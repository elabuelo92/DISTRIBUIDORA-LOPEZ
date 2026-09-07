# Checklist manual - Version 8790-138

Fecha: 06/09/2026

## Actualizacion y acceso

- [ ] Abrir el sistema normalmente y comprobar `Version instalada: 8790-138`.
- [ ] Cerrar y volver a abrir sin usar `Ctrl+F5`; debe continuar en 8790-138.

## Alta de clientes

- [ ] En Preventa movil abrir `Cliente nuevo` y comprobar `Referencia para ubicarlo (obligatoria)`.
- [ ] Intentar guardar sin referencia; el sistema debe impedirlo.
- [ ] Completar una referencia y guardar; debe conservarse en la ficha.
- [ ] En Administracion crear un cliente y repetir la misma validacion.

## Pedido movil y WhatsApp

- [ ] Crear un pedido desde Preventa.
- [ ] Confirmar que al guardarse quedan vacios cliente, producto, carrito, observaciones y solicitud comercial.
- [ ] Confirmar que aparece el resumen del ultimo pedido guardado.
- [ ] Pulsar `WhatsApp`; debe abrir el numero registrado del cliente con productos, cantidades, precios y total.
- [ ] Confirmar que no comparte costos, margenes, comisiones, stock ni notas internas.

## Armado y scanner

- [ ] Llevar un pedido hasta `Etiquetado`, con etiqueta y bultos confirmados.
- [ ] Marcar `Listo para despacho` sin escanear.
- [ ] Confirmar que el pedido avanza y muestra `Scanner opcional`.
- [ ] Abrir el scanner manualmente y comprobar que sigue disponible para controles posteriores.

## Reparto

- [ ] Abrir una hoja de ruta con varios pedidos; las paradas deben mostrarse en tabla compacta.
- [ ] Cambiar el orden con flechas, campo numerico y arrastrar/soltar.
- [ ] Recargar y confirmar que el orden queda guardado.
- [ ] Exportar `Manifiesto CSV` y `Manifiesto PDF`; ambos deben respetar filas y columnas.
- [ ] Registrar entrega y rechazo; no debe solicitar ni enviar firma.

## Exportaciones

- [ ] Clientes: exportar CSV y PDF tabular.
- [ ] Productos/cartera: exportar CSV y PDF tabular con listas actuales.
- [ ] Lista de precios seleccionada: exportar CSV y PDF tabular.
- [ ] Proveedores: exportar CSV y PDF tabular.

## Campos numericos

- [ ] En un campo numerico cuyo valor sea `0`, hacer foco; debe quedar vacio para escribir directamente.
- [ ] Confirmar que un valor distinto de cero no se borra al enfocarlo.

## Archivo operativo autorizado

- [ ] Pedidos activos: `0`.
- [ ] Rutas activas: `0`.
- [ ] Armado y Despacho no muestran pedidos anteriores.
- [ ] Stock fisico no cambia.
- [ ] Stock reservado queda en `0` y disponible coincide con fisico.
- [ ] Clientes, proveedores, reglas de comision y conciliaciones mantienen la misma cantidad.
- [ ] Historial del cliente conserva pedidos anteriores.
- [ ] Comisiones conservan pedidos e importes anteriores.
- [ ] El nuevo pedido usa un numero mayor al ultimo historico.

## Regresion basica

- [ ] Login administrativo.
- [ ] Login de preventista.
- [ ] Login de deposito.
- [ ] Login de reparto.
- [ ] Crear pedido, etiquetar, dejar listo, planificar y publicar ruta.
- [ ] Verificar `/api/health` y Monitor sin alertas nuevas.
