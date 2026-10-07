"""Read-only SFTP snapshot for isolated local performance/equivalence tests."""
import hashlib
import importlib.util
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("deployment", root / "scripts/deploy/safe-production-deploy.py")
deployment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployment)
target = root / ".tmp-performance-167" / "production-state.json"
target.parent.mkdir(exist_ok=True)
client = deployment.connect()
try:
    with client.open_sftp() as sftp:
        # The server atomically replaces this file; the opened handle retains one snapshot.
        sftp.get("/opt/distribuidora-lopez/data/demo-state.json", str(target))
finally:
    client.close()
raw = target.read_bytes()
payload = json.loads(raw)
print(json.dumps({"path": str(target), "bytes": len(raw), "sha256": hashlib.sha256(raw).hexdigest(), "version": payload.get("version")}))
