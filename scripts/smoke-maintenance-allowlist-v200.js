const assert = require("assert");
const access = require("../maintenance-access");

const status = {
  active: true,
  allowSuperadmin: true,
  allowedAdminUsers: ["AgustinRocha"]
};
const agustin = { username: "AgustinRocha", role: "admin" };
const otherAdmin = { username: "Admin2", role: "admin" };
const seller = { username: "Ruggero", role: "seller" };

assert.equal(access.allowsLogin(status, agustin), true);
assert.equal(access.allowsLogin(status, { username: "agustinrocha", role: "admin" }), true);
assert.equal(access.allowsLogin(status, { username: "superadmin", role: "admin" }), true);
assert.equal(access.allowsLogin(status, otherAdmin), false);
assert.equal(access.allowsLogin(status, seller), false);
assert.equal(access.allowsRequest({ status, user: agustin, method: "POST", pathname: "/api/orders" }), true);
assert.equal(access.allowsRequest({ status, user: otherAdmin, method: "GET", pathname: "/api/orders" }), false);
assert.equal(access.allowsRequest({ status, user: seller, method: "GET", pathname: "/api/orders" }), false);
assert.equal(access.allowsRequest({ status, user: null, method: "GET", pathname: "/" }), true);
assert.equal(access.allowsRequest({ status, user: null, method: "GET", pathname: "/api/orders" }), false);
assert.equal(access.allowsRequest({ status, user: null, method: "GET", pathname: "/api/health" }), true);
assert.equal(access.allowsLogin({ ...status, active: false }, otherAdmin), true);
assert.equal(access.allowsLogin({ ...status, allowSuperadmin: false }, agustin), false);
assert.equal(access.allowsRequest({ status: { ...status, allowSuperadmin: false }, user: agustin, method: "GET", pathname: "/api/orders" }), false);

console.log("PASS: solo AgustinRocha y superadmin acceden durante mantenimiento; otros roles y admins siguen bloqueados.");
