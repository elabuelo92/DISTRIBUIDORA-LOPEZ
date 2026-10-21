"use strict";
function isCollectionReversal(entry) { return Boolean(entry.correctionId && entry.type === "Reverso administrativo de cobranza"); }
function accountCollectionNet(entry) { return Number(entry.credit || 0) - (isCollectionReversal(entry) ? Number(entry.debit || 0) : 0); }
let correctionBusy = false, correctionPreview = null, correctionRequestId = "";
async function loadCollectionCorrections(routeId = "") {
  if (correctionBusy || !isAdminUser()) return;
  correctionBusy = true;
  try {
    const response = await fetchWithTimeout(apiUrl(`api/collection-corrections?routeId=${encodeURIComponent(routeId)}`), { cache: "no-store" }, 15000);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    correctionPreview = null; correctionRequestId = crypto.randomUUID();
    byId("collectionCorrectionsContent").innerHTML = `<form id="collectionCorrectionForm" class="form-grid">
      <label>Ruta cerrada<select name="routeId" required><option value="">Seleccionar</option>${data.routes.map(r => `<option value="${escapeHtml(r.id)}" ${r.id === routeId ? "selected" : ""}>${escapeHtml(r.label)}</option>`).join("")}</select></label>
      <label>Cobro original<select name="sourceId" required><option value="">Seleccionar</option>${data.sources.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.client || "Sin cliente")} - ${escapeHtml(s.id)} - Efectivo ${money.format(s.cash)} / Transferencia ${money.format(s.transfer)}</option>`).join("")}</select></label>
      <label>Efectivo correcto<input name="cashAmount" type="number" min="0" step="0.01" required></label>
      <label>Transferencia correcta<input name="transferAmount" type="number" min="0" step="0.01" required></label>
      <label>Banco<input name="bank" value="Mercado Pago" maxlength="120"></label>
      <label>Operacion<input name="reference" maxlength="160"></label>
      <label>Nuevo comprobante<input name="proof" type="file" accept="image/*,application/pdf"></label>
      <label>Motivo obligatorio<textarea name="reason" required minlength="5" maxlength="1000"></textarea></label>
      <button type="submit" class="secondary-btn">Previsualizar</button>
      <div id="collectionCorrectionImpact"></div><button type="button" id="applyCollectionCorrection" class="primary-btn" disabled>Confirmar ajuste administrativo</button>
      <p role="alert" id="collectionCorrectionError"></p></form>
      <h3>Ajustes vinculados al cierre</h3><div class="responsive-table"><table><thead><tr><th>Fecha / Usuario</th><th>Cliente / Cobro</th><th>Motivo</th><th>Ajuste efectivo</th><th>Ajuste transferencia</th><th>Saldo posterior</th></tr></thead><tbody>${data.corrections.map(c => `<tr><td data-label="Fecha / Usuario">${escapeHtml(new Date(c.at).toLocaleString("es-AR"))}<br>${escapeHtml(c.user)}</td><td data-label="Cliente / Cobro">${escapeHtml(c.client)}<br>${escapeHtml(c.sourceId)}</td><td data-label="Motivo">${escapeHtml(c.reason)}</td><td data-label="Ajuste efectivo">${money.format(c.impact.cashDelta)}</td><td data-label="Ajuste transferencia">${money.format(c.impact.transferDelta)}</td><td data-label="Saldo posterior">${money.format(c.impact.balanceAfter)}</td></tr>`).join("")}</tbody></table></div>`;
  } catch (error) { showCompactNotice(error.message, "warn"); }
  finally { correctionBusy = false; }
}
function lockCorrection(value) {
  correctionBusy = value;
  byId("collectionCorrectionForm")?.querySelectorAll("input,select,textarea,button").forEach(el => { el.disabled = value; });
  if (!value && byId("applyCollectionCorrection")) byId("applyCollectionCorrection").disabled = !correctionPreview;
}
document.addEventListener("input", event => {
  if (!event.target.closest("#collectionCorrectionForm") || correctionBusy) return;
  correctionPreview = null; correctionRequestId = crypto.randomUUID();
  byId("applyCollectionCorrection").disabled = true; byId("collectionCorrectionImpact").textContent = "";
});
document.addEventListener("change", event => {
  if (event.target.matches('#collectionCorrectionForm select[name="routeId"]')) loadCollectionCorrections(event.target.value);
});
document.addEventListener("submit", async event => {
  if (event.target.id !== "collectionCorrectionForm") return;
  event.preventDefault(); if (correctionBusy) return;
  const form = event.target, values = new FormData(form);
  lockCorrection(true); correctionPreview = null;
  try {
    const file = values.get("proof");
    if (file?.size > 8 * 1024 * 1024) throw new Error("El comprobante supera 8 MB.");
    const dataUrl = file?.size ? await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }) : "";
    const input = { routeId: values.get("routeId"), sourceId: values.get("sourceId"), cashAmount: Number(values.get("cashAmount")), transferAmount: Number(values.get("transferAmount")), reason: values.get("reason"), bank: values.get("bank"), reference: values.get("reference"), dataUrl, requestId: correctionRequestId };
    const result = await postOperationalAction("api/collection-corrections", { ...input, action: "preview" });
    correctionPreview = { ...input, token: result.token };
    const p = result.impact;
    byId("collectionCorrectionImpact").innerHTML = `<dl><dt>Saldo actual</dt><dd>${money.format(p.balanceBefore)}</dd><dt>Reverso</dt><dd>${money.format(p.reversal)}</dd><dt>Saldo despues del ajuste</dt><dd>${money.format(p.balanceAfter)}</dd><dt>Transferencia por validar</dt><dd>${money.format(p.pendingValidation)}</dd><dt>Saldo tras validacion bancaria</dt><dd>${money.format(p.balanceAfterValidation)}</dd><dt>Ajuste efectivo / transferencia</dt><dd>${money.format(p.cashDelta)} / ${money.format(p.transferDelta)}</dd></dl><strong>Cierre historico: sin cambios</strong>`;
    byId("collectionCorrectionError").textContent = "";
  } catch (error) { byId("collectionCorrectionError").textContent = error.message; }
  finally { lockCorrection(false); }
});
document.addEventListener("click", async event => {
  if (event.target.closest("#loadCollectionCorrections")) return loadCollectionCorrections();
  if (!event.target.closest("#applyCollectionCorrection") || correctionBusy || !correctionPreview) return;
  lockCorrection(true);
  try {
    const input = correctionPreview;
    await postOperationalAction("api/collection-corrections", { ...input, action: "apply" });
    correctionPreview = null;
    showCompactNotice("Ajuste registrado. Cierre historico conservado.", "ok");
    lockCorrection(false); await loadCollectionCorrections(input.routeId);
  } catch (error) { byId("collectionCorrectionError").textContent = error.message; }
  finally { lockCorrection(false); }
});
