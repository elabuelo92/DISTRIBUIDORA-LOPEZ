# Reimpresion de etiquetas guardadas

Estado: implementado localmente, pendiente de despliegue. No modifica datos productivos hasta un despliegue posterior autorizado.

Cuando un pedido tiene etiqueta generada, las vistas Pedidos y Deposito muestran `Reimprimir`, aunque el servidor no la haya marcado como impresa. El modal tambien ofrece esa opcion. Puede usarse tantas veces como sea necesario: abre la impresion 100 x 60 mm con los codigos de bulto guardados, sin `POST`, sin timeout HTTP, sin regenerar IDs, sin cambiar estado ni borrar escaneos.

Si los codigos guardados estan incompletos, se avisa y no se imprime una mezcla de codigos. Para etiquetas historicas sin lista de codigos se aplica el codigo deterministico de bulto del motor actual (`PED...B1`, `PED...B2`). Si el navegador bloquea ventanas emergentes, se muestra el aviso actual de impresion.

La generacion del pedido ahora espera hasta 60 s; las otras acciones operativas esperan hasta 45 s. Los timeouts de consultas/health mantienen su configuracion independiente. La ventana de impresion se abre antes de la peticion para evitar bloqueos del navegador. Cada intento lleva un `operationId` persistido en la etiqueta. Si la respuesta se corta, se consulta solamente el estado de esa etiqueta, hasta tres veces; no se reenvia el `POST`. El modal ofrece `Verificar etiqueta` si sigue sin poder confirmarse. Un `POST` repetido con la misma operacion o los mismos datos devuelve la etiqueta existente sin mutar el pedido. Para cambiar datos de una etiqueta ya generada se pide confirmacion explicita.

Contingencia para deposito:

1. Si falla `Generar e imprimir`, no repetir la generacion mientras el estado sea incierto. Usar `Verificar etiqueta`.
2. Si aparece como guardada, usar `Reimprimir` las veces necesarias. La reimpresion no espera al servidor.
3. Si hay popup bloqueado, habilitar ventanas emergentes para este sitio y volver a usar `Reimprimir`.
   Si el servidor esta temporalmente fuera de linea pero el pedido ya figura cargado en la pagina abierta, no refrescar: la reimpresion de esa etiqueta es local.
4. Si los codigos de bulto guardados estan incompletos, no imprimir otra etiqueta distinta sin revisar el pedido.
5. Confirmar fisicamente las hojas y el escaneo de cada bulto; `printed` significa solicitud de impresion, no prueba de papel emitido.

Pruebas locales: `npm.cmd run test:label-reprint`, `npm.cmd run test:label-reprint-api`, `npm.cmd run test:print-label`, `npm.cmd run test:order-workflow`, `npm.cmd run test:order-dispatch-protection` y `npm.cmd run test:operational-reliability`. El monitor local paso `test:monitor-safety`; `test:monitor-linux` quedo sin ejecutar porque WSL Bash devolvio acceso denegado. Antes del despliegue verificar manualmente: pedido sin etiqueta (sin boton), etiqueta generada con dos bultos (reimprimir varias veces con mismos codigos), pedido escaneado (escaneos conservados), respuesta de servidor tardia, popup bloqueado y Safari/Chrome con papel 100 x 60 mm.
