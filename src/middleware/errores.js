function rutaNoEncontrada(_req, res) {
  return res.status(404).json({ error: 'Ruta no encontrada.' });
}

function manejarError(error, _req, res, _next) {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El JSON excede el tamano permitido.' });
  }
  if (error.type === 'entity.parse.failed' || (error instanceof SyntaxError && error.status === 400)) {
    return res.status(400).json({ error: 'JSON mal formado.' });
  }
  if (error.name === 'SequelizeUniqueConstraintError' || error.code === 11000) {
    return res.status(409).json({ error: 'El registro ya existe.' });
  }
  if (error.name === 'ValidationError' || error.name === 'SequelizeValidationError') {
    return res.status(400).json({ error: 'Los datos no cumplen las validaciones.' });
  }
  console.error('[ERROR INTERNO]', error);
  return res.status(500).json({ error: 'Error interno del servidor.' });
}

module.exports = { rutaNoEncontrada, manejarError };
