# Checklist de incidencias y aceptacion

Actualizado: 12/10/2026. Documento de control en curso, no certificado de cierre.
No marcar como aprobado lo que no se haya ejecutado. Completar operador, fecha,
version, evidencia y resultado para cada prueba manual.

## Estado por item

| Item | Estado | Evidencia / pendiente |
| --- | --- | --- |
| GPS corregido conserva ubicacion nueva | Produccion 824ece7; validacion tecnica | Falta comprobar cliente real autorizado en app y mapa |
| Pago mixto no borra importes | Produccion b7bca43; validacion tecnica | Falta formulario autenticado; no realizar cobros ficticios en produccion |
| Excel de cobros con letra mayor | Implementado localmente | 13 pt, filas ajustadas, importes numericos; falta vista impresa y despliegue |
| Manifiesto limitado a ruta seleccionada | Prueba automatica aprobada | Comparar archivo real con ruta y cierre |
| Cobro de 100000 no asentado | Pendiente de diagnostico del registro | Faltan numero de pedido o Excel original |
| Efectivo y transferencia duplicados | Pendiente de diagnostico del registro | Contrastar movimientos y comprobante; no borrar ni recalcular historicos |
| Rechazo de pedido despachado / devolucion 3601 | Pendiente | Verificar retorno fisico y stock una sola vez |
| Correccion administrativa de cobranza cerrada | Pendiente | Definir autorizacion, motivo y asiento de ajuste auditable |
| Varios comprobantes por pedido | Pendiente | Importe, validacion y conciliacion independientes |
| Propuesta GPS desde repartidor | Pendiente | Requiere aprobacion administrativa |

## Reglas de prueba

- Usar datos ficticios solo en entorno aislado para crear, cobrar, devolver y cerrar.
- En produccion, consultar registros existentes o acompanar una operacion real
  autorizada. No generar ventas, cobros ni devoluciones de prueba.
- Antes de desplegar: respaldo verificado, artefacto aislado y pruebas aprobadas.
- Comparar cantidades e importes antes/despues; ninguna alteracion inesperada.
- Ante una diferencia, detener el cierre del item y registrar evidencia, sin
  repetir cobros ni restaurar datos completos sobre operaciones nuevas.

## GPS

- [ ] Registrar ID del cliente y coordenadas anteriores.
- [ ] Solicitar correccion y comprobar bloqueo de nuevas ventas en Preventa.
- [ ] Capturar ubicacion nueva; comprobar estado pendiente de validacion.
- [ ] Administracion compara coordenadas anteriores/nuevas en mapa y aprueba.
- [ ] Reabrir cliente y mapa desde otra sesion: debe verse la ubicacion aprobada.
- [ ] Verificar que paradas abiertas usen la ubicacion vigente.
- [ ] Verificar que entregas cerradas conserven su evidencia historica.
- [ ] Rechazar una propuesta en demo: no debe habilitar ventas ni reemplazar GPS.

## Cobranza mixta: en demo

- [ ] Pedido 250000: ingresar efectivo 100000; deuda esperada 150000.
- [ ] Pulsar Pago mixto manual dos veces: efectivo sigue en 100000.
- [ ] Agregar transferencia 50000: deuda comercial esperada 100000.
- [ ] Guardar y reabrir: efectivo 100000, transferencia 50000 y credito 100000.
- [ ] Antes de validar transferencia, verificar su estado pendiente: no confundir
  deuda comercial con saldo contable aun pendiente de conciliacion.
- [ ] Validar transferencia una vez: saldo final esperado 100000.
- [ ] Repetir validacion: no debe duplicar el ingreso.
- [ ] Cambiar a Todo transferencia antes de guardar: efectivo debe quedar cero.
- [ ] Cambiar a Todo efectivo: transferencia debe quedar cero.
- [ ] Simular reintento de cobro: no duplicar recibo, saldo ni movimiento de caja.
- [ ] Pago 1100 sobre total 1000: saldo a favor 100, identificado claramente.

## Excel y rendicion

- [ ] Exportar ruta A con dos pedidos; ruta B debe quedar excluida.
- [ ] Incluir cobro de ruta A realizado otro dia; no perderlo por filtro diario.
- [ ] Conciliar cliente, pedido, efectivo, transferencia, banco, CC y saldo a favor.
- [ ] Comprobar totales contra cobros guardados, no solo contra captura de pantalla.
- [ ] Verificar letra 13 pt en encabezados y filas del Excel nuevo.
- [ ] Probar nombres largos y banco largo: texto completo, sin solapamientos.
- [ ] Revisar vista de impresion A4 horizontal con 20, 50 y 100 filas.
- [ ] Verificar encabezados repetidos y legibilidad en la escala elegida; no forzar
  todas las filas a una sola pagina.
- [ ] Comparar PDF y Excel: mismos pedidos e importes (el aumento de letra es Excel).
- [ ] Rendicion sin cerrar identificada como provisoria.
- [ ] Con gasto real de gasoil 70000, verificar efectivo esperado menos gasto.
- [ ] Diferencia mayor a 1000 exige autorizacion administrativa en demo.

## Control posterior al despliegue

- [ ] Version/commit y archivos publicos coinciden con artefacto probado.
- [ ] Salud, licencia e integridad OK; mantenimiento desactivado.
- [ ] Ingreso administrador, vendedor y repartidor verificado.
- [ ] Pedidos, precios, stock, saldos y usuarios sin diferencias inesperadas.
- [ ] Abrir los modulos afectados y medir tiempos; sin errores de consola/API.
- [ ] Recargar la app sin formularios pendientes para obtener el codigo nuevo.
- [ ] Guardar evidencia y firma de conformidad del operador.

## Registro

| Prueba | Fecha/hora | Operador | Version | Resultado | Evidencia |
| --- | --- | --- | --- | --- | --- |
| Validacion funcional autenticada | Pendiente | | | | |
| Impresion Excel | Pendiente | | | | |
| Cobros historicos reportados | Pendiente | | | | |

No se considera cerrado el conjunto mientras existan cobros sin conciliar o
pruebas criticas pendientes. El checklist se actualiza con cada bloque, y su
version final se entrega al completar las implementaciones.
