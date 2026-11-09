const mongoose = require('mongoose');

function obtenerMongoURI() {
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  const usuario = encodeURIComponent(process.env.MONGO_USER || 'mongo_admin');
  const clave = encodeURIComponent(process.env.MONGO_PASSWORD || '');
  const host = process.env.MONGO_HOST || '127.0.0.1';
  const puerto = process.env.MONGO_PORT || '27017';
  const base = process.env.MONGO_DATABASE || 'la_boveda';
  return `mongodb://${usuario}:${clave}@${host}:${puerto}/${base}?authSource=admin`;
}

async function conectarMongo() {
  await mongoose.connect(obtenerMongoURI(), { serverSelectionTimeoutMS: 7000 });
}

module.exports = { conectarMongo, mongoose };
