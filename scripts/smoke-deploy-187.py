"""Review the generated deployment guards without connecting to any server."""
import importlib.util
from pathlib import Path

file = Path(__file__).parent / "deploy" / "safe-production-deploy.py"
spec = importlib.util.spec_from_file_location("deploy_test", file)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
for options in ({}, {"expected_commit": "short"}, {"expected_commit": "a" * 40, "recover_price_incident": True}):
    try:
        module.deploy(None, "8790-187", **options)
        raise AssertionError("Missing deployment guard")
    except ValueError:
        pass
captured = []
module.run = lambda client, command, **kwargs: (captured.append(command) or (0, "DRY-RUN: no connection", ""))
module.deploy(None, "8790-187", expected_commit="a" * 40)
command = captured[0]
for guard in ("2026-10-24", "ed19fb0c21793b5d2562e85b0748ecf520998a71", "a" * 40,
              "FULL_DATA_INTEGRITY_COMPARISON_FAILED", "UNEXPECTED_DEPLOY_FAILURE",
              "security.integrity.ok == true", "security.license.ok == true", "stateSync.maxConcurrent == 1",
              "APP_BACKUP_FAILED", "DATA_BACKUP_FAILED"):
    assert guard in command, guard
assert command.index('for DATA_NAME in demo-state.json users.json;', command.index('FULL_DATA_IDENTICAL')) < command.rindex('disable_maintenance')
print("PASS 187 deployment: exact commit, date, backups, full data/users comparison, health, rollback; no server access")
