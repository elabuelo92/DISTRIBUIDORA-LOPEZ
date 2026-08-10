# Semana 1 - Base operativa

Objetivo: dejar la solucion lista para una primera instalacion controlada en el servidor Windows del cliente, con acceso remoto para vendedores, login por rol, respaldo diario y datos centralizados.

## Alcance de esta semana

- Servidor Windows en oficina con UPS.
- Aplicacion web administrativa en navegador.
- APK de preventa apuntando a una URL estable.
- 5 usuarios vendedores y 3 usuarios administrativos.
- Login basico con roles reales.
- Vendedor limitado a preventa, carga de pedidos, stock visible y comision.
- Administracion con dashboard, clientes, pedidos, stock, cuentas y mapa.
- Modelo de clientes con CUIT, razon social, condicion fiscal, direccion, telefono, tipo y forma de pago.
- Modelo de compras/stock preparado para Cecilia y Eric.
- Modelo de logistica preparado para Eduardo y Manuel.
- Backup diario de datos.
- Camino definido para acceso remoto HTTPS.

## Ajuste por relevamiento

Personas y roles detectados:

- Martin Lopez: direccion general, autorizacion de compras/descuentos y tablero gerencial.
- Cecilia: compras, control de stock, recepcion y precios.
- Eric: ventas internas, carga de pedidos, deposito y linea cigarrillos/tabaco.
- Kevin: preventa, visitas, pedidos y nuevos clientes.
- Eduardo: reparto principal, entregas, cobranzas y rendiciones.
- Manuel: apoyo de reparto.
- Tomas Demarchi: catalogo, capacitacion y apoyo comercial.

Procesos que entran al diseno desde Semana 1:

- Preventa desde celular.
- Pedido recibido por ventas internas/deposito.
- Hoja de armado para deposito.
- Stock con ingreso, egreso y ajuste.
- Cierre semanal de inventario de los lunes.
- Clientes con cuenta corriente e historial.
- Cobranzas por efectivo, transferencia, Mercado Pago y mercaderia como parte de pago.
- Proveedores con datos fiscales, listas de precios, condiciones y plazos.
- Repartos por zona, vehiculo, entrega, devolucion y rendicion.

## Usuarios iniciales

Administrativos:

- `admin1`
- `admin2`
- `admin3`

Vendedores:

- `sofia`
- `carlos`
- `nicolas`
- `vendedor4`
- `vendedor5`

La clave inicial se toma de `DL_DEFAULT_PASSWORD`. En desarrollo local, si no se configura esa variable, usa una clave demo. Antes de instalar en el cliente hay que cambiarla y regenerar `data/users.json`.

## Decisiones tecnicas

- Mantener Node.js como servidor principal de la version productiva inicial.
- No usar IP local para vendedores en calle.
- Usar una URL HTTPS publica mediante Cloudflare Tunnel o una VPN tipo Tailscale.
- Guardar datos operativos en `data/` durante la transicion.
- Preparar migracion a PostgreSQL para pedidos, clientes, stock, cuentas y auditoria.
- No exponer la API de Google Maps en repositorios publicos; cargarla por variable `GOOGLE_MAPS_API_KEY`.

## Entregables de Semana 1

- Login y sesiones en `server.js`.
- Frontend con pantalla de login y rol vendedor/admin.
- Usuarios semilla para 8 licencias.
- Documentacion de instalacion Windows.
- Script de backup diario.
- Esquema SQL inicial para evolucionar desde archivo demo a base de datos.
- Relevamiento funcional ordenado en `docs/RELEVAMIENTO-OPERATIVO.md`.
- Plan de 30 dias ajustado en `docs/PLAN-30-DIAS-AJUSTADO.md`.
- Guia de implementacion fisica del lunes en `docs/IMPLEMENTACION-FISICA-2026-06-15.md`.

## Checklist operativo

1. Instalar Node.js LTS en el servidor Windows.
2. Copiar el proyecto a `C:\DistribuidoraLopez`.
3. Configurar variables de entorno productivas.
4. Ejecutar `npm start`.
5. Validar desde la red local: `http://IP-SERVIDOR:8789`.
6. Configurar acceso remoto HTTPS.
7. Recompilar APK con la URL remota.
8. Instalar APK en 1 telefono piloto.
9. Probar login vendedor, pedido, stock y ubicacion.
10. Activar backup diario.

## Riesgos a cerrar

- Internet de la oficina: si cae, los vendedores no entran desde la calle.
- GPS: Android puede pausar ubicacion si la app queda en segundo plano; para produccion real conviene servicio nativo foreground.
- Datos: el archivo demo sirve para arranque, pero el mes de implementacion debe migrar a base de datos.
- Seguridad: agregar cambio de clave por usuario, bloqueo por intentos y auditoria.

## Plan de 30 dias resumido

Semana 1: base productiva, login, roles, servidor Windows, acceso remoto y backup.

Semana 2: preventa real, importacion desde Excel, clientes/productos/pedidos normalizados y stock confiable.

Semana 3: cuentas corrientes, cobros, pagos, proveedores, reparto, rendiciones y comisiones.

Semana 4: estabilizacion, pruebas con usuarios reales, capacitacion, instalacion final y soporte de salida.
