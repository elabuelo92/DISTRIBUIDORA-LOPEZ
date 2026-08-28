# Carteras y Rutas Comerciales - Version 118

Version: `8790-118`  
Fecha: 28/08/2026  
Prompts cubiertos: 114, 115, 116, 117, 118, 119, 120 y 121.

## Alcance

Esta fase agrega una capa de control administrativo sin reemplazar Clientes, Preventa ni Reparto.

- `Carteras` diagnostica la relacion cliente, vendedor titular, ruta comercial, zona, dias de visita y GPS.
- Preventa utiliza la misma regla centralizada para `Mi ruta de hoy`, `Mi cartera` y `Fuera de ruta`.
- La ruta comercial permanece separada de la ruta logistica de reparto.
- Los clientes inactivos no aparecen en la cartera del vendedor.
- El usuario creador del cliente no determina su pertenencia comercial.

## Control de cartera y administracion

El acceso `Administracion > Carteras` muestra:

- clientes correctos;
- advertencias por dia, ruta, zona, direccion o GPS faltante;
- errores por vendedor inexistente, inactivo o no asignado;
- posibles duplicados por CUIT, telefono o nombre mas direccion;
- clientes inactivos que conservan asignaciones.

El diagnostico es de solo lectura. No modifica ni fusiona datos silenciosamente.

La accion `Corregir seleccionados` deriva los clientes al formulario masivo existente en `Clientes`, que conserva motivo obligatorio y revalidacion de clave administrativa.

La grilla administrativa agrega filtros combinables por vendedor, dia, ruta, zona, estado, GPS, horario, periodo e inconsistencia. Muestra 50 clientes por pagina para no bloquear el navegador y mantiene la seleccion al cambiar de pagina. Las exportaciones siempre incluyen todo el resultado filtrado.

Las acciones masivas disponibles siguen usando el circuito protegido de Clientes:

- asignar vendedor;
- asignar zona;
- asignar ruta;
- asignar uno o varios dias;
- activar o inactivar;
- registrar motivo y validar clave administrativa.

## Varios dias y orden de visita

Cada cliente puede conservar uno o varios dias mediante `dias_visita`. El campo heredado `dia_visita` se mantiene por compatibilidad y no se elimina durante la migracion.

El orden administrativo se guarda por combinacion `ruta + dia` en `ordenes_visita`. Preventa respeta primero este orden y luego aplica la distancia GPS y el orden alfabetico. Esto no modifica ni reutiliza las hojas de reparto.

## Fuente oficial de Preventa

La visibilidad se resuelve con:

`cliente activo -> vendedor titular -> dias de visita -> ruta comercial`

- `Mi cartera`: cliente activo y vendedor titular igual al usuario autenticado.
- `Mi ruta de hoy`: lo anterior mas coincidencia con el dia actual.
- `Fuera de ruta`: conserva el circuito excepcional existente.

Las identidades admitidas del vendedor son usuario, nombre y `sellerName`, evitando que una diferencia entre login y nombre visible oculte clientes validos.

## Extractos y hoja comercial diaria

`Carteras` permite exportar la cartera filtrada en XLSX, PDF, CSV UTF-8 o impresion. Una fila representa un cliente y contiene datos comerciales, fiscales, contacto, vendedor, ruta, dias, orden, horario, GPS, estado y saldo.

La `Hoja de Ruta Comercial Diaria` se genera por vendedor, fecha, ruta y zona. Incluye orden, cliente, domicilio, horario, telefono, estado de jornada y acceso a Maps mediante coordenadas. Sus salidas son XLSX, PDF e impresion.

## Importacion homologada

`Descargar para edicion` genera una plantilla XLSX con `ID_Cliente` como identificador estable. `Importar cartera` ejecuta:

1. lectura y validacion;
2. vista previa de diferencias;
3. control de filas desconocidas o duplicadas;
4. motivo, clave y confirmacion administrativa;
5. backup automatico;
6. aplicacion y auditoria individual.

La importacion no crea clientes, no elimina registros, no homologa por nombre y no reemplaza coordenadas validas con celdas vacias.

## Pruebas

Ejecutar:

```powershell
npm.cmd run test:client-portfolio
npm.cmd run test:commercial-portfolios
```

La segunda prueba utiliza una base temporal y verifica:

- matriz de visibilidad para dos vendedores;
- dias simples, varios dias y formato heredado `2/7 LuVi`;
- exclusion de clientes inactivos;
- diagnostico de errores, advertencias y duplicados;
- endpoint exclusivo para Administracion;
- multiples dias persistidos sin duplicar clientes;
- orden administrativo por ruta y dia;
- importacion homologada por ID;
- preservacion de GPS cuando el Excel contiene celdas vacias;
- backup previo y cero modificaciones sobre la base productiva.

## Operacion recomendada

1. Abrir `Administracion > Carteras`.
2. Ejecutar `Actualizar control` antes de reasignaciones masivas.
3. Corregir primero errores rojos y luego advertencias amarillas.
4. Descargar una cartera filtrada para respaldo operativo.
5. Para cambios masivos, descargar la plantilla, editarla sin alterar `ID_Cliente`, importar y revisar la vista previa.
6. Confirmar solo cuando las diferencias sean las esperadas.

## Estado de entrega

Implementado localmente y validado con datos temporales. Pendiente de despliegue productivo controlado despues de las 18:00.
