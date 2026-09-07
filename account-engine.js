(function initAccountEngine(root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.DLAccountEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildAccountEngine() {
  "use strict";

  const CLOSED_ORDER_STATUSES = new Set(["Entregado", "Cobrado", "Cerrado", "Cancelado"]);
  const TRANSFER_STATUS = {
    PENDING: "Pendiente de Transferencia",
    RECEIVED: "Comprobante Recibido",
    BANK_PENDING: "Pendiente de Validacion Bancaria",
    VALIDATED: "Transferencia Validada",
    CONFIRMED: "Pago Confirmado",
    ACCOUNT_UPDATED: "Cuenta Corriente Actualizada",
    OBSERVED: "Transferencia Observada"
  };
  const TRANSFER_STATUSES = new Set(Object.values(TRANSFER_STATUS));
  const FINAL_TRANSFER_STATUSES = new Set([
    TRANSFER_STATUS.VALIDATED,
    TRANSFER_STATUS.CONFIRMED,
    TRANSFER_STATUS.ACCOUNT_UPDATED
  ]);

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function positive(value) {
    return Math.max(0, numeric(value, 0));
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function sameClient(a, b) {
    return normalizeText(a) === normalizeText(b);
  }

  function historicalOrders(state) {
    const orders = [];
    const seen = new Set();
    [state && state.orders, state && state.archivedOrders].forEach((source) => {
      (Array.isArray(source) ? source : []).forEach((order) => {
        const key = String(order && (order.code || order.id) || "").trim();
        if (key && seen.has(key)) return;
        if (key) seen.add(key);
        orders.push(order);
      });
    });
    return orders;
  }

  function parseDate(value) {
    if (!value) return null;
    if (value instanceof Date && Number.isFinite(value.getTime())) return value;
    const text = String(value).trim();
    const direct = new Date(text);
    if (Number.isFinite(direct.getTime())) return direct;
    const match = text.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (!match) return null;
    const now = new Date();
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : now.getFullYear();
    const parsed = new Date(year, month, day);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function localTraceParts(value) {
    const date = new Date(value || nowIso());
    return {
      date: date.toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
      time: date.toLocaleTimeString("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      })
    };
  }

  function isoDate(value) {
    const parsed = parseDate(value) || new Date();
    return parsed.toLocaleDateString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  }

  function transferStatus(value, hasAttachment) {
    const text = String(value || "").trim();
    if (text === "Pendiente") return TRANSFER_STATUS.PENDING;
    if (text === "Validada") return TRANSFER_STATUS.ACCOUNT_UPDATED;
    if (text === "Rechazada") return TRANSFER_STATUS.OBSERVED;
    if (TRANSFER_STATUSES.has(text)) return text;
    return hasAttachment ? TRANSFER_STATUS.RECEIVED : TRANSFER_STATUS.PENDING;
  }

  function isTransferDebtOpen(status) {
    return !FINAL_TRANSFER_STATUSES.has(transferStatus(status));
  }

  function transferHistoryEntry(action, context, extra = {}) {
    const at = nowIso();
    const parts = localTraceParts(at);
    return {
      at,
      date: parts.date,
      time: parts.time,
      user: String(context && (context.user || context.username) || "Sistema"),
      action,
      ...extra
    };
  }

  function pushTransferHistory(record, action, context, extra) {
    record.history = Array.isArray(record.history) ? record.history : [];
    record.history.push(transferHistoryEntry(action, context, extra));
    return record;
  }

  function transferReconciliationKey(record) {
    return [
      isoDate(record.date || record.at),
      Math.round(positive(record.amount) * 100),
      normalizeText(record.bank),
      normalizeText(record.alias),
      String(record.cbu || "").replace(/\D/g, "")
    ].join("|");
  }

  function normalizeTransferRecord(record) {
    const at = record.at || nowIso();
    const parts = localTraceParts(at);
    const date = String(record.date || parts.date || "").trim();
    const normalized = {
      id: String(record.id || `TRF-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`),
      source: String(record.source || "manual"),
      orderCode: String(record.orderCode || ""),
      client: String(record.client || record.account || ""),
      seller: String(record.seller || ""),
      routeId: String(record.routeId || ""),
      bank: String(record.bank || "").trim(),
      alias: String(record.alias || "").trim(),
      cbu: String(record.cbu || "").trim(),
      date,
      time: String(record.time || parts.time || "").trim(),
      at,
      amount: positive(record.amount),
      status: transferStatus(record.status, record.attachment),
      observations: String(record.observations || "").trim(),
      attachment: record.attachment || null,
      uploadedAt: record.uploadedAt || (record.attachment && record.attachment.uploadedAt) || null,
      uploadedBy: String(record.uploadedBy || (record.attachment && record.attachment.uploadedBy) || "").trim(),
      uploadObservations: String(record.uploadObservations || "").trim(),
      validatedAt: record.validatedAt || null,
      validatedBy: record.validatedBy || "",
      validationBank: String(record.validationBank || record.bank || "").trim(),
      operationNumber: String(record.operationNumber || "").trim(),
      paymentConfirmedAt: record.paymentConfirmedAt || null,
      accountUpdatedAt: record.accountUpdatedAt || null,
      accountUpdatedBy: record.accountUpdatedBy || "",
      previousBalance: numeric(record.previousBalance, null),
      newBalance: numeric(record.newBalance, null),
      accountPaymentApplied: Boolean(record.accountPaymentApplied),
      accountEntryId: String(record.accountEntryId || "").trim(),
      rejectedAt: record.rejectedAt || null,
      rejectedBy: record.rejectedBy || "",
      statusReason: String(record.statusReason || "").trim(),
      driver: String(record.driver || record.driverUser || record.repartidor || "").trim(),
      loadedBy: String(record.loadedBy || record.uploadedBy || "").trim(),
      history: Array.isArray(record.history) ? record.history : []
    };
    normalized.matchKey = transferReconciliationKey(normalized);
    return normalized;
  }

  function receiptRecordFromOrder(order, receipt, index) {
    const id = String(receipt.id || receipt.reconciliationId || `${order.code || "PED"}-TRF-${index + 1}`);
    receipt.id = id;
    receipt.reconciliationId = id;
    receipt.status = transferStatus(receipt.status, receipt.attachment);
    receipt.date = receipt.date || localTraceParts(receipt.at).date;
    receipt.time = receipt.time || localTraceParts(receipt.at).time;
    receipt.amount = positive(receipt.amount || receipt.importe);
    return normalizeTransferRecord({
      id,
      source: "reparto",
      orderCode: order.code,
      client: order.client,
      seller: order.seller,
      routeId: receipt.routeId || order.routeId || "",
      bank: receipt.bank,
      alias: receipt.alias,
      cbu: receipt.cbu,
      date: receipt.date,
      time: receipt.time,
      at: receipt.at,
      amount: receipt.amount,
      status: receipt.status,
      observations: receipt.observations,
      attachment: receipt.attachment,
      uploadedAt: receipt.uploadedAt,
      uploadedBy: receipt.uploadedBy,
      uploadObservations: receipt.uploadObservations,
      validationBank: receipt.validationBank,
      operationNumber: receipt.operationNumber,
      paymentConfirmedAt: receipt.paymentConfirmedAt,
      accountUpdatedAt: receipt.accountUpdatedAt,
      accountUpdatedBy: receipt.accountUpdatedBy,
      previousBalance: receipt.previousBalance,
      newBalance: receipt.newBalance,
      accountPaymentApplied: receipt.accountPaymentApplied,
      accountEntryId: receipt.accountEntryId,
      history: receipt.history
    });
  }

  function ensureTransferReconciliation(state) {
    if (!state || typeof state !== "object") return [];
    state.bankReconciliation = Array.isArray(state.bankReconciliation) ? state.bankReconciliation.map(normalizeTransferRecord) : [];
    const byId = new Map(state.bankReconciliation.map((record) => [record.id, record]));
    historicalOrders(state).forEach((order) => {
      (Array.isArray(order.transferReceipts) ? order.transferReceipts : []).forEach((receipt, index) => {
        const record = receiptRecordFromOrder(order, receipt, index);
        const existing = byId.get(record.id);
        const next = existing ? normalizeTransferRecord({ ...record, ...existing }) : record;
        byId.set(next.id, next);
        receipt.status = next.status;
        receipt.reconciliationId = next.id;
        receipt.validatedAt = next.validatedAt;
        receipt.validatedBy = next.validatedBy;
        receipt.rejectedAt = next.rejectedAt;
        receipt.rejectedBy = next.rejectedBy;
        receipt.statusReason = next.statusReason;
        receipt.uploadedAt = next.uploadedAt;
        receipt.uploadedBy = next.uploadedBy;
        receipt.uploadObservations = next.uploadObservations;
        receipt.paymentConfirmedAt = next.paymentConfirmedAt;
        receipt.accountUpdatedAt = next.accountUpdatedAt;
        receipt.accountUpdatedBy = next.accountUpdatedBy;
        receipt.previousBalance = next.previousBalance;
        receipt.newBalance = next.newBalance;
        receipt.accountPaymentApplied = next.accountPaymentApplied;
        receipt.accountEntryId = next.accountEntryId;
        receipt.history = next.history;
      });
    });
    state.bankReconciliation = Array.from(byId.values())
      .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0));
    return state.bankReconciliation;
  }

  function daysBetween(a, b) {
    if (!a || !b) return 0;
    return Math.floor((b.getTime() - a.getTime()) / 86400000);
  }

  function accountEntries(state, clientName) {
    return (state.accounts || []).filter((entry) => sameClient(entry.account, clientName));
  }

  function lastPayment(state, clientName) {
    const payments = accountEntries(state, clientName)
      .filter((entry) => positive(entry.credit) > 0)
      .map((entry, index) => ({
        date: String(entry.date || entry.createdAt || ""),
        parsedDate: parseDate(entry.date || entry.createdAt),
        amount: positive(entry.credit),
        method: String(entry.method || ""),
        index
      }));
    if (!payments.length) return null;
    payments.sort((a, b) => {
      const aTime = a.parsedDate ? a.parsedDate.getTime() : 0;
      const bTime = b.parsedDate ? b.parsedDate.getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return a.index - b.index;
    });
    return payments[0];
  }

  function pendingOrderExposure(state, clientName, excludeCode) {
    return historicalOrders(state).reduce((total, order) => {
      if (!sameClient(order.client, clientName)) return total;
      if (excludeCode && String(order.code) === String(excludeCode)) return total;
      if (CLOSED_ORDER_STATUSES.has(order.status)) return total;
      if (order.accountPosted) return total;
      return total + positive(order.amount);
    }, 0);
  }

  function creditMode(client) {
    return normalizeText(client && client.forma_pago).includes("cuenta")
      || normalizeText(client && client.paymentMethod).includes("cuenta")
      || normalizeText(client && client.status).includes("deuda")
      || positive(client && (client.limit ?? client.limite_credito)) > 0;
  }

  function overdueDebtFor(state, client, currentBalance) {
    const explicit = positive(client.deuda_vencida ?? client.overdueDebt);
    if (explicit > 0) return Math.min(currentBalance, explicit);
    if (currentBalance <= 0) return 0;
    const status = normalizeText(client.estado_cuenta || client.estado || client.status);
    if (status.includes("vencid") || status.includes("bloquead")) return currentBalance;
    const creditDays = positive(client.dias_credito);
    if (!creditDays) return 0;
    const payment = lastPayment(state, client.name || client.nombre_comercial);
    if (!payment || !payment.parsedDate) return 0;
    return daysBetween(payment.parsedDate, new Date()) > creditDays ? currentBalance : 0;
  }

  function accountStatus(summary, client) {
    const status = normalizeText(client.estado || client.status);
    if (status.includes("bloquead")) return "Bloqueada";
    if (summary.overLimitAmount > 0) return "Sobre limite";
    if (summary.overdueDebt > 0) return "Deuda vencida";
    if (summary.currentBalance > 0) return "Con saldo pendiente";
    return "Al dia";
  }

  function findClient(state, clientOrName) {
    if (!clientOrName) return null;
    if (typeof clientOrName === "object") return clientOrName;
    return (state.clients || []).find((client) => sameClient(client.name || client.nombre_comercial, clientOrName)) || null;
  }

  function accountSummary(state, clientOrName, newOrderAmount, options) {
    const client = findClient(state, clientOrName);
    if (!client) {
      return {
        ok: false,
        error: "Cliente no encontrado.",
        requiresAuthorization: false
      };
    }
    const currentBalance = positive(client.balance ?? client.saldo_actual ?? client.saldo_inicial);
    const creditLimit = positive(client.limit ?? client.limite_credito);
    const pendingExposure = pendingOrderExposure(state, client.name || client.nombre_comercial, options && options.excludeOrderCode);
    const orderAmount = positive(newOrderAmount);
    const totalDebt = currentBalance + pendingExposure;
    const projectedBalance = totalDebt + orderAmount;
    const last = lastPayment(state, client.name || client.nombre_comercial);
    const overdueDebt = overdueDebtFor(state, client, currentBalance);
    const appliesCreditLimit = creditMode(client);
    const overLimitAmount = appliesCreditLimit && creditLimit > 0
      ? Math.max(0, projectedBalance - creditLimit)
      : 0;
    const zeroLimitNeedsAuthorization = appliesCreditLimit && creditLimit <= 0 && projectedBalance > 0;
    const blocked = normalizeText(client.estado || client.status).includes("bloquead");
    const requiresAuthorization = blocked || overLimitAmount > 0 || zeroLimitNeedsAuthorization;
    const availableCredit = creditLimit > 0 ? Math.max(0, creditLimit - projectedBalance) : 0;
    const summary = {
      ok: true,
      clientName: client.name || client.nombre_comercial,
      currentBalance,
      creditLimit,
      overdueDebt,
      totalDebt,
      pendingOrderExposure: pendingExposure,
      newOrderAmount: orderAmount,
      projectedBalance,
      availableCredit,
      overLimitAmount: zeroLimitNeedsAuthorization ? projectedBalance : overLimitAmount,
      lastPayment: last,
      requiresAuthorization,
      canContinueWithoutAuthorization: !requiresAuthorization
    };
    summary.status = accountStatus(summary, client);
    if (blocked) {
      summary.warning = "Cliente bloqueado: requiere autorizacion administrativa.";
    } else if (zeroLimitNeedsAuthorization) {
      summary.warning = "Cliente sin limite de credito configurado: requiere autorizacion administrativa.";
    } else if (overLimitAmount > 0) {
      summary.warning = `Supera el limite de credito por ${Math.round(overLimitAmount).toLocaleString("es-AR")}.`;
    } else if (overdueDebt > 0) {
      summary.warning = "Cliente con deuda vencida: revisar antes de confirmar.";
    } else if (currentBalance > 0) {
      summary.warning = "Cliente con saldo pendiente.";
    } else {
      summary.warning = "Cuenta habilitada.";
    }
    return summary;
  }

  function migrateState(state) {
    if (!state || typeof state !== "object") return state;
    state.clients = Array.isArray(state.clients) ? state.clients : [];
    state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
    state.orders = Array.isArray(state.orders) ? state.orders : [];
    ensureTransferReconciliation(state);
    state.clients.forEach((client) => {
      const summary = accountSummary(state, client, 0);
      if (!summary.ok) return;
      client.saldo_actual = summary.currentBalance;
      client.balance = summary.currentBalance;
      client.saldo_inicial = summary.currentBalance;
      client.limite_credito = summary.creditLimit;
      client.limit = summary.creditLimit;
      client.deuda_vencida = summary.overdueDebt;
      client.deuda_total = summary.totalDebt;
      client.pedidos_pendientes_cuenta = summary.pendingOrderExposure;
      client.credito_disponible = summary.creditLimit > 0 ? Math.max(0, summary.creditLimit - summary.totalDebt) : 0;
      client.estado_cuenta = summary.status;
      client.ultimo_pago = summary.lastPayment ? {
        date: summary.lastPayment.date,
        amount: summary.lastPayment.amount,
        method: summary.lastPayment.method
      } : null;
    });
    return state;
  }

  function syncTransferWithOrders(state, record) {
    historicalOrders(state).forEach((order) => {
      (Array.isArray(order.transferReceipts) ? order.transferReceipts : []).forEach((receipt) => {
        if (receipt.reconciliationId === record.id || receipt.id === record.id) {
          receipt.status = record.status;
          receipt.statusReason = record.statusReason;
          receipt.attachment = record.attachment;
          receipt.uploadedAt = record.uploadedAt;
          receipt.uploadedBy = record.uploadedBy;
          receipt.uploadObservations = record.uploadObservations;
          receipt.validatedAt = record.validatedAt;
          receipt.validatedBy = record.validatedBy;
          receipt.validationBank = record.validationBank;
          receipt.operationNumber = record.operationNumber;
          receipt.paymentConfirmedAt = record.paymentConfirmedAt;
          receipt.accountUpdatedAt = record.accountUpdatedAt;
          receipt.accountUpdatedBy = record.accountUpdatedBy;
          receipt.previousBalance = record.previousBalance;
          receipt.newBalance = record.newBalance;
          receipt.accountPaymentApplied = record.accountPaymentApplied;
          receipt.accountEntryId = record.accountEntryId;
          receipt.rejectedAt = record.rejectedAt;
          receipt.rejectedBy = record.rejectedBy;
          receipt.history = record.history;
        }
      });
    });
    return record;
  }

  function upsertTransferRecord(state, record) {
    ensureTransferReconciliation(state);
    const normalized = normalizeTransferRecord(record);
    const existingIndex = state.bankReconciliation.findIndex((item) => item.id === normalized.id);
    if (existingIndex >= 0) {
      const previousHistory = Array.isArray(state.bankReconciliation[existingIndex].history) ? state.bankReconciliation[existingIndex].history : [];
      const nextHistory = Array.isArray(normalized.history) ? normalized.history : [];
      state.bankReconciliation[existingIndex] = normalizeTransferRecord({
        ...state.bankReconciliation[existingIndex],
        ...normalized,
        history: nextHistory.length ? [...previousHistory, ...nextHistory] : previousHistory
      });
      return state.bankReconciliation[existingIndex];
    }
    state.bankReconciliation.unshift(normalized);
    return normalized;
  }

  function registerPendingTransfer(state, order, input, context) {
    if (!state || !order) return null;
    const amount = positive(input && (input.amount ?? input.pendingAmount));
    if (amount <= 0) return null;
    const at = input.at || nowIso();
    const parts = localTraceParts(at);
    const record = normalizeTransferRecord({
      id: input.id || input.reconciliationId || `${order.code || "PED"}-TRF-${Date.now()}`,
      source: input.source || "reparto",
      orderCode: order.code,
      client: order.client,
      seller: order.seller,
      routeId: input.routeId || order.routeId || "",
      bank: input.bank,
      alias: input.alias,
      cbu: input.cbu,
      date: input.date || parts.date,
      time: input.time || parts.time,
      at,
      amount,
      status: input.status || (input.attachment ? TRANSFER_STATUS.RECEIVED : TRANSFER_STATUS.PENDING),
      observations: input.observations,
      attachment: input.attachment || null,
      uploadedAt: input.uploadedAt,
      uploadedBy: input.uploadedBy || (context && context.user),
      uploadObservations: input.uploadObservations || input.observations,
      driver: input.driver || (context && context.user),
      history: []
    });
    pushTransferHistory(record, input.attachment ? "COMPROBANTE_RECIBIDO" : "TRANSFERENCIA_PENDIENTE", context, {
      amount: record.amount,
      orderCode: record.orderCode,
      client: record.client
    });
    const saved = upsertTransferRecord(state, record);
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Conciliacion",
      title: input.attachment ? `Comprobante recibido ${order.code || ""}`.trim() : `Transferencia pendiente ${order.code || ""}`.trim(),
      text: `${order.client || "Cliente"} - ${record.amount}. La deuda sigue pendiente hasta validacion bancaria.`
    });
    return syncTransferWithOrders(state, saved);
  }

  function registerTransferReceipt(state, order, receipt, context) {
    if (!state || !order || !receipt) return null;
    ensureTransferReconciliation(state);
    const record = normalizeTransferRecord({
      id: receipt.id || receipt.reconciliationId || `${order.code || "PED"}-TRF-${Date.now()}`,
      source: "reparto",
      orderCode: order.code,
      client: order.client,
      seller: order.seller,
      routeId: receipt.routeId || "",
      bank: receipt.bank,
      alias: receipt.alias,
      cbu: receipt.cbu,
      date: receipt.date,
      time: receipt.time,
      at: receipt.at,
      amount: receipt.amount,
      status: receipt.status || (receipt.attachment ? TRANSFER_STATUS.RECEIVED : TRANSFER_STATUS.PENDING),
      observations: receipt.observations,
      attachment: receipt.attachment,
      uploadedAt: receipt.uploadedAt || (receipt.attachment && receipt.attachment.uploadedAt),
      uploadedBy: receipt.uploadedBy || (receipt.attachment && receipt.attachment.uploadedBy) || (context && context.user),
      uploadObservations: receipt.uploadObservations || receipt.observations,
      driver: context && context.user,
      history: Array.isArray(receipt.history) ? receipt.history : []
    });
    pushTransferHistory(record, receipt.attachment ? "COMPROBANTE_RECIBIDO" : "TRANSFERENCIA_PENDIENTE", context, {
      amount: record.amount,
      orderCode: record.orderCode,
      client: record.client
    });
    receipt.id = record.id;
    receipt.reconciliationId = record.id;
    receipt.status = record.status;
    receipt.uploadedAt = record.uploadedAt;
    receipt.uploadedBy = record.uploadedBy;
    receipt.history = record.history;
    const saved = upsertTransferRecord(state, record);
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Conciliacion",
      title: record.attachment ? `Comprobante recibido ${order.code || ""}`.trim() : `Transferencia pendiente ${order.code || ""}`.trim(),
      text: `${order.client || "Cliente"} - ${record.bank || "Banco sin informar"} - ${record.alias || "Alias sin informar"} - ${record.amount}.`
    });
    return syncTransferWithOrders(state, saved);
  }

  function attachTransferProof(state, transferId, input, context) {
    ensureTransferReconciliation(state);
    const record = state.bankReconciliation.find((item) => item.id === transferId);
    if (!record) throw new Error("Transferencia no encontrada para conciliacion.");
    if (FINAL_TRANSFER_STATUSES.has(record.status)) throw new Error("La transferencia ya fue validada y no puede reemplazar comprobante.");
    const attachment = input && input.attachment;
    if (!attachment || !attachment.url || !attachment.filename) throw new Error("Adjuntar comprobante valido.");
    const at = nowIso();
    const user = String(context && context.user || "Administracion");
    record.attachment = attachment;
    record.uploadedAt = at;
    record.uploadedBy = user;
    record.uploadObservations = String(input && (input.observations || input.note) || "").trim();
    record.status = TRANSFER_STATUS.RECEIVED;
    record.rejectedAt = null;
    record.rejectedBy = "";
    record.statusReason = "";
    pushTransferHistory(record, "COMPROBANTE_RECIBIDO", context, {
      attachment: attachment.filename,
      observations: record.uploadObservations
    });
    syncTransferWithOrders(state, record);
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Conciliacion",
      title: `Comprobante recibido ${record.orderCode || transferId}`.trim(),
      text: `${record.client || "Cliente"} - ${record.amount}. Pendiente de validacion bancaria.`
    });
    return record;
  }

  function applyValidatedTransferToAccount(state, record, context) {
    if (!isTransferDebtOpen(record.status) || record.accountPaymentApplied) return record;
    const amount = positive(record.amount);
    if (amount <= 0) throw new Error("La transferencia no tiene importe valido.");
    const client = findClient(state, record.client);
    if (!client) throw new Error("Cliente no encontrado para actualizar cuenta corriente.");
    const previousBalance = positive(client.balance ?? client.saldo_actual ?? client.saldo_inicial);
    const nextBalance = Math.max(0, Math.round((previousBalance - amount) * 100) / 100);
    client.balance = nextBalance;
    client.saldo_actual = nextBalance;
    client.saldo_inicial = nextBalance;
    const at = nowIso();
    const parts = localTraceParts(at);
    const accountEntry = {
      id: `ACC-TRF-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      date: parts.date,
      createdAt: at,
      type: "Transferencia validada",
      account: record.client,
      method: "Transferencia bancaria",
      debit: 0,
      credit: amount,
      balance: nextBalance,
      orderCode: record.orderCode,
      transferId: record.id,
      bank: record.validationBank || record.bank,
      operationNumber: record.operationNumber,
      user: String(context && (context.user || context.username) || "Administracion")
    };
    state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
    state.accounts.unshift(accountEntry);
    record.previousBalance = previousBalance;
    record.newBalance = nextBalance;
    record.accountPaymentApplied = true;
    record.accountEntryId = accountEntry.id;
    record.paymentConfirmedAt = at;
    record.accountUpdatedAt = at;
    record.accountUpdatedBy = accountEntry.user;
    return record;
  }

  function validateTransfer(state, transferId, input, context) {
    ensureTransferReconciliation(state);
    const record = state.bankReconciliation.find((item) => item.id === transferId);
    if (!record) throw new Error("Transferencia no encontrada para conciliacion.");
    if (!record.attachment) throw new Error("No se puede validar una transferencia sin comprobante cargado.");
    if (record.status === TRANSFER_STATUS.OBSERVED && !String(input && input.allowObserved || "").trim()) {
      throw new Error("La transferencia observada debe regularizarse antes de validarse.");
    }
    const at = nowIso();
    const user = String(context && context.user || "Administracion");
    record.status = TRANSFER_STATUS.BANK_PENDING;
    record.validationBank = String(input && (input.bank || input.validationBank) || record.bank || "").trim();
    record.operationNumber = String(input && (input.operationNumber || input.numeroOperacion) || "").trim();
    record.statusReason = String(input && (input.reason || input.note) || "").trim();
    pushTransferHistory(record, "VALIDACION_BANCARIA_INICIADA", context, {
      bank: record.validationBank,
      operationNumber: record.operationNumber
    });
    applyValidatedTransferToAccount(state, record, context);
    record.status = TRANSFER_STATUS.ACCOUNT_UPDATED;
    record.validatedAt = at;
    record.validatedBy = user;
    record.rejectedAt = null;
    record.rejectedBy = "";
    pushTransferHistory(record, "TRANSFERENCIA_VALIDADA", context, {
      amount: record.amount,
      previousBalance: record.previousBalance,
      newBalance: record.newBalance,
      operationNumber: record.operationNumber
    });
    syncTransferWithOrders(state, record);
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Conciliacion",
      title: `Transferencia validada ${record.orderCode || transferId}`.trim(),
      text: `${record.client || "Cliente"} - ${record.amount}. Cuenta corriente actualizada.`
    });
    migrateState(state);
    return record;
  }

  function rejectTransferProof(state, transferId, input, context) {
    ensureTransferReconciliation(state);
    const record = state.bankReconciliation.find((item) => item.id === transferId);
    if (!record) throw new Error("Transferencia no encontrada para conciliacion.");
    const at = nowIso();
    const user = String(context && context.user || "Administracion");
    const reason = String(input && (input.reason || input.note || input.statusReason) || "").trim();
    if (!reason) throw new Error("Indicar motivo de observacion o rechazo.");
    record.status = TRANSFER_STATUS.OBSERVED;
    record.statusReason = reason;
    record.rejectedAt = at;
    record.rejectedBy = user;
    record.validatedAt = null;
    record.validatedBy = "";
    pushTransferHistory(record, "TRANSFERENCIA_OBSERVADA", context, { reason });
    syncTransferWithOrders(state, record);
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Conciliacion",
      title: `Transferencia observada ${record.orderCode || transferId}`.trim(),
      text: `${record.client || "Cliente"} - ${record.amount}. ${reason}`
    });
    return record;
  }

  function setTransferStatus(state, transferId, status, context) {
    ensureTransferReconciliation(state);
    const nextStatus = transferStatus(status);
    const record = state.bankReconciliation.find((item) => item.id === transferId);
    if (!record) throw new Error("Transferencia no encontrada para conciliacion.");
    if (FINAL_TRANSFER_STATUSES.has(nextStatus)) {
      return validateTransfer(state, transferId, context || {}, context);
    }
    if (nextStatus === TRANSFER_STATUS.OBSERVED) {
      return rejectTransferProof(state, transferId, context || {}, context);
    }
    const at = nowIso();
    const user = String(context && context.user || "Administracion");
    record.status = nextStatus;
    record.statusReason = String(context && (context.reason || context.note) || "").trim();
    record.validatedAt = null;
    record.validatedBy = "";
    record.rejectedAt = null;
    record.rejectedBy = "";
    pushTransferHistory(record, "TRANSFERENCIA_ESTADO", { ...context, user }, { status: nextStatus });
    syncTransferWithOrders(state, record);
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Conciliacion",
      title: `Transferencia ${record.status}`,
      text: `${record.orderCode || "Sin pedido"} - ${record.client || "Sin cliente"} - ${record.bank || "Banco"} - ${record.amount}.`
    });
    return record;
  }

  const ACCOUNT_PAYMENT_METHODS = new Set([
    "Efectivo",
    "Transferencia",
    "Mercado Pago",
    "Cheque",
    "Mercaderia"
  ]);

  function normalizePaymentMethod(value, fallback = "") {
    const raw = String(value || "").trim();
    const normalized = normalizeText(raw).replace(/\s+/g, " ");
    const aliases = new Map([
      ["efectivo", "Efectivo"],
      ["cash", "Efectivo"],
      ["transferencia", "Transferencia"],
      ["transferencia bancaria", "Transferencia"],
      ["mercado pago", "Mercado Pago"],
      ["mercadopago", "Mercado Pago"],
      ["cheque", "Cheque"],
      ["mercaderia", "Mercaderia"],
      ["mercaderia como pago", "Mercaderia"],
      ["cuenta corriente", "Cuenta corriente"],
      ["transferencia pendiente", "Transferencia Pendiente"],
      ["mixto", "Mixto"]
    ]);
    return aliases.get(normalized) || raw || fallback;
  }

  function accountEntryRecord(entry, index) {
    return {
      id: String(entry.id || `ACC-${index + 1}`),
      at: String(entry.createdAt || entry.at || ""),
      date: String(entry.date || ""),
      type: String(entry.type || "Movimiento"),
      method: normalizePaymentMethod(entry.method, "Sin informar"),
      debit: positive(entry.debit),
      credit: positive(entry.credit),
      balance: positive(entry.balance),
      reference: String(entry.reference || entry.operationNumber || entry.orderCode || entry.paymentId || entry.remitNumber || ""),
      status: String(entry.status || entry.paymentStatus || "Aplicado"),
      user: String(entry.user || entry.createdBy || "Sistema"),
      note: String(entry.note || entry.observations || "")
    };
  }

  function sortAccountRecords(records) {
    return records.sort((left, right) => {
      const leftDate = parseDate(left.at || left.date);
      const rightDate = parseDate(right.at || right.date);
      return (rightDate ? rightDate.getTime() : 0) - (leftDate ? leftDate.getTime() : 0);
    });
  }

  function findSupplier(state, value) {
    const key = normalizeText(value);
    return (state.suppliers || []).find((supplier) => [
      supplier.id,
      supplier.name,
      supplier.razon_social,
      supplier.nombre_comercial,
      supplier.cuit
    ].some((candidate) => normalizeText(candidate) === key)) || null;
  }

  function supplierStatementMovements(state, supplier) {
    const name = supplier.name || supplier.razon_social;
    const records = accountEntries(state, name).map(accountEntryRecord);
    const source = [
      ...(state.supplierMovements || []).filter((movement) => sameClient(movement.supplier || movement.proveedor, name)),
      ...(Array.isArray(supplier.movements) ? supplier.movements : [])
    ];
    const seen = new Set(records.map((record) => record.id));
    source.forEach((movement, index) => {
      const id = String(movement.id || `${movement.type || "SUP"}-${movement.remitNumber || movement.date || index}`);
      if (seen.has(id)) return;
      seen.add(id);
      records.push({
        id,
        at: String(movement.at || movement.createdAt || ""),
        date: String(movement.date || ""),
        type: String(movement.type || "Movimiento proveedor"),
        method: normalizePaymentMethod(movement.method, movement.type === "Remito" ? "Cuenta proveedor" : "Sin informar"),
        debit: movement.type === "Remito" ? positive(movement.amount || movement.declaredAmount) : 0,
        credit: movement.type === "Pago proveedor" ? positive(movement.amount) : 0,
        balance: positive(movement.balance),
        reference: String(movement.remitNumber || movement.invoiceNumber || movement.operationNumber || movement.id || ""),
        status: String(movement.paymentStatus || movement.adminValidationStatus || movement.status || (movement.economicValidated ? "Validado" : "Pendiente")),
        user: String(movement.user || movement.validatedBy || movement.reconciledBy || "Sistema"),
        note: String(movement.observations || movement.text || movement.note || "")
      });
    });
    return sortAccountRecords(records).slice(0, 500);
  }

  function accountStatement(state, type, entityId) {
    migrateState(state);
    const entityType = normalizeText(type) === "supplier" || normalizeText(type) === "proveedor" ? "supplier" : "client";
    if (entityType === "supplier") {
      const supplier = findSupplier(state, entityId);
      if (!supplier) throw new Error("Proveedor no encontrado.");
      const movements = supplierStatementMovements(state, supplier);
      return {
        type: "supplier",
        entity: {
          id: String(supplier.id || supplier.cuit || supplier.name || supplier.razon_social),
          name: String(supplier.name || supplier.razon_social || "Proveedor"),
          legalName: String(supplier.razon_social || supplier.name || ""),
          taxId: String(supplier.cuit || ""),
          phone: String(supplier.telefono || supplier.phone || ""),
          address: String(supplier.direccion || supplier.address || ""),
          status: String(supplier.estado_operativo || supplier.status || "Activo")
        },
        summary: {
          balance: positive(supplier.balance ?? supplier.saldo_pendiente),
          purchased: positive(supplier.totalPurchased ?? supplier.total_comprado),
          paid: positive(supplier.totalPaid ?? supplier.total_pagado),
          overdue: positive(supplier.overdueDebt ?? supplier.deuda_vencida),
          movementCount: movements.length
        },
        movements,
        actions: { canRegisterPayment: true, requiresReconciliation: true }
      };
    }

    const client = findClient(state, entityId)
      || (state.clients || []).find((item) => [item.id, item.codigo_cliente, item.cuit].some((candidate) => normalizeText(candidate) === normalizeText(entityId)));
    if (!client) throw new Error("Cliente no encontrado.");
    const clientName = client.name || client.nombre_comercial;
    const summary = accountSummary(state, client, 0);
    const movements = sortAccountRecords(accountEntries(state, clientName).map(accountEntryRecord)).slice(0, 500);
    const orders = historicalOrders(state)
      .filter((order) => sameClient(order.client, clientName))
      .map((order) => ({
        code: String(order.code || ""),
        at: String(order.createdAt || order.receivedAt || order.updatedAt || ""),
        status: String(order.status || ""),
        amount: positive(order.amount),
        method: normalizePaymentMethod(order.paymentMethod || order.forma_pago, "Sin informar")
      }))
      .sort((left, right) => new Date(right.at || 0) - new Date(left.at || 0))
      .slice(0, 100);
    return {
      type: "client",
      entity: {
        id: String(client.id || client.codigo_cliente || clientName),
        name: String(clientName || "Cliente"),
        legalName: String(client.razon_social || clientName || ""),
        taxId: String(client.cuit || ""),
        phone: String(client.telefono || client.phone || ""),
        address: String(client.domicilio || client.address || ""),
        status: String(client.estado || client.status || "Activo")
      },
      summary: {
        balance: positive(summary.currentBalance),
        totalDebt: positive(summary.totalDebt),
        creditLimit: positive(summary.creditLimit),
        overdue: positive(summary.overdueDebt),
        pendingOrders: positive(summary.pendingOrderExposure),
        movementCount: movements.length,
        orderCount: orders.length
      },
      movements,
      orders,
      actions: { canRegisterPayment: true, requiresReconciliation: false }
    };
  }

  function registerClientPayment(state, input, context) {
    migrateState(state);
    const statement = accountStatement(state, "client", input && (input.entityId || input.client || input.account));
    const client = findClient(state, statement.entity.name);
    const method = normalizePaymentMethod(input && (input.method || input.paymentMethod));
    const amount = positive(input && input.amount);
    const reference = String(input && (input.reference || input.operationNumber) || "").trim();
    const note = String(input && (input.note || input.observations) || "").trim();
    if (!ACCOUNT_PAYMENT_METHODS.has(method)) throw new Error("Seleccionar un medio de pago valido.");
    if (amount <= 0) throw new Error("Indicar un importe de pago mayor a cero.");
    if (amount - statement.summary.balance > 0.01) throw new Error("El pago no puede superar el saldo actual del cliente.");
    if (["Transferencia", "Mercado Pago", "Cheque"].includes(method) && !reference) {
      throw new Error("Indicar numero de operacion o referencia para este medio de pago.");
    }
    if (method === "Mercaderia" && !note) throw new Error("Detallar la mercaderia recibida como pago.");
    const at = nowIso();
    const parts = localTraceParts(at);
    const previousBalance = positive(client.balance ?? client.saldo_actual ?? client.saldo_inicial);
    const nextBalance = Math.max(0, Math.round((previousBalance - amount) * 100) / 100);
    const id = `ACC-PAG-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
    const entry = {
      id,
      createdAt: at,
      date: parts.date,
      time: parts.time,
      type: "Pago parcial cliente",
      account: statement.entity.name,
      method,
      debit: 0,
      credit: amount,
      balance: nextBalance,
      previousBalance,
      reference,
      observations: note,
      user: String(context && (context.user || context.username) || "Administracion"),
      username: String(context && context.username || "")
    };
    client.balance = nextBalance;
    client.saldo_actual = nextBalance;
    client.saldo_inicial = nextBalance;
    client.paymentHistory = Array.isArray(client.paymentHistory) ? client.paymentHistory : [];
    client.paymentHistory.unshift({ ...entry });
    client.paymentHistory = client.paymentHistory.slice(0, 500);
    state.accounts.unshift(entry);
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Cuentas",
      title: `Pago parcial ${statement.entity.name}`,
      text: `${method} ${amount}. Saldo ${previousBalance} -> ${nextBalance}.`
    });
    migrateState(state);
    return { payment: entry, client, statement: accountStatement(state, "client", statement.entity.id) };
  }

  function canAuthorize(user) {
    if (!user) return false;
    return user.role === "admin"
      || user.creditAuthorization === true
      || Boolean(user.permissions && user.permissions.creditAuthorization);
  }

  return {
    migrateState,
    accountSummary,
    pendingOrderExposure,
    lastPayment,
    ensureTransferReconciliation,
    registerTransferReceipt,
    registerPendingTransfer,
    attachTransferProof,
    validateTransfer,
    rejectTransferProof,
    isTransferDebtOpen,
    TRANSFER_STATUS,
    setTransferStatus,
    TRANSFER_STATUSES,
    ACCOUNT_PAYMENT_METHODS,
    normalizePaymentMethod,
    accountStatement,
    registerClientPayment,
    canAuthorize
  };
});
