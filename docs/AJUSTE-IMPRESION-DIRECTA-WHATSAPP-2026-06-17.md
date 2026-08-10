# Ajuste impresion directa y WhatsApp soporte - 2026-06-17

## Estado de fase

Se mantiene la fase:

```text
Fase de modificacion / operacion administradora
```

No se avanza de fase porque todavia se esta estabilizando el uso real en la PC servidor, APK y navegador.

## Requerimiento

- El boton `Imprimir` del modulo Stock debe mandar el reporte directamente a la impresora conectada al servidor.
- La opcion debe estar disponible solo para usuarios administradores.
- El boton de soporte por WhatsApp debe enviar consultas al numero real informado:

```text
3512410535
```

## Cambios aplicados

Frontend `8790-14`:

- El boton `Imprimir` ya no abre el dialogo del navegador.
- Ahora envia la solicitud al servidor mediante:

```text
POST /api/admin/print-stock
```

- Se respeta el buscador y filtro activo del modulo Stock.
- Si la impresion falla, se muestra un mensaje claro al administrador.
- WhatsApp de soporte configurado con formato internacional:

```text
5493512410535
```

Backend:

- Nuevo endpoint protegido:

```text
POST /api/admin/print-stock
```

- Exige sesion administradora.
- Rechaza vendedores con `403`.
- Genera un reporte TXT en:

```text
C:\DLPreventaServer\data\print-jobs
```

- Ejecuta el script:

```text
C:\DLPreventaServer\scripts\print-stock-report.ps1
```

## Configuracion de impresora

El sistema usa esta prioridad:

1. Si existe `DL_STOCK_PRINTER_NAME`, imprime en esa impresora exacta.
2. Si no existe, usa la impresora predeterminada de Windows.

Configuracion actual del servidor:

```powershell
$env:DL_STOCK_PRINTER_NAME = ""
```

Esto significa que hoy toma la predeterminada de Windows.

## Estado real detectado en esta PC

Al 2026-06-17, Windows no muestra una impresora fisica/de red disponible para el servidor. La predeterminada detectada es:

```text
Microsoft Print to PDF (1 redireccionado)
```

Tambien aparecen impresoras virtuales o redirigidas como OneNote, XPS, Fax y AnyDesk.

El sistema rechaza estas impresoras a proposito para evitar que el administrador crea que se imprimio en papel cuando en realidad se envio a PDF o a una sesion remota.

Mensaje esperado mientras no exista impresora real:

```text
La impresora seleccionada es virtual o redireccionada. Instalar/configurar la impresora fisica de red como predeterminada o definir DL_STOCK_PRINTER_NAME.
```

## Paso a paso para activar la impresion real

1. Instalar la impresora fisica o de red en Windows desde la PC servidor.
2. Confirmar que imprime una pagina de prueba desde Windows.
3. Elegir una de estas opciones:

Opcion A: dejar esa impresora como predeterminada de Windows.

Opcion B: fijar el nombre exacto en:

```text
C:\DLPreventaServer\scripts\run-server-prod.ps1
```

Linea a modificar:

```powershell
$env:DL_STOCK_PRINTER_NAME = "NOMBRE EXACTO DE LA IMPRESORA"
```

4. Reiniciar el servidor 8790.
5. Entrar como `admin1`.
6. Ir a `Stock`.
7. Tocar `Imprimir`.
8. Confirmar que sale el reporte por la impresora real.

## Validaciones realizadas

- `GET /api/health` responde OK en el servidor activo.
- `config.js` activo devuelve `window.DL_SUPPORT_WHATSAPP_PHONE = "5493512410535"`.
- Login admin `admin1` responde OK.
- `POST /api/admin/print-stock` con admin llega al flujo de impresion.
- Como no hay impresora real instalada, el endpoint devuelve error controlado.
- Login vendedor `carlos` responde OK.
- `POST /api/admin/print-stock` con vendedor devuelve `403`.

## Archivos modificados

- `index.html`
- `app.js`
- `server.js`
- `sw.js`
- `config.js`
- `scripts\run-server-prod.ps1`
- `scripts\print-stock-report.ps1`

## Pendiente

- Instalar/configurar la impresora fisica o de red.
- Definir si se usara impresora predeterminada o `DL_STOCK_PRINTER_NAME`.
- Hacer prueba de impresion real con papel.

