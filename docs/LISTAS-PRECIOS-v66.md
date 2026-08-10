# Listas de precios - v66

Fecha: 2026-07-23

## Objetivo

Se agrego un modulo administrativo para consultar, simular, programar y aplicar listas de precios sin cambiar pedidos historicos.

## Regla operativa

- El precio efectivo de venta sigue siendo `price / precio_lista_2` del producto.
- Ese precio ahora queda gobernado por la lista activa o programada.
- Los pedidos confirmados guardan `unitPrice`, `lineTotal`, `priceListId` y `priceListName`.
- Si la lista cambia despues, el pedido ya confirmado conserva su precio original.

## Modulo nuevo

Solapa: `Precios`

Permite:

- Ver listas registradas, estado, vigencia, usuario y productos afectados.
- Filtrar productos por producto, codigo, rubro, marca, proveedor, lista, fecha y estado.
- Simular cambios antes de aplicar.
- Aplicar precio individual.
- Aplicar aumento masivo por rubro, marca, proveedor o general.
- Programar vigencia futura.
- Registrar motivo administrativo obligatorio al aplicar.

## Estados de listas

- `Activa`: impacta inmediatamente si la vigencia ya llego.
- `Programada`: no pisa precios hasta la fecha y hora configurada.
- `Borrador`: queda guardada sin impactar precios.
- `Inactiva` / `Historica`: no se usa para ventas nuevas.

## Auditoria

Cada cambio registra:

- producto
- lista
- precio anterior
- precio nuevo
- usuario
- fecha
- hora
- motivo
- operacion individual o masiva

El historial no se sobrescribe.

## Integracion

Impacta en:

- Preventa: el selector de productos muestra el precio vigente.
- Pedidos: cada item conserva precio y lista usada.
- Stock: muestra lista vigente asociada al producto.
- Administracion: registra auditoria global y notificacion.
- Reportes/estadisticas/comisiones: usan el importe historico del pedido.

## Validacion realizada

Prueba con `DATA_DIR` temporal:

- Health `runtimeVersion = 8790-66`.
- Login admin OK.
- Estado con 644 productos y lista base.
- Simulacion individual OK.
- Aplicacion individual OK.
- Producto `Aceite girasol 900ml` actualizado a `$ 1.777`.
- Auditoria de precio generada.

APK:

- `DL-Preventa-GPS-NATIVO-8790-v66.apk`
- SHA256: `DF75FD98B64A1C5457A8AA7E36442BE71D0A531A5196ACF43296BCB2AE9731D1`
- `apksigner verify`: v1/v2/v3 OK.
