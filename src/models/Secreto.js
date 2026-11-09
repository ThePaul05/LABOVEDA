const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
  userId: { type: Number, required: true },
  fecha: { type: Date, required: true },
}, { _id: false });

const secretoSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true, maxlength: 120 },
  contenido: { type: String, required: true, select: false },
  creadoPor: { type: Number, required: true },
  fechaApertura: { type: Date, default: null },
  solicitudes: { type: [solicitudSchema], default: [] },
}, {
  timestamps: true,
  toJSON: {
    transform: (_documento, resultado) => {
      delete resultado.contenido;
      return resultado;
    },
  },
});

module.exports = mongoose.model('Secreto', secretoSchema);
