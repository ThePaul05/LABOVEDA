const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluarApertura } = require('../src/services/quorum');

const ahora = new Date('2026-11-03T22:00:00.000Z');
const antes = (minutos) => new Date(ahora.getTime() - minutos * 60 * 1000);
const base = (solicitudes = [], fechaApertura = null) => ({ solicitudes, fechaApertura });

test('sin solicitudes ni fecha permanece cerrado', () => {
  const resultado = evaluarApertura(base(), ahora);
  assert.equal(resultado.permitido, false);
  assert.equal(resultado.faltanAgentes, 2);
});

test('dos agentes distintos en cinco minutos abren', () => {
  const resultado = evaluarApertura(base([
    { userId: 1, fecha: antes(4) }, { userId: 2, fecha: antes(1) },
  ]), ahora);
  assert.equal(resultado.permitido, true);
  assert.equal(resultado.porQuorum, true);
});

test('el mismo agente no cuenta dos veces', () => {
  const resultado = evaluarApertura(base([
    { userId: 1, fecha: antes(2) }, { userId: 1, fecha: antes(1) },
  ]), ahora);
  assert.equal(resultado.permitido, false);
  assert.equal(resultado.solicitudesDistintasVigentes, 1);
});

test('las solicitudes vencidas no cuentan', () => {
  const resultado = evaluarApertura(base([
    { userId: 1, fecha: antes(6) }, { userId: 2, fecha: antes(1) },
  ]), ahora);
  assert.equal(resultado.permitido, false);
});

test('la fecha de apertura vencida abre sin quorum', () => {
  const resultado = evaluarApertura(base([], antes(3)), ahora);
  assert.equal(resultado.permitido, true);
  assert.equal(resultado.porTiempo, true);
});

test('una fecha futura no abre por tiempo', () => {
  const futuro = new Date(ahora.getTime() + 60_000);
  assert.equal(evaluarApertura(base([], futuro), ahora).permitido, false);
});

test('no se aceptan fechas futuras de solicitudes en el quorum', () => {
  const futuro = new Date(ahora.getTime() + 60_000);
  const resultado = evaluarApertura(base([
    { userId: 1, fecha: antes(1) }, { userId: 2, fecha: futuro },
  ]), ahora);
  assert.equal(resultado.permitido, false);
});

test('el creador puede contar si solicita; nunca abre solo', () => {
  const resultado = evaluarApertura({ ...base([{ userId: 1, fecha: antes(1) }]), creadoPor: 1 }, ahora);
  assert.equal(resultado.permitido, false);
});
