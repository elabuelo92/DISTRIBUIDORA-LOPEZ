# Monitoreo y contingencia de produccion

En `8790-146`, el monitor desplegado registra alertas ante fallas de salud o memoria, sin ordenar reinicios del ERP. Los timers de monitor y preflight estan activos. Una salida real del proceso u OOM todavia puede provocar reinicio por `Restart=always` de systemd y cerrar sesiones almacenadas en memoria.

El cambio se probo en Linux aislado y se activo el 15/09/2026 sin reinicio posterior del servicio. Las alertas llegan a journal y al log del monitor; falta un canal externo antes de dejarlo sin vigilancia. El procedimiento y criterios de recuperacion estan en [PROTOCOLO-CONTINGENCIA-SESIONES-2026-09-15.md](PROTOCOLO-CONTINGENCIA-SESIONES-2026-09-15.md).

Ante una demora, consultar primero estado, PID y logs. No reiniciar el servicio fuera de una ventana autorizada y un backup validado; un timeout aislado no demuestra que el proceso haya caido.
