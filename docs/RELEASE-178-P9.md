# Release 8790-178 - P9

Correcciones administrativas de cobranzas cerradas con reverso y reemplazo vinculados, motivo obligatorio, vista previa versionada y confirmacion idempotente.

No contiene migraciones ni ejecucion de correcciones reales. Cierres, pedidos, stock y liquidaciones originales se conservan. Las transferencias nuevas requieren conciliacion bancaria.

Limites: transferencias originales pendientes o trianguladas, saldo a favor e historicos ambiguos bloqueados. Una correccion por cobro. Ajustes separados de manifiestos historicos.

Validacion previa: 23 suites P1-P9 aprobadas en datos temporales; prueba visual movil de P9 en demo; prueba de version/cache 178. Respaldo y comparacion completa de demo-state.json y users.json requeridos para el despliegue.

P10 no incluido en esta version.
