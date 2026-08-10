# Preventa movil por plantillas v71

Fecha: 2026-07-28

Version: 8790-71

## Objetivo

Ordenar el frente de Preventa movil con menos informacion simultanea y mas foco operativo.

## Se mantiene

- Boton **Volver** dentro de la app.
- Proteccion del boton nativo de Android para que no cierre la APK.
- Mismo motor de pedidos, clientes, GPS, stock y sincronizacion.

## Se revierte

- Se retira la tarjeta pesada de "Unidad de negocio activa".
- Se elimina la guia visual extensa de siguiente accion.

## Nueva organizacion

La pantalla de Preventa queda dividida en tres plantillas:

1. **Pedido**
   - seleccion de cliente cargado
   - cuenta corriente resumida
   - carga de articulos
   - carrito
   - envio del pedido

2. **Cliente nuevo**
   - alta de cliente
   - telefono obligatorio
   - direccion obligatoria
   - ubicacion GPS obligatoria

3. **Estado**
   - objetivo diario
   - GPS
   - sincronizacion
   - hoja de ruta
   - visitas sin compra

## Resultado esperado

El vendedor ve menos informacion por pantalla y opera por contexto. La carga del pedido no queda mezclada con el alta de cliente ni con el estado general de la app.
