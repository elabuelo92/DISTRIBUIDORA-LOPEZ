"use strict";
let supplierRemitsName = "", supplierRemitsBusy = false, supplierRemitCancelPreview = null;
function supplierRemitDialog() {
  let dialog = byId("supplierRemitsDetail");
  if (!dialog) {
    dialog = document.createElement("dialog"); dialog.id = "supplierRemitsDetail";
    dialog.style.width = "min(1000px, 96vw)"; document.body.append(dialog);
    dialog.addEventListener("cancel", e => { if (supplierRemitsBusy) e.preventDefault(); });
  }
  return dialog;
}
async function refreshSupplierRemits() {
  const dialog = byId("supplierRemitsDetail");
  if (!dialog?.open || supplierRemitsBusy) return;
  supplierRemitsBusy = true;
  const expanded = new Set([...dialog.querySelectorAll("details[open][data-remit-detail]")].map(el => el.dataset.remitDetail));
  try {
    const response = await fetchWithTimeout(apiUrl(`api/suppliers/remits/detail?supplier=${encodeURIComponent(supplierRemitsName)}`), { cache: "no-store" }, 15000);
    const payload = await response.json(); if (!response.ok) throw new Error(payload.error);
    dialog.innerHTML = `<h2>${escapeHtml(supplierRemitsName)} - Remitos</h2><button type="button" class="secondary-btn" data-close-remits>Cerrar</button><p role="alert" id="supplierRemitDetailError"></p>` +
      (payload.remits.length ? payload.remits.map(r => `<details data-remit-detail="${escapeHtml(r.id)}" ${expanded.has(r.id) ? "open" : ""}>
        <summary><strong>Remito ${escapeHtml(r.remitNumber)}</strong> - ${escapeHtml(r.cancellation ? "Anulado" : r.adminValidationStatus)} - ${money.format(r.amount || r.declaredAmount || 0)}</summary>
        <p>${escapeHtml(r.date)} | Factura ${escapeHtml(r.invoiceNumber || "Sin factura")} | ${escapeHtml(r.observations || "")}</p>
        <div class="responsive-table"><table><thead><tr><th>Codigo</th><th>Producto</th><th>Recibido</th><th>Ingreso original</th><th>Importe</th></tr></thead><tbody>${(r.products || []).map(p => `<tr><td>${escapeHtml(p.productCode)}</td><td>${escapeHtml(p.name || p.product)}</td><td>${escapeHtml(String(p.stockQty ?? p.qty ?? ""))}</td><td>${escapeHtml(String(r.stockApplied ? p.stockAppliedQty ?? 0 : 0))}</td><td>${money.format(p.subtotal || 0)}</td></tr>`).join("")}</tbody></table></div>
        <p>${(r.uploads || [r.upload]).concat(r.invoiceUpload || []).filter(a => a?.url && /^\/api\/supplier-uploads\//.test(a.url)).map((a, i) => `<a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">Adjunto ${i + 1}</a>`).join(" | ")}</p>
        ${r.cancellation ? `<p><strong>Anulado</strong> ${escapeHtml(new Date(r.cancellation.at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }))} / ${escapeHtml(r.cancellation.user)}: ${escapeHtml(r.cancellation.reason)}</p><p>Reverso proveedor: ${money.format(r.cancellation.impact.amount)}</p><ul>${r.cancellation.impact.lines.map(l => `<li>${escapeHtml(l.code)}: stock ${l.before} → ${l.after} (reverso ${l.qty})</li>`).join("")}</ul>` :
          `${!r.economicValidated ? `<button type="button" class="mini-btn" data-supplier-remit-validate="${escapeHtml(r.id)}">Conciliar remito</button>` : ""}<form data-remit-cancel="${escapeHtml(r.id)}"><label>Motivo de anulacion<input name="reason" required minlength="5" maxlength="1000"></label><button type="submit" class="secondary-btn">Previsualizar anulacion</button></form>`}
      </details>`).join("") : "<p>Sin remitos.</p>");
  } catch (error) { showCompactNotice(error.message, "warn"); }
  finally { supplierRemitsBusy = false; }
}
document.addEventListener("click", async event => {
  const open = event.target.closest("[data-supplier-remits]");
  if (open && isAdminUser() && !supplierRemitsBusy) {
    supplierRemitsName = open.dataset.supplierRemits; const dialog = supplierRemitDialog();
    dialog.innerHTML = "<p>Cargando remitos...</p>"; if (!dialog.open) dialog.showModal();
    await refreshSupplierRemits(); return;
  }
  if (event.target.closest("[data-close-remits]") && !supplierRemitsBusy) byId("supplierRemitsDetail").close();
  if (event.target.closest("[data-close-remit-cancel]") && !supplierRemitsBusy) byId("supplierRemitCancelConfirm").close();
  if (!event.target.closest("[data-confirm-remit-cancel]") || supplierRemitsBusy || !supplierRemitCancelPreview) return;
  supplierRemitsBusy = true;
  const confirm = byId("supplierRemitCancelConfirm"); confirm.querySelectorAll("button").forEach(b => { b.disabled = true; });
  try {
    const p = supplierRemitCancelPreview;
    await postOperationalAction(`api/suppliers/remits/${encodeURIComponent(p.id)}/cancellation`, { ...p, action: "apply" });
    supplierRemitCancelPreview = null; confirm.close(); supplierRemitsBusy = false;
    await refreshSupplierRemits(); showCompactNotice("Remito anulado con auditoria. Movimientos revertidos una sola vez.", "ok");
  } catch (error) { confirm.querySelector('[role="alert"]').textContent = error.message; }
  finally { supplierRemitsBusy = false; confirm.querySelectorAll("button").forEach(b => { b.disabled = false; }); }
});
document.addEventListener("submit", async event => {
  const form = event.target;
  if (!form.matches("[data-remit-cancel]")) return;
  event.preventDefault(); if (supplierRemitsBusy) return;
  supplierRemitsBusy = true;
  try {
    const reason = new FormData(form).get("reason"), id = form.dataset.remitCancel;
    const p = await postOperationalAction(`api/suppliers/remits/${encodeURIComponent(id)}/cancellation`, { action: "preview", reason });
    supplierRemitCancelPreview = { id, reason, token: p.token, requestId: crypto.randomUUID() };
    let dialog = byId("supplierRemitCancelConfirm");
    if (!dialog) { dialog = document.createElement("dialog"); dialog.id = "supplierRemitCancelConfirm"; dialog.style.width = "min(650px,96vw)"; document.body.append(dialog); dialog.addEventListener("cancel", e => { if (supplierRemitsBusy) e.preventDefault(); }); }
    dialog.innerHTML = `<h2>Confirmar anulacion</h2><p>${escapeHtml(reason)}</p><p>Saldo proveedor: ${money.format(p.impact.balanceBefore)} → ${money.format(p.impact.balanceAfter)}</p><ul>${p.impact.lines.map(l => `<li>${escapeHtml(l.code)} ${escapeHtml(l.name)}: ${l.before} → ${l.after}. Reservado: ${l.reserved}</li>`).join("")}</ul>${p.impact.stockApplied ? "" : "<p>Sin movimientos de stock ni saldo: remito pendiente.</p>"}<p role="alert"></p><button type="button" class="danger-btn" data-confirm-remit-cancel>Confirmar anulacion</button><button type="button" data-close-remit-cancel>Volver</button>`;
    dialog.showModal();
  } catch (error) { byId("supplierRemitDetailError").textContent = error.message; }
  finally { supplierRemitsBusy = false; }
});
