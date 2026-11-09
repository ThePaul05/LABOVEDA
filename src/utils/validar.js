function esObjetoPlano(valor) {
  return valor !== null && typeof valor === 'object' && !Array.isArray(valor);
}

function validarCampos(body, permitidos) {
  if (!esObjetoPlano(body)) return 'Debes enviar un objeto JSON.';
  const noPermitidos = Object.keys(body).filter((campo) => !permitidos.includes(campo));
  if (noPermitidos.length) return `Campos no permitidos: ${noPermitidos.join(', ')}.`;
  return null;
}

function idMongoValido(id) {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
}

function validarFechaISO(valor) {
  if (typeof valor !== 'string') return null;
  // ISO 8601 con zona horaria explicita. Ej.: 2030-01-01T14:00:00Z
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(valor)) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

module.exports = { esObjetoPlano, validarCampos, idMongoValido, validarFechaISO };
