# Cartera completa para vendedores - v149

## Problema y cambio

La proyeccion de estado del servidor limitaba `clients` al vendedor autenticado. La opcion Fuera de ruta no podia mostrar clientes de otros vendedores o sin asignacion aunque la sincronizacion terminara correctamente. Ademas, el filtro de esa opcion excluia clientes de la ruta del dia.

Todos los vendedores reciben ahora el catalogo completo. Fuera de ruta muestra todos los clientes activos, incluidos los de hoy, otros vendedores y sin asignacion. Mi cartera y Mi ruta de hoy mantienen su comportamiento. Los clientes inactivos siguen excluidos del selector comercial. No se reasigna ningun cliente.

Los pedidos, pedidos archivados e historiales operativos siguen limitados al vendedor. Se conserva el limite de respuestas concurrentes de sincronizacion y el reintento periodico existente (15 segundos en movil, salvo configuracion distinta). La lista visual muestra resultados acotados y la busqueda recorre toda la cartera recibida.

## Validacion local

- Prueba de 3000 clientes activos, uno inactivo y tres vendedores, incluido uno sin asignaciones: cartera completa, busqueda del ultimo registro y aislamiento de pedidos.
- Prueba HTTP operativa: vendedor recibe tambien cliente de otro vendedor; pedidos idempotentes, PIN y operaciones existentes.
- Cartera y asignacion masiva; carteras comerciales y multiples dias.
- Concurrencia de sincronizacion: 12 solicitudes, proteccion de carga y salud disponible.
- Estabilidad de sesion y actualizacion de cache/version.

El primer arranque del test operativo excedio su espera; la repeticion aislada paso. El test de cache requirio actualizar sus expectativas a v149 y paso despues.

## Publicacion

Version de servidor, configuracion, HTML y service worker actualizadas a 8790-149. Desplegar con respaldo de datos, comparacion de pedidos, regeneracion de integridad y validacion de salud e ingresos autenticados.

Al comenzar la jornada, abrir la app con conexion y esperar sincronizacion; Fuera de ruta debe mostrar la cartera activa completa. No borrar datos locales como procedimiento de actualizacion.
