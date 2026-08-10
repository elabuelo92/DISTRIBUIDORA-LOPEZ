# Distribuidora Lopez - v44 Organizacion y Performance

Fecha: 2026-07-05

## Objetivo

Cerrar los Prompts 17 y 18:

- ubicar pedidos rapidamente por cliente, numero, direccion, zona, vendedor y estado;
- ordenar pedidos para armado, etiquetado, despacho y rutas;
- agrupar la planificacion de reparto por ruta;
- reducir renderizados innecesarios en pantallas grandes;
- dejar una auditoria tecnica de performance para el siguiente corte.

## Problemas detectados

1. Pedidos tenia buscador, pero no encontraba direccion, zona, ruta ni horario de atencion.
2. El listado de Pedidos renderizaba todos los registros filtrados en una sola tabla.
3. El filtro de estado era exacto, pero no habia filtros operativos como "No entregados" o "Listos para despacho".
4. El planificador de reparto mostraba todos los pedidos listos en una lista plana.
5. Las busquedas ejecutaban render en cada tecla, especialmente en Dashboard, Pedidos, Clientes, Stock, Proveedores, Cuentas y Auditoria.
6. La sincronizacion GPS ya tenia control por distancia e intervalo; se mantuvo para evitar duplicados y llamadas repetidas.
7. No existe base SQL en esta version local: el sistema usa estado JSON sincronizado por servidor. Por eso no corresponde agregar indices de base todavia; la optimizacion se aplico en renderizado y filtros.

## Correcciones aplicadas

### Pedidos y deposito

- Buscador ampliado para:
  - numero de pedido;
  - cliente;
  - vendedor;
  - productos;
  - direccion;
  - zona;
  - ruta;
  - horario;
  - estado;
  - datos fiscales basicos del cliente.
- Nuevo filtro operativo:
  - Pendientes;
  - En preparacion;
  - Armados;
  - Etiquetados;
  - Listos para despacho;
  - En reparto;
  - Entregados;
  - No entregados.
- Nuevo ordenamiento:
  - mas nuevos primero;
  - prioridad;
  - zona;
  - ruta;
  - horario de entrega;
  - cliente;
  - estado.
- Paginacion del listado de pedidos: 25 filas por pagina.
- La tabla ahora muestra direccion, zona, ruta y horario dentro de cada pedido.

### Armado y despacho

- El ordenamiento de Pedidos sirve para preparar armado por zona, ruta, prioridad, horario, cliente o estado.
- Se conserva la logica previa de etiqueta, escaneo y listo para despacho.

### Reparto

- El planificador de rutas ahora permite ordenar por:
  - ruta;
  - zona;
  - prioridad;
  - horario de entrega;
  - cliente;
  - estado.
- Se agrego agrupacion visual por ruta.
- Los pedidos sin domicilio o GPS valido se muestran bloqueados para que administracion los corrija antes de publicar la ruta.
- El resumen del planificador muestra:
  - pedidos listos para despacho;
  - seleccionados;
  - monto total seleccionado;
  - rutas detectadas;
  - pedidos con domicilio pendiente.

### Performance

- Se agrego debounce de 180 ms en busquedas de:
  - buscador global;
  - Pedidos;
  - Clientes;
  - Cuentas corrientes;
  - Stock;
  - Proveedores;
  - Auditoria;
  - Centro de notificaciones.
- Se evita redibujar la tabla completa de Pedidos en cada tecla.
- Pedidos renderiza solo la pagina visible.
- El cache del service worker y los assets se subieron a v44 para evitar que celulares o navegador mantengan JS/CSS viejo.

## Mejora esperada

- Pedidos grandes: baja fuerte del costo de renderizado porque se dibujan 25 filas por pagina, no todo el resultado.
- Busqueda: menor bloqueo visual al escribir por debounce.
- Planificacion de reparto: menor tiempo operativo para armar ruta porque los pedidos se agrupan por ruta y se ordenan por criterios logisticos.
- Soporte: menos casos donde el usuario "no encuentra" un pedido por buscar direccion, zona u horario.

## Pruebas realizadas

### Antes

Comportamiento detectado en codigo v43:

- Pedidos filtraba por texto, estado exacto, vendedor y urgencia.
- Pedidos no tenia paginacion.
- Planificador de reparto ordenaba basicamente por zona y fecha.
- Busquedas ejecutaban render inmediato por cada input.

### Despues

Pruebas locales ejecutadas:

- `node --check SERVIDOR_UNICO_8790/app.js`: OK.
- `node --check SERVIDOR_UNICO_8790/server.js`: OK.
- `powershell.exe -ExecutionPolicy Bypass -File SERVIDOR_UNICO_8790/scripts/smoke-v44.ps1 -Port 8896`: OK.
- `powershell.exe -ExecutionPolicy Bypass -File release/DLPreventaServer-UNICO-8790-2026-07-05-v44-ORGANIZACION-PERFORMANCE/scripts/smoke-v44.ps1 -Port 8897`: OK.
- Verificacion de cache-buster v44 en HTML, JS y service worker: OK.
- Verificacion estatica de nuevos controles:
  - `ordersQuickFilter`;
  - `ordersSort`;
  - `ordersPager`;
  - `deliveryPlannerSort`;
  - `deliveryPlannerGroupRoute`.

## Pendiente recomendado para v45

- Medicion con navegador real usando una base grande simulada de 1.000, 5.000 y 10.000 pedidos.
- Paginacion tambien en Clientes, Cuentas y Auditoria si la base real supera algunos miles de registros.
- Cuando se migre a ERPNext o SQL, agregar indices reales para:
  - numero de pedido;
  - cliente;
  - vendedor;
  - estado;
  - zona;
  - ruta;
  - fecha de creacion;
  - fecha de entrega.
