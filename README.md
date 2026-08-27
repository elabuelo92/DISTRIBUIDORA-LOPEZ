# Distribuidora Lopez - Demo CRM/Preventa

Demo web para mostrar un flujo integrado de distribuidora:

- Dashboard administrativo.
- Preventa desde celular.
- Pedidos compartidos automaticamente.
- Stock, clientes, proveedores y cuentas corrientes.
- Comisiones por vendedor.
- GPS de preventistas/repartidores sobre mapa.
- Soporte WhatsApp configurado para `+5493512410535`.
- Impresion directa de reportes de stock desde el servidor Windows.
- Compatibilidad de servidor en MacBook Air con scripts macOS.
- Notificaciones emergentes para administradores cuando ingresan pedidos desde celulares.
- Trazabilidad de pedidos desde preventa hasta entrega.
- Tablero grafico de pipeline de pedidos y alertas criticas priorizadas.
- Cortes PDF por estado del pipeline de pedidos.
- Preventa sin stock ficticio: reservas, faltantes, mercaderia en transito y asignacion automatica.
- Herramienta local para administrar usuarios y claves individuales.
- Reparto Android sin papel con hoja de ruta, GPS, firma, evidencias y cobranza.
- Herramienta externa de soporte para backups, parametros y resets controlados.
- Impresion inteligente para Armado con bultos, control manual, QR/codigo de recuperacion y auditoria.
- Branding institucional discreto de Grupo Rocha Solutions en login, ayuda, acerca, footer y documentos.
- APK con boton Volver interno, back nativo protegido y Preventa movil organizada por plantillas: Pedido, Cliente nuevo y Estado.
- Aprobacion comercial sincronizada: el descuento aprobado actualiza lineas, total y comision en Administracion sin esperar un refresco completo.
- Listas comerciales exportables a PDF y generacion auditada de Lista Nº 1 con 8% de descuento sobre Lista Nº 2.

## Ejecutar local

```bash
npm start
```

Luego abrir:

- Dashboard: `http://localhost:8790/index.html#dashboard`
- Preventa: `http://localhost:8790/index.html#preventa`
- API estado: `http://localhost:8790/api/state`

## Login inicial

El servidor Node crea usuarios semilla en `data/users.json`:

- Administracion: `admin1`, `admin2`, `admin3`
- Vendedores: `sofia`, `carlos`, `nicolas`, `vendedor4`, `vendedor5`
- Reparto: `reparto1`

La clave inicial se define con `DL_DEFAULT_PASSWORD`. Para instalacion real, cambiar esa variable antes del primer arranque.
Para regenerar usuarios de demo con una clave conocida:

```bash
node scripts/reset-demo-users.js "Lopez2026!"
```

Para cambiar usuarios y claves individuales sin editar hashes:

```text
ADMINISTRAR-USUARIOS.cmd
```

Ver `docs\ADMINISTRAR-USUARIOS-Y-CLAVES.md`.

## Soporte y mantenimiento

Para backups manuales, cambio externo de parametros o resets controlados usar:

```text
SOPORTE-MANTENIMIENTO.cmd
```

Esta herramienta genera backups automaticos y pide confirmacion textual para operaciones peligrosas. Ver `docs\HERRAMIENTA-SOPORTE-MANTENIMIENTO-2026-06-23.md`.

Para la demo local con `DemoServer.exe`, la pantalla de acceso usa estos usuarios:

- Administracion: `admin1`, `admin2`, `admin3`, `martin`, `cecilia`, `eric`
- Vendedores: `sofia`, `carlos`, `nicolas`, `vendedor4`, `vendedor5`
- Reparto: `reparto1`
- Clave demo: `Lopez2026!`

## Deploy online

El servidor usa Node.js sin dependencias externas.

En Render/Railway/VPS:

- Build command: vacio
- Start command: `npm start`
- Port: automatico con variable `PORT`
- Variable opcional para mapa real: `GOOGLE_MAPS_API_KEY`

Render detecta `render.yaml`.

## APK Android

La APK nativa es un WebView que debe apuntar a la URL publica final.

Actualizar en:

`android-apk/src/com/distribuidora/lopez/MainActivity.java`

```java
private static final String APP_URL = "https://TU_URL_PUBLICA/index.html#preventa";
```

Luego recompilar la APK.

## Impresion directa de stock

El boton `Imprimir` del modulo Stock usa el servidor Windows y exige usuario administrador.

Para imprimir en papel, Windows debe tener instalada una impresora fisica/de red visible para el usuario que ejecuta el servidor. Si se deja `DL_STOCK_PRINTER_NAME` vacio, se usa la impresora predeterminada. Si se quiere fijar una impresora exacta, editar:

```powershell
C:\DLPreventaServer\scripts\run-server-prod.ps1
$env:DL_STOCK_PRINTER_NAME = "NOMBRE EXACTO DE LA IMPRESORA"
```

El sistema rechaza impresoras virtuales o redirigidas como PDF, OneNote, XPS, Fax y AnyDesk.

## Nota de demo

`demo-state.json` guarda el estado compartido. En hosting gratuito puede resetearse si el servicio reinicia. Para produccion real conviene reemplazarlo por base de datos.

Ver tambien:

- `docs/SEMANA-1.md`
- `docs/RELEVAMIENTO-OPERATIVO.md`
- `docs/PLAN-30-DIAS-AJUSTADO.md`
- `docs/PASO-A-PASO-PC-Y-MINI-PC.md`
- `docs/MINI-PC-192-168-88-3.md`
- `docs/INFORME-IMPLEMENTACION-2026-06-15.md`
- `docs/IMPLEMENTACION-FISICA-2026-06-15.md`
- `docs/INSTALACION-WINDOWS.md`
- `docs/INSTALACION-MACBOOK-AIR.md`
- `docs/BACKUP-Y-OPERACION.md`
- `docs/AJUSTE-IMPRESION-DIRECTA-WHATSAPP-2026-06-17.md`
- `docs/AJUSTE-NOTIFICACIONES-TRAZABILIDAD-PEDIDOS-2026-06-17.md`
- `docs/AJUSTE-TABLERO-PIPELINE-ALERTAS-2026-06-17.md`
- `docs/AJUSTE-CORTES-PDF-PEDIDOS-2026-06-17.md`
- `docs/AJUSTE-CICLO-PEDIDOS-ABASTECIMIENTO-2026-06-23.md`
- `docs/ADMINISTRAR-USUARIOS-Y-CLAVES.md`
- `docs/MODULO-REPARTO-COBRANZA-2026-06-23.md`
- `docs/HERRAMIENTA-SOPORTE-MANTENIMIENTO-2026-06-23.md`
- `docs/ENTIDADES-MIXTAS-Y-RUTAS-FASE2-v59.md`
- `docs/AJUSTE-CUENTAS-CONCILIACION-v60.md`
- `docs/AJUSTE-REPARTO-MOVIL-MAPA-v61.md`
