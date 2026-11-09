const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  secretoId: { type: mongoose.Schema.Types.ObjectId, required: true },
  usuarioId: { type: Number, required: true },
  expiraEn: { type: Date, required: true },
  usado: { type: Boolean, default: false },
}, { timestamps: true });

// MongoDB limpia tokens expirados; la validez se comprueba tambien en cada canje.
tokenSchema.index({ expiraEn: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenRevelacion', tokenSchema);
