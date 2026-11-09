require('dotenv').config();
const { sequelize } = require('./config/mysql');
const { conectarMongo, mongoose } = require('./config/mongo');
const TokenRevelacion = require('./models/TokenRevelacion');
require('./models/Usuario');
const app = require('./app');

function validarConfiguracion() {
  for (const nombre of ['MYSQL_PASSWORD', 'MONGO_PASSWORD',
    'JWT_SECRET', 'JWT_REVEAL_SECRET']) {
    if (!process.env[nombre]) throw new Error(`Falta ${nombre} en .env`);
  }
  for (const nombre of ['JWT_SECRET', 'JWT_REVEAL_SECRET']) {
    const clave = process.env[nombre];
    if (clave.length < 32 || /REEMPLAZAR|CAMBIAR|EJEMPLO/i.test(clave)) {
      throw new Error(`Configura ${nombre} con al menos 32 caracteres aleatorios.`);
    }
  }
  if (process.env.JWT_SECRET === process.env.JWT_REVEAL_SECRET) {
    throw new Error('Los secretos JWT deben ser diferentes.');
  }
  if (process.env.BONUS_TOKEN_UN_SOLO_USO &&
      !['true', 'false'].includes(process.env.BONUS_TOKEN_UN_SOLO_USO)) {
    throw new Error('BONUS_TOKEN_UN_SOLO_USO debe ser true o false.');
  }
}

async function iniciar() {
  validarConfiguracion();
  await sequelize.authenticate();
  await sequelize.sync(); // Crea tabla si falta; no borra datos.
  console.log('MySQL conectado');
  await conectarMongo();
  await TokenRevelacion.init(); // Indice unico y TTL listos.
  console.log('MongoDB conectado');
  const port = Number(process.env.PORT || 3000);
  const servidor = app.listen(port, () => {
    console.log(`La Boveda: http://localhost:${port}`);
    console.log('Bonus token de un solo uso:', process.env.BONUS_TOKEN_UN_SOLO_USO !== 'false');
  });

  async function cerrar() {
    console.log('Cerrando conexiones...');
    servidor.close(async () => {
      await Promise.allSettled([sequelize.close(), mongoose.disconnect()]);
      process.exit(0);
    });
  }
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
}

iniciar().catch(async (error) => {
  console.error('No se pudo iniciar La Boveda:', error.message);
  await Promise.allSettled([sequelize.close(), mongoose.disconnect()]);
  process.exit(1);
});
