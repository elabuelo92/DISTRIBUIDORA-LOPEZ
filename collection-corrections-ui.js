"use strict";
function isCollectionReversal(entry) { return Boolean(entry.correctionId && entry.type === "Reverso administrativo de cobranza"); }
function accountCollectionNet(entry) { return entry.type === "Anulacion remito proveedor" ? 0 : Number(entry.credit || 0) - (isCollectionReversal(entry) ? Number(entry.debit || 0) : 0); }
let correctionBusy = false, correctionPreview = null, correctionRequestId = "";
let correctionSources = [];
let correctionAuthorizing = false;
function newCorrectionRequestId() {
  return typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `COR-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function setCorrectionTransferMode() {
  const form = byId("collectionCorrectionForm");
  const retain = form.elements.retainTransfer.checked;
  for (const name of ["transferAmount", "bank", "reference", "proof"]) form.elements[name].disabled = retain;
  const needsProof = !retain && Number(form.elements.transferAmount.value) > 0;
  form.elements.bank.required = needsProof;
  form.elements.reference.required = needsProof;
  form.elements.proof.required = needsProof;
}
async function loadCollectionCorrections(routeId = "") {
  if (correctionBusy || !isAdminUser()) return;
  correctionBusy = true;
  try {
    const response = await fetchWithTimeout(apiUrl(`api/collection-corrections?routeId=${encodeURIComponent(routeId)}`), { cache: "no-store" }, 15000);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    correctionSources = data.sources;
    correctionPreview = null; correctionRequestId = newCorrectionRequestId();
    byId("collectionCorrectionsContent").innerHTML = `<form id="collectionCorrectionForm" class="form-grid">
      <label>Ruta cerrada<select name="routeId" required><option value="">Seleccionar</option>${data.routes.map(r => `<option value="${escapeHtml(r.id)}" ${r.id === routeId ? "selected" : ""}>${escapeHtml(r.label)}</option>`).join("")}</select></label>
      <label>Cobro original<select name="sourceId" required><option value="">Seleccionar</option>${data.sources.map(s => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.client || "Sin cliente")} - ${escapeHtml(s.id)} - Efectivo ${money.format(s.cash)} / Transferencia declarada ${money.format(Math.max(s.transfer, s.pendingTransfer || 0))}</option>`).join("")}</select></label>
      <p id="collectionCorrectionSource" role="status"></p>
      <label>Efectivo correcto<input name="cashAmount" type="number" min="0" step="0.01" required></label>
      <label>Transferencia correcta<input name="transferAmount" type="number" min="0" step="0.01" required></label>
      <label class="correction-retain"><input name="retainTransfer" type="checkbox">Conservar transferencia original y su comprobante</label>
      <label>Banco / cuenta receptora<input name="bank" maxlength="120"></label>
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
  if (!value && byId("collectionCorrectionForm")) setCorrectionTransferMode();
}
document.addEventListener("input", event => {
  if (!event.target.closest("#collectionCorrectionForm") || correctionBusy) return;
  correctionPreview = null; correctionRequestId = newCorrectionRequestId();
  byId("applyCollectionCorrection").disabled = true; byId("collectionCorrectionImpact").textContent = "";
  setCorrectionTransferMode();
});
document.addEventListener("change", event => {
  if (event.target.matches('#collectionCorrectionForm select[name="routeId"]')) loadCollectionCorrections(event.target.value);
  if (event.target.matches('#collectionCorrectionForm select[name="sourceId"]')) {
    const source = correctionSources.find(s => s.id === event.target.value);
    const form = byId("collectionCorrectionForm");
    form.elements.cashAmount.value = source?.cash ?? "";
    form.elements.transferAmount.value = source ? Math.max(source.transfer, source.pendingTransfer || 0) : "";
    form.elements.retainTransfer.checked = Boolean(source && Math.max(source.transfer, source.pendingTransfer || 0) > 0);
    form.elements.bank.value = source?.bank || "";
    form.elements.reference.value = source?.reference || "";
    form.elements.proof.value = "";
    setCorrectionTransferMode();
    byId("collectionCorrectionSource").textContent = source ? `Cobro original: efectivo ${money.format(source.cash)} / transferencia ${money.format(Math.max(source.transfer, source.pendingTransfer || 0))}${source.customerCredit ? ` / genero saldo a favor ${money.format(source.customerCredit)}: requiere conciliacion especifica` : ""}` : "";
    correctionPreview = null; correctionRequestId = newCorrectionRequestId();
    byId("applyCollectionCorrection").disabled = true;
    byId("collectionCorrectionImpact").textContent = "";
  }
});
document.addEventListener("submit", async event => {
  if (event.target.id !== "collectionCorrectionForm") return;
  event.preventDefault(); if (correctionBusy) return;
  const form = event.target, values = new FormData(form);
  const retainTransfer = form.elements.retainTransfer.checked;
  const transferAmount = Number(form.elements.transferAmount.value);
  lockCorrection(true); correctionPreview = null;
  try {
    const file = values.get("proof");
    if (file?.size > 8 * 1024 * 1024) throw new Error("El comprobante supera 8 MB.");
    const dataUrl = file?.size ? await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }) : "";
    const input = { routeId: values.get("routeId"), sourceId: values.get("sourceId"), cashAmount: Number(values.get("cashAmount")), transferAmount, retainTransfer, reason: values.get("reason"), bank: values.get("bank") || "", reference: values.get("reference") || "", dataUrl, requestId: correctionRequestId };
    const result = await postOperationalAction("api/collection-corrections", { ...input, action: "preview" });
    correctionPreview = { ...input, token: result.token };
    const p = result.impact;
    byId("collectionCorrectionImpact").innerHTML = `<table><thead><tr><th>Concepto</th><th>Original</th><th>Corregido</th><th>Diferencia</th></tr></thead><tbody><tr><th>Efectivo</th><td>${money.format(p.originalCash)}</td><td>${money.format(p.correctedCash)}</td><td>${money.format(p.cashDelta)}</td></tr><tr><th>Transferencia</th><td>${money.format(p.originalTransfer)}</td><td>${money.format(p.correctedTransfer)}</td><td>${money.format(p.transferDelta)}</td></tr><tr><th>Saldo del cliente</th><td>${money.format(p.balanceBefore)}</td><td>${money.format(p.balanceAfter)}</td><td>${money.format(p.balanceAfter - p.balanceBefore)}</td></tr></tbody></table><dl><dt>Reverso de pagos acreditados</dt><dd>${money.format(p.reversal)}</dd><dt>Transferencias acreditadas a revertir</dt><dd>${money.format(p.appliedTransferReversed || 0)}</dd><dt>Pendientes anteriores reemplazados</dt><dd>${money.format(p.pendingTransferCancelled || 0)}</dd><dt>Nueva transferencia por validar</dt><dd>${money.format(p.pendingValidation)}</dd><dt>Transferencias pendientes conservadas</dt><dd>${money.format(p.retainedPendingValidation || 0)}</dd><dt>Saldo tras validacion bancaria</dt><dd>${money.format(p.balanceAfterValidation)}</dd><dt>Saldo a favor conservado</dt><dd>${money.format(p.customerCreditUnchanged || 0)}</dd></dl><strong>Cierre historico: sin cambios</strong>${p.retainTransfer ? '<p>Transferencia original conservada, sin reversion ni nueva acreditacion.</p>' : '<p>Las transferencias sustituidas quedan vinculadas al ajuste. El nuevo comprobante requiere validacion bancaria.</p>'}`;
    byId("collectionCorrectionError").textContent = "";
  } catch (error) { byId("collectionCorrectionError").textContent = error.message; }
  finally { lockCorrection(false); }
});
document.addEventListener("click", async event => {
  if (event.target.closest("#loadCollectionCorrections")) return loadCollectionCorrections();
  if (!event.target.closest("#applyCollectionCorrection") || correctionBusy || !correctionPreview) return;
  lockCorrection(true);
  const form = byId("collectionCorrectionAuthorizationForm");
  form.elements.username.value = currentUser?.username || "";
  form.elements.password.value = "";
  byId("collectionCorrectionAuthorizationError").textContent = "";
  byId("collectionCorrectionAuthorization").showModal();
  form.elements.password.focus();
});

function closeCorrectionAuthorization() {
  if (correctionAuthorizing) return;
  byId("collectionCorrectionAuthorizationForm").elements.password.value = "";
  byId("collectionCorrectionAuthorization").close();
  lockCorrection(false);
}
document.addEventListener("click", event => {
  if (event.target.closest("#cancelCollectionCorrectionAuthorization")) closeCorrectionAuthorization();
});
document.addEventListener("cancel", event => {
  if (event.target.id !== "collectionCorrectionAuthorization") return;
  event.preventDefault(); closeCorrectionAuthorization();
}, true);
document.addEventListener("submit", async event => {
  if (event.target.id !== "collectionCorrectionAuthorizationForm") return;
  event.preventDefault();
  if (correctionAuthorizing || !correctionPreview) return;
  const form = event.target;
  correctionAuthorizing = true;
  form.querySelectorAll("button").forEach(button => { button.disabled = true; });
  try {
    const input = correctionPreview;
    await postOperationalAction("api/collection-corrections", { ...input, action: "apply", adminPassword: form.elements.password.value });
    correctionPreview = null;
    correctionAuthorizing = false;
    closeCorrectionAuthorization();
    showCompactNotice("Ajuste registrado. Cierre historico conservado.", "ok");
    lockCorrection(false); await loadCollectionCorrections(input.routeId);
  } catch (error) { byId("collectionCorrectionAuthorizationError").textContent = error.message; }
  finally {
    correctionAuthorizing = false;
    form.elements.password.value = "";
    form.querySelectorAll("button").forEach(button => { button.disabled = false; });
  }
});
