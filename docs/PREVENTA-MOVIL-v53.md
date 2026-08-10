# Preventa Movil - v53

Fecha: 2026-07-17

## Cambios implementados

- Selector "Dia de trabajo" debajo de Vendedor.
- Cartera filtrada por vendedor y dia.
- Orden por cercania cuando existe GPS del vendedor y GPS del cliente.
- Alta rapida de cliente con telefono, domicilio y GPS obligatorios.
- Boton "Registrar ubicacion actual" para guardar latitud, longitud y precision.
- Alta movil sincronizada inmediatamente contra el servidor.
- Correccion del flujo donde el cliente nuevo no quedaba disponible para vender.
- Correccion del boton que podia quedar en "Registrando...".
- Ojo de mostrar/ocultar clave en login.
- Dashboard comercial de preventista con avance, efectividad, ventas, comision, pedidos y ticket promedio.
- Registro de "Sin compra" con motivo obligatorio.
- Observacion obligatoria cuando el motivo es "Otros".
- Auditoria y notificaciones para altas moviles y visitas sin compra.

## Endpoints agregados

- POST /api/clients/mobile
- POST /api/preventa/no-purchase

Ambos requieren sesion activa y registran auditoria.

## URL de prueba

http://127.0.0.1:8790/index.html?v=8790-53#preventa
