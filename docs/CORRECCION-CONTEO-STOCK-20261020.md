# Correccion de persistencia de conteos - 20/10/2026

Estado: implementado y probado localmente. NO desplegado.
Paquete preparado: 8790-176. Publicacion autorizada por el usuario.
Base: ea88189 / P6 8790-175. Sin modificacion de datos ni sesiones reales.

## Problema observado

La captura indica "Producto o conteo no encontrado. Actualizar antes de ajustar".
El flujo anterior mostraba el conteo local y llamaba saveState sin esperar
confirmacion; el ajuste consultaba el conteo en el servidor. Ademas, un envio
de sincronizacion en curso podia hacer que el siguiente envio se omitiera.
Esto explica una via reproducible de desajuste entre pantalla y servidor;
no acredita cual fue el fallo de red/sincronizacion de la computadora original.

## Correccion

- Reutiliza POST /api/stock/entry con action recordCount; no nuevo endpoint.
- Conteo persistido y auditado por servidor, sin mover stock.
- Codigo exacto y unico; cantidades enteras no negativas; stock esperado validado.
- Identificador estable en reintentos por perdida de respuesta; no duplicacion.
- Ajustar solo disponible sin borrador y con confirmacion serverRecorded.
- Un conteo distinto al que se abrio en el dialogo exige cerrar y revisar.
- Borradores conservados en memoria al fallar y durante rerenders.
  No sobreviven cerrar/recargar el navegador; el aviso lo indica.
- Conteos y ajustes no se sobrescriben por POST generico de estado.
- Clave administrativa y protecciones de reservas/stock vigente conservadas.
- Operaciones de conteo/ajuste trabajan sobre copia aislada antes de persistir.

## Pruebas aprobadas

- smoke-physical-count-persistence.js: guardar sin modificar stock, reintento,
  respuesta perdida, doble clic, borrador retenido, stock desactualizado,
  identidad/cantidad invalida y ajuste unico.
- smoke-stock-reconciliation.js: diferencias, reservas, motivos y lote ficticio
  de 100 productos (10.1 ms de motor, no benchmark de produccion).
- smoke-order-workflow-v114.js: HTTP con servidor temporal y datos ficticios,
  conteos y ajustes concurrentes, permiso administrativo, clave incorrecta,
  proteccion contra borrado de conteos por sincronizacion general,
  reservas y pedidos preservados, regresion de armado y carga inicial.
- Sintaxis y diff sin errores.

El primer arranque HTTP en sandbox no respondio; fuera del sandbox la prueba
aislada paso. No se consulto ni se escribio produccion.

Revision previa al despliegue: repeticion de las tres suites y cache/version
aprobadas. La demo aislada inicio, pero el navegador integrado no pudo adjuntar
la pestaña (timeout); revision visual pendiente. La demo se detuvo sin tocar
sesiones productivas. Inspeccion productiva de solo lectura: servicio sano,
8790-175, ocho sesiones abiertas.

## Antes de publicar

- Revision visual integrada de Guardar, borrador, confirmacion y Autorizar.
- Actualizar version/cache; respaldo y despliegue en ventana autorizada.
- Comprobar datos identicos e integridad despues del reinicio.
- Conteos antiguos no confirmados deben guardarse y revisarse de nuevo.
  No recuperar ni aplicar automaticamente los valores de la captura (310/37).
