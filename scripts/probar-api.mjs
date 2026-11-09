// Prueba de integracion: requiere las dos DB y la API iniciada con bonus=true.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const aleatorio = randomUUID().slice(0, 8);
const correo1 = `agente1_${aleatorio}@ejemplo.test`;
const correo2 = `agente2_${aleatorio}@ejemplo.test`;
const clave = 'ClavePruebaSegura2026!';

async function api(metodo, ruta, token, body, headersExtra = {}) {
  const headers = { ...headersExtra };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const respuesta = await fetch(`${BASE_URL}${ruta}`, {
    method: metodo, headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const texto = await respuesta.text();
  let datos;
  try { datos = JSON.parse(texto); } catch { datos = texto; }
  return { status: respuesta.status, data: datos };
}

async function main() {
  let respuesta = await api('POST', '/auth/registro', null, {
    nombre: 'Agente Uno', email: correo1, password: clave,
  });
  assert.equal(respuesta.status, 201, JSON.stringify(respuesta.data));
  const usuario1 = respuesta.data.id;
  respuesta = await api('POST', '/auth/registro', null, {
    nombre: 'Agente Dos', email: correo2, password: clave,
  });
  assert.equal(respuesta.status, 201, JSON.stringify(respuesta.data));
  const usuario2 = respuesta.data.id;
  assert.notEqual(usuario1, usuario2);
  const login1 = await api('POST', '/auth/login', null, { email: correo1, password: clave });
  const login2 = await api('POST', '/auth/login', null, { email: correo2, password: clave });
  assert.equal(login1.status, 200);
  assert.equal(login2.status, 200);
  const t1 = login1.data.token;
  const t2 = login2.data.token;
  console.log('✓ Registro y login de dos agentes');

  const secretoTexto = `CLAVE-SUPER-SECRETA-${aleatorio}`;
  const crear = await api('POST', '/secretos', t1,
    { titulo: 'Operacion prueba', contenido: secretoTexto });
  assert.equal(crear.status, 201);
  const id = crear.data.id;
  const listado = await api('GET', '/secretos', t1);
  assert.equal(listado.status, 200);
  assert.ok(!JSON.stringify(listado.data).includes(secretoTexto));
  assert.ok(!JSON.stringify(listado.data).includes('contenido'));
  console.log('✓ Crear secreto y listar sin revelar contenido');

  const sinAuth = await api('GET', '/secretos');
  assert.equal(sinAuth.status, 401);
  const inicio = await api('GET', `/secretos/${id}/abrir`, t1);
  assert.equal(inicio.status, 403);
  console.log('✓ Bloqueo sin token y sin quorum');

  const falso = await api('POST', `/secretos/${id}/solicitar`, t1,
    { userId: usuario2, fecha: '2030-01-01T00:00:00Z' });
  assert.equal(falso.status, 400);
  const s1 = await api('POST', `/secretos/${id}/solicitar`, t1, {});
  const duplicado = await api('POST', `/secretos/${id}/solicitar`, t1, {});
  assert.equal(s1.status, 201);
  assert.equal(duplicado.status, 201);
  assert.equal((await api('GET', `/secretos/${id}/abrir`, t1)).status, 403);
  console.log('✓ No sirven la suplantacion ni las solicitudes duplicadas');

  const s2 = await api('POST', `/secretos/${id}/solicitar`, t2, {});
  assert.equal(s2.status, 201);
  const apertura = await api('GET', `/secretos/${id}/abrir`, t1);
  assert.equal(apertura.status, 200, JSON.stringify(apertura.data));
  assert.ok(apertura.data.tokenRevelacion,
    'Activa BONUS_TOKEN_UN_SOLO_USO=true para esta prueba');
  const cabeceras = { 'X-Reveal-Token': apertura.data.tokenRevelacion };
  const revelar = await api('GET', `/secretos/${id}/revelar`, t1, undefined, cabeceras);
  assert.equal(revelar.status, 200);
  assert.equal(revelar.data.contenido, secretoTexto);
  const repetido = await api('GET', `/secretos/${id}/revelar`, t1, undefined, cabeceras);
  assert.equal(repetido.status, 403);
  console.log('✓ Quorum correcto, revelacion unica y rechazo del segundo canje');

  const fechaPasada = await api('POST', '/secretos', t1,
    { titulo: 'Fecha vencida', contenido: 'Abierto por tiempo',
      fechaApertura: '2020-01-01T00:00:00Z' });
  assert.equal(fechaPasada.status, 201);
  const porFecha = await api('GET', `/secretos/${fechaPasada.data.id}/abrir`, t1);
  assert.equal(porFecha.status, 200);
  assert.ok(porFecha.data.tokenRevelacion);
  console.log('✓ Fecha de apertura habilita un secreto sin quorum');
  console.log('TODO CORRECTO: pruebas de integracion superadas.');
}

main().catch((error) => {
  console.error('PRUEBA FALLIDA:', error.message);
  process.exitCode = 1;
});
