"use strict";
const fs = require("node:fs");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const INCIDENT = "PL-1790603239162-F2EFF2";
const hash = (value) => crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

function planRecovery(state) {
  const audit = state.priceListAudit || [];
  const entries = audit.filter((a) => a.listId === INCIDENT && a.productCode !== "717");
  if (entries.length !== 32 || new Set(entries.map((a) => a.productCode)).size !== 32) throw new Error("Unexpected incident scope");
  const plan = [], skipped = [];
  for (const entry of entries) {
    const matches = (state.products || []).filter((p) => p.codigo_producto === entry.productCode);
    if (matches.length !== 1) throw new Error(`Ambiguous product ${entry.productCode}`);
    const product = matches[0];
    if (!Number.isFinite(entry.previousPrice) || entry.previousPrice < 0 || entry.newPrice !== 8600) throw new Error("Invalid audit price");
    if (product.precio_lista_2 === entry.previousPrice) { skipped.push({ code: entry.productCode, reason: "already-restored" }); continue; }
    if (product.precio_lista_2 !== entry.newPrice || product.price !== entry.newPrice
      || audit.some((a) => a.productCode === entry.productCode && a.at > entry.at)
      || !Number.isFinite(Date.parse(product.priceUpdatedAt)) || !Number.isFinite(Date.parse(entry.at))
      || Math.abs(Date.parse(product.priceUpdatedAt) - Date.parse(entry.at)) > 1000) throw new Error(`Later change requires review: ${entry.productCode}`);
    plan.push({ code: entry.productCode, name: entry.productName, before: entry.newPrice, after: entry.previousPrice, auditId: entry.id });
  }
  return { incident: INCIDENT, plan, skipped };
}

function recover(payload, user = "Recuperacion autorizada por administracion") {
  const state = payload.state;
  const result = planRecovery(state);
  const protectedBefore = hash(Object.fromEntries(Object.entries(state).filter(([k]) => !["products", "priceLists", "priceListAudit", "globalAudit"].includes(k))));
  const originalProducts = structuredClone(state.products);
  const at = new Date().toISOString();
  for (const row of result.plan) {
    const product = state.products.find((p) => p.codigo_producto === row.code);
    product.price = product.precio_lista_2 = row.after;
    product.margen_lista_2 = Number(product.costo || product.cost) > 0 ? Math.round((row.after / Number(product.costo || product.cost) - 1) * 10000) / 100 : 0;
    product.priceUpdatedAt = at;
    product.priceUpdatedBy = user;
    for (const list of state.priceLists || []) {
      if (list.number !== 2 && list.id !== "PL-L2") continue;
      for (const item of list.items || []) {
        if (item.productCode !== row.code) continue;
        item.price = item.newPrice = row.after;
        item.previousPrice = row.after;
        item.difference = 0;
      }
      list.updatedAt = at;
      list.updatedBy = user;
    }
    const audit = { id: crypto.randomUUID(), at, user, username: "recovery-authorized",
      operation: "recuperacion-incidente", motive: `Restauracion auditada ${INCIDENT}`, sourceAuditId: row.auditId,
      listId: "PL-L2", listNumber: 2, listName: "Lista 2", productCode: row.code, productName: row.name,
      previousPrice: row.before, newPrice: row.after, difference: row.after - row.before };
    state.priceListAudit.unshift(audit);
    state.globalAudit = state.globalAudit || [];
    state.globalAudit.unshift({ id: crypto.randomUUID(), at, user, action: "PRECIO_RESTAURADO_DESDE_AUDITORIA",
      entityType: "producto", entityId: row.code, previousValue: { precio_lista_2: row.before }, newValue: { precio_lista_2: row.after }, note: audit.motive });
  }
  const allowed = new Set(["price", "precio_lista_2", "margen_lista_2", "priceUpdatedAt", "priceUpdatedBy"]);
  state.products.forEach((p, i) => {
    const strip = (v) => Object.fromEntries(Object.entries(v).filter(([k]) => !allowed.has(k)));
    if (hash(strip(p)) !== hash(strip(originalProducts[i]))) throw new Error("Unexpected product field change");
  });
  if (protectedBefore !== hash(Object.fromEntries(Object.entries(state).filter(([k]) => !["products", "priceLists", "priceListAudit", "globalAudit"].includes(k))))) throw new Error("Protected data changed");
  payload.version = Math.max(Date.now(), Number(payload.version || 0) + 1);
  return result;
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) throw new Error("State file required; default is dry-run");
  const before = fs.readFileSync(file);
  const payload = JSON.parse(before.toString("utf8"));
  const plan = planRecovery(payload.state);
  if (process.argv.includes("--apply")) {
    if (!process.argv.includes("--expect-31") || plan.plan.length !== 31) throw new Error("Expected exactly 31 reviewed corrections");
    if (process.platform === "linux") {
      let active = false;
      try { active = execFileSync("systemctl", ["is-active", "distribuidora-lopez.service"], { encoding: "utf8" }).trim() === "active"; } catch (error) { if (error.status !== 3) throw error; }
      if (active) throw new Error("Stop ERP before offline recovery");
    }
    const backup = `${file}.before-price-recovery-${Date.now()}.bak`;
    fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
    const result = recover(payload);
    if (!fs.readFileSync(file).equals(before)) throw new Error("State changed concurrently");
    const tmp = `${file}.price-recovery-${process.pid}.tmp`;
    const stat = fs.statSync(file);
    const fd = fs.openSync(tmp, "wx", stat.mode);
    try { fs.writeFileSync(fd, JSON.stringify(payload)); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    if (process.platform === "linux") fs.chownSync(tmp, stat.uid, stat.gid);
    fs.renameSync(tmp, file);
    console.log(JSON.stringify({ applied: true, backup, ...result }));
  } else console.log(JSON.stringify({ applied: false, ...plan }));
}
module.exports = { planRecovery, recover, INCIDENT };
