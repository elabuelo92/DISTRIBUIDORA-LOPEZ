# Version 8790-128 - Planificacion rapida y scanner

## Alcance

Esta version implementa los bloques 129-B y 129-C sin cambiar el circuito de estados de pedidos.

## Planificacion rapida

- Tabla compacta, una fila por pedido.
- Busqueda por pedido, cliente, direccion, telefono, zona y vendedor.
- Filtros rapidos: todos, sin asignar, con ruta, sin GPS, con horario y urgentes.
- Filtros combinables por zona y vendedor.
- Seleccion individual, total o de todos los resultados filtrados.
- Asignacion de muchos pedidos mediante una sola operacion atomica.
- Panel lateral con rutas abiertas del dia y sus pedidos, bultos y repartidor.
- Ordenamiento por ruta, zona, prioridad, horario, cliente o estado.
- Atajos: `Ctrl/Cmd+A` selecciona resultados operables y `Escape` limpia la seleccion.
- El mapa se carga bajo demanda para Administracion y no bloquea la tabla.
- La ultima ruta creada puede deshacerse mientras siga Planificada. Una ruta publicada o iniciada no se puede revertir.

## Scanner rapido

- Campo persistente en Armado / Deposito.
- Captura HID por teclado con finalizacion por Enter.
- El scanner no usa el debounce del buscador de texto.
- Indices `Map` de coincidencia exacta para etiquetas y codigos de producto.
- Una etiqueta valida se envia inmediatamente al control operativo existente.
- Un producto encontrado muestra cantidad de pedidos activos y resalta el primero.
- Escanear productos no modifica cantidades comerciales ni salta estados de trazabilidad.
- El contador de lecturas repetidas es solo feedback operativo local.

## Validacion

```powershell
npm.cmd run test:planner-scanner
npm.cmd run test:performance-100
npm.cmd run test:order-workflow
npm.cmd run test:cache-update
node --check app.js
node --check delivery-engine.js
node --check server.js
```

Resultados locales:

- 100 filas de planificacion simuladas.
- 22 pedidos seleccionados mediante filtro combinado en el escenario.
- 20 lecturas consecutivas verificadas.
- 20.000 busquedas exactas en menos de 4 ms en la corrida de cierre.
- Planificar y deshacer una ruta conserva los pedidos y elimina solamente la hoja no publicada.
- Benchmark API de 100 pedidos: planificar 198,2 ms, reordenar 188,0 ms y publicar 751,3 ms.
- Cache v128 con recarga automatica, `no-store` y `SKIP_WAITING` verificados.

## Despliegue pendiente

El cambio debe desplegarse en la ventana de produccion con el procedimiento documentado:

1. Backup de `data`.
2. Comparacion de integridad de pedidos.
3. `git pull` de `main`.
4. Regeneracion del manifiesto de integridad.
5. Reinicio controlado.
6. Verificacion de `/api/health`, login administrativo, Planificacion, Armado, licencia e integridad.
7. Prueba fisica de 20 lecturas con la pistola real antes de declarar cerrado 129-C.

Estado al cerrar desarrollo local: **Implementado localmente, pendiente de despliegue**.
