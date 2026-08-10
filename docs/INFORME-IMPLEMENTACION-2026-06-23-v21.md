# Informe de implementacion - 2026-06-23 - v21

## Estado actual

Servidor activo:

- Carpeta: `C:\DLPreventaServer`
- URL local: `http://localhost:8790/index.html#dashboard`
- API de salud: `http://127.0.0.1:8790/api/health`
- Datos activos: `C:\DLPreventaServer\data`
- Version front: `8790-21`

Validado el 2026-06-23:

- Servidor escuchando en puerto 8790.
- API de salud responde correctamente.
- Login administrador validado con `admin1`.
- Login reparto validado con `reparto1`.
- Datos activos conservados: 24 pedidos, 644 productos, 756 clientes.
- Modulo Reparto/Cobranza activo en API.
- Hoja de ruta generada: `RUTA-20260617-CENTRO`.

## Cambios aplicados

### Login y conexion

- Se suavizo el mensaje visual de inicio de sesion.
- Durante los primeros reintentos ya no aparece error rojo.
- El sistema muestra estado informativo: servidor iniciando / reintentando conexion.
- El error rojo queda reservado para falta real de respuesta sostenida.
- No requiere reinstalar APK: el front se sirve desde el servidor.

### Ciclo de pedidos

Estados de trabajo adoptados:

1. Preventa.
2. Pendiente de abastecimiento.
3. Completo para armado.
4. Armado.
5. Despachado.
6. Bajar.
7. Controlado.
8. Entregado.
9. Cobrado / cuenta corriente segun forma de pago.

### Reparto y cobranza

Se incorporo el modulo operativo para telefonos Android corporativos:

- Usuario de reparto: `reparto1`.
- El dispositivo de reparto puede tomar hoja de ruta.
- Boton `IR AL CLIENTE` abre navegacion con Google Maps.
- Flujo operativo: siguiente cliente, navegar, bajar, controlado, cobrar, entregado.
- Formas de cobro: efectivo, transferencia, cuenta corriente.
- Alias bancario visible para transferencias: `DISTRIBUIDORA.LOPEZ`.
- Registro de auditoria por estado, usuario, fecha, hora, GPS y cobranza.
- Soporte para firma digital y fotos opcionales de comprobante/entrega.

## Instrucciones de uso

### Administracion

1. Entrar a `http://localhost:8790/index.html#dashboard`.
2. Ingresar con usuario administrador.
3. Revisar pedidos, stock, abastecimiento, rutas y cobranzas.
4. Para soporte, usar el boton WhatsApp configurado al numero `3512410535`.

### Reparto

1. Abrir la app en el Android corporativo.
2. Ingresar con:
   - Usuario: `reparto1`
   - Clave inicial: `Lopez2026!`
3. Entrar al modulo Reparto.
4. Tomar la hoja de ruta disponible.
5. En cada parada:
   - Tocar `IR AL CLIENTE`.
   - Marcar `BAJAR`.
   - Marcar `CONTROLADO`.
   - Registrar cobranza.
   - Confirmar `ENTREGADO`.

## Observaciones

- Si el telefono conserva una pantalla vieja, cerrar y abrir la APK. No hace falta reinstalar.
- Si el GPS del navegador muestra permiso denegado, usar APK instalada o URL HTTPS/Tailscale compatible; Android bloquea geolocalizacion en origen no seguro.
- La carpeta `data` no debe copiarse ni pisarse sin backup previo.
- Las claves se administran desde `ADMINISTRAR-USUARIOS.cmd` o desde `scripts\manage-users.js`.

## Backup del despliegue

Antes de actualizar el servidor activo se genero backup en:

`C:\DLPreventaServer\backups\deploy-v21-20260623-145830`

Tambien se genero backup automatico de datos durante migracion:

`C:\DLPreventaServer\data\demo-state.json.backup-ciclo-2026-06-23T17-58-34-812Z`


