const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

function opcionesVerificacion() {
  return {
    algorithms: ['HS256'],
    issuer: 'la-boveda',
    audience: 'la-boveda-api',
  };
}

async function autenticacion(req, res, next) {
  const auth = req.get('Authorization') || '';
  const match = /^Bearer ([^\s]+)$/.exec(auth);
  if (!match) return res.status(401).json({ error: 'Falta un token Bearer valido.' });

  let payload;
  try {
    payload = jwt.verify(match[1], process.env.JWT_SECRET, opcionesVerificacion());
  } catch {
    return res.status(401).json({ error: 'Token vencido o invalido.' });
  }

  if (payload.tipo !== 'acceso' || !Number.isSafeInteger(payload.id) || payload.id < 1) {
    return res.status(401).json({ error: 'Tipo de token incorrecto.' });
  }

  try {
    const usuario = await Usuario.findByPk(payload.id, { attributes: ['id', 'rol'] });
    if (!usuario || usuario.rol !== payload.rol) {
      return res.status(401).json({ error: 'Sesion no autorizada.' });
    }
    req.usuario = { id: usuario.id, rol: usuario.rol };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { autenticacion, opcionesVerificacion };
