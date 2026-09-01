(function attachClientHours(root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.DLClientHours = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildClientHours() {
  "use strict";

  const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

  function time(value) {
    const text = String(value || "").trim();
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : "";
  }

  function normalize(value) {
    const rows = Array.isArray(value) ? value : [];
    return rows.map((row) => {
      const day = DAYS.find((item) => item.toLowerCase() === String(row && row.day || row && row.dia || "").trim().toLowerCase());
      const ranges = (Array.isArray(row && row.ranges) ? row.ranges : [])
        .map((range) => ({ from: time(range && (range.from || range.desde)), to: time(range && (range.to || range.hasta)) }))
        .filter((range) => range.from && range.to && range.from < range.to)
        .slice(0, 2);
      return day && ranges.length ? { day, ranges } : null;
    }).filter(Boolean).sort((left, right) => DAYS.indexOf(left.day) - DAYS.indexOf(right.day));
  }

  function validationErrors(value) {
    const rows = Array.isArray(value) ? value : [];
    const errors = [];
    rows.forEach((row) => {
      const day = DAYS.find((item) => item.toLowerCase() === String(row && (row.day || row.dia) || "").trim().toLowerCase());
      if (!day) {
        errors.push("El dia del horario no es valido.");
        return;
      }
      const ranges = Array.isArray(row.ranges) ? row.ranges.slice(0, 2) : [];
      const labels = ["manana", "tarde"];
      let completed = 0;
      ranges.forEach((range, index) => {
        const from = time(range && (range.from || range.desde));
        const to = time(range && (range.to || range.hasta));
        if (!from && !to) return;
        if (!from || !to) {
          errors.push(`${day}: completar desde y hasta del turno ${labels[index]}.`);
          return;
        }
        if (from >= to) {
          errors.push(`${day}: la hora desde debe ser anterior a la hora hasta del turno ${labels[index]}.`);
          return;
        }
        completed += 1;
      });
      if (!completed && !errors.some((error) => error.startsWith(`${day}:`))) errors.push(`${day}: completar al menos un rango horario.`);
    });
    return errors;
  }

  function assertValid(value) {
    const errors = validationErrors(value);
    if (errors.length) throw new Error(errors[0]);
    return normalize(value);
  }

  function compactDays(days) {
    if (!days.length) return "";
    if (days.length === 5 && DAYS.slice(0, 5).every((day) => days.includes(day))) return "Lun-Vie";
    return days.map((day) => day.slice(0, 3)).join("/");
  }

  function summary(value, fallback = "") {
    const rows = normalize(value);
    if (!rows.length) return String(fallback || "").trim();
    const grouped = new Map();
    rows.forEach((row) => {
      const key = row.ranges.map((range) => `${range.from}-${range.to}`).join(" / ");
      const days = grouped.get(key) || [];
      days.push(row.day);
      grouped.set(key, days);
    });
    return Array.from(grouped.entries()).map(([ranges, days]) => `${compactDays(days)} ${ranges}`).join("; ");
  }

  function today(value, date = new Date()) {
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    const row = normalize(value).find((item) => item.day === DAYS[dayIndex]);
    return row ? row.ranges.map((range) => `${range.from}-${range.to}`).join(" / ") : "";
  }

  return { DAYS, normalize, validationErrors, assertValid, summary, today };
});
