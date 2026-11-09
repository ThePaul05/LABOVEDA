const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/auth');
const secretosRoutes = require('./routes/secretos');
const { manejarError, rutaNoEncontrada } = require('./middleware/errores');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '16kb', strict: true }));
app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.get('/', (_req, res) => res.json({ nombre: 'La Boveda', version: '1.0.0',
  mensaje: 'API activa. Importa la coleccion de Postman para usarla.' }));
app.use('/auth', authRoutes);
app.use('/secretos', secretosRoutes);
app.use(rutaNoEncontrada);
app.use(manejarError);

module.exports = app;
