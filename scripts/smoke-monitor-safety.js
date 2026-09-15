const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const monitor = fs.readFileSync(path.join(root, "scripts", "production-health-monitor.sh"), "utf8");
const installer = fs.readFileSync(path.join(root, "scripts", "install-production-monitor.sh"), "utf8");

assert.doesNotMatch(monitor, /systemctl\s+(?:restart|stop|kill)\s+['"]?\$SERVICE_NAME/);
assert.doesNotMatch(monitor, /restart_service\s*\(/);
assert.match(monitor, /health_failures >= FAILURE_LIMIT[\s\S]*?alert_operator health/);
assert.match(monitor, /memory_failures >= MEMORY_FAILURE_LIMIT[\s\S]*?alert_operator memory/);
assert.match(monitor, /active_state.*!=.*active[\s\S]*?alert_operator service/);
assert.match(monitor, /health=recovered/);
assert.match(monitor, /alert=operator_required/);
assert.doesNotMatch(installer, /systemctl\s+(?:restart|stop|kill)\s+distribuidora-lopez\.service/);

console.log("Monitor: umbrales solo alertan; instalador no reinicia el ERP.");
