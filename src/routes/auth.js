const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const Usuario = require('../models/Usuario');
const { validarCampos } = require('../utils/validar');

const router = express.Router();
const limiteRegistro = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10,
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Demasiados intentos de registro. Intenta mas tarde.' } });
const limiteLogin = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20,
  standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso. Intenta mas tarde.' } });

router.post('/registro', limiteRegistro, async (req, res) => {
  const error = validarCampos(req.body, ['nombre', 'email', 'password']);
  if (error) return res.status(400).json({ error });
  const { nombre, email, password } = req.body;
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100 ||
      typeof email !== 'string' || email.length > 190 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof password !== 'string' || Buffer.byteLength(password, 'utf8') < 8 ||
      Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ error: 'Nombre, email o contrasena invalidos (8 a 72 bytes).' });
  }

  const normalizado = email.trim().toLowerCase();
  const yaExiste = await Usuario.findOne({ where: { email: normalizado } });
  if (yaExiste) return res.status(409).json({ error: 'Este correo ya esta registrado.' });

  const hash = await bcrypt.hash(password, 12);
  // El rol SIEMPRE lo asigna el servidor, nunca la persona que se registra.
  const usuario = await Usuario.create({ nombre: nombre.trim(), email: normalizado,
    password: hash, rol: 'agente' });
  return res.status(201).json({ id: usuario.id, nombre: usuario.nombre,
    email: usuario.email, rol: usuario.rol });
});

router.post('/login', limiteLogin, async (req, res) => {
  const error = validarCampos(req.body, ['email', 'password']);
  if (error) return res.status(400).json({ error });
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Se requieren email y password.' });
  }
  const usuario = await Usuario.findOne({ where: { email: email.trim().toLowerCase() } });
  const correcta = usuario ? await bcrypt.compare(password, usuario.password) : false;
  if (!correcta) return res.status(401).json({ error: 'Credenciales incorrectas.' });

  const token = jwt.sign({ id: usuario.id, rol: usuario.rol, tipo: 'acceso' },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '1h', issuer: 'la-boveda', audience: 'la-boveda-api' });
  return res.json({ token, tokenType: 'Bearer', expiresIn: 3600 });
});

module.exports = router;
