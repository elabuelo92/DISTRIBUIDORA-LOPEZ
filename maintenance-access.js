function isSuperAdmin(user) {
  return Boolean(user
    && user.role === "admin"
    && String(user.username || "").trim().toLowerCase() === "superadmin");
}

function isMaintenanceAdmin(status, user) {
  if (!user || user.role !== "admin") return false;
  if (isSuperAdmin(user)) return true;
  const username = String(user.username || "").trim().toLowerCase();
  const allowedUsers = Array.isArray(status && status.allowedAdminUsers)
    ? status.allowedAdminUsers
    : [];
  return allowedUsers.some((allowed) => String(allowed || "").trim().toLowerCase() === username);
}

function allowsRequest({ status, user, method, pathname }) {
  if (!status || status.active !== true) return true;
  if (pathname === "/api/health" || pathname === "/api/health/live"
    || pathname === "/icons/logo-distribuidora-lopez-512.png") return true;
  if (status.allowSuperadmin !== true) return false;
  if (isMaintenanceAdmin(status, user)) return true;
  if (pathname === "/api/login" && method === "POST") return true;
  if (pathname === "/api/logout" && method === "POST") return true;
  return !user && !pathname.startsWith("/api/") && (method === "GET" || method === "HEAD");
}

function allowsLogin(status, user) {
  if (!status || status.active !== true) return true;
  if (status.allowSuperadmin !== true) return false;
  return isMaintenanceAdmin(status, user);
}

module.exports = { isSuperAdmin, isMaintenanceAdmin, allowsRequest, allowsLogin };
