"""Compare all ERP state fields and user records against the deployment backup."""
import importlib.util
import re
import shlex
import sys
from pathlib import Path

if len(sys.argv) != 2 or not re.fullmatch(r"/opt/distribuidora-lopez/backups/emergency-[0-9-]+/data.tar.gz", sys.argv[1]):
    raise SystemExit("Expected deployment data.tar.gz backup path")
spec = importlib.util.spec_from_file_location("deployment", Path(__file__).with_name("safe-production-deploy.py"))
deployment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployment)
code = r'''
import hashlib, json, tarfile, urllib.request
backup = BACKUP_PATH
with tarfile.open(backup, "r:gz") as archive:
    state_before = archive.extractfile("data/demo-state.json").read()
    users_before = archive.extractfile("data/users.json").read()
with open("/opt/distribuidora-lopez/data/demo-state.json", "rb") as f:
    state_after = f.read()
with open("/opt/distribuidora-lopez/data/users.json", "rb") as f:
    users_after = f.read()
before = json.loads(state_before)["state"]
after = json.loads(state_after)["state"]
keys = sorted(set(before) | set(after))
changed = [key for key in keys if (key in before) != (key in after) or before.get(key) != after.get(key)]
with urllib.request.urlopen("http://127.0.0.1:8790/api/health", timeout=15) as response:
    health = json.load(response)
result = {
    "backup": backup, "allStateFieldsCompared": len(keys), "changedStateFields": changed,
    "stateFileByteIdentical": state_before == state_after,
    "usersByteIdentical": users_before == users_after,
    "stateBeforeSha256": hashlib.sha256(state_before).hexdigest(),
    "stateAfterSha256": hashlib.sha256(state_after).hexdigest(),
    "counts": {k: len(after.get(k, [])) for k in ["orders", "archivedOrders", "products", "clients", "accounts", "deliveryRoutes", "bankReconciliation"]},
    "ok": not changed and users_before == users_after and health.get("ok") is True,
    "health": {k: health.get(k) for k in ["version", "maintenance", "stateSync", "activeSessions", "security"]}
}
print(json.dumps(result, indent=2))
if not result["ok"]:
    raise SystemExit(2)
'''.replace("BACKUP_PATH", repr(sys.argv[1]))
client = deployment.connect()
try:
    status, output, error = deployment.run(client, "python3 -c " + shlex.quote(code), timeout=90, check=False)
    print(output)
    if error:
        print(error)
    if status == 0:
        (Path(__file__).resolve().parents[2] / "docs/PRODUCTION-167-INTEGRITY.json").write_text(output, encoding="utf-8")
    raise SystemExit(status)
finally:
    client.close()
