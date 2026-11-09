const express = require('express');
const jwt = require('jsonwebtoken');
const { randomUUID } = require('node:crypto');
const Secreto = require('../models/Secreto');
const TokenRevelacion = require('../models/TokenRevelacion');
const { autenticacion, opcionesVerificacion } = require('../middleware/autenticacion');
const { validarCampos, validarFechaISO, idMongoValido } = require('../utils/validar');
const { VENTANA_MS, evaluarApertura, solicitudesValidas } = require('../services/quorum');

const router = express.Router();
router.use(autenticacion);
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

router.post('/', async (req, res) => {
  const error = validarCampos(req.body, ['titulo', 'contenido', 'fechaApertura']);
  if (error) return res.status(400).json({ error });
  const { titulo, contenido, fechaApertura } = req.body;
  if (typeof titulo !== 'string' || !titulo.trim() || titulo.trim().length > 120 ||
      typeof contenido !== 'string' || !contenido.trim() || contenido.length > 10000) {
    return res.status(400).json({ error: 'Titulo o contenido invalido.' });
  }
  let apertura = null;
  if (fechaApertura !== undefined && fechaApertura !== null) {
    apertura = validarFechaISO(fechaApertura);
    if (!apertura) return res.status(400).json({ error: 'fechaApertura debe ser ISO 8601 con zona horaria.' });
  }
  const secreto = await Secreto.create({ titulo: titulo.trim(), contenido,
    fechaApertura: apertura, creadoPor: req.usuario.id, solicitudes: [] });
  return res.status(201).json({ id: secreto.id, titulo: secreto.titulo,
    creadoPor: secreto.creadoPor, fechaApertura: secreto.fechaApertura,
    numeroSolicitudes: 0 });
});

router.get('/', async (_req, res) => {
  // Nunca solicitar contenido a Mongo; el esquema ademas lo excluye por defecto.
  const secretos = await Secreto.find({}, '_id titulo fechaApertura solicitudes').lean();
  const ahora = new Date();
  return res.json(secretos.map((secreto) => ({
    id: String(secreto._id),
    titulo: secreto.titulo,
    fechaApertura: secreto.fechaApertura,
    numeroSolicitudes: (secreto.solicitudes || []).length,
    solicitudesVigentes: new Set(solicitudesValidas(secreto.solicitudes, ahora)
      .map((s) => s.userId)).size,
  })));
});

router.post('/:id/solicitar', async (req, res) => {
  if (!idMongoValido(req.params.id)) return res.status(400).json({ error: 'ID de secreto invalido.' });
  const error = validarCampos(req.body || {}, []);
  if (error) return res.status(400).json({ error: `${error} El usuario y la fecha se toman del servidor.` });

  const ahora = new Date();
  const limite = new Date(ahora.getTime() - VENTANA_MS);
  const usuarioId = req.usuario.id;

  // Una sola operacion atomica: elimina la solicitud anterior del mismo usuario,
  // descarta las vencidas y agrega una con identidad/fecha del servidor.
  // En Mongoose 9 los updates con pipeline requieren updatePipeline: true.
  const resultado = await Secreto.updateOne(
    { _id: req.params.id },
    [{ $set: {
      solicitudes: {
        $concatArrays: [
          { $filter: { input: { $ifNull: ['$solicitudes', []] }, as: 's',
            cond: { $and: [
              { $ne: ['$$s.userId', usuarioId] },
              { $gte: ['$$s.fecha', limite] },
              { $lte: ['$$s.fecha', ahora] },
            ] },
          } },
          [{ $literal: { userId: usuarioId, fecha: ahora } }],
        ],
      },
    } }],
    { updatePipeline: true },
  );
  if (!resultado.matchedCount) return res.status(404).json({ error: 'Secreto no encontrado.' });
  return res.status(201).json({ mensaje: 'Solicitud registrada.',
    usuarioId, fecha: ahora.toISOString(), ventanaMinutos: 5 });
});

router.get('/:id/abrir', async (req, res) => {
  if (!idMongoValido(req.params.id)) return res.status(400).json({ error: 'ID de secreto invalido.' });
  const secreto = await Secreto.findById(req.params.id);
  if (!secreto) return res.status(404).json({ error: 'Secreto no encontrado.' });
  const regla = evaluarApertura(secreto, new Date());
  if (!regla.permitido) return res.status(403).json({
    error: 'La boveda sigue cerrada.',
    mensaje: `Faltan ${regla.faltanAgentes} agente(s) distinto(s) con solicitudes de los ultimos 5 minutos, o esperar la fecha de apertura.`,
    solicitudesDistintasVigentes: regla.solicitudesDistintasVigentes,
  });

  if (process.env.BONUS_TOKEN_UN_SOLO_USO === 'false') {
    const abierto = await Secreto.findById(secreto.id).select('+contenido');
    if (!abierto) return res.status(404).json({ error: 'Secreto no encontrado.' });
    return res.json({ id: abierto.id, contenido: abierto.contenido,
      abiertoPor: regla.porTiempo ? 'fecha' : 'quorum' });
  }

  // Bonus: token de lectura utilizable UNA VEZ durante 60 segundos.
  const jti = randomUUID();
  const expiraEn = new Date(Date.now() + 60_000);
  const token = jwt.sign({ tipo: 'revelacion', secretoId: secreto.id,
    usuarioId: req.usuario.id }, process.env.JWT_REVEAL_SECRET,
  { algorithm: 'HS256', expiresIn: '60s', jwtid: jti,
    issuer: 'la-boveda', audience: 'la-boveda-revelacion' });
  await TokenRevelacion.create({ jti, secretoId: secreto._id,
    usuarioId: req.usuario.id, expiraEn, usado: false });
  return res.json({ mensaje: 'Apertura autorizada. Canjea el token una sola vez.',
    tokenRevelacion: token, venceEnSegundos: 60,
    siguientePaso: `GET /secretos/${secreto.id}/revelar con X-Reveal-Token` });
});

router.get('/:id/revelar', async (req, res) => {
  if (process.env.BONUS_TOKEN_UN_SOLO_USO === 'false') {
    return res.status(404).json({ error: 'Bonus desactivado.' });
  }
  if (!idMongoValido(req.params.id)) return res.status(400).json({ error: 'ID de secreto invalido.' });
  const token = req.get('X-Reveal-Token');
  if (!token) return res.status(401).json({ error: 'Falta X-Reveal-Token.' });
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REVEAL_SECRET, {
      ...opcionesVerificacion(), audience: 'la-boveda-revelacion',
    });
  } catch {
    return res.status(401).json({ error: 'Token de revelacion invalido o vencido.' });
  }
  if (payload.tipo !== 'revelacion' || payload.secretoId !== req.params.id ||
      payload.usuarioId !== req.usuario.id || typeof payload.jti !== 'string') {
    return res.status(403).json({ error: 'El token no corresponde a esta solicitud.' });
  }
  const registro = await TokenRevelacion.findOneAndUpdate({
    jti: payload.jti,
    secretoId: req.params.id,
    usuarioId: req.usuario.id,
    usado: false,
    expiraEn: { $gt: new Date() },
  }, { $set: { usado: true } }, { new: true });
  if (!registro) return res.status(403).json({ error: 'Token ya utilizado o expirado.' });

  const secreto = await Secreto.findById(req.params.id).select('+contenido');
  if (!secreto) return res.status(404).json({ error: 'Secreto no encontrado.' });
  return res.json({ id: secreto.id, contenido: secreto.contenido });
});

module.exports = router;
