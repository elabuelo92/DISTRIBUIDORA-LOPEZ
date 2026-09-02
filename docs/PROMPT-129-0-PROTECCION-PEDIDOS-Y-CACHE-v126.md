# Prompt 129-0 - Proteccion de pedidos y actualizacion automatica v126

## Condicion bloqueante

No iniciar 129-A, 129-B, 129-C ni 129-D sin completar y validar 129-0.

Todo despliegue ejecutado con `scripts/deploy/safe-production-deploy.py` debe:

1. identificar la fecha operativa de Buenos Aires;
2. descargar el script de control desde `origin/main` sin modificar la aplicacion instalada;
3. detener el servicio;
4. respaldar aplicacion y carpeta productiva `data`;
5. generar `orders-today-before.json`;
6. desplegar, validar licencia e integridad y arrancar una vez;
7. generar `orders-today-after.json`;
8. comparar resumen y hash logico por pedido;
9. continuar solo con diferencia cero;
10. restaurar codigo, configuracion y datos si salud o comparacion fallan.

## Archivos de evidencia

Cada backup de despliegue contiene:

- `app.tar.gz`
- `data.tar.gz`
- `distribuidora-lopez.env`
- `integrity-manifest.json`
- `orders-today-before.json`
- `orders-today-after.json`
- `orders-today-comparison.json`

El snapshot incluye pedidos procesados durante la jornada, lineas, cantidades, precios, total, cliente, estado, numero de armado, bultos, etiquetas, ruta, repartidor, observaciones, cobranza relacionada, trazas y auditoria del dia.

El hash logico considera el contenido comercial y operativo. No incorpora la hora de generacion del archivo.

## Go / no-go

La comparacion debe devolver:

```json
{
  "ok": true,
  "missing": [],
  "added": [],
  "changed": [],
  "summaryDifferences": []
}
```

Una diferencia devuelve codigo 42 y activa rollback.

## Cache y actualizaciones

- HTML, JavaScript, CSS, configuracion y API se sirven sin cache persistente.
- Los recursos llevan version en la URL.
- El service worker se registra con `updateViaCache: none`.
- La nueva version activa `skipWaiting`, toma control y recarga la aplicacion.
- Si navegador y servidor difieren, la aplicacion navega una sola vez a una URL versionada.

El usuario ya no debe depender de `Ctrl+F5`. Durante el primer paso desde una version anterior a v126 puede ser necesario cerrar y abrir una vez la APK instalada; desde v126 las siguientes versiones se actualizan automaticamente.

## Pruebas

- `npm.cmd run test:order-dispatch-protection`
- `npm.cmd run test:cache-update`
- `node --check scripts/order-dispatch-snapshot.js`
- `python -m py_compile scripts/deploy/safe-production-deploy.py`
