# P144 - Reparto, GPS y correcciones de cobranza

Estado: **Implementado localmente, pendiente de despliegue**. Paquete preparado: 8790-191.

## Alcance y respaldo previo

- Fuente inicial: commit `d8fe037`, codigo productivo 190 en `9345c3734e9fe39269caa95f02d7e45f6be2023e`.
- Respaldo local de fuente anterior: `C:/DistribuidoraLopez/.security/p144-source-before-d8fe037.zip`.
- Copia de datos de solo lectura: 104288864 bytes, version `1792883540272`, SHA256 `e336e077ca41d189afda27a73ff4f0ec577d1ac6cbb09ba7500c0392138bc6a6`. Coincide con el respaldo productivo 190.
- No se modificaron clientes, pedidos, rutas, cobranza ni saldos en produccion durante desarrollo/pruebas. Las operaciones de prueba se realizaron en servidores ficticios de 127.0.0.1 o en memoria sobre la copia local.

## 1. Por que no aparecia GPS

La funcion no estaba eliminada: el acceso `gps-corrections` y su contenido estaban restringidos expresamente a `currentUser.role === driver`. Administracion no podia verla en Herramientas. Ademas, la pantalla solo listaba solicitudes, sin buscador ni comparacion, y captura/envio eran una sola accion.

## 2. Recuperacion del circuito

- Acceso estable **09 - Corregir ubicacion de cliente**, visible para Administracion y Reparto.
- Busqueda por nombre, codigo, direccion o pedido. El repartidor conserva el alcance de clientes de sus rutas; no se amplian permisos al padron completo.
- Un cliente seleccionado a la vez, coordenadas oficiales, nueva captura, precision y enlaces de cada punto al mapa.
- Capturar no guarda. Enviar a validacion conserva la ubicacion oficial y muestra la propuesta pendiente.
- Administracion puede solicitar la correccion y aprobar/rechazar desde la herramienta. Se conserva el requisito de solicitud administrativa previa para que el repartidor capture.
- Nueva captura invalida el borrador anterior; permisos denegados, tiempo agotado y reintentos no disparan capturas para otros clientes.
- Revision concurrente protegida mediante version del cliente; una pantalla anterior no puede aprobar una propuesta distinta. Se conserva compatibilidad del circuito anterior.
- Auditoria: usuario/rol, dispositivo, fecha/hora, coordenadas anteriores/propuestas, precision y administrador que resuelve.
- Escritura sobre borrador y persistencia atomica. Pedidos y coordenadas historicas no se reescriben al aprobar.

## 3. Bloqueos de cobranza reproducidos

- El formulario exigia banco, operacion y un archivo nuevo incluso si se deseaba conservar la transferencia y corregir solo efectivo.
- El motor rechazaba cualquier correccion si el cliente tenia saldo a favor, aun cuando provenia de otro movimiento y no iba a modificarse.
- El token de previsualizacion incluia todo el cliente y toda la ruta: un cambio ajeno a la contabilidad, como GPS o nombre del equipo, invalidaba la confirmacion.
- `crypto.randomUUID()` se usaba sin alternativa para navegadores sin ese metodo en contextos locales; ahora existe un identificador alternativo de operacion.
- No habia confirmacion explicita con clave administrativa; se agrega sin cambiar los roles habilitados.

Diagnostico de solo lectura sobre 1168 cobros de rutas cerradas: antes, 1123 previsualizaciones aceptadas y 45 bloqueadas. Despues, 1151 aceptadas y 17 bloqueadas por condiciones contables reales: 16 cobros generaron saldo a favor y uno supera la deuda tras el reverso. No son 1151 correcciones aplicadas: solo previsualizaciones sobre una copia. No se ha recibido aun el pedido o mensaje exacto del reclamo; no se afirma que ese caso particular este resuelto.

## 4. Correccion contable

- Opcion explicita para conservar transferencia, comprobante y conciliacion originales. No exige nuevo archivo ni genera otra transferencia ni revierte lo conservado.
- Para reemplazar importe/banco/comprobante: reverso vinculado del pago acreditado y nueva transferencia pendiente de validacion. Lo historico queda intacto y no puede acreditarse otra vez.
- Efectivo correcto y transferencia correcta determinan la diferencia y saldo pendiente; vista previa Original / Corregido / Diferencia.
- El saldo a favor ajeno a la cobranza se conserva exactamente. Si el cobro original genero credito, se mantiene el bloqueo para conciliacion especifica; no se inventa una compensacion.
- Motivo obligatorio, clave administrativa independiente, botones bloqueados y datos conservados ante error. Reintentar la misma operacion genera un solo ajuste.
- El token sigue protegiendo importes, saldo, bancos y cierre; ignora cambios no financieros de GPS/equipo.
- Prevalidacion sin duplicar la copia completa de estado antes de subir un comprobante. La aplicacion crea una sola copia contable.
- Se conserva la herramienta de rutas cerradas. No se habilitan modificaciones directas de cierres, pagos triangulados ni saldos a favor originados por el cobro.

## Archivos y endpoints

- `app.js`, `index.html`, `styles.css`: acceso 09, busqueda, comparacion/captura/envio y autorizacion de cobranza.
- `server.js`: `POST /api/clients/:id/gps-review`, `GET/POST /api/collection-corrections`; permisos, concurrencia, borrador GPS y comprobacion de clave.
- `collection-correction-engine.js`: conservacion bancaria, saldo a favor independiente, token financiero y prevalidacion sin copia doble.
- `collection-corrections-ui.js`: modos conservar/reemplazar, comparacion y modal de autorizacion.
- `config.js`, `sw.js`, `index.html`, `server.js`: version/cache 191.
- `scripts/deploy/safe-production-deploy.py`: resguardo de commit exacto, respaldo y comparacion integral.

## Pruebas

`node scripts/verify-p144.js`: **16/16 verificaciones aprobadas**, ultima ejecucion 2026-10-24 21:55 ART, evidencia en `P144-release-checks.json`. Revision visual de escritorio y movil sin superposiciones en los controles modificados.

- GPS: acceso de administrador/repartidor, busqueda por codigo/pedido, captura unica, precision, ubicacion anterior/propuesta, envio, aprobacion/rechazo/cancelacion y conflicto de version.
- Navegador Chromium real con viewport movil y geolocalizacion simulada: no equivale a probar el sensor de un Android fisico. Se verifican tambien formatos de fecha del puente Android y liberacion de timers.
- Cobros: efectivo/transferencia parcial, transferencia validada o pendiente conservada, rechazo de clave incorrecta, autorizacion correcta, doble envio concurrente, reintentos y token vencido por cambio financiero.
- Saldo, cuentas, caja, auditoria y validacion bancaria una sola vez; cierres/pedidos/reservas/stock/liquidaciones sin cambios no justificados.
- Regresiones P143, P9, P10, cancelacion GPS, reportes de efectivo y exportacion numerica.
- Copia completa: reproduccion del bloqueo por credito independiente, ajuste en memoria, historicos y demas clientes identicos, credito intacto, fuente de datos sin modificaciones. Evidencia `P144-volume-results.json`.
- Evidencia visual: `P144-gps-movil.png`, `P144-gps-validacion.png`; recorrido de cobranza en `PRIORIDADES-cobranza-preview-20261024.png` y su variante movil.

## Checklist operativo

1. Reparto > Herramientas > 09: buscar el cliente o pedido y consultar la ubicacion oficial.
2. Con solicitud administrativa abierta y estando frente al comercio, capturar GPS; comprobar precision y ambos puntos antes de enviar.
3. Confirmar que queda Pendiente de validacion y la ubicacion oficial no cambia.
4. Administracion revisa y aprueba/rechaza; volver a consultar al cliente. No usar clientes productivos solo para probar.
5. Corregir cobranzas cerradas: elegir ruta/cobro. Conservar transferencia si no se modifica, o desmarcar y cargar los datos nuevos completos.
6. Revisar Original / Corregido / Diferencia, indicar motivo y autorizar con clave.
7. Revisar ajuste vinculado, cuenta corriente, efectivo de ruta y conciliacion. El cierre historico debe seguir igual.
8. Si informa saldo a favor generado por el cobro, deuda insuficiente o trazabilidad ambigua, registrar pedido y mensaje para revision puntual; no forzar importes.
