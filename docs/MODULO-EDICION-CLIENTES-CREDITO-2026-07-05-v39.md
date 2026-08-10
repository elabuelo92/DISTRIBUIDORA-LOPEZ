# Modulo de edicion de clientes y limite de credito - v39

Fecha: 2026-07-05

## Objetivo

Permitir que Administracion corrija y mantenga la ficha de cada cliente sin tocar archivos internos ni romper la base del sistema.

## Alcance implementado

- Boton Editar en la grilla de Clientes.
- Reutilizacion del formulario de cliente para alta y modificacion.
- Edicion de:
  - Nombre comercial.
  - Razon social.
  - CUIT/DNI.
  - Direccion.
  - Telefono.
  - Email.
  - Zona.
  - Vendedor asignado.
  - Condicion comercial.
  - Observaciones.
  - Coordenadas GPS.
- Campo obligatorio Motivo del cambio al editar.
- Actualizacion de referencias cuando cambia el nombre comercial:
  - Pedidos.
  - Cuentas corrientes.
  - Conciliacion bancaria.
  - Hojas de ruta.

## Control de permisos

- El limite de credito solo puede modificarlo un usuario con rol Administrador.
- Si un usuario no autorizado intenta cambiar el limite, el servidor rechaza la operacion.
- El resto de los datos queda centralizado en el endpoint seguro de edicion.

## Auditoria obligatoria

Cuando se modifica una ficha se guarda:

- Usuario.
- Fecha y hora.
- IP.
- Motivo declarado.
- Valor anterior.
- Valor nuevo.

Los cambios sensibles generan una accion `CLIENTE_CAMBIO_SENSIBLE`:

- Limite de credito.
- Condicion comercial.
- Datos fiscales.
- Direccion.

Los cambios no sensibles generan una accion `CLIENTE_EDITADO`.

## Validaciones

- No se permite guardar sin motivo.
- No se permite duplicar codigo de cliente.
- No se permite duplicar nombre comercial contra otro cliente.
- La ficha se normaliza antes de persistirse para mantener compatibilidad con preventa, pedidos, cuentas y reparto.

## Archivos modificados

- `index.html`
- `app.js`
- `server.js`
- `styles.css`

## Prueba recomendada

1. Ingresar como administrador.
2. Abrir Clientes.
3. Buscar un cliente.
4. Presionar Editar.
5. Cambiar telefono, email u observaciones y guardar con motivo.
6. Cambiar limite de credito y verificar que queda registrado como cambio sensible.
7. Ingresar con un usuario no administrador e intentar cambiar limite de credito: debe ser rechazado.

