"use strict";
const fs = require("node:fs");
const crypto = require("node:crypto");
function diagnose(state, users) {
  const usernames = new Set(users.filter(user => user.role === "admin").map(user => String(user.username || "").trim().toLowerCase()).filter(Boolean));
  const clients = state.clients || [];
  const findings = clients.flatMap(client => {
    const email = String(client.email || "").trim();
    const adminMatch = usernames.has(email.toLowerCase());
    if (!email || (!adminMatch && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return [];
    return [{ id: client.codigo_cliente || client.id || "", name: client.name || client.nombre_comercial || "", email,
      reason: adminMatch ? "matches_admin_username" : "invalid_format", updatedAt: client.updatedAt || null }];
  });
  return { totalClients: clients.length, nonEmptyEmails: clients.filter(client => String(client.email || "").trim()).length,
    adminMatches: findings.filter(row => row.reason === "matches_admin_username").length, findings };
}
if (require.main === module || process.env.P143_READ_ONLY_DIAGNOSTIC === "1") {
  const start = Date.now();
  const stateFile = process.env.P143_STATE_FILE;
  const usersFile = process.env.P143_USERS_FILE;
  if (!stateFile || !usersFile) throw new Error("Explicit read-only diagnostic paths required");
  const before = fs.statSync(stateFile);
  const raw = fs.readFileSync(stateFile);
  const payload = JSON.parse(raw);
  const usersPayload = JSON.parse(fs.readFileSync(usersFile));
  const result = diagnose(payload.state || payload, usersPayload.users || usersPayload);
  const after = fs.statSync(stateFile);
  console.log(JSON.stringify({ ...result, at: new Date().toISOString(), stateVersion: payload.version,
    sha256: crypto.createHash("sha256").update(raw).digest("hex"), stableDuringRead: before.mtimeMs === after.mtimeMs && before.size === after.size,
    elapsedMs: Date.now() - start, mode: "read-only; no database or file writes" }, null, 2));
}
module.exports = { diagnose };
