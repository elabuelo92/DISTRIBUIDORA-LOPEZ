"""Verify P142 deployment guards without contacting production."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("deploy_188", Path(__file__).parent / "deploy" / "safe-production-deploy.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
for options in ({}, {"expected_commit": "short"}, {"expected_commit": "a" * 40, "recover_price_incident": True},
                {"expected_commit": "a" * 40, "allow_operational_archive": True}):
    try:
        module.deploy(None, "8790-188", **options)
        raise AssertionError("Unsafe deployment accepted")
    except ValueError:
        pass
commands = []
module.run = lambda client, command, **kwargs: (commands.append(command) or (0, "DRY-RUN", ""))
module.deploy(None, "8790-188", expected_commit="a" * 40)
command = commands[0]
for token in ("2026-10-24", "297df1dcc2312556405f79b3b58cae750faec723", "a" * 40,
              "APP_BACKUP_FAILED", "DATA_BACKUP_FAILED", "FULL_DATA_INTEGRITY_COMPARISON_FAILED",
              "UNEXPECTED_DEPLOY_FAILURE", "security.integrity.ok == true", "security.license.ok == true",
              "stateSync.maxConcurrent == 1", "PREPARATION_FAILED_OLD_SERVICE_RESUMED"):
    assert token in command, token
assert command.index("trap resume_unchanged_service ERR") < command.index("sudo systemctl stop")
assert command.index("trap 'rollback_deploy") < command.index("git merge --ff-only")
assert command.rindex("FULL_DATA_IDENTICAL") < command.rindex("disable_maintenance")
assert "cat \"$BACKUP_DIR/orders-today-comparison.json\"" not in command
print("PASS 188: reviewed commit/base/date, verified backups, recovery guards, complete data/users hashes and health; no server access")
