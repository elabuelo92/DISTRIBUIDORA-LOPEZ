# Modulo de reparto y cobranza digital

Fecha: 2026-06-23

Version: `8790-20`

## Objetivo

Ejecutar reparto y cobranza desde telefonos Android corporativos, tomando al dispositivo como unidad operativa y eliminando la hoja de papel.

## Identidad del dispositivo

- Cada navegador o APK genera un identificador persistente `DL-...`.
- El equipo conserva un nombre operativo editable.
- Una hoja de ruta tomada queda asociada al identificador del dispositivo.
- Otro dispositivo no puede operar esa ruta, salvo intervencion administrativa.
- La auditoria conserva dispositivo, usuario autenticado, fecha, hora y GPS.

## Generacion de hojas de ruta

Al avanzar un pedido de `Armado` a `Despachado`, el servidor:

1. Descuenta el stock fisico reservado.
2. Agrupa el pedido por fecha y zona/ruta del cliente.
3. Genera o actualiza la hoja de ruta.
4. Ordena las paradas por estado en curso, prioridad, horario de apertura, distancia GPS y antiguedad.

Los clientes sin coordenadas se ordenan por prioridad, horario y antiguedad. Para optimizacion geografica real deben completarse latitud y longitud en la ficha del cliente. Las altas realizadas desde preventa guardan el GPS del vendedor como coordenada inicial del cliente.

## Flujo de la parada

```text
DESPACHADO -> BAJAR -> CONTROLADO -> COBRAR -> ENTREGADO
```

- Solo la primera parada pendiente queda operativa.
- `IR AL CLIENTE` abre Google Maps con coordenadas o domicilio.
- `BAJAR` registra GPS y comienzo de descarga.
- `CONTROLADO` registra GPS y conformidad sobre la mercaderia.
- La cobranza exige firma y GPS.
- Al entregar se habilita automaticamente la siguiente parada.

## Cobranza

Formas admitidas:

- Efectivo.
- Transferencia.
- Cuenta corriente.

Se registran importe cobrado, saldo pendiente, fecha, hora, usuario, dispositivo y ubicación. El total cobrado mas el saldo pendiente debe coincidir con el total del pedido.

El alias bancario y titular se configuran desde `Reparto > Configuracion de cobranza` por un administrador.

## Cuenta corriente

- Los pedidos nuevos no generan deuda al confirmar la preventa.
- La deuda se genera al entregar y registrar saldo pendiente.
- Efectivo o transferencia completos no agregan saldo.
- Los pedidos historicos conservan `accountPosted=true` porque ya fueron contabilizados con el modelo anterior.
- Un cobro sobre pedido historico reduce el saldo previamente cargado, sin duplicarlo.

## Evidencias

- Firma digital obligatoria.
- Foto de comprobante de transferencia opcional.
- Foto de entrega opcional.
- GPS obligatorio para `BAJAR`, `CONTROLADO` y `ENTREGADO`.
- Imágenes guardadas en `data\delivery-uploads` y referenciadas desde la auditoría.

## API

- `GET /api/delivery`
- `POST /api/delivery/routes/:id/claim`
- `POST /api/delivery/orders/:code/status`
- `POST /api/delivery/orders/:code/collect`
- `POST /api/delivery/settings`
- `POST /api/delivery/upload`
- `GET /api/uploads/:filename`

## Usuario inicial

```text
Usuario: reparto1
Rol: driver
Clave inicial: la clave demo configurada para el paquete
```

La clave debe cambiarse desde `ADMINISTRAR-USUARIOS.cmd` antes de la prueba real.

## Pruebas realizadas

- Dos paradas en una misma ruta.
- Bloqueo de la segunda parada hasta finalizar la primera.
- Asignacion de ruta por dispositivo.
- Registro GPS en cada transición.
- Cobro en efectivo sin crear deuda.
- Cuenta corriente actualizada por saldo pendiente.
- Firma almacenada como archivo protegido.
- Auditoria completa de la entrega.
- Prueba HTTP integral contra servidor temporal.
