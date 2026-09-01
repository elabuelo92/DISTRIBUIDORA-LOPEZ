"use strict";

const fs = require("node:fs");

function normalized(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function activeRule(rule) {
  return rule.active !== false && normalized(rule.status || rule.estado) !== "inactiva";
}

function ruleScope(rule) {
  const user = [rule.username, rule.userLabel].map(normalized).filter(Boolean).sort().join("/") || "*";
  const role = normalized(rule.role || rule.rol) || "seller";
  const product = normalized(rule.productCode || rule.productName) || "*";
  const rubric = normalized(rule.rubro || rule.category || rule.categoria) || "*";
  return `${role}|${user}|${product}|${rubric}`;
}

function targetsOverlap(left, right) {
  const leftTargets = [left.username, left.userLabel].map(normalized).filter(Boolean);
  const rightTargets = [right.username, right.userLabel].map(normalized).filter(Boolean);
  if (!leftTargets.length || !rightTargets.length) return !leftTargets.length && !rightTargets.length;
  return leftTargets.some((target) => rightTargets.includes(target));
}

function scopesOverlap(left, right) {
  if (normalized(left.role || left.rol || "seller") !== normalized(right.role || right.rol || "seller")) return false;
  if (!targetsOverlap(left, right)) return false;
  const leftProduct = normalized(left.productCode || left.productName);
  const rightProduct = normalized(right.productCode || right.productName);
  if (leftProduct || rightProduct) return Boolean(leftProduct && rightProduct && leftProduct === rightProduct);
  return normalized(left.rubro || left.category || left.categoria || "*") === normalized(right.rubro || right.category || right.categoria || "*");
}

function rangesOverlap(left, right) {
  const leftStart = Date.parse(left.startsAt || left.startAt || "1970-01-01T00:00:00.000Z");
  const rightStart = Date.parse(right.startsAt || right.startAt || "1970-01-01T00:00:00.000Z");
  const leftEnd = Date.parse(left.endsAt || left.endAt || "9999-12-31T23:59:59.999Z");
  const rightEnd = Date.parse(right.endsAt || right.endAt || "9999-12-31T23:59:59.999Z");
  return leftStart <= rightEnd && rightStart <= leftEnd;
}

function publicRule(rule) {
  return {
    id: rule.id || "",
    role: rule.role || rule.rol || "seller",
    username: rule.username || "",
    userLabel: rule.userLabel || "",
    rubro: rule.rubro || rule.category || rule.categoria || "*",
    productCode: rule.productCode || "",
    productName: rule.productName || "",
    percent: Number(rule.percent ?? rule.percentage ?? rule.porcentaje ?? 0),
    startsAt: rule.startsAt || rule.startAt || "",
    endsAt: rule.endsAt || rule.endAt || "",
    status: rule.status || rule.estado || "",
    active: activeRule(rule),
    updatedAt: rule.updatedAt || "",
    updatedBy: rule.updatedBy || ""
  };
}

function audit(payload) {
  const state = payload && payload.state ? payload.state : payload;
  const rules = state.commissionSettings && Array.isArray(state.commissionSettings.rules)
    ? state.commissionSettings.rules
    : [];
  const sellers = Array.isArray(state.sellers) ? state.sellers : [];
  const orders = Array.isArray(state.orders) ? state.orders : [];
  const users = Array.isArray(payload.users) ? payload.users : [];
  const active = rules.filter(activeRule);
  const conflicts = [];

  active.forEach((rule, index) => {
    active.slice(index + 1).forEach((other) => {
      if (!scopesOverlap(rule, other) || !rangesOverlap(rule, other)) return;
      conflicts.push({ scope: ruleScope(rule), left: publicRule(rule), right: publicRule(other) });
    });
  });

  const targets = ["axel", "ruggero"];
  const targetDetails = Object.fromEntries(targets.map((target) => {
    const sellerMatches = sellers.filter((seller) => normalized([seller.name, seller.username].join(" ")).includes(target));
    const userMatches = users.filter((user) => normalized([user.name, user.username].join(" ")).includes(target));
    const ruleMatches = rules.filter((rule) => normalized([rule.userLabel, rule.username].join(" ")).includes(target));
    const orderMatches = orders.filter((order) => normalized([order.seller, order.sellerUsername].join(" ")).includes(target));
    return [target, {
      sellers: sellerMatches,
      users: userMatches.map((user) => ({ id: user.id || "", name: user.name || "", username: user.username || "", role: user.role || "", active: user.active !== false })),
      rules: ruleMatches.map(publicRule),
      recentOrders: orderMatches
        .sort((a, b) => Date.parse(b.createdAt || b.receivedAt || 0) - Date.parse(a.createdAt || a.receivedAt || 0))
        .slice(0, 10)
        .map((order) => ({
          code: order.code || "",
          seller: order.seller || "",
          sellerUsername: order.sellerUsername || "",
          createdAt: order.createdAt || order.receivedAt || "",
          amount: Number(order.amount || 0),
          commission: Number(order.commissions && order.commissions.seller && order.commissions.seller.total || 0),
          ruleIds: [...new Set((order.commissions && order.commissions.seller && order.commissions.seller.lines || []).map((line) => line.ruleId).filter(Boolean))]
        }))
    }];
  }));

  const activeSellerNames = sellers.filter((seller) => seller.active !== false && normalized(seller.status || seller.estado) !== "inactivo");
  const sellersWithoutSpecificRule = activeSellerNames.filter((seller) => !active.some((rule) => {
    const identity = normalized([rule.userLabel, rule.username].join(" "));
    return identity && (identity.includes(normalized(seller.name)) || identity.includes(normalized(seller.username)));
  })).map((seller) => ({ name: seller.name || "", username: seller.username || "" }));

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      sellers: sellers.length,
      activeSellers: activeSellerNames.length,
      orders: orders.length,
      rules: rules.length,
      activeRules: active.length,
      inactiveRules: rules.length - active.length,
      generalRules: rules.filter((rule) => !normalized(rule.userLabel || rule.username)).length,
      conflicts: conflicts.length,
      sellersWithoutSpecificRule: sellersWithoutSpecificRule.length
    },
    conflicts,
    generalRules: rules.filter((rule) => !normalized(rule.userLabel || rule.username)).map(publicRule),
    sellersWithoutSpecificRule,
    targets: targetDetails
  };
}

const input = process.argv[2]
  ? JSON.parse(fs.readFileSync(process.argv[2], "utf8"))
  : JSON.parse(fs.readFileSync(0, "utf8"));
if (process.argv[3]) {
  const userPayload = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
  input.users = Array.isArray(userPayload) ? userPayload : (userPayload.users || []);
}

process.stdout.write(`${JSON.stringify(audit(input), null, 2)}\n`);
