"use strict";
let collectionVisitPage = 0, collectionVisitData = null, collectionVisitLoading = false, collectionVisitUser = "";
function renderCollectionVisits() {
  if (!["admin", "driver"].includes(currentUser?.role)) return;
  if (collectionVisitUser !== currentUser.username && !collectionVisitLoading) {
    collectionVisitUser = currentUser.username; collectionVisitPage = 0; loadCollectionVisits();
  }
}
async function loadCollectionVisits() {
  if (collectionVisitLoading) return;
  collectionVisitLoading = true;
  const user = currentUser?.username;
  try {
    const q = byId("collectionVisitSearch").elements.q.value.trim();
    const response = await fetchWithTimeout(apiUrl(`api/collection-visits?q=${encodeURIComponent(q)}&page=${collectionVisitPage}`), { cache: "no-store" }, 15000);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudieron consultar las ordenes de cobro.");
    if (user !== currentUser?.username) return;
    collectionVisitData = data;
    const routes = (id = "") => `<option value="">Bolsa / sin ruta</option>` + data.routes.filter(r => !r.closed).map(r => `<option value="${escapeHtml(r.id)}" ${r.id === id ? "selected" : ""}>${escapeHtml(r.label)}</option>`).join("");
    byId("collectionVisitContent").innerHTML = (isAdminUser() ? `<form id="collectionVisitCreate" class="form-grid">
      <label>Cliente con saldo<select name="clientId" required><option value="">Seleccionar cliente</option>${data.clients.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)} - ${money.format(c.balance)}</option>`).join("")}</select></label>
      <label>Importe<input name="amount" type="number" min="0.01" step="0.01" required></label><label>Ruta<select name="routeId">${routes()}</select></label><button type="submit" class="primary-btn">Crear orden de cobro</button></form>` : "") +
      `<div class="responsive-table"><table><thead><tr><th>Cliente / orden</th><th>Ruta</th><th>Solicitado</th><th>Cobrado validado</th><th>Por validar</th><th>Resta visitar</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>` + data.visits.map(v => {
        const s = v.summary, r = data.routes.find(r => r.id === v.routeId), gps = s.gps;
        const hasGps = gps.lat !== null && gps.lng !== null && Number.isFinite(Number(gps.lat)) && Number.isFinite(Number(gps.lng));
        return `<tr><td><strong>${escapeHtml(v.client)}</strong><small>${escapeHtml(v.id)}</small><details><summary>Historial</summary>${v.history.map(h => `<p>${escapeHtml(h.at)} ${escapeHtml(h.action)} ${escapeHtml(h.user || "")} ${escapeHtml(h.reason || "")}</p>`).join("")}</details></td>
          <td>${escapeHtml(r?.label || "Sin ruta")}${isAdminUser() && !v.payments.length && !v.completedAt && !r?.closed ? `<select aria-label="Ruta destino" data-visit-route="${escapeHtml(v.id)}">${routes(v.routeId)}</select><button type="button" class="mini-btn" data-visit-assign="${escapeHtml(v.id)}">Asignar</button>` : ""}</td>
          <td>${money.format(v.amount)}</td><td>${money.format(s.paid)}</td><td>${money.format(s.pendingValidation)}</td><td>${money.format(s.pending)}</td><td>${escapeHtml(s.status)}${v.completedAt ? " / Visita finalizada" : ""}</td>
          <td>${hasGps ? `<a class="mini-btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${gps.lat},${gps.lng}`)}">Ir</a>` : "SIN GPS"}
          ${r && !r.closed && !v.completedAt ? `<button type="button" class="mini-btn" data-visit-collect="${escapeHtml(v.id)}">Cobrar</button><button type="button" class="mini-btn" data-visit-finish="${escapeHtml(v.id)}">${v.payments.length ? "Finalizar parcial" : "No cobrada"}</button>` : ""}</td></tr>`;
      }).join("") + `</tbody></table></div><p>${data.total} ordenes | Pagina ${data.page + 1}</p><button type="button" class="mini-btn" data-visit-page="-1" ${data.page === 0 ? "disabled" : ""}>Anterior</button><button type="button" class="mini-btn" data-visit-page="1" ${(data.page + 1) * 50 >= data.total ? "disabled" : ""}>Siguiente</button>`;
  } catch (error) { showCompactNotice(error.message, "warn"); }
  finally { collectionVisitLoading = false; }
}
function openCollectionVisitPayment(id) {
  const visit = collectionVisitData?.visits.find(v => v.id === id);
  if (!visit) return;
  let dialog = byId("collectionVisitPayment");
  if (!dialog) {
    dialog = document.createElement("dialog"); dialog.id = "collectionVisitPayment";
    dialog.style.width = "min(620px, 94vw)"; document.body.append(dialog);
    dialog.addEventListener("cancel", e => { if (dialog.dataset.saving) e.preventDefault(); });
  }
  dialog.innerHTML = `<form id="collectionVisitPaymentForm" class="form-grid" data-id="${escapeHtml(id)}" data-request-id="${crypto.randomUUID()}">
    <h2>${escapeHtml(visit.client)}</h2><p>Pendiente de esta visita: ${money.format(visit.summary.pending)}</p>
    <label>Efectivo<input name="cashAmount" type="number" min="0" step="0.01"></label><label>Transferencia<input name="transferAmount" type="number" min="0" step="0.01"></label>
    <label>Banco<input name="bank" value="Mercado Pago" maxlength="120"></label><label>Numero de operacion<input name="reference" maxlength="160"></label>
    <label>Comprobante<input name="proof" type="file" accept="image/*,application/pdf"></label><p role="alert" data-visit-error></p>
    <button type="submit" class="primary-btn">Registrar cobro</button><button type="button" class="secondary-btn" data-visit-cancel>Cancelar</button></form>`;
  dialog.showModal();
}
async function postCollectionVisit(path, body) {
  return postOperationalAction(`api/collection-visits${path}`, { ...body, deviceId: deliveryDevice.id });
}
document.addEventListener("submit", async event => {
  const form = event.target;
  if (form.id === "collectionVisitSearch") { event.preventDefault(); collectionVisitPage = 0; await loadCollectionVisits(); return; }
  if (!["collectionVisitCreate", "collectionVisitPaymentForm"].includes(form.id)) return;
  event.preventDefault(); if (form.dataset.saving) return;
  form.dataset.saving = "true";
  const dialog = form.closest("dialog"); if (dialog) dialog.dataset.saving = "true";
  form.querySelectorAll("button").forEach(b => { b.disabled = true; });
  const data = new FormData(form);
  try {
    if (form.id === "collectionVisitCreate") {
      form.dataset.requestId ||= crypto.randomUUID();
      await postCollectionVisit("", { requestId: form.dataset.requestId, clientId: data.get("clientId"), routeId: data.get("routeId"), amount: Number(data.get("amount")) });
    } else {
      const file = data.get("proof"); let dataUrl = "";
      if (file?.size) {
        if (file.size > 8 * 1024 * 1024) throw new Error("El comprobante supera 8 MB.");
        dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      }
      await postCollectionVisit(`/${encodeURIComponent(form.dataset.id)}/collect`, { requestId: form.dataset.requestId, cashAmount: Number(data.get("cashAmount") || 0), transferAmount: Number(data.get("transferAmount") || 0), bank: data.get("bank"), reference: data.get("reference"), dataUrl });
      dialog.close();
    }
    showCompactNotice("Orden de cobro actualizada.", "ok"); await loadCollectionVisits();
  } catch (error) {
    const message = form.querySelector("[data-visit-error]"); if (message) message.textContent = error.message; else showCompactNotice(error.message, "warn");
  } finally {
    delete form.dataset.saving; if (dialog) delete dialog.dataset.saving;
    form.querySelectorAll("button").forEach(b => { b.disabled = false; });
  }
});
document.addEventListener("click", async event => {
  const button = event.target.closest("button"); if (!button || button.disabled) return;
  if (button.hasAttribute("data-visit-cancel")) { button.closest("dialog").close(); return; }
  if (button.dataset.visitCollect) { openCollectionVisitPayment(button.dataset.visitCollect); return; }
  if (button.dataset.visitPage) { collectionVisitPage += Number(button.dataset.visitPage); await loadCollectionVisits(); return; }
  const id = button.dataset.visitAssign || button.dataset.visitFinish; if (!id) return;
  let body;
  if (button.dataset.visitAssign) body = { routeId: [...document.querySelectorAll("[data-visit-route]")].find(s => s.dataset.visitRoute === id).value };
  else { const reason = window.prompt("Motivo de finalizacion; el saldo sin cobrar sigue en cuenta corriente:"); if (!reason?.trim()) return; body = { reason }; }
  button.disabled = true;
  try { await postCollectionVisit(`/${encodeURIComponent(id)}/${button.dataset.visitAssign ? "assign" : "finish"}`, body); await loadCollectionVisits(); }
  catch (error) { showCompactNotice(error.message, "warn"); }
  finally { button.disabled = false; }
});
