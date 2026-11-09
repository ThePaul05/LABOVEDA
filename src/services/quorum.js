const VENTANA_MS = 5 * 60 * 1000;

function solicitudesValidas(solicitudes, ahora = new Date()) {
  const milisegundos = ahora.getTime();
  return (solicitudes || []).filter(({ fecha }) => {
    const fechaMs = new Date(fecha).getTime();
    return Number.isFinite(fechaMs) &&
      fechaMs >= milisegundos - VENTANA_MS && fechaMs <= milisegundos;
  });
}

function evaluarApertura(secreto, ahora = new Date()) {
  const aperturaMs = secreto.fechaApertura ? new Date(secreto.fechaApertura).getTime() : NaN;
  const porTiempo = Number.isFinite(aperturaMs) && ahora.getTime() >= aperturaMs;
  const ids = new Set(
    solicitudesValidas(secreto.solicitudes, ahora)
      .map((s) => s.userId)
      .filter((id) => Number.isSafeInteger(id) && id > 0),
  );
  const porQuorum = ids.size >= 2;
  return {
    permitido: porTiempo || porQuorum,
    porTiempo,
    porQuorum,
    solicitudesDistintasVigentes: ids.size,
    faltanAgentes: Math.max(0, 2 - ids.size),
  };
}

module.exports = { VENTANA_MS, solicitudesValidas, evaluarApertura };
