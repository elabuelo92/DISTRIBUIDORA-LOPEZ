# Cierre tecnico - Version 8790-138

## Alcance

La version implementa el cierre solicitado sobre clientes, pedido movil, armado, reparto, exportaciones y archivo operativo.

## Archivo, no borrado

`maintenance-engine.js` mueve pedidos y rutas activas a `archivedOrders` y `archivedDeliveryRoutes`. La operacion:

- deja vacias las grillas operativas;
- libera reservas y conserva stock fisico;
- preserva clientes, proveedores, reglas de comision y conciliaciones;
- mantiene pedidos archivados disponibles para historial y comisiones;
- conserva correlativos de pedido y orden de armado.

El script `scripts/archive-operational-orders.js` exige `--apply` y `--reason`, crea un respaldo propio y debe ejecutarse con el servicio detenido para evitar escrituras concurrentes.

## Interfaz

- Referencia obligatoria al crear clientes desde Administracion y Preventa.
- Cliente y producto vuelven vacios despues de confirmar un pedido.
- WhatsApp usa esquema nativo en Android y compartir estandar como respaldo.
- Scanner visible pero opcional.
- Firma retirada del flujo de entrega e incidencias.
- Rutas en tabla compacta reordenable y manifiestos CSV/PDF.
- Exportaciones maestras CSV y PDF tabular.
- Campos numericos con cero se limpian al recibir foco.

## Pruebas automatizadas

- `npm run test:operational-archive`
- `npm run test:client-create`
- `npm run test:order-share`
- `npm run test:delivery-operations`
- `npm run test:portfolio-pdf`
- `npm run test:cache-update`

La evidencia de produccion se registra durante el despliegue comparando cantidades antes y despues del archivo operativo.
