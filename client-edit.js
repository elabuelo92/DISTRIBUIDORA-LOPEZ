(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ClientEdit = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const aliases = {
    nombre_comercial: ["name", "nombre_comercial"], zona: ["zone", "zona"],
    vendedor_asignado: ["seller", "vendedor_asignado", "vendedor"], estado: ["status", "estado"],
    limite_credito: ["limite_credito", "limit"], telefono: ["telefono", "phone"],
    domicilio: ["domicilio", "address"], referencia: ["referencia", "reference"], ruta: ["ruta", "route"],
    latitud: ["latitud", "latitude"], longitud: ["longitud", "longitude"]
  };
  const fields = ["nombre_comercial", "razon_social", "cuit", "condicion_fiscal", "domicilio", "referencia",
    "localidad", "telefono", "email", "horarios_atencion", "horario_atencion", "horario_observacion", "latitud", "longitud",
    "tipo_cliente", "zona", "ruta", "vendedor_asignado", "forma_pago", "condicion_comercial", "dias_credito", "limite_credito",
    "dia_visita", "dias_visita", "ordenes_visita", "frecuencia_visita", "estado", "observaciones"];
  const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const validEmail = value => !value || (value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
  function snapshot(client) {
    return Object.fromEntries(fields.map(key => [key, (aliases[key] || [key]).map(k => client[k]).find(v => v != null) ?? null]));
  }
  function apply(previous, patch, expected, hoursEngine) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch) || !expected || typeof expected !== "object") {
      throw new Error("Faltan los cambios y su referencia original.");
    }
    const current = snapshot(previous);
    const next = { ...previous };
    for (const key of Object.keys(patch)) {
      if (!fields.includes(key)) throw new Error(`Campo no editable: ${key}`);
      if (!Object.prototype.hasOwnProperty.call(expected, key) || !same(current[key], expected[key])) {
        throw Object.assign(new Error(`El campo ${key} cambio mientras la ficha estaba abierta. Revisar antes de guardar.`), { status: 409 });
      }
      let value = patch[key];
      if (["dias_credito", "limite_credito"].includes(key)) {
        value = Number(value);
        if (!Number.isFinite(value) || value < 0) throw new Error(`Valor invalido: ${key}`);
      } else if (["latitud", "longitud"].includes(key)) {
        value = value === "" || value === null ? null : Number(value);
        if (value !== null && (!Number.isFinite(value) || Math.abs(value) > (key === "latitud" ? 90 : 180))) throw new Error("Coordenada invalida.");
      } else if (key === "horarios_atencion") {
        value = hoursEngine.assertValid(value);
      } else if (key === "dias_visita") {
        if (!Array.isArray(value) || value.some(day => !["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"].includes(day))) throw new Error("Dias de visita invalidos.");
      } else if (key === "ordenes_visita") {
        if (!value || typeof value !== "object" || Array.isArray(value) || Object.values(value).some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error("Orden de visita invalido.");
      } else {
        if (typeof value !== "string") throw new Error(`Texto invalido: ${key}`);
        value = value.trim();
      }
      if (key === "nombre_comercial" && !value) throw new Error("El cliente debe tener nombre comercial.");
      if (key === "email" && !validEmail(value)) throw new Error("Ingresar un email valido o dejarlo vacio.");
      next[key] = value;
      for (const alias of aliases[key] || []) {
        // Keep canonical business aliases in sync, without introducing legacy aliases.
        if (["name", "nombre_comercial", "zone", "zona", "seller", "vendedor_asignado", "vendedor", "status", "estado", "limite_credito", "limit"].includes(alias)
          || Object.prototype.hasOwnProperty.call(previous, alias)) next[alias] = value;
      }
    }
    const changedFields = Object.keys(next).filter(key => !same(previous[key], next[key]));
    return { next, changedFields };
  }
  return { fields, snapshot, apply, same, validEmail };
});
