# Release 8790-197: selector Rubro / Familia

Fecha: 2 de noviembre de 2026

## Alcance

- Reemplaza los dos campos de texto por un desplegable combinado Rubro / Familia.
- Las opciones se construyen a partir de combinaciones existentes del catalogo y se muestra la clasificacion actual del producto.
- El servidor vuelve a validar la combinacion y rechaza valores que no existan.
- El guardado confirma los valores persistidos antes de cerrar el formulario.
- La operacion modifica unicamente la clasificacion del producto y mantiene la auditoria y el control de concurrencia.

## Verificacion previa

- Prueba HTTP integrada aislada: aprobada.
- Combinacion inexistente: rechazada sin incrementar la version del estado.
- Combinacion disponible: persistida con coincidencia exacta.
- Stock, reservas, disponibilidad, costo, precios, pedidos, movimientos y comisiones liquidadas permanecen iguales en la prueba.
- `node --check app.js` y `node --check server.js`: aprobados.
- El despliegue se fija al estado productivo 8790-196 y exige fecha 2026-11-02 desde las 18:00 ART.

## Datos productivos

Esta correccion no requiere migracion ni edita clasificaciones existentes. El respaldo de datos y la comparacion de pedidos se realizan mediante el procedimiento controlado de despliegue.
