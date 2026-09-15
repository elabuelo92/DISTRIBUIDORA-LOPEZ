# Monitoreo y contingencia de produccion

La politica actualmente desplegada en `8790-145` todavia puede reiniciar el ERP por seis fallas de `/api/health/live` o dos lecturas de memoria >= 1,5 GiB. Esto puede cerrar todas las sesiones porque estan en memoria. No hay un umbral de CPU que ordene reinicio en el monitor.

La politica nueva, preparada solo localmente, convierte esas condiciones en alertas y elimina el reinicio implicito del instalador. **No asumir que ya esta activa en produccion.** El procedimiento completo, criterios de recuperacion y despliegue futuro estan en [PROTOCOLO-CONTINGENCIA-SESIONES-2026-09-15.md](PROTOCOLO-CONTINGENCIA-SESIONES-2026-09-15.md).

Mientras el cambio no este desplegado, consultar estado y logs antes de decidir una intervencion. No ejecutar `scripts/install-production-monitor.sh` ni reiniciar el servicio fuera de una ventana autorizada y un backup validado.
