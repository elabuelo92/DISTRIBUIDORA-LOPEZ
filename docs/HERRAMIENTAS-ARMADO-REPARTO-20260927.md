# Herramientas de Armado y Reparto

Implementado localmente, pendiente de despliegue.

Cada modulo abre un menu de cuadros. Solo se muestra la herramienta seleccionada; el boton Herramientas y el selector permiten cambiar de area. El boton general Volver regresa primero al menu del modulo.

Armado: pedidos y etiquetas, control de armado, resumen del deposito.

Reparto: planificacion, entregas y cobros, hojas de ruta y rendicion, cierres y cobros, auditoria, configuracion y equipo. Cada rol ve solamente sus accesos permitidos. Elegir una ruta abre sus entregas. El escaner de Armado funciona dentro de Control de armado.

Los controles existentes se conservan: cambiar de herramienta no descarga datos ni reinicia formularios, filtros o seleccion de pedidos. No se agregan endpoints ni temporizadores. El mapa solo se dibuja cuando corresponde a la herramienta de entregas.

Validacion: scripts/smoke-operational-tools-ui.js, con Playwright y Chrome sobre una demo local de 100 pedidos. Comprueba seis accesos de administrador, tres de repartidor, tres de armado, un solo panel visible, permisos, filtros, seleccion de pedidos, continuidad tras renderizado, apertura de ruta, Volver, ausencia de errores de JavaScript y desborde horizontal a 390 px. Capturas revisadas a 1440 px y 390 px.

No se modificaron datos ni codigo del servidor productivo para esta revision visual.
