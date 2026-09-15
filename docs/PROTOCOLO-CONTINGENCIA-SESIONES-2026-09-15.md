# Protocolo de contingencia: sesiones y disponibilidad

Estado: preparado localmente el 15/09/2026. NO desplegado ni aplicado en Vultr. La produccion conserva su monitor anterior hasta un cambio autorizado.

## Causa y regla de seguridad

El monitor anterior ejecutaba `systemctl restart distribuidora-lopez.service` despues de seis fallas consecutivas de `/api/health/live` o dos controles de memoria >= 1,5 GiB. No existe un umbral de CPU que ordene reinicio en ese script. Un timeout HTTP no demuestra que Node haya muerto: puede estar ocupado temporalmente. Las sesiones viven en un `Map` dentro de `server.js`; cada reinicio las invalida.

La politica local nueva nunca reinicia por salud, CPU ni memoria. Registra y deduplica alertas. `Restart=always` de systemd sigue cubriendo la salida real del proceso. `MemoryHigh=1G` presiona el uso de memoria y `MemoryMax=1536M` es el ultimo limite: una caida por OOM todavia puede reiniciar el servicio y perder sesiones hasta que exista persistencia segura.

## Niveles y respuesta

| Sintoma | Deteccion | Monitor local nuevo | Operador |
| --- | --- | --- | --- |
| 1-2 fallas de ping | Control cada minuto | Log WARN | Observar tendencia |
| 3-5 fallas | Ping consecutivo | Alerta `health_warning` | Revisar PID, carga y logs |
| 6+ fallas | Ping consecutivo | Alerta `health`, sin reinicio | Incidente critico y decision humana |
| Memoria >= 1 GiB | `MemoryCurrent` | Log WARN | Revisar crecimiento |
| Memoria >= 1,5 GiB dos veces | `MemoryCurrent` | Alerta `memory`, sin reinicio | Revisar OOM y margen |
| Servicio no activo | Estado systemd | Alerta `service`, sin reinicio del monitor | Confirmar recuperacion de systemd o estado `failed` |

Las alertas se escriben en journal y `/var/log/distribuidora-lopez-monitor.log`; cada motivo se repite como maximo cada 15 minutos y se limpia cuando recupera. **Todavia no hay aviso externo por WhatsApp/correo/SMS.** Antes de operar sin vigilancia, definir destinatario, suplente y canal, probar entrega y no guardar secretos en el repo.

## Triage sin cortar sesiones

Primero leer estado, PID, OOM, tiempos y disco. No ejecutar reinicio como reflejo ante una respuesta lenta:

```bash
date -Is
systemctl show distribuidora-lopez.service -p ActiveState -p SubState -p MainPID -p NRestarts -p ExecMainStartTimestamp -p MemoryCurrent -p MemoryHigh -p MemoryMax --no-pager
systemctl status distribuidora-lopez-monitor.timer --no-pager
systemctl list-timers distribuidora-lopez-monitor.timer distribuidora-lopez-preflight.timer --no-pager
curl -sS --max-time 8 -w 'live_http=%{http_code} live_seconds=%{time_total}\n' -o /dev/null http://127.0.0.1:8790/api/health/live
curl -sS --max-time 15 -w 'full_http=%{http_code} full_seconds=%{time_total}\n' -o /dev/null http://127.0.0.1:8790/api/health
journalctl -u distribuidora-lopez.service --since '30 minutes ago' --no-pager -n 150
journalctl -t distribuidora-lopez-monitor --since '30 minutes ago' --no-pager -n 100
journalctl -k --since '30 minutes ago' --no-pager | grep -Ei 'oom|killed process|memory' || true
df -h /opt/distribuidora-lopez
free -h
```

Si el PID no cambio y el servicio esta `active`, conservarlo. Revisar endpoints lentos, volumen de logs, `data/demo-state.json`, consultas repetidas, escrituras y otras cargas del VPS. Suspender despliegues y procesos no esenciales, no pedidos en curso. Si esta `failed`, confirmar causa y si systemd intenta recuperar; `start`/`restart` manual requiere decision responsable porque cortara sesiones.

Si cae todo el VPS o la red, comunicar la incidencia. Registrar pedidos de contingencia con identificador externo unico, cliente, vendedor, fecha y detalle. Al volver, cotejar identificadores/numeros antes de ingresar: no reenviar a ciegas ni crear duplicados. No restaurar backups viejos sobre pedidos recibidos despues.

## Recuperacion manual excepcional

Solo considerar reinicio si el proceso sigue activo pero no puede trabajar tras diagnostico, no se recupera y el impacto de esperar supera el de cerrar sesiones. Registrar hora, PID, sintomas, pedidos activos y autorizacion. Avisar a usuarios y tomar backup/snapshot consistente en ventana controlada. Reiniciar una sola vez, nunca en bucle. Tras arrancar verificar login admin y vendedor, pedidos, armado, despacho, reparto, licencia, integridad y logs. Comparar IDs, cantidad, lineas, totales y bultos antes/despues; diferencia esperada: cero. Si falla, detener acciones nuevas e investigar sin reemplazar `data` automaticamente.

## Puerta para un despliegue futuro

Este documento NO autoriza produccion ahora. Lunes a viernes, esperar despues de las 18:00 ART salvo autorizacion especifica posterior. En fines de semana se mantienen backup, pruebas y validacion.

1. Probar el monitor en Linux aislado con `systemctl` falso y ping simulado: timeout de 8 s, seis fallas, memoria critica y recuperacion. Cero llamadas a `restart`; una alerta por motivo dentro de 15 minutos.
2. Configurar y probar canal externo de alertas para titular y suplente. Journal solamente no alcanza para guardia desatendida.
3. Hacer backup frio verificable de `data`, snapshot de pedidos, registrar commit conocido y probar restauracion en entorno aislado.
4. Revisar rollback antes de usar `scripts/deploy/safe-production-deploy.py`: contiene `git reset --hard` y restauracion completa de `data`, lo que puede borrar pedidos posteriores al backup. No usar ese rollback automatico sin redisenarlo y aprobarlo expresamente.
5. Instalar el monitor en ventana autorizada; el instalador local ya no reinicia el ERP. Los limites nuevos del drop-in aplican completamente en el siguiente arranque planificado. Verificar timer cada minuto y preflight 06:45 ART.
6. Probar con admin y vendedores conectados. Simular demora temporal y confirmar PID y sesiones estables; simular salida real solo en entorno aislado.

## Trabajo estructural pendiente

- Persistencia segura de sesiones fuera del proceso con expiracion, revocacion y politica de dispositivos. Sin esto una caida real o despliegue seguira cerrandolas.
- Medir p95/p99 HTTP, delay del event loop, tiempo de escrituras del estado, memoria, CPU y disco. Un porcentaje de CPU es alarma, no criterio unico para reinicio.
- Reducir escrituras/migraciones pesadas y probar 100 pedidos con usuarios concurrentes.
- Habilitar backups automaticos y probar restauracion con RPO/RTO definidos. La captura anterior de Vultr indicaba backups deshabilitados; confirmar estado actual antes de confiar en ellos.
