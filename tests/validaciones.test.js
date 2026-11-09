const test = require('node:test');
const assert = require('node:assert/strict');
const { validarCampos, idMongoValido, validarFechaISO } = require('../src/utils/validar');

test('rechaza registro que intenta asignarse rol jefe', () => {
  assert.match(validarCampos({ nombre: 'A', rol: 'jefe' }, ['nombre', 'email', 'password']), /rol/);
});
test('rechaza solicitudes que aportan una fecha o userId', () => {
  assert.match(validarCampos({ fecha: '2030-01-01', userId: 2 }, []), /fecha/);
});
test('acepta solo ObjectIds hexadecimales completos', () => {
  assert.equal(idMongoValido('507f1f77bcf86cd799439011'), true);
  assert.equal(idMongoValido('not-an-id'), false);
});
test('acepta fecha ISO con zona horaria y rechaza fecha ambigua', () => {
  assert.ok(validarFechaISO('2030-01-01T12:00:00Z') instanceof Date);
  assert.equal(validarFechaISO('2030-01-01'), null);
});
