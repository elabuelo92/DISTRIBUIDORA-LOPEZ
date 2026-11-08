function isSuperAdmin(user) {
  return Boolean(user
    && user.role === "admin"
    && String(user.username || "").trim().toLowerCase() === "superadmin");
}

function allowsRequest({ status, user, method, pathname }) {
  if (!status || status.active !== true) return true;
  if (pathname === "/api/health" || pathname === "/api/health/live"
    || pathname === "/icons/logo-distribuidora-lopez-512.png") return true;
  if (status.allowSuperadmin !== true) return false;
  if (isSuperAdmin(user)) return true;
  if (pathname === "/api/login" && method === "POST") return true;
  if (pathname === "/api/logout" && method === "POST") return true;
  return !user && !pathname.startsWith("/api/") && (method === "GET" || method === "HEAD");
}

function allowsLogin(status, user) {
  if (!status || status.active !== true || status.allowSuperadmin !== true) return true;
  return isSuperAdmin(user);
}

module.exports = { isSuperAdmin, allowsRequest, allowsLogin };
