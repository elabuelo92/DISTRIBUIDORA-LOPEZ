# Monitoreo y contingencia de produccion

## Protecciones instaladas

- Monitor de salud cada minuto.
- Reinicio luego de tres fallas consecutivas de `/api/health`.
- Advertencia al superar 1 GB de RAM.
- Reinicio controlado si supera 1,5 GB durante dos controles consecutivos.
- Enfriamiento de cinco minutos entre reinicios para evitar bucles.
- `MemoryHigh=1G`, `MemoryMax=1536M` y `MemorySwapMax=2G` en systemd.
- Comprobacion diaria a las 06:45, zona `America/Argentina/Buenos_Aires`.
- Registro persistente en `/var/log/distribuidora-lopez-monitor.log` y journal.

## Consultar estado

```bash
systemctl status distribuidora-lopez.service --no-pager
systemctl status distribuidora-lopez-monitor.timer --no-pager
systemctl status distribuidora-lopez-preflight.timer --no-pager
systemctl list-timers distribuidora-lopez-monitor.timer distribuidora-lopez-preflight.timer --no-pager
tail -n 100 /var/log/distribuidora-lopez-monitor.log
journalctl -t distribuidora-lopez-monitor -n 100 --no-pager
```

## Ejecutar una comprobacion manual

```bash
sudo systemctl start distribuidora-lopez-monitor.service
sudo systemctl start distribuidora-lopez-preflight.service
```

## Desactivar temporalmente

```bash
sudo systemctl disable --now distribuidora-lopez-monitor.timer
sudo systemctl disable --now distribuidora-lopez-preflight.timer
```

Esto no detiene el ERP. Solo desactiva las comprobaciones automaticas.

## Reinstalar

```bash
cd /opt/distribuidora-lopez/app
sudo bash scripts/install-production-monitor.sh
```

## Recuperacion manual

Si el servicio no responde y el monitor no pudo recuperarlo:

```bash
sudo systemctl restart distribuidora-lopez.service
sleep 4
curl -fsS https://lopez.gruporochaapp.com/api/health
sudo journalctl -u distribuidora-lopez.service -n 120 --no-pager
```

No reemplazar archivos de `data` ni desplegar codigo durante el horario operativo.
