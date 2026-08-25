# Prompt 101 - Cartera de clientes por vendedor

Version: 8790-110  
Fecha: 25/08/2026

## Regla de pertenencia

La pertenencia se determina exclusivamente por los campos de asignacion comercial del cliente:

- `vendedor_asignado`
- `seller`
- `vendedor`

El usuario que creo el cliente no interviene en el filtro.

## Alcances de Preventa

- **Mi ruta de hoy:** clientes asignados al vendedor autenticado cuyo dia de visita incluye el dia actual. Acepta formatos completos y abreviados, por ejemplo `Lunes` y `2/7 LuVi`.
- **Mi cartera:** todos los clientes asignados al vendedor autenticado, sin filtrar por dia.
- **Fuera de ruta:** clientes que no forman parte de la ruta del vendedor para el dia actual. Se conserva como acceso excepcional y nunca se mezcla dentro de Mi ruta de hoy.

La sesion autenticada es la autoridad. Si el usuario vendedor no existe en la coleccion auxiliar `sellers`, la aplicacion reconstruye su registro visual sin reemplazarlo por otro vendedor.

## Administracion

El modulo Clientes permite seleccionar registros visibles o mantener seleccion entre paginas. La barra de reasignacion permite actualizar en una operacion:

- vendedor;
- ruta;
- zona;
- dia de visita.

La operacion exige motivo y reingreso de clave administrativa. Es transaccional: si algun cliente no existe, no se modifica ninguno. Se registra una entrada de auditoria por cliente con valores anteriores y nuevos.

## Pruebas

Ejecutar:

```powershell
npm.cmd run test:client-portfolio
```

Cobertura:

- ruta de hoy de Kevin;
- cartera completa de Kevin;
- ruta de Carlos;
- fuera de ruta sin mezcla;
- busqueda por coincidencia;
- dias abreviados `LuVi`;
- rechazo de clave incorrecta;
- reasignacion masiva;
- auditoria individual.
