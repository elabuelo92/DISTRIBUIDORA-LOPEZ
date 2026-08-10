# Backup y operacion diaria

## Archivos criticos

- `data/users.json`: usuarios y claves hasheadas.
- `data/demo-state.json`: estado operativo mientras se usa archivo demo.
- `config.js`: solo para demo local. En produccion usar `GOOGLE_MAPS_API_KEY`.

## Backup diario

Ejecutar:

```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\DistribuidoraLopez\scripts\backup-windows.ps1
```

El backup queda en:

```text
C:\DistribuidoraLopez\backups
```

Para instalar backup automatico diario a las 20:00:

```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\DistribuidoraLopez\scripts\install-backup-task.ps1
```

## Verificacion diaria

- Dashboard abre desde administracion.
- APK entra con usuario vendedor.
- Pedido creado desde celular aparece en pedidos.
- Stock baja al enviar pedido.
- GPS actualiza en el mapa.
- Backup del dia existe.

## Recuperacion rapida

1. Detener servidor.
2. Descomprimir el ultimo backup.
3. Reemplazar carpeta `data`.
4. Iniciar servidor.
5. Probar login y dashboard.
