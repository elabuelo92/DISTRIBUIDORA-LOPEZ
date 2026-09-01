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

  return { DAYS, normalize, summary, today };
});
