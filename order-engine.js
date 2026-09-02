(function initOrderEngine(root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.DLOrderEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildOrderEngine() {
  "use strict";

  const STATUS = {
    PENDING: "Pendiente",
    PREVENTA: "Pendiente",
    PENDING_SUPPLY: "Pendiente",
    COMMERCIAL_APPROVAL: "Pendiente de aprobacion comercial",
    READY: "En PreparaciÃ³n",
    ASSEMBLY: "En Armado",
    LABELED: "Etiquetado",
    READY_DISPATCH: "Listo para Despacho",
    DISPATCHED: "Despachado",
    IN_ROUTE: "En Reparto",
    UNLOADING: "En Reparto",
    CHECKED: "Controlado",
    PARTIAL_DELIVERED: "Parcialmente Entregado",
    DELIVERED: "Entregado",
    COLLECTED: "Cobrado",
    CLOSED: "Cerrado",
    NOT_DELIVERED: "No entregado",
    POSTPONED: "Postergado",
    REJECTED: "Rechazado",
    CANCELLED: "Cancelado"
  };

  const ACTIVE_RESERVATION_STATUSES = new Set([
    STATUS.PENDING_SUPPLY,
    STATUS.COMMERCIAL_APPROVAL,
    STATUS.READY,
    STATUS.ASSEMBLY,
    STATUS.LABELED,
    STATUS.READY_DISPATCH
  ]);
  const EDITABLE_STATUSES = new Set([
    STATUS.PREVENTA,
    STATUS.PENDING_SUPPLY,
    STATUS.COMMERCIAL_APPROVAL,
    STATUS.READY,
    STATUS.ASSEMBLY,
    STATUS.LABELED,
    STATUS.READY_DISPATCH
  ]);
  const ASSEMBLY_NUMBER_STATUSES = new Set([
    STATUS.READY,
    STATUS.ASSEMBLY,
    STATUS.LABELED,
    STATUS.READY_DISPATCH,
    STATUS.DISPATCHED,
    STATUS.IN_ROUTE,
    STATUS.UNLOADING,
    STATUS.CHECKED,
    STATUS.PARTIAL_DELIVERED,
    STATUS.DELIVERED,
    STATUS.COLLECTED,
    STATUS.CLOSED
  ]);
  const COMMISSION_ACCRUAL = {
    seller: "confirmacion_pedido",
    driver: "entrega_confirmada"
  };
  const COMMISSION_DEFAULT_RULES = [
    {
      id: "COM-SELLER-CIGARRILLOS",
      role: "seller",
      rubro: "Cigarrillos",
      percent: 1,
      priority: 40,
      active: true,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "",
      note: "Regla inicial vendedores cigarrillos"
    },
    {
      id: "COM-SELLER-GENERAL",
      role: "seller",
      rubro: "*",
      percent: 3,
      priority: 10,
      active: true,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "",
      isDefault: true,
      note: "Regla inicial vendedores resto de mercaderia"
    },
    {
      id: "COM-DRIVER-CIGARRILLOS",
      role: "driver",
      rubro: "Cigarrillos",
      percent: 1,
      priority: 40,
      active: true,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "",
      note: "Regla inicial repartidores cigarrillos"
    },
    {
      id: "COM-DRIVER-GENERAL",
      role: "driver",
      rubro: "*",
      percent: 4,
      priority: 10,
      active: true,
      startsAt: "2026-01-01T00:00:00.000Z",
      endsAt: "",
      isDefault: true,
      note: "Regla inicial repartidores resto de mercaderia"
    }
  ];
  const CANCELLED_COMMISSION_STATUSES = new Set([STATUS.CANCELLED, STATUS.REJECTED, STATUS.NOT_DELIVERED]);
  const DRIVER_COMMISSION_STATUSES = new Set([
    STATUS.PARTIAL_DELIVERED,
    STATUS.DELIVERED,
    STATUS.COLLECTED,
    STATUS.CLOSED
  ]);

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function positive(value) {
    return Math.max(0, numeric(value, 0));
  }

  function nonNegativeOrFallback(value, fallback = 0) {
    if (value === undefined || value === null || value === "") return Math.max(0, numeric(fallback, 0));
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : Math.max(0, numeric(fallback, 0));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || null));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function validIso(value, fallback) {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? (fallback || nowIso()) : date.toISOString();
  }

  function localTraceParts(value) {
    const date = new Date(validIso(value));
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

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function productCode(product) {
    return String(product.codigo_producto || product.code || "").trim();
  }

  function productName(product) {
    return String(product.descripcion || product.name || "").trim();
  }

  function productUnitPrice(product) {
    return positive(product && (product.price || product.precio_lista_2 || product.precio_lista_1));
  }

  function productPriceListMeta(product) {
    return {
      priceListId: String(product && (product.priceListId || product.lista_precio_id) || ""),
      priceListName: String(product && (product.priceListName || product.lista_precio_actual || "Lista vigente") || "Lista vigente")
    };
  }

  function commissionRole(value) {
    const text = normalizeText(value);
    if (["driver", "repartidor", "reparto", "chofer"].includes(text)) return "driver";
    return "seller";
  }

  function commissionRuleId() {
    return `COM-${Date.now()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`;
  }

  function normalizeCommissionRule(rule, index) {
    const source = rule && typeof rule === "object" ? rule : {};
    const role = commissionRole(source.role || source.rol);
    const percent = Math.max(0, numeric(source.percent ?? source.percentage ?? source.porcentaje, role === "driver" ? 4 : 3));
    const status = String(source.status || source.estado || (source.active === false ? "Inactiva" : "Activa")).trim() || "Activa";
    const productCodeValue = String(source.productCode || source.codigo_producto || source.code || "").trim();
    const productNameValue = String(source.productName || source.producto || source.name || "").trim();
    const rubro = String(source.rubro || source.category || source.categoria || (source.isDefault ? "*" : "") || "").trim();
    const username = String(source.username || source.user || source.usuario || "").trim();
    const userLabel = String(source.userLabel || source.userName || source.nombre_usuario || "").trim();
    return {
      id: String(source.id || commissionRuleId()).trim(),
      role,
      username,
      userLabel,
      rubro: rubro || "*",
      productCode: productCodeValue,
      productName: productNameValue,
      percent,
      startsAt: validIso(source.startsAt || source.startAt || source.fecha_inicio || "2026-01-01T00:00:00.000Z"),
      endsAt: String(source.endsAt || source.endAt || source.fecha_fin || "").trim(),
      status,
      active: status !== "Inactiva" && source.active !== false,
      priority: numeric(source.priority ?? source.prioridad, source.isDefault ? 0 : 10 + index),
      isDefault: Boolean(!username && !userLabel && (source.isDefault || source.default || (!productCodeValue && !productNameValue && (!rubro || rubro === "*")))),
      note: String(source.note || source.observations || source.observaciones || "").trim(),
      updatedAt: source.updatedAt || "",
      updatedBy: String(source.updatedBy || source.usuario_modifico || "").trim()
    };
  }

  function ensureCommissionSettings(state) {
    if (!state || typeof state !== "object") return { rules: [] };
    const current = state.commissionSettings && typeof state.commissionSettings === "object" ? state.commissionSettings : {};
    const sourceRules = Array.isArray(current.rules) && current.rules.length ? current.rules : COMMISSION_DEFAULT_RULES;
    state.commissionSettings = {
      accrual: {
        ...COMMISSION_ACCRUAL,
        ...(current.accrual && typeof current.accrual === "object" ? current.accrual : {})
      },
      rules: sourceRules.map(normalizeCommissionRule)
    };
    state.commissionAudit = Array.isArray(state.commissionAudit) ? state.commissionAudit : [];
    return state.commissionSettings;
  }

  function productRubric(product, item) {
    return String(
      product && (product.rubro || product.category || product.categoria || product.familia || product.segmento)
      || item && (item.rubro || item.category || item.categoria || item.familia || item.segmento)
      || "Sin rubro"
    ).trim();
  }

  function itemProductKey(item, product) {
    return {
      code: String(item && (item.productCode || item.codigo_producto || item.code) || product && productCode(product) || "").trim(),
      name: String(item && (item.name || item.product || item.descripcion) || product && productName(product) || "").trim()
    };
  }

  function isCigaretteLine(item, product) {
    const text = normalizeText([
      productRubric(product, item),
      item && item.name,
      product && productName(product)
    ].filter(Boolean).join(" "));
    return text.includes("cigarr");
  }

  function commissionDateApplies(rule, at) {
    const date = new Date(validIso(at || nowIso()));
    const start = new Date(validIso(rule.startsAt || "2026-01-01T00:00:00.000Z"));
    const endsText = String(rule.endsAt || "").trim();
    const end = endsText ? new Date(validIso(endsText)) : null;
    if (date < start) return false;
    if (end && date > end) return false;
    return true;
  }

  function commissionRuleTargetsOverlap(left, right) {
    const leftTargets = [left.username, left.userLabel].map(normalizeText).filter(Boolean);
    const rightTargets = [right.username, right.userLabel].map(normalizeText).filter(Boolean);
    if (!leftTargets.length || !rightTargets.length) return !leftTargets.length && !rightTargets.length;
    return leftTargets.some((target) => rightTargets.includes(target));
  }

  function commissionRuleScopeMatches(left, right) {
    if (left.role !== right.role || !commissionRuleTargetsOverlap(left, right)) return false;
    const leftProduct = normalizeText(left.productCode || left.productName);
    const rightProduct = normalizeText(right.productCode || right.productName);
    if (leftProduct || rightProduct) return Boolean(leftProduct && rightProduct && leftProduct === rightProduct);
    return normalizeText(left.rubro || "*") === normalizeText(right.rubro || "*");
  }

  function commissionRuleRangesOverlap(left, right) {
    const leftStart = new Date(validIso(left.startsAt || "2026-01-01T00:00:00.000Z")).getTime();
    const rightStart = new Date(validIso(right.startsAt || "2026-01-01T00:00:00.000Z")).getTime();
    const leftEnd = left.endsAt ? new Date(validIso(left.endsAt)).getTime() : Number.POSITIVE_INFINITY;
    const rightEnd = right.endsAt ? new Date(validIso(right.endsAt)).getTime() : Number.POSITIVE_INFINITY;
    return leftStart <= rightEnd && rightStart <= leftEnd;
  }

  function analyzeCommissionRules(state) {
    const rules = ensureCommissionSettings(state).rules;
    const activeRules = rules.filter((rule) => rule.active !== false && rule.status !== "Inactiva" && rule.status !== "Historica");
    const conflicts = [];
    activeRules.forEach((rule, index) => activeRules.slice(index + 1).forEach((other) => {
      if (!commissionRuleScopeMatches(rule, other) || !commissionRuleRangesOverlap(rule, other)) return;
      conflicts.push({
        ruleId: rule.id,
        otherRuleId: other.id,
        user: rule.userLabel || rule.username || other.userLabel || other.username || "Regla general",
        scope: rule.productName || rule.productCode || rule.rubro || "*",
        percents: [rule.percent, other.percent]
      });
    }));
    return {
      total: rules.length,
      active: activeRules.length,
      inactive: rules.length - activeRules.length,
      general: rules.filter((rule) => !normalizeText(rule.username) && !normalizeText(rule.userLabel)).length,
      conflicts
    };
  }

  function commissionRuleBucket(rule, context) {
    const username = normalizeText(context.username);
    const userName = normalizeText(context.userName);
    const productCodeValue = normalizeText(context.productCode);
    const productNameValue = normalizeText(context.productName);
    const rubro = normalizeText(context.rubro);
    const ruleUsername = normalizeText(rule.username);
    const ruleUserName = normalizeText(rule.userLabel);
    const hasUser = Boolean(ruleUsername || ruleUserName);
    const userMatches = !hasUser || (ruleUsername && ruleUsername === username) || (ruleUserName && ruleUserName === userName);
    if (!userMatches) return -1;

    const ruleCode = normalizeText(rule.productCode);
    const ruleProduct = normalizeText(rule.productName);
    const ruleRubro = normalizeText(rule.rubro);
    const productMatches = (ruleCode && ruleCode === productCodeValue)
      || (ruleProduct && (ruleProduct === productNameValue || productNameValue.includes(ruleProduct)));
    const rubroMatches = ruleRubro && ruleRubro !== "*" && (
      ruleRubro === rubro
      || rubro.includes(ruleRubro)
      || (ruleRubro.includes("cigarr") && context.isCigarette)
    );

    if (hasUser && (ruleCode || ruleProduct) && productMatches) return 5;
    if (hasUser && rubroMatches) return 4;
    if (hasUser && (rule.isDefault || ruleRubro === "*" || !ruleRubro)) return 3.5;
    if (!hasUser && (ruleCode || ruleProduct) && productMatches) return 3;
    if (!hasUser && rubroMatches) return 2;
    if (!hasUser && (rule.isDefault || ruleRubro === "*" || !ruleRubro)) return 1;
    return -1;
  }

  function findCommissionRule(state, context) {
    const settings = ensureCommissionSettings(state);
    return settings.rules
      .filter((rule) => rule.active !== false && rule.status !== "Inactiva")
      .filter((rule) => rule.role === context.role)
      .filter((rule) => commissionDateApplies(rule, context.at))
      .map((rule) => ({ rule, bucket: commissionRuleBucket(rule, context) }))
      .filter((item) => item.bucket >= 0)
      .sort((a, b) => b.bucket - a.bucket || numeric(b.rule.priority) - numeric(a.rule.priority) || b.rule.percent - a.rule.percent)[0]?.rule
      || settings.rules.find((rule) => rule.role === context.role && rule.isDefault && !normalizeText(rule.username) && !normalizeText(rule.userLabel))
      || normalizeCommissionRule({ role: context.role, rubro: "*", percent: context.role === "driver" ? 4 : 3, isDefault: true });
  }

  function previewCommissionRule(state, input = {}) {
    const product = findProduct(state, input.productCode || input.productName || input.product || "");
    const key = itemProductKey(input, product);
    const rubro = productRubric(product, input);
    const rule = findCommissionRule(state, {
      role: commissionRole(input.role || "seller"),
      username: input.username || "",
      userName: input.userName || input.seller || "",
      productCode: key.code,
      productName: key.name,
      rubro,
      isCigarette: isCigaretteLine(input, product),
      at: input.at || nowIso()
    });
    const baseAmount = Math.max(0, numeric(input.baseAmount, 0));
    return {
      rule: clone(rule),
      productCode: key.code,
      productName: key.name,
      rubro,
      baseAmount,
      percent: positive(rule.percent),
      commission: Math.round(baseAmount * positive(rule.percent) / 100),
      origin: rule.userLabel || rule.username ? `Especifica de ${rule.userLabel || rule.username}` : "Regla general"
    };
  }

  function commissionBaseForItem(item, role, cancelled) {
    if (cancelled) return 0;
    const unitPrice = positive(item.unitPrice ?? item.price);
    const requestedQty = positive(item.requestedQty ?? item.qty ?? item.cantidad);
    const lineTotal = nonNegativeOrFallback(item.lineTotal, requestedQty * unitPrice);
    const returnedQty = positive(item.returnedQty);
    const returnedAmount = positive(item.returnedAmount) || returnedQty * unitPrice;
    if (role === "driver") {
      const deliveredQty = positive(item.deliveredQty);
      if (deliveredQty > 0) return Math.max(0, deliveredQty * unitPrice);
      return Math.max(0, lineTotal - returnedAmount);
    }
    return Math.max(0, lineTotal - returnedAmount);
  }

  function commissionUserForRole(order, role, options) {
    if (role === "driver") {
      return String(
        options && (options.driverUser || options.driverName)
        || order.collection && (order.collection.user || order.collection.deviceLabel)
        || order.driverUser
        || order.driver
        || order.deviceLabel
        || ""
      ).trim();
    }
    return String(order.seller || options && (options.sellerUser || options.sellerName) || "").trim();
  }

  function calculateRoleCommission(state, order, role, options = {}) {
    const cancelled = CANCELLED_COMMISSION_STATUSES.has(order.status);
    const userName = commissionUserForRole(order, role, options);
    const lines = (order.items || []).map((item) => {
      const product = findProduct(state, item);
      const productKey = itemProductKey(item, product);
      const rubro = productRubric(product, item);
      const isCigarette = isCigaretteLine(item, product);
      const context = {
        role,
        username: options.username || (role === "seller" ? order.sellerUsername : order.driverUsername) || "",
        userName,
        productCode: productKey.code,
        productName: productKey.name,
        rubro,
        isCigarette,
        at: order.createdAt || order.receivedAt || nowIso()
      };
      const rule = findCommissionRule(state, context);
      const baseAmount = commissionBaseForItem(item, role, cancelled);
      const percent = positive(rule.percent);
      const commission = Math.round(baseAmount * percent / 100);
      return {
        productCode: productKey.code,
        productName: productKey.name,
        rubro,
        group: isCigarette ? "cigarrillos" : "mercaderia",
        baseAmount,
        percent,
        commission,
        ruleId: rule.id,
        ruleLabel: rule.isDefault ? "General predeterminada" : `${rule.role} ${rule.rubro || rule.productName || rule.productCode}`,
        ruleSnapshot: {
          id: rule.id,
          role: rule.role,
          username: rule.username || "",
          userLabel: rule.userLabel || "",
          rubro: rule.rubro || "*",
          productCode: rule.productCode || "",
          productName: rule.productName || "",
          percent,
          priority: numeric(rule.priority, 0),
          startsAt: rule.startsAt || "",
          endsAt: rule.endsAt || ""
        }
      };
    });
    return {
      role,
      user: userName,
      accrual: ensureCommissionSettings(state).accrual[role] || COMMISSION_ACCRUAL[role],
      baseAmount: lines.reduce((sum, line) => sum + line.baseAmount, 0),
      cigarettes: lines.filter((line) => line.group === "cigarrillos").reduce((sum, line) => sum + line.commission, 0),
      merchandise: lines.filter((line) => line.group !== "cigarrillos").reduce((sum, line) => sum + line.commission, 0),
      total: lines.reduce((sum, line) => sum + line.commission, 0),
      lines
    };
  }

  function calculateOrderCommissions(state, order, options = {}) {
    const normalizedOrder = order || {};
    const includeDriver = options.includeDriver === true || DRIVER_COMMISSION_STATUSES.has(normalizedOrder.status);
    const seller = calculateRoleCommission(state, normalizedOrder, "seller", options);
    const driver = includeDriver ? calculateRoleCommission(state, normalizedOrder, "driver", options) : {
      role: "driver",
      user: "",
      accrual: ensureCommissionSettings(state).accrual.driver || COMMISSION_ACCRUAL.driver,
      baseAmount: 0,
      cigarettes: 0,
      merchandise: 0,
      total: 0,
      lines: []
    };
    return {
      basis: "importe_neto_vendido_no_anulado",
      seller,
      driver,
      cigarettes: seller.cigarettes + driver.cigarettes,
      merchandise: seller.merchandise + driver.merchandise,
      total: seller.total + driver.total,
      calculatedAt: nowIso()
    };
  }

  function normalizeCommissionBlock(source, fallback) {
    const data = source && typeof source === "object" ? source : fallback;
    return {
      role: String(data.role || fallback.role || ""),
      user: String(data.user || fallback.user || ""),
      accrual: String(data.accrual || fallback.accrual || ""),
      baseAmount: positive(data.baseAmount ?? fallback.baseAmount),
      cigarettes: positive(data.cigarettes ?? fallback.cigarettes),
      merchandise: positive(data.merchandise ?? fallback.merchandise),
      total: positive(data.total ?? fallback.total),
      lines: Array.isArray(data.lines) ? data.lines : fallback.lines
    };
  }

  function normalizeOrderCommissions(state, order) {
    const calculated = calculateOrderCommissions(state, order, {
      includeDriver: DRIVER_COMMISSION_STATUSES.has(order.status)
    });
    if (CANCELLED_COMMISSION_STATUSES.has(order.status)) return calculated;
    const stored = order.commissions && typeof order.commissions === "object" ? order.commissions : null;
    if (!stored) return calculated;
    return {
      basis: String(stored.basis || calculated.basis),
      seller: normalizeCommissionBlock(stored.seller, calculated.seller),
      driver: normalizeCommissionBlock(stored.driver, calculated.driver),
      cigarettes: positive(stored.cigarettes ?? calculated.cigarettes),
      merchandise: positive(stored.merchandise ?? calculated.merchandise),
      total: positive(stored.total ?? calculated.total),
      calculatedAt: stored.calculatedAt || calculated.calculatedAt
    };
  }

  function refreshOrderCommissions(state, order, options = {}) {
    if (!order) return null;
    order.commissions = calculateOrderCommissions(state, order, options);
    return order.commissions;
  }

  function refreshSellerMetrics(state) {
    const sellers = Array.isArray(state.sellers) ? state.sellers : [];
    sellers.forEach((seller) => {
      const sellerName = String(seller.name || "");
      const orders = (state.orders || []).filter((order) => order.seller === sellerName && !CANCELLED_COMMISSION_STATUSES.has(order.status));
      seller.orders = orders.length;
      seller.sales = orders.reduce((sum, order) => sum + positive(order.amount), 0);
      seller.commission = orders.reduce((sum, order) => sum + (order.commissionLiquidated === true ? 0 : positive(order.commissions && order.commissions.seller && order.commissions.seller.total)), 0);
    });
    return sellers;
  }

  function recalculateCommissions(state, input = {}, actor = {}) {
    migrateState(state);
    const motive = String(input.motive || input.motivo || "").trim();
    if (!motive) throw new Error("Indicar el motivo del recalculo de comisiones.");
    const from = new Date(validIso(input.dateFrom || input.desde || "2026-01-01T00:00:00.000Z"));
    const to = new Date(validIso(input.dateTo || input.hasta || nowIso()));
    if (from > to) throw new Error("El rango de fechas de comisiones no es valido.");
    const sellerNames = new Set((Array.isArray(input.sellerNames) ? input.sellerNames : []).map(normalizeText).filter(Boolean));
    const usernames = new Set((Array.isArray(input.usernames) ? input.usernames : []).map(normalizeText).filter(Boolean));
    if (!sellerNames.size && !usernames.size) throw new Error("Seleccionar al menos un vendedor para recalcular.");

    const affected = [];
    let previousTotal = 0;
    let nextTotal = 0;
    (state.orders || []).forEach((order) => {
      const at = new Date(validIso(order.createdAt || order.receivedAt));
      if (at < from || at > to) return;
      if (order.commissionLiquidated === true || order.commissionsLiquidated === true) return;
      if (!sellerNames.has(normalizeText(order.seller)) && !usernames.has(normalizeText(order.sellerUsername))) return;
      const before = clone(order.commissions || {});
      const beforeValue = positive(before && before.seller && before.seller.total);
      refreshOrderCommissions(state, order, { includeDriver: DRIVER_COMMISSION_STATUSES.has(order.status) });
      const afterValue = positive(order.commissions && order.commissions.seller && order.commissions.seller.total);
      previousTotal += beforeValue;
      nextTotal += afterValue;
      affected.push({
        orderCode: order.code,
        seller: order.seller,
        sellerUsername: order.sellerUsername || "",
        previousTotal: beforeValue,
        nextTotal: afterValue,
        previous: before,
        current: clone(order.commissions)
      });
    });
    refreshSellerMetrics(state);
    const at = nowIso();
    state.commissionAudit = Array.isArray(state.commissionAudit) ? state.commissionAudit : [];
    affected.forEach((entry) => state.commissionAudit.unshift({
      id: `COM-AUD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action: "COMISION_PEDIDO_RECALCULADA",
      at,
      user: String(actor.name || actor.user || "Administracion"),
      username: String(actor.username || ""),
      motive,
      ...entry
    }));
    return {
      count: affected.length,
      orders: affected.map((entry) => entry.orderCode),
      previousTotal,
      nextTotal,
      difference: nextTotal - previousTotal,
      dateFrom: from.toISOString(),
      dateTo: to.toISOString(),
      motive
    };
  }

  function summarizeCommissions(state, filters = {}) {
    ensureCommissionSettings(state);
    const roleFilter = String(filters.role || "").trim();
    const userFilter = normalizeText(filters.user || filters.seller || "");
    const from = filters.dateFrom ? new Date(validIso(filters.dateFrom)).getTime() : Number.NEGATIVE_INFINITY;
    const to = filters.dateTo ? new Date(validIso(filters.dateTo)).getTime() : Number.POSITIVE_INFINITY;
    const rows = new Map();
    (state.orders || []).forEach((order) => {
      const orderAt = new Date(validIso(order.createdAt || order.receivedAt || order.date)).getTime();
      if (orderAt < from || orderAt > to) return;
      const commissions = order.commissions || normalizeOrderCommissions(state, order);
      ["seller", "driver"].forEach((role) => {
        if (roleFilter && role !== roleFilter) return;
        const block = commissions[role];
        if (!block || !block.user || block.total <= 0) return;
        if (userFilter && normalizeText(block.user) !== userFilter) return;
        const key = `${role}::${block.user}`;
        const current = rows.get(key) || {
          role,
          user: block.user,
          orders: 0,
          baseAmount: 0,
          cigarettes: 0,
          merchandise: 0,
          total: 0,
          adjustments: 0,
          returns: 0
        };
        current.orders += 1;
        current.baseAmount += positive(block.baseAmount);
        current.cigarettes += positive(block.cigarettes);
        current.merchandise += positive(block.merchandise);
        current.total += positive(block.total);
        current.returns += positive(order.returnSummary && order.returnSummary.returnedAmount);
        rows.set(key, current);
      });
    });
    return Array.from(rows.values()).sort((a, b) => b.total - a.total || a.user.localeCompare(b.user));
  }

  function saveCommissionRule(state, input, actor = {}) {
    ensureCommissionSettings(state);
    const motive = String(input && (input.motive || input.motivo || input.reason) || "").trim();
    if (!motive) throw new Error("Indicar motivo del cambio de comision.");
    const rules = state.commissionSettings.rules;
    const id = String(input && input.id || "").trim();
    const index = id ? rules.findIndex((rule) => rule.id === id) : -1;
    const previous = index >= 0 ? clone(rules[index]) : null;
    const changedAt = nowIso();
    const merged = {
      ...(previous || {}),
      ...(input || {}),
      id: id || commissionRuleId(),
      updatedAt: changedAt,
      updatedBy: actor.name || actor.username || "Administracion",
      note: motive
    };
    if (input && (input.action === "deactivate" || input.active === false)) {
      merged.active = false;
      merged.status = "Inactiva";
    }
    let rule = normalizeCommissionRule(merged, index >= 0 ? index : rules.length);
    let auditAction = previous ? "COMISION_REGLA_EDITADA" : "COMISION_REGLA_CREADA";
    if (previous && input.action !== "deactivate" && input.active !== false) {
      const requestedStart = String(input.startsAt || "").trim();
      const previousStart = new Date(validIso(previous.startsAt || "2026-01-01T00:00:00.000Z")).getTime();
      let effectiveAt = requestedStart ? new Date(validIso(requestedStart)) : new Date(changedAt);
      if (effectiveAt.getTime() <= previousStart) effectiveAt = new Date(changedAt);
      const historical = normalizeCommissionRule({
        ...previous,
        active: false,
        status: "Historica",
        endsAt: new Date(effectiveAt.getTime() - 1).toISOString(),
        updatedAt: changedAt,
        updatedBy: actor.name || actor.username || "Administracion",
        note: `Cerrada por modificacion: ${motive}`
      }, index);
      rule = normalizeCommissionRule({
        ...merged,
        id: commissionRuleId(),
        startsAt: effectiveAt.toISOString(),
        endsAt: String(input.endsAt || "").trim(),
        active: true,
        status: "Activa"
      }, rules.length);
      const overlaps = rules.map((existing, existingIndex) => ({ existing, existingIndex }))
        .filter(({ existing, existingIndex }) => existingIndex !== index
        && existing.active !== false
        && existing.status !== "Inactiva"
        && existing.status !== "Historica"
        && commissionRuleScopeMatches(existing, rule)
        && commissionRuleRangesOverlap(existing, rule));
      rules[index] = historical;
      const superseded = [];
      overlaps.forEach(({ existing, existingIndex }) => {
        const existingStart = new Date(validIso(existing.startsAt || effectiveAt.toISOString())).getTime();
        const closeAt = Math.max(existingStart, effectiveAt.getTime() - 1);
        const archived = normalizeCommissionRule({
          ...existing,
          active: false,
          status: "Historica",
          endsAt: new Date(closeAt).toISOString(),
          updatedAt: changedAt,
          updatedBy: actor.name || actor.username || "Administracion",
          note: `Reemplazada por modificacion de ${rule.id}: ${motive}`
        }, existingIndex);
        rules[existingIndex] = archived;
        superseded.push({ id: archived.id, previous: clone(existing), next: clone(archived) });
      });
      rules.unshift(rule);
      rule.supersededRuleIds = superseded.map((entry) => entry.id);
      auditAction = "COMISION_REGLA_VERSIONADA";
    } else {
      const overlap = rule.active === false ? null : rules.find((existing, existingIndex) => existingIndex !== index
        && existing.active !== false
        && existing.status !== "Inactiva"
        && existing.status !== "Historica"
        && commissionRuleScopeMatches(existing, rule)
        && commissionRuleRangesOverlap(existing, rule));
      if (overlap) throw new Error(`Ya existe una regla activa superpuesta para ${rule.userLabel || rule.username || "todos los vendedores"}: ${overlap.id}.`);
      if (index >= 0) rules[index] = rule;
      else rules.unshift(rule);
    }
    const parts = localTraceParts(rule.updatedAt);
    const audit = {
      id: `COMAUD-${Date.now()}-${Math.random().toString(16).slice(2, 6).toUpperCase()}`,
      at: rule.updatedAt,
      date: parts.date,
      time: parts.time,
      user: actor.name || actor.username || "Administracion",
      username: actor.username || "",
      action: auditAction,
      ruleId: rule.id,
      previous,
      next: clone(rule),
      superseded: Array.isArray(rule.supersededRuleIds) ? clone(rule.supersededRuleIds) : [],
      motive
    };
    state.commissionAudit.unshift(audit);
    state.commissionAudit = state.commissionAudit.slice(0, 10000);
    return { rule, previous, audit };
  }

  function refreshProductInventory(product) {
    const physical = positive(product.stock_fisico ?? product.stock_actual ?? product.stock);
    const reserved = Math.min(physical, positive(product.stock_reservado));
    const inTransit = positive(product.stock_en_transito);
    product.stock_fisico = physical;
    product.stock_actual = physical;
    product.stock = physical;
    product.stock_reservado = reserved;
    product.stock_disponible = Math.max(0, physical - reserved);
    product.stock_en_transito = inTransit;
    return product;
  }

  function inventory(product) {
    refreshProductInventory(product);
    return {
      physical: product.stock_fisico,
      reserved: product.stock_reservado,
      available: product.stock_disponible,
      inTransit: product.stock_en_transito
    };
  }

  function findProduct(state, reference) {
    const products = Array.isArray(state.products) ? state.products : [];
    const code = String(reference && (reference.productCode || reference.codigo_producto || reference.code) || "").trim();
    const name = String(reference && (reference.name || reference.product || reference.descripcion) || reference || "").trim();
    if (code) {
      const byCode = products.find((item) => productCode(item) === code);
      if (byCode) return byCode;
    }
    const normalizedName = normalizeText(name);
    if (!normalizedName) return null;
    return products.find((item) => normalizeText(productName(item)) === normalizedName) || null;
  }

  function parseProductText(text) {
    return String(text || "")
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const match = part.match(/^(.*?)\s+[xX]\s*(\d+(?:[.,]\d+)?)\s*$/);
        return {
          name: match ? match[1].trim() : part,
          qty: Math.max(1, numeric(match ? String(match[2]).replace(",", ".") : 1, 1))
        };
      });
  }

  function formatItems(items) {
    return (items || []).map((item) => `${item.name} x${item.requestedQty}`).join(", ");
  }

  function canonicalStatus(status, fallback) {
    const text = String(status || "").trim();
    const map = {
      "": fallback || STATUS.READY,
      Preventa: STATUS.PENDING,
      Recibido: STATUS.READY,
      "Pendiente de abastecimiento": STATUS.PENDING,
      "Completo para armado": STATUS.READY,
      "En armado": STATUS.ASSEMBLY,
      "En Armado": STATUS.ASSEMBLY,
      Armado: STATUS.ASSEMBLY,
      Etiquetado: STATUS.LABELED,
      "Listo para despacho": STATUS.READY_DISPATCH,
      "Listo para Despacho": STATUS.READY_DISPATCH,
      "Listo reparto": STATUS.READY_DISPATCH,
      Bajar: STATUS.IN_ROUTE,
      Controlado: STATUS.IN_ROUTE,
      "En reparto": STATUS.IN_ROUTE,
      "En Reparto": STATUS.IN_ROUTE,
      Facturado: STATUS.COLLECTED,
      "No entregado": STATUS.NOT_DELIVERED,
      Postergado: STATUS.POSTPONED,
      Rechazado: STATUS.REJECTED
    };
    return map[text] || text || fallback || STATUS.READY;
  }

  function traceEntry(status, actor, note, at, gps, action) {
    const iso = validIso(at);
    const parts = localTraceParts(iso);
    const user = String(actor || "Sistema");
    return {
      status: canonicalStatus(status),
      at: iso,
      date: parts.date,
      time: parts.time,
      actor: user,
      user,
      note: String(note || ""),
      gps: gps || null,
      action: String(action || "")
    };
  }

  function normalizeTrace(trace, order, fallbackStatus) {
    const createdAt = validIso(order.createdAt || order.receivedAt);
    const entries = (Array.isArray(trace) ? trace : []).map((entry) => traceEntry(
      entry.status || fallbackStatus || STATUS.PENDING,
      entry.actor || entry.user || "Sistema",
      entry.note || entry.text || "",
      entry.at || entry.createdAt || createdAt,
      entry.gps || null,
      entry.action || entry.event || ""
    ));
    if (!entries.some((entry) => entry.status === STATUS.PENDING)) {
      entries.unshift(traceEntry(
        STATUS.PENDING,
        String(order.seller || "Preventa"),
        "Pedido registrado",
        createdAt
      ));
    }
    return entries.sort((a, b) => new Date(a.at) - new Date(b.at));
  }

  function legacyStatus(status) {
    return canonicalStatus(status, STATUS.READY);
  }

  function normalizeItem(state, item, legacy) {
    const product = findProduct(state, item);
    const requestedQty = Math.max(1, positive(item.requestedQty ?? item.qty ?? item.cantidad) || 1);
    const reservedQty = legacy ? 0 : Math.min(requestedQty, positive(item.reservedQty ?? item.reserved));
    const missingQty = legacy ? 0 : Math.max(0, requestedQty - reservedQty);
    const unitPrice = positive(item.unitPrice ?? item.price ?? (product && productUnitPrice(product)));
    const originalUnitPrice = positive(item.originalUnitPrice ?? item.precioOriginal ?? unitPrice);
    const discountPct = Math.min(100, positive(item.discountPct ?? item.discount ?? item.descuento));
    const grossTotal = requestedQty * unitPrice;
    const discountAmount = nonNegativeOrFallback(
      item.discountAmount,
      Math.round(grossTotal * discountPct) / 100
    );
    const lineTotal = nonNegativeOrFallback(item.lineTotal ?? item.total, Math.max(0, grossTotal - discountAmount));
    const priceList = productPriceListMeta(product);
    return {
      ...item,
      productCode: product ? productCode(product) : String(item.productCode || item.codigo_producto || ""),
      name: product ? productName(product) : String(item.name || item.product || "Producto sin identificar"),
      requestedQty,
      reservedQty,
      missingQty,
      unitPrice,
      originalUnitPrice,
      discountPct,
      discountAmount,
      lineTotal,
      priceListId: String(item.priceListId || priceList.priceListId || ""),
      priceListName: String(item.priceListName || priceList.priceListName || "Lista vigente")
    };
  }

  function normalizeScanValue(value) {
    return String(value || "")
      .replace(/^\*+|\*+$/g, "")
      .replace(/\s+/g, "")
      .toUpperCase();
  }

  function packageScanCode(orderCode, packageNumber) {
    const base = (normalizeScanValue(orderCode || "PEDIDO") || "PEDIDO").replace(/-/g, "");
    return `${base}B${String(packageNumber)}`;
  }

  function normalizePackageLabels(rawLabels, orderCode, packages) {
    const total = Math.max(0, Math.floor(positive(packages)));
    if (!total) return [];
    const source = Array.isArray(rawLabels) ? rawLabels : [];
    return Array.from({ length: total }, (_, index) => {
      const packageNumber = index + 1;
      const raw = source.find((item) => Number(item && (item.packageNumber || item.index || item.number)) === packageNumber) || source[index] || {};
      const scanCode = String(raw.scanCode || raw.code || packageScanCode(orderCode, packageNumber)).replace(/-/g, "").trim();
      return {
        id: String(raw.id || raw.uniqueId || scanCode),
        uniqueId: String(raw.uniqueId || raw.id || scanCode),
        packageNumber,
        index: packageNumber,
        totalPackages: total,
        scanCode,
        barcodeType: String(raw.barcodeType || "CODE39"),
        generated: raw.generated === undefined ? true : Boolean(raw.generated),
        generatedAt: raw.generatedAt || null,
        generatedBy: String(raw.generatedBy || ""),
        scanned: Boolean(raw.scanned),
        scannedAt: raw.scannedAt || null,
        scannedBy: String(raw.scannedBy || ""),
        scanValue: String(raw.scanValue || "")
      };
    });
  }

  function generatedPackageLabels(orderCode, packages, at, actor) {
    return normalizePackageLabels([], orderCode, packages).map((label) => ({
      ...label,
      generated: true,
      generatedAt: at,
      generatedBy: actor,
      scanned: false,
      scannedAt: null,
      scannedBy: "",
      scanValue: ""
    }));
  }

  function emptyAssembly(code, input = {}) {
    const bultosConfirmed = positive(input.bultosConfirmed ?? input.bultos ?? input.packages);
    const orderNumber = Math.floor(positive(input.orderNumber ?? input.assemblyOrderNumber ?? input.ordenArmado ?? input.orden_armado));
    return {
      orderNumber,
      assemblyOrderNumber: orderNumber,
      orderAssignedAt: input.orderAssignedAt || input.assemblyOrderAssignedAt || null,
      orderAssignedBy: String(input.orderAssignedBy || input.assemblyOrderAssignedBy || ""),
      bultosConfirmed,
      observations: String(input.observations || input.observaciones || ""),
      label: {
        id: String(input.labelId || ""),
        scanCode: String(input.scanCode || code || "").replace(/-/g, ""),
        barcodeType: "CODE39",
        generated: Boolean(input.generated),
        generatedAt: input.generatedAt || null,
        generatedBy: String(input.generatedBy || ""),
        printer: String(input.printer || ""),
        printed: Boolean(input.printed),
        printedAt: input.printedAt || null,
        scanned: Boolean(input.scanned),
        scannedAt: input.scannedAt || null,
        scannedBy: String(input.scannedBy || ""),
        scanValue: String(input.scanValue || ""),
        invalidatedAt: input.invalidatedAt || null,
        invalidatedBy: String(input.invalidatedBy || ""),
        invalidationReason: String(input.invalidationReason || ""),
        packageLabels: normalizePackageLabels(input.packageLabels, code, bultosConfirmed)
      }
    };
  }

  function normalizeAssembly(order) {
    const raw = order && typeof order.assembly === "object" && order.assembly ? order.assembly : {};
    const labelRaw = raw.label && typeof raw.label === "object" ? raw.label : {};
    const code = String(order && order.code || "");
    const assembly = emptyAssembly(code, {
      bultosConfirmed: raw.bultosConfirmed ?? raw.bultos ?? order.bultosConfirmed ?? order.bultos,
      observations: raw.observations || raw.observaciones || order.assemblyObservations || "",
      orderNumber: raw.orderNumber ?? raw.assemblyOrderNumber ?? order.assemblyOrderNumber ?? order.ordenArmado ?? order.orden_armado,
      orderAssignedAt: raw.orderAssignedAt || raw.assemblyOrderAssignedAt || order.assemblyOrderAssignedAt || null,
      orderAssignedBy: raw.orderAssignedBy || raw.assemblyOrderAssignedBy || order.assemblyOrderAssignedBy || "",
      labelId: labelRaw.id || order.labelId,
      scanCode: labelRaw.scanCode || order.scanCode || code,
      generated: labelRaw.generated || order.labelGenerated,
      generatedAt: labelRaw.generatedAt || order.labelGeneratedAt || null,
      generatedBy: labelRaw.generatedBy || order.labelGeneratedBy || "",
      printer: labelRaw.printer || order.labelPrinter || "",
      printed: labelRaw.printed || order.labelPrinted,
      printedAt: labelRaw.printedAt || order.labelPrintedAt || null,
      scanned: labelRaw.scanned || order.labelScanned,
      scannedAt: labelRaw.scannedAt || order.labelScannedAt || null,
      scannedBy: labelRaw.scannedBy || order.labelScannedBy || "",
      scanValue: labelRaw.scanValue || order.labelScanValue || "",
      invalidatedAt: labelRaw.invalidatedAt || null,
      invalidatedBy: labelRaw.invalidatedBy || "",
      invalidationReason: labelRaw.invalidationReason || "",
      packageLabels: labelRaw.packageLabels || order.packageLabels || []
    });
    if (!assembly.label.id && assembly.label.generated) assembly.label.id = `ETQ-${code}`;
    if (!assembly.label.scanCode) assembly.label.scanCode = String(code || "").replace(/-/g, "");
    else assembly.label.scanCode = String(assembly.label.scanCode || "").replace(/-/g, "");
    assembly.label.packageLabels = normalizePackageLabels(assembly.label.packageLabels, code, assembly.bultosConfirmed);
    assembly.assemblyOrderNumber = assembly.orderNumber;
    return assembly;
  }

  function shouldHaveAssemblyOrderNumber(order) {
    return order && ASSEMBLY_NUMBER_STATUSES.has(order.status);
  }

  function maxAssemblyOrderNumber(state) {
    return (state.orders || []).reduce((max, order) => {
      const assembly = order && order.assembly && typeof order.assembly === "object" ? order.assembly : {};
      return Math.max(max, Math.floor(positive(assembly.orderNumber ?? assembly.assemblyOrderNumber ?? order.assemblyOrderNumber)));
    }, 0);
  }

  function assignAssemblyOrderNumber(state, order, actor, at, options = {}) {
    if (!shouldHaveAssemblyOrderNumber(order)) return order && order.assembly && order.assembly.orderNumber || 0;
    order.assembly = normalizeAssembly(order);
    const current = Math.floor(positive(order.assembly.orderNumber ?? order.assembly.assemblyOrderNumber));
    if (current > 0) return current;
    const next = maxAssemblyOrderNumber(state) + 1;
    order.assembly.orderNumber = next;
    order.assembly.assemblyOrderNumber = next;
    order.assembly.orderAssignedAt = at || nowIso();
    order.assembly.orderAssignedBy = String(actor || "Sistema");
    if (options.trace) {
      addTrace(order, order.status, actor || "Sistema", `Orden de Armado asignada: ${next}.`, order.assembly.orderAssignedAt, options.gps || null, "PEDIDO_ORDEN_ARMADO_ASIGNADA");
    }
    return next;
  }

  function orderWithAssemblyOrderNumber(state, number, exceptCode) {
    const target = Math.floor(positive(number));
    if (target <= 0) return null;
    return (state.orders || []).find((item) => {
      if (!item || item.code === exceptCode) return false;
      const assembly = normalizeAssembly(item);
      return Math.floor(positive(assembly.orderNumber ?? assembly.assemblyOrderNumber)) === target;
    }) || null;
  }

  function setAssemblyOrderNumber(state, order, inputNumber, actor, at, options = {}) {
    const next = Math.floor(positive(inputNumber));
    if (next <= 0) return assignAssemblyOrderNumber(state, order, actor, at, options);
    order.assembly = normalizeAssembly(order);
    const previous = Math.floor(positive(order.assembly.orderNumber ?? order.assembly.assemblyOrderNumber));
    if (previous === next) return next;
    const existing = orderWithAssemblyOrderNumber(state, next, order.code);
    if (existing) throw new Error(`La orden de armado ${next} ya esta asignada al pedido ${existing.code}.`);
    order.assembly.orderNumber = next;
    order.assembly.assemblyOrderNumber = next;
    order.assembly.orderAssignedAt = at || nowIso();
    order.assembly.orderAssignedBy = String(actor || "Sistema");
    addTrace(
      order,
      order.status,
      actor || "Sistema",
      `Orden de Armado ${previous > 0 ? "modificada" : "asignada"}: ${previous > 0 ? `${previous} -> ` : ""}${next}.`,
      order.assembly.orderAssignedAt,
      options.gps || null,
      previous > 0 ? "PEDIDO_ORDEN_ARMADO_MODIFICADA" : "PEDIDO_ORDEN_ARMADO_ASIGNADA"
    );
    return next;
  }

  function ensureAssemblyOrderNumbers(state) {
    (state.orders || [])
      .filter(shouldHaveAssemblyOrderNumber)
      .sort((a, b) => new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0))
      .forEach((order) => assignAssemblyOrderNumber(state, order, order.assembly && order.assembly.orderAssignedBy || "Sistema", order.assembly && order.assembly.orderAssignedAt || order.updatedAt || order.createdAt || nowIso()));
  }

  function normalizeOrder(state, order) {
    const createdAt = validIso(order.createdAt || order.receivedAt || order.dateIso);
    const isLegacy = !order.inventoryMode;
    const legacyInventory = isLegacy || order.inventoryMode === "legacy-deducted";
    const parsedItems = Array.isArray(order.items) && order.items.length
      ? order.items
      : parseProductText(order.products);
    const items = parsedItems.map((item) => normalizeItem(state, item, legacyInventory));
    const status = canonicalStatus(isLegacy ? legacyStatus(order.status) : order.status, STATUS.PENDING);
    const normalized = {
      ...order,
      code: String(order.code || `PED-${Date.now()}`),
      client: String(order.client || ""),
      seller: String(order.seller || ""),
      sellerUsername: String(order.sellerUsername || order.seller_username || ""),
      items,
      products: items.length ? formatItems(items) : String(order.products || ""),
      amount: nonNegativeOrFallback(order.amount, items.reduce((sum, item) => sum + item.lineTotal, 0)),
      status,
      priority: String(order.priority || "Normal"),
      source: String(order.source || (order.origin === "preventa" ? "mobile" : "dashboard")),
      origin: String(order.origin || "preventa"),
      inventoryMode: order.inventoryMode || "legacy-deducted",
      stockSettled: Boolean(order.stockSettled || [STATUS.DISPATCHED, STATUS.IN_ROUTE, STATUS.CHECKED, STATUS.PARTIAL_DELIVERED, STATUS.DELIVERED, STATUS.COLLECTED, STATUS.CLOSED, STATUS.NOT_DELIVERED, STATUS.POSTPONED, STATUS.REJECTED].includes(status) || isLegacy),
      accountPosted: order.accountPosted === undefined ? isLegacy || order.inventoryMode === "legacy-deducted" : Boolean(order.accountPosted),
      collectionStatus: String(order.collectionStatus || "Pendiente"),
      paymentMethod: String(order.paymentMethod || "Cuenta corriente"),
      createdAt,
      receivedAt: validIso(order.receivedAt, createdAt),
      updatedAt: validIso(order.updatedAt, createdAt),
      print: Boolean(order.print),
      assembly: normalizeAssembly(order)
    };
    if ([STATUS.DISPATCHED, STATUS.IN_ROUTE, STATUS.CHECKED, STATUS.PARTIAL_DELIVERED, STATUS.DELIVERED, STATUS.COLLECTED, STATUS.CLOSED, STATUS.NOT_DELIVERED, STATUS.POSTPONED, STATUS.REJECTED].includes(status)) {
      normalized.assembly.bultosConfirmed = normalized.assembly.bultosConfirmed || 1;
      normalized.assembly.label.generated = true;
      normalized.assembly.label.scanned = true;
      normalized.assembly.label.id = normalized.assembly.label.id || `ETQ-${normalized.code}`;
      normalized.assembly.label.scanCode = String(normalized.assembly.label.scanCode || normalized.code || "").replace(/-/g, "");
    }
    let repairedApprovedAmounts = false;
    if (normalized.commercialApproval && String(normalized.commercialApproval.status || "") === "Aprobada") {
      try {
        const beforeApproval = JSON.stringify({
          amount: normalized.amount,
          items: normalized.items.map((item) => ({
            productCode: item.productCode,
            unitPrice: item.unitPrice,
            discountPct: item.discountPct,
            discountAmount: item.discountAmount,
            lineTotal: item.lineTotal
          }))
        });
        applyCommercialApprovalToOrder(normalized);
        const afterApproval = JSON.stringify({
          amount: normalized.amount,
          items: normalized.items.map((item) => ({
            productCode: item.productCode,
            unitPrice: item.unitPrice,
            discountPct: item.discountPct,
            discountAmount: item.discountAmount,
            lineTotal: item.lineTotal
          }))
        });
        repairedApprovedAmounts = beforeApproval !== afterApproval;
      } catch (_error) {
        // Registros historicos incompletos permanecen consultables sin bloquear la carga general.
      }
    }
    normalized.trace = normalizeTrace(order.trace, normalized, status);
    if (!normalized.trace.some((entry) => entry.status === status)) {
      normalized.trace.push(traceEntry(status, "Sistema", isLegacy ? "Pedido historico migrado" : "Estado actual", normalized.updatedAt));
    }
    normalized.commissions = repairedApprovedAmounts
      ? calculateOrderCommissions(state, normalized, { includeDriver: DRIVER_COMMISSION_STATUSES.has(normalized.status) })
      : normalizeOrderCommissions(state, normalized);
    return normalized;
  }

  function migrateState(state) {
    if (!state || typeof state !== "object") return state;
    state.products = (Array.isArray(state.products) ? state.products : []).map(refreshProductInventory);
    ensureCommissionSettings(state);
    state.orders = (Array.isArray(state.orders) ? state.orders : []).map((order) => normalizeOrder(state, order));
    ensureAssemblyOrderNumbers(state);

    const reservedByCode = new Map();
    state.orders
      .filter((order) => order.inventoryMode === "reservation" && ACTIVE_RESERVATION_STATUSES.has(order.status))
      .forEach((order) => order.items.forEach((item) => {
        const key = item.productCode || normalizeText(item.name);
        reservedByCode.set(key, (reservedByCode.get(key) || 0) + positive(item.reservedQty));
      }));
    state.products.forEach((product) => {
      const key = productCode(product) || normalizeText(productName(product));
      product.stock_reservado = Math.min(product.stock_fisico, reservedByCode.get(key) || 0);
      refreshProductInventory(product);
    });
    state.shortages = buildShortageList(state);
    refreshSellerMetrics(state);
    return state;
  }

  function nextOrderCode(state) {
    const maxNumber = (state.orders || []).reduce((max, order) => {
      const match = String(order.code || "").match(/PED-(\d+)/i);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 2051);
    return `PED-${maxNumber + 1}`;
  }

  function prepareRequestedItems(state, inputItems) {
    const grouped = new Map();
    (inputItems || []).forEach((raw) => {
      const product = findProduct(state, raw);
      if (!product) throw new Error(`Producto no encontrado: ${raw.name || raw.productCode || "sin identificar"}.`);
      const qty = Math.max(1, positive(raw.qty ?? raw.requestedQty) || 1);
      const key = productCode(product) || normalizeText(productName(product));
      const current = grouped.get(key) || { product, qty: 0, raw };
      current.qty += qty;
      grouped.set(key, current);
    });
    if (!grouped.size) throw new Error("El pedido no contiene productos.");
    return Array.from(grouped.values());
  }

  function quoteOrder(state, input) {
    migrateState(state);
    const sourceItems = Array.isArray(input && input.items) && input.items.length
      ? input.items
      : parseProductText(input && input.products);
    const requested = prepareRequestedItems(state, sourceItems);
    const items = requested.map(({ product, qty, raw }) => {
      const unitPrice = positive(raw && (raw.unitPrice ?? raw.price)) || productUnitPrice(product);
      const discountPct = Math.min(100, positive(raw && (raw.discountPct ?? raw.discount ?? raw.descuento)));
      const grossTotal = qty * unitPrice;
      const discountAmount = Math.round(grossTotal * discountPct) / 100;
      const lineTotal = Math.max(0, grossTotal - discountAmount);
      const priceList = productPriceListMeta(product);
      return {
        productCode: productCode(product),
        name: productName(product),
        requestedQty: qty,
        unitPrice,
        originalUnitPrice: unitPrice,
        discountPct,
        discountAmount,
        lineTotal,
        priceListId: String(raw && raw.priceListId || priceList.priceListId || ""),
        priceListName: String(raw && raw.priceListName || priceList.priceListName || "Lista vigente")
      };
    });
    return {
      items,
      amount: items.reduce((sum, item) => sum + item.lineTotal, 0)
    };
  }

  function outOfStockProducts(state, items) {
    return (Array.isArray(items) ? items : []).filter((item) => {
      const product = findProduct(state, item);
      return product && inventory(product).available <= 0;
    }).map((item) => ({
      productCode: String(item.productCode || item.codigo_producto || ""),
      name: String(item.name || item.productName || item.product || "Producto")
    }));
  }

  function assertPreventaStockPolicy(state, items) {
    if (state && state.salesPolicy && state.salesPolicy.allowPreorderWithoutStock === true) return [];
    const blocked = outOfStockProducts(state, items);
    if (!blocked.length) return [];
    const error = new Error(`SIN STOCK: ${blocked.map((item) => item.name).join(", ")}. Administracion no habilito la preventa de productos agotados.`);
    error.code = "OUT_OF_STOCK_BLOCKED";
    error.products = blocked;
    throw error;
  }

  function addTrace(order, status, actor, note, at, gps, action) {
    order.trace = Array.isArray(order.trace) ? order.trace : [];
    order.trace.push(traceEntry(status, actor || "Sistema", note || "", at || nowIso(), gps || null, action || ""));
  }

  function orderHasMissing(order) {
    return (order.items || []).some((item) => positive(item.missingQty) > 0);
  }

  function createOrder(state, input, actor) {
    migrateState(state);
    const now = nowIso();
    const requested = prepareRequestedItems(state, input.items);
    const items = requested.map(({ product, qty, raw }) => {
      const stock = inventory(product);
      const reservedQty = Math.min(stock.available, qty);
      product.stock_reservado += reservedQty;
      refreshProductInventory(product);
      const unitPrice = positive(raw && (raw.unitPrice ?? raw.price)) || productUnitPrice(product);
      const discountPct = Math.min(100, positive(raw && (raw.discountPct ?? raw.discount ?? raw.descuento)));
      const grossTotal = qty * unitPrice;
      const discountAmount = Math.round(grossTotal * discountPct) / 100;
      const lineTotal = Math.max(0, grossTotal - discountAmount);
      const priceList = productPriceListMeta(product);
      return {
        productCode: productCode(product),
        name: productName(product),
        requestedQty: qty,
        reservedQty,
        missingQty: qty - reservedQty,
        unitPrice,
        originalUnitPrice: unitPrice,
        discountPct,
        discountAmount,
        lineTotal,
        priceListId: String(raw && raw.priceListId || priceList.priceListId || ""),
        priceListName: String(raw && raw.priceListName || priceList.priceListName || "Lista vigente")
      };
    });
    const hasShortage = items.some((item) => item.missingQty > 0);
    const commercialRequest = input && input.commercialRequest && typeof input.commercialRequest === "object"
      ? {
        status: "Pendiente",
        requestedBy: String(actor || input.seller || "Preventa"),
        requestedAt: now,
        type: String(input.commercialRequest.type || ""),
        productCode: String(input.commercialRequest.productCode || ""),
        productName: String(input.commercialRequest.productName || ""),
        originalPrice: positive(input.commercialRequest.originalPrice),
        proposedValue: positive(input.commercialRequest.proposedValue),
        discountPct: positive(input.commercialRequest.discountPct),
        motive: String(input.commercialRequest.motive || input.commercialRequest.motivo || "").trim(),
        originalAmount: items.reduce((sum, item) => sum + item.lineTotal, 0),
        resolvedBy: "",
        resolvedAt: "",
        resolution: ""
      }
      : null;
    const requiresCommercialApproval = Boolean(commercialRequest && commercialRequest.type && commercialRequest.motive);
    const status = requiresCommercialApproval ? STATUS.COMMERCIAL_APPROVAL : (hasShortage ? STATUS.PENDING : STATUS.READY);
    const order = {
      code: String(input.code || nextOrderCode(state)),
      client: String(input.client || ""),
      seller: String(input.seller || ""),
      sellerUsername: String(input.sellerUsername || input.seller_username || ""),
      items,
      products: formatItems(items),
      amount: items.reduce((sum, item) => sum + item.lineTotal, 0),
      status,
      priority: String(input.priority || "Normal"),
      source: String(input.source || "mobile"),
      origin: String(input.origin || "preventa"),
      inventoryMode: "reservation",
      stockSettled: false,
      accountPosted: false,
      collectionStatus: "Pendiente",
      paymentMethod: String(input.paymentMethod || "Cuenta corriente"),
      observations: String(input.observations || input.observaciones || ""),
      observaciones: String(input.observations || input.observaciones || ""),
      commercialApproval: commercialRequest,
      createdAt: now,
      receivedAt: now,
      updatedAt: now,
      print: false,
      assembly: emptyAssembly(String(input.code || "")),
      trace: []
    };
    order.assembly.label.scanCode = String(order.code || "").replace(/-/g, "");
    addTrace(order, STATUS.PENDING, actor || order.seller || "Preventa", "Pedido registrado desde preventa", now);
    if (order.observations) addTrace(order, STATUS.PENDING, actor || order.seller || "Preventa", `Observaciones: ${order.observations}`, now, null, "PEDIDO_OBSERVACIONES");
    if (requiresCommercialApproval) addTrace(order, status, actor || order.seller || "Preventa", `Solicitud comercial pendiente: ${commercialRequest.motive}`, now, null, "PEDIDO_APROBACION_COMERCIAL");
    addTrace(order, status, "Sistema", hasShortage ? "Stock insuficiente: faltantes enviados a abastecimiento" : "Stock fisico completo y reservado", now);
    refreshOrderCommissions(state, order, { includeDriver: false });
    state.orders.unshift(order);
    refreshSellerMetrics(state);
    state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Preventa",
      title: `${order.code} - ${status}`,
      text: hasShortage ? `${order.client}: faltan ${items.reduce((sum, item) => sum + item.missingQty, 0)} unidades.` : `${order.client}: mercaderia completa para armado.`
    });
    state.stockMovements = Array.isArray(state.stockMovements) ? state.stockMovements : [];
    const reservationMovements = items.map((item) => ({
      id: `STK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: now,
      type: hasShortage ? "Reserva parcial" : "Reserva",
      productCode: item.productCode || "",
      productName: item.name,
      qty: item.reservedQty,
      orderCode: order.code,
      client: order.client,
      user: actor || order.seller || "Preventa",
      reason: hasShortage ? "Reserva parcial por faltante" : "Reserva por preventa confirmada",
      title: `${item.name} - ${order.code}`,
      text: `${order.client}: ${item.reservedQty}/${item.requestedQty} reservadas.`
    }));
    state.stockMovements.unshift(...reservationMovements);
    state.shortages = buildShortageList(state);
    return order;
  }

  function pendingOrders(state) {
    return (state.orders || [])
      .filter((order) => order.inventoryMode === "reservation" && order.status === STATUS.PENDING && orderHasMissing(order))
      .sort((a, b) => {
        const urgentA = a.priority === "Urgente" ? 0 : 1;
        const urgentB = b.priority === "Urgente" ? 0 : 1;
        return urgentA - urgentB || new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  function allocatePendingOrders(state, actor) {
    const completed = [];
    pendingOrders(state).forEach((order) => {
      order.items.forEach((item) => {
        if (item.missingQty <= 0) return;
        const product = findProduct(state, item);
        if (!product) return;
        const assign = Math.min(inventory(product).available, item.missingQty);
        if (assign <= 0) return;
        item.reservedQty += assign;
        item.missingQty -= assign;
        product.stock_reservado += assign;
        refreshProductInventory(product);
        addTrace(order, STATUS.PENDING, actor || "Sistema", `${item.name}: se asignaron ${assign} unidades ingresadas`);
      });
      if (order.items.every((item) => item.missingQty <= 0)) {
        order.status = STATUS.READY;
        order.updatedAt = nowIso();
        addTrace(order, STATUS.READY, actor || "Sistema", "Pedido completo luego del ingreso de mercaderia", order.updatedAt);
        completed.push(order.code);
      }
    });
    state.shortages = buildShortageList(state);
    return completed;
  }

  function applyStockEntry(state, input, actor) {
    migrateState(state);
    const product = findProduct(state, { productCode: input.productCode, name: input.product });
    if (!product) throw new Error("Producto no encontrado.");
    const qty = Math.max(1, positive(input.qty) || 1);
    const movementType = String(input.movementType || input.movement_type || "Ingreso");
    const before = inventory(product);
    let triggersAllocation = false;

    if (movementType === "Mercaderia en transito") {
      product.stock_en_transito += qty;
    } else if (movementType === "Ingreso desde transito") {
      product.stock_en_transito = Math.max(0, product.stock_en_transito - qty);
      product.stock_fisico += qty;
      triggersAllocation = true;
    } else if (movementType === "Ajuste negativo") {
      if (product.stock_fisico - qty < product.stock_reservado) {
        throw new Error(`No se puede reducir por debajo del stock reservado (${product.stock_reservado}).`);
      }
      product.stock_fisico -= qty;
    } else {
      product.stock_fisico += qty;
      triggersAllocation = true;
    }
    refreshProductInventory(product);
    const completedOrders = triggersAllocation ? allocatePendingOrders(state, actor || "Stock") : [];
    const after = inventory(product);

    state.stockMovements = Array.isArray(state.stockMovements) ? state.stockMovements : [];
    state.stockMovements.unshift({
      id: `STK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: nowIso(),
      type: movementType,
      productCode: productCode(product),
      productName: productName(product),
      qty: movementType === "Ajuste negativo" ? -qty : qty,
      stockBefore: before.physical,
      stockAfter: after.physical,
      previousStock: before.physical,
      newStock: after.physical,
      supplier: input.supplier || "Sin proveedor",
      remitNumber: input.remitNumber || input.remito || "",
      user: actor || "Stock",
      reason: input.note || "",
      title: `${productName(product)} ${movementType === "Ajuste negativo" ? "-" : "+"}${qty}`,
      text: `${input.supplier || "Sin proveedor"}${input.note ? ` - ${input.note}` : ""}. Fisico ${after.physical}, reservado ${after.reserved}, disponible ${after.available}, transito ${after.inTransit}.`
    });
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Stock",
      title: `${movementType}: ${productName(product)}`,
      text: completedOrders.length ? `Pedidos completados automaticamente: ${completedOrders.join(", ")}.` : `Stock fisico ${before.physical} -> ${after.physical}.`
    });
    state.shortages = buildShortageList(state);
    return { product, completedOrders };
  }

  function getOrder(state, code) {
    return (state.orders || []).find((order) => order.code === code) || null;
  }

  function nextStatus(status) {
    const transitions = {
      [STATUS.PENDING]: STATUS.READY,
      [STATUS.READY]: STATUS.ASSEMBLY,
      [STATUS.READY_DISPATCH]: STATUS.DISPATCHED,
      [STATUS.COLLECTED]: STATUS.CLOSED
    };
    return transitions[status] || "";
  }

  function assertDispatchChecklist(order) {
    if (!order) throw new Error("Pedido no encontrado.");
    if (order.status !== STATUS.READY_DISPATCH) {
      throw new Error(`El pedido debe estar en ${STATUS.READY_DISPATCH} para despachar.`);
    }
    const assembly = normalizeAssembly(order);
    if (!assembly.label.generated) throw new Error("Generar etiqueta antes de despachar.");
    if (!assembly.label.scanned) throw new Error("Escanear la etiqueta antes de despachar.");
    if (positive(assembly.bultosConfirmed) <= 0) throw new Error("Confirmar cantidad de bultos antes de despachar.");
    order.assembly = assembly;
    return assembly;
  }

  function settleReservedStock(state, order, actor) {
    if (order.stockSettled || order.inventoryMode !== "reservation") return;
    const at = nowIso();
    const movements = [];
    order.items.forEach((item) => {
      const product = findProduct(state, item);
      if (!product || item.reservedQty < item.requestedQty) {
        throw new Error(`El pedido no tiene reserva completa para ${item.name}.`);
      }
      const before = inventory(product);
      product.stock_fisico = Math.max(0, positive(product.stock_fisico) - item.requestedQty);
      product.stock_reservado = Math.max(0, positive(product.stock_reservado) - item.requestedQty);
      refreshProductInventory(product);
      const after = inventory(product);
      movements.push({
        id: `STK-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at,
        type: "Despacho",
        productCode: productCode(product),
        productName: productName(product),
        qty: -item.requestedQty,
        stockBefore: before.physical,
        stockAfter: after.physical,
        previousStock: before.physical,
        newStock: after.physical,
        orderCode: order.code,
        client: order.client,
        user: actor || "Deposito",
        reason: "Mercaderia despachada: salida fisica del deposito",
        title: `${productName(product)} - ${order.code}`,
        text: `${order.client}: despacho de ${item.requestedQty} unidades.`
      });
    });
    order.stockSettled = true;
    state.stockMovements = Array.isArray(state.stockMovements) ? state.stockMovements : [];
    state.stockMovements.unshift(...movements);
  }

  function advanceOrder(state, code, actor, options = {}) {
    if (!options.skipMigration) migrateState(state);
    const order = getOrder(state, code);
    if (!order) throw new Error("Pedido no encontrado.");
    const target = nextStatus(order.status);
    if (!target) {
      if (order.status === STATUS.PENDING && orderHasMissing(order)) throw new Error("El pedido todavia tiene faltantes y no puede pasar a preparacion.");
      throw new Error("El pedido no tiene un estado siguiente disponible.");
    }
    if (order.status === STATUS.PENDING && orderHasMissing(order)) throw new Error("El pedido todavia tiene faltantes y no puede pasar a preparacion.");
    if (target === STATUS.DISPATCHED) {
      assertDispatchChecklist(order);
      settleReservedStock(state, order, actor);
    }
    order.status = target;
    order.updatedAt = nowIso();
    if (shouldHaveAssemblyOrderNumber(order)) assignAssemblyOrderNumber(state, order, actor || "Administracion", order.updatedAt, { trace: true });
    if ([STATUS.ASSEMBLY, STATUS.DISPATCHED].includes(target)) order.print = true;
    addTrace(order, target, actor || "Administracion", `Pedido avanzado a ${target}`, order.updatedAt);
    state.activity.unshift({ type: "Pedidos", title: `${order.code} avanzo a ${target}`, text: `${order.client} - ${order.seller}.` });
    if (!options.skipShortageRebuild) state.shortages = buildShortageList(state);
    return order;
  }

  function findClientForOrder(state, order) {
    const normalized = normalizeText(order && order.client);
    return (state.clients || []).find((client) => (
      normalizeText(client.name) === normalized
      || normalizeText(client.nombre_comercial) === normalized
      || normalizeText(client.razon_social) === normalized
    )) || null;
  }

  function labelAddress(client) {
    if (!client) return "";
    return [
      client.domicilio || client.direccion || client.address,
      client.localidad || client.city,
      client.provincia || "Cordoba"
    ].filter(Boolean).join(", ");
  }

  function orderLabelData(state, order) {
    const client = findClientForOrder(state, order) || {};
    const assembly = normalizeAssembly(order);
    return {
      orderCode: order.code,
      assemblyOrderNumber: assembly.orderNumber || 0,
      orderNumber: assembly.orderNumber || 0,
      client: order.client,
      address: labelAddress(client),
      zone: client.ruta || client.zona || client.zone || "Sin ruta",
      packages: positive(assembly.bultosConfirmed),
      observations: assembly.observations || order.observations || order.observaciones || "",
      scanCode: String(assembly.label.scanCode || order.code || "").replace(/-/g, ""),
      labelId: assembly.label.id || `ETQ-${order.code}`,
      barcodeType: assembly.label.barcodeType || "CODE39",
      packageLabels: normalizePackageLabels(assembly.label.packageLabels, order.code, assembly.bultosConfirmed),
      generatedAt: assembly.label.generatedAt || null,
      generatedBy: assembly.label.generatedBy || "",
      printer: assembly.label.printer || ""
    };
  }

  function generateOrderLabel(state, code, input = {}, context = {}) {
    migrateState(state);
    const order = getOrder(state, code);
    if (!order) throw new Error("Pedido no encontrado.");
    if (![STATUS.ASSEMBLY, STATUS.LABELED, STATUS.READY_DISPATCH].includes(order.status)) {
      throw new Error(`La etiqueta se genera cuando el pedido esta en ${STATUS.ASSEMBLY}.`);
    }
    const packages = Math.floor(positive(input.bultos ?? input.packages ?? input.bultosConfirmed ?? order.assembly?.bultosConfirmed));
    if (packages <= 0) throw new Error("Confirmar cantidad de bultos mayor a cero.");
    const at = nowIso();
    const actor = String(context.user || context.actor || "Deposito");
    order.assembly = normalizeAssembly(order);
    order.assembly.bultosConfirmed = packages;
    setAssemblyOrderNumber(state, order, input.orderNumber ?? input.assemblyOrderNumber ?? input.ordenArmado ?? input.orden_armado, actor, at, { trace: !order.assembly.orderNumber, gps: context.gps || null });
    order.assembly.observations = String(input.observations ?? input.observaciones ?? order.assembly.observations ?? "").trim();
    order.assembly.label = {
      ...order.assembly.label,
      id: order.assembly.label.id || `ETQ-${order.code}-${Date.now().toString(36).toUpperCase()}`,
      scanCode: String(order.code || "").replace(/-/g, ""),
      barcodeType: "CODE39",
      generated: true,
      generatedAt: at,
      generatedBy: actor,
      printer: String(input.printer || input.printerName || order.assembly.label.printer || "").trim(),
      printed: input.printed === false ? Boolean(order.assembly.label.printed) : true,
      printedAt: input.printed === false ? order.assembly.label.printedAt : at,
      scanned: false,
      scannedAt: null,
      scannedBy: "",
      scanValue: "",
      invalidatedAt: null,
      invalidatedBy: "",
      invalidationReason: "",
      packageLabels: generatedPackageLabels(order.code, packages, at, actor)
    };
    order.status = STATUS.LABELED;
    order.updatedAt = at;
    order.print = true;
    addTrace(order, STATUS.LABELED, actor, `Etiqueta generada. Bultos: ${packages}.`, at, context.gps || null, "PEDIDO_ETIQUETA_GENERADA");
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Deposito",
      title: `${order.code} etiquetado`,
      text: `${order.client}: ${packages} bultos.`
    });
    return { order, label: orderLabelData(state, order) };
  }

  function scanOrderLabel(state, code, input = {}, context = {}) {
    migrateState(state);
    const order = getOrder(state, code);
    if (!order) throw new Error("Pedido no encontrado.");
    if (![STATUS.LABELED, STATUS.READY_DISPATCH].includes(order.status)) {
      throw new Error(`El pedido debe estar en ${STATUS.LABELED} para escanear etiqueta.`);
    }
    order.assembly = normalizeAssembly(order);
    if (!order.assembly.label.generated) throw new Error("Primero generar la etiqueta del pedido.");
    if (positive(order.assembly.bultosConfirmed) <= 0) throw new Error("Confirmar bultos antes de escanear.");
    const scanValue = String(input.scanValue || input.code || input.barcode || "").trim();
    const expected = normalizeScanValue(order.assembly.label.scanCode || order.code);
    if (!scanValue) throw new Error("Escanear o ingresar el codigo de etiqueta.");
    const normalizedScan = normalizeScanValue(scanValue);
    const packageLabels = normalizePackageLabels(
      order.assembly.label.packageLabels,
      order.code,
      order.assembly.bultosConfirmed
    );
    const legacyOrderScan = normalizedScan === expected || normalizedScan === normalizeScanValue(order.code);
    let matchedPackage = null;
    if (!legacyOrderScan) {
      matchedPackage = packageLabels.find((label) => (
        normalizeScanValue(label.scanCode) === normalizedScan
        || normalizeScanValue(label.uniqueId) === normalizedScan
        || normalizeScanValue(label.id) === normalizedScan
      ));
      if (!matchedPackage) {
        throw new Error(`Codigo escaneado incorrecto. Esperado: ${order.assembly.label.scanCode || order.code} o bulto ${packageScanCode(order.code, 1)}.`);
      }
    }
    const at = nowIso();
    const actor = String(context.user || context.actor || "Deposito");
    if (legacyOrderScan) {
      packageLabels.forEach((label) => {
        label.scanned = true;
        label.scannedAt = at;
        label.scannedBy = actor;
        label.scanValue = scanValue;
      });
    } else if (matchedPackage) {
      matchedPackage.scanned = true;
      matchedPackage.scannedAt = at;
      matchedPackage.scannedBy = actor;
      matchedPackage.scanValue = scanValue;
    }
    order.assembly.label.packageLabels = packageLabels;
    const pendingPackages = packageLabels.filter((label) => !label.scanned);
    if (pendingPackages.length) {
      order.assembly.label.scanned = false;
      order.assembly.label.scannedAt = null;
      order.assembly.label.scannedBy = "";
      order.assembly.label.scanValue = scanValue;
      order.updatedAt = at;
      addTrace(order, STATUS.LABELED, actor, `Bulto ${matchedPackage ? matchedPackage.packageNumber : ""} escaneado. Faltan ${pendingPackages.length} bultos.`, at, context.gps || null, "PEDIDO_BULTO_ESCANEADO");
      return { order, label: orderLabelData(state, order), pendingPackages: pendingPackages.length };
    }
    order.assembly.label.scanned = true;
    order.assembly.label.scannedAt = at;
    order.assembly.label.scannedBy = actor;
    order.assembly.label.scanValue = scanValue;
    order.status = STATUS.READY_DISPATCH;
    order.updatedAt = at;
    addTrace(order, STATUS.READY_DISPATCH, actor, `Etiqueta escaneada y pedido listo para despacho. Bultos: ${order.assembly.bultosConfirmed}.`, at, context.gps || null, "PEDIDO_ETIQUETA_ESCANEADA");
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Deposito",
      title: `${order.code} listo para despacho`,
      text: `${order.client}: etiqueta validada con scanner.`
    });
    return { order, label: orderLabelData(state, order) };
  }

  function setPriority(state, code, priority, actor) {
    migrateState(state);
    const order = getOrder(state, code);
    if (!order) throw new Error("Pedido no encontrado.");
    order.priority = priority === "Urgente" ? "Urgente" : "Normal";
    order.updatedAt = nowIso();
    addTrace(order, order.status, actor || "Administracion", order.priority === "Urgente" ? "Marcado como urgente" : "Urgencia retirada", order.updatedAt);
    state.activity.unshift({ type: "Pedidos", title: `${order.code} - prioridad ${order.priority}`, text: `${order.client} - ${order.status}.` });
    return order;
  }

  function cancelOrder(state, code, actor) {
    migrateState(state);
    const order = getOrder(state, code);
    if (!order) throw new Error("Pedido no encontrado.");
    if (order.inventoryMode !== "reservation") throw new Error("Los pedidos historicos migrados no pueden cancelarse automaticamente.");
    if ([STATUS.DISPATCHED, STATUS.IN_ROUTE, STATUS.CHECKED, STATUS.PARTIAL_DELIVERED, STATUS.DELIVERED, STATUS.COLLECTED, STATUS.CLOSED, STATUS.NOT_DELIVERED, STATUS.POSTPONED, STATUS.REJECTED].includes(order.status)) throw new Error("Un pedido despachado requiere una devolucion, no una cancelacion.");
    order.items.forEach((item) => {
      const product = findProduct(state, item);
      if (!product) return;
      product.stock_reservado = Math.max(0, positive(product.stock_reservado) - positive(item.reservedQty));
      refreshProductInventory(product);
      item.reservedQty = 0;
      item.missingQty = item.requestedQty;
    });
    order.status = STATUS.CANCELLED;
    order.updatedAt = nowIso();
    addTrace(order, STATUS.CANCELLED, actor || "Administracion", "Pedido cancelado y reservas liberadas", order.updatedAt);
    refreshOrderCommissions(state, order, { includeDriver: false });
    refreshSellerMetrics(state);
    const client = (state.clients || []).find((item) => item.name === order.client);
    if (order.accountPosted && client) {
      client.balance = Math.max(0, positive(client.balance) - order.amount);
      client.saldo_inicial = client.balance;
      state.accounts.unshift({
        date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
        type: "Anulacion",
        account: order.client,
        method: "Reversion pedido",
        debit: 0,
        credit: order.amount,
        balance: client.balance,
        orderCode: order.code
      });
      order.accountPosted = false;
    }
    state.activity.unshift({ type: "Pedidos", title: `${order.code} cancelado`, text: "Reservas liberadas y venta revertida." });
    allocatePendingOrders(state, actor || "Sistema");
    return order;
  }

  function editOrder(state, code, input, context) {
    migrateState(state);
    const order = getOrder(state, code);
    if (!order) throw new Error("Pedido no encontrado.");
    if (!EDITABLE_STATUSES.has(order.status)) throw new Error("Solo se pueden editar pedidos antes del despacho. Los pedidos despachados requieren devolucion o ajuste auditado.");

    const motive = String(input && input.motive || input && input.motivo || "").trim();
    if (!motive) throw new Error("El motivo de la modificacion es obligatorio.");
    const reservationMode = order.inventoryMode === "reservation";

    const nextInputItems = Array.isArray(input && input.items) && input.items.length
      ? input.items
      : parseProductText(input && input.products);
    const previous = {
      items: clone(order.items),
      products: order.products,
      amount: order.amount,
      status: order.status,
      observations: order.observations || order.observaciones || "",
      assembly: clone(order.assembly)
    };

    if (reservationMode) {
      order.items.forEach((item) => {
        const product = findProduct(state, item);
        if (!product) return;
        product.stock_reservado = Math.max(0, positive(product.stock_reservado) - positive(item.reservedQty));
        refreshProductInventory(product);
      });
    }

    const previousItemsByKey = new Map((previous.items || []).map((item) => [
      item.productCode || normalizeText(item.name),
      item
    ]));
    const requested = prepareRequestedItems(state, nextInputItems);
    const nextItems = requested.map(({ product, qty, raw }) => {
      const key = productCode(product) || normalizeText(productName(product));
      const previousLine = previousItemsByKey.get(key) || {};
      const stock = inventory(product);
      const reservedQty = reservationMode ? Math.min(stock.available, qty) : 0;
      if (reservationMode) {
        product.stock_reservado += reservedQty;
        refreshProductInventory(product);
      }
      const unitPrice = positive(raw && (raw.unitPrice ?? raw.price)) || positive(previousLine.unitPrice) || productUnitPrice(product);
      const originalUnitPrice = positive(previousLine.originalUnitPrice ?? previousLine.unitPrice) || unitPrice;
      const rawDiscountPct = raw ? (raw.discountPct ?? raw.discount ?? raw.descuento) : undefined;
      const discountPct = Math.min(100, positive(rawDiscountPct ?? previousLine.discountPct));
      const grossTotal = qty * unitPrice;
      const discountAmount = Math.round(grossTotal * discountPct) / 100;
      const lineTotal = Math.max(0, grossTotal - discountAmount);
      const priceList = productPriceListMeta(product);
      return {
        productCode: productCode(product),
        name: productName(product),
        requestedQty: qty,
        reservedQty,
        missingQty: reservationMode ? qty - reservedQty : 0,
        unitPrice,
        originalUnitPrice,
        discountPct,
        discountAmount,
        lineTotal,
        priceListId: String(raw && raw.priceListId || previousLine.priceListId || priceList.priceListId || ""),
        priceListName: String(raw && raw.priceListName || previousLine.priceListName || priceList.priceListName || "Lista vigente")
      };
    });

    const previousAmount = positive(order.amount);
    const nextAmount = nextItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const hasShortage = reservationMode && nextItems.some((item) => item.missingQty > 0);
    const shouldInvalidateLabel = [STATUS.LABELED, STATUS.READY_DISPATCH].includes(previous.status)
      || Boolean(previous.assembly && previous.assembly.label && previous.assembly.label.generated);
    const nextStatus = reservationMode
      ? (hasShortage ? STATUS.PENDING : ([STATUS.ASSEMBLY, STATUS.LABELED, STATUS.READY_DISPATCH].includes(previous.status) ? STATUS.ASSEMBLY : STATUS.READY))
      : previous.status;

    order.items = nextItems;
    order.products = formatItems(nextItems);
    order.amount = nextAmount;
    order.status = nextStatus;
    order.observations = String((input && (input.observations ?? input.observaciones)) ?? previous.observations ?? "");
    order.observaciones = order.observations;
    order.updatedAt = nowIso();
    order.print = [STATUS.READY, STATUS.ASSEMBLY].includes(nextStatus);
    order.assembly = shouldInvalidateLabel
      ? emptyAssembly(order.code, {
        invalidatedAt: order.updatedAt,
        invalidatedBy: String(context && context.user || context && context.actor || "Administracion"),
        invalidationReason: motive
      })
      : normalizeAssembly(order);

    const delta = nextAmount - previousAmount;
    refreshOrderCommissions(state, order, { includeDriver: DRIVER_COMMISSION_STATUSES.has(order.status) });
    refreshSellerMetrics(state);
    if (order.accountPosted && delta !== 0) {
      const client = (state.clients || []).find((item) => item.name === order.client);
      if (client) {
        client.balance = Math.max(0, positive(client.balance) + delta);
        client.saldo_actual = client.balance;
        client.saldo_inicial = client.balance;
        state.accounts = Array.isArray(state.accounts) ? state.accounts : [];
        state.accounts.unshift({
          date: new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
          type: "Ajuste pedido",
          account: order.client,
          method: "Edicion administrativa",
          debit: delta > 0 ? delta : 0,
          credit: delta < 0 ? Math.abs(delta) : 0,
          balance: client.balance,
          orderCode: order.code
        });
      }
    }

    const auditParts = localTraceParts(order.updatedAt);
    const audit = {
      at: order.updatedAt,
      date: auditParts.date,
      time: auditParts.time,
      user: String(context && context.user || context && context.actor || "Administracion"),
      username: String(context && context.username || ""),
      role: String(context && context.role || "admin"),
      ip: String(context && context.ip || ""),
      motive,
      inventoryMode: order.inventoryMode,
      before: previous,
      after: {
        items: clone(order.items),
        products: order.products,
        amount: order.amount,
        status: order.status,
        observations: order.observations,
        assembly: clone(order.assembly)
      }
    };
    order.editHistory = Array.isArray(order.editHistory) ? order.editHistory : [];
    order.editHistory.push(audit);
    state.orderAudit = Array.isArray(state.orderAudit) ? state.orderAudit : [];
    state.orderAudit.unshift({
      action: "ORDER_EDIT",
      orderCode: order.code,
      client: order.client,
      ...audit
    });
    addTrace(order, order.status, audit.user, `Pedido editado. Motivo: ${motive}`, order.updatedAt);
    if (shouldInvalidateLabel) {
      addTrace(order, order.status, audit.user, "Etiqueta invalidada por edicion administrativa. Requiere nueva etiqueta y escaneo.", order.updatedAt, null, "PEDIDO_ETIQUETA_INVALIDADA");
    }

    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Auditoria",
      title: `${order.code} modificado`,
      text: `${audit.user}: ${motive}. Importe ${previousAmount} -> ${nextAmount}.`
    });
    state.shortages = buildShortageList(state);
    allocatePendingOrders(state, audit.user);
    return { order, audit };
  }

  function commercialLineMatches(line, request) {
    const requestCode = normalizeText(request && request.productCode);
    const requestName = normalizeText(request && request.productName);
    const lineCode = normalizeText(line && line.productCode);
    const lineName = normalizeText(line && line.name);
    return Boolean((requestCode && requestCode === lineCode) || (requestName && requestName === lineName));
  }

  function recalculateOrderLine(line) {
    const qty = positive(line && line.requestedQty);
    const unitPrice = positive(line && line.unitPrice);
    const discountPct = Math.min(100, Math.max(0, positive(line && line.discountPct)));
    const grossTotal = qty * unitPrice;
    const discountAmount = Math.round(grossTotal * discountPct) / 100;
    line.discountPct = discountPct;
    line.discountAmount = discountAmount;
    line.lineTotal = Math.max(0, grossTotal - discountAmount);
    return line;
  }

  function applyCommercialApprovalToOrder(order) {
    const request = order && order.commercialApproval;
    if (!request) return [];
    const type = String(request.type || "");
    const changed = [];
    const targetItems = (order.items || []).filter((line) => (
      type === "general_discount" || commercialLineMatches(line, request)
    ));
    if (!targetItems.length) throw new Error("No se encontro el producto asociado a la solicitud comercial.");

    targetItems.forEach((line) => {
      const before = clone(line);
      line.originalUnitPrice = positive(line.originalUnitPrice || before.unitPrice || request.originalPrice);
      if (type === "price_change") {
        const proposedPrice = positive(request.proposedValue);
        if (proposedPrice <= 0) throw new Error("El precio solicitado debe ser mayor a cero.");
        line.unitPrice = proposedPrice;
        line.discountPct = 0;
      } else {
        const discountPct = Math.min(100, Math.max(0, positive(request.discountPct || request.proposedValue)));
        line.discountPct = discountPct;
      }
      recalculateOrderLine(line);
      changed.push({
        productCode: line.productCode,
        productName: line.name,
        previous: before,
        current: clone(line)
      });
    });
    order.products = formatItems(order.items || []);
    order.amount = (order.items || []).reduce((sum, item) => sum + positive(item.lineTotal), 0);
    return changed;
  }

  function resolveCommercialApproval(state, code, input = {}, context = {}) {
    migrateState(state);
    const order = getOrder(state, code);
    if (!order) throw new Error("Pedido no encontrado.");
    const request = order.commercialApproval;
    if (!request || String(request.status || "Pendiente") !== "Pendiente") {
      throw new Error("El pedido no tiene una solicitud comercial pendiente.");
    }
    const decision = String(input.decision || input.resolution || input.action || "").toLowerCase();
    const approved = ["approve", "approved", "aprobar", "aprobada", "aprobado"].includes(decision);
    const rejected = ["reject", "rejected", "rechazar", "rechazada", "rechazado"].includes(decision);
    if (!approved && !rejected) throw new Error("Indicar si la solicitud se aprueba o se rechaza.");
    const motive = String(input.motive || input.motivo || input.note || input.observations || "").trim();
    if (!motive) throw new Error("Indicar motivo u observacion administrativa.");

    const at = nowIso();
    const actor = String(context.user || context.actor || "Administracion");
    const previous = {
      items: clone(order.items),
      products: order.products,
      amount: order.amount,
      status: order.status,
      commercialApproval: clone(order.commercialApproval)
    };
    let changedLines = [];
    if (approved) changedLines = applyCommercialApprovalToOrder(order);

    request.status = approved ? "Aprobada" : "Rechazada";
    request.resolution = request.status;
    request.resolutionNote = motive;
    request.resolvedBy = actor;
    request.resolvedAt = at;
    request.resolvedUsername = String(context.username || "");

    const nextStatus = orderHasMissing(order) ? STATUS.PENDING : STATUS.READY;
    order.status = nextStatus;
    order.updatedAt = at;
    order.print = nextStatus === STATUS.READY;
    refreshOrderCommissions(state, order, { includeDriver: DRIVER_COMMISSION_STATUSES.has(order.status) });
    refreshSellerMetrics(state);

    const auditParts = localTraceParts(at);
    const audit = {
      at,
      date: auditParts.date,
      time: auditParts.time,
      user: actor,
      username: String(context.username || ""),
      role: String(context.role || "admin"),
      ip: String(context.ip || ""),
      motive,
      decision: request.status,
      changedLines,
      before: previous,
      after: {
        items: clone(order.items),
        products: order.products,
        amount: order.amount,
        status: order.status,
        commercialApproval: clone(order.commercialApproval)
      }
    };
    order.commercialApprovalHistory = Array.isArray(order.commercialApprovalHistory) ? order.commercialApprovalHistory : [];
    order.commercialApprovalHistory.push(audit);
    state.orderAudit = Array.isArray(state.orderAudit) ? state.orderAudit : [];
    state.orderAudit.unshift({
      action: approved ? "COMMERCIAL_APPROVAL_APPROVED" : "COMMERCIAL_APPROVAL_REJECTED",
      orderCode: order.code,
      client: order.client,
      ...audit
    });
    addTrace(order, order.status, actor, `Solicitud comercial ${request.status.toLowerCase()}. ${motive}`, at, context.gps || null, approved ? "PEDIDO_APROBACION_COMERCIAL_OK" : "PEDIDO_APROBACION_COMERCIAL_RECHAZADA");
    state.activity = Array.isArray(state.activity) ? state.activity : [];
    state.activity.unshift({
      type: "Comercial",
      title: `${order.code} ${request.status.toLowerCase()}`,
      text: `${order.client}: ${motive}.`
    });
    state.shortages = buildShortageList(state);
    return { order, audit };
  }

  function buildShortageList(state) {
    const grouped = new Map();
    (state.orders || [])
      .filter((order) => order.status === STATUS.PENDING && orderHasMissing(order))
      .forEach((order) => order.items.forEach((item) => {
        if (item.missingQty <= 0) return;
        const product = findProduct(state, item);
        const key = item.productCode || normalizeText(item.name);
        const current = grouped.get(key) || {
          productCode: item.productCode,
          name: item.name,
          missingQty: 0,
          inTransit: product ? inventory(product).inTransit : 0,
          orders: []
        };
        current.missingQty += item.missingQty;
        current.orders.push({ code: order.code, client: order.client, qty: item.missingQty, priority: order.priority });
        grouped.set(key, current);
      }));
    return Array.from(grouped.values()).map((item) => ({
      ...item,
      purchaseQty: Math.max(0, item.missingQty - item.inTransit)
    })).sort((a, b) => b.purchaseQty - a.purchaseQty || a.name.localeCompare(b.name));
  }

  return {
    STATUS,
    migrateState,
    normalizeOrder,
    refreshProductInventory,
    inventory,
    findProduct,
    parseProductText,
    formatItems,
    ensureCommissionSettings,
    calculateOrderCommissions,
    previewCommissionRule,
    refreshOrderCommissions,
    refreshSellerMetrics,
    recalculateCommissions,
    summarizeCommissions,
    analyzeCommissionRules,
    saveCommissionRule,
    nextOrderCode,
    quoteOrder,
    outOfStockProducts,
    assertPreventaStockPolicy,
    createOrder,
    allocatePendingOrders,
    applyStockEntry,
    nextStatus,
    assertDispatchChecklist,
    orderLabelData,
    generateOrderLabel,
    scanOrderLabel,
    advanceOrder,
    setPriority,
    cancelOrder,
    editOrder,
    resolveCommercialApproval,
    buildShortageList
  };
});

