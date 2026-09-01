# Implementacion v124 - Listados progresivos

## Objetivo

Reducir el desplazamiento vertical de los modulos internos sin ocultar informacion, alterar filtros ni cargar nuevamente datos ya disponibles.

## Comportamiento

- Pedidos y Clientes utilizan paginas de 10 registros.
- Las demas tablas y listas muestran inicialmente 6 registros.
- `Siguiente bloque` agrega hasta 10 registros por vez.
- `Plegar` vuelve a los primeros 6 registros.
- Al cambiar una busqueda o filtro, el listado vuelve al bloque inicial.
- Armado selecciona e invierte solamente los pedidos realmente visibles.
- Los listados con 6 registros o menos no muestran controles adicionales.

## Modulos cubiertos

Armado, Carteras, Cuentas, Stock, Precios, Comisiones, Control fisico, Proveedores, Estadisticas, Diagnostico, Monitor, Legal, Usuarios, Administracion y listados operativos de Reparto.

## Verificacion

- Prueba unitaria de progresion: 6, 16, 26 y sucesivos bloques hasta el total.
- Validacion visual con 653 productos en escritorio.
- Validacion responsive y comprobacion de elementos ocultos sin altura.
- Los filtros, buscadores y acciones permanecen activos sobre el modulo correspondiente.
