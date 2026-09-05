# Prompt 135 - Descuentos ligados al producto

Version: `8790-131`

## Causa raiz

La aprobacion comercial comparaba cada linea por codigo **o** por nombre. Cuando dos productos compartian nombre, una solicitud que incluia el codigo correcto tambien podia alcanzar otra linea por coincidencia de nombre.

## Correccion

- Las solicitudes nuevas por producto guardan `targetLineKey` con prioridad absoluta al codigo.
- El backend comprueba que el producto solicitado pertenece al pedido y que existe una unica coincidencia.
- Una solicitud historica sin codigo solo puede resolverse por nombre cuando la coincidencia es unica.
- Una edicion no puede retirar el producto que tiene una solicitud comercial pendiente.
- Reordenar productos no cambia el destinatario del descuento.
- La auditoria de aprobacion conserva la unica linea modificada, valores anteriores y posteriores.

## Prueba

Ejecutar:

```powershell
npm.cmd run test:discount-binding
```

La prueba utiliza dos productos con el mismo nombre y codigos diferentes, reordena el pedido y confirma que solamente cambia el producto solicitado.

## Auditoria previa de produccion

- Solicitudes comerciales: 20.
- Pendientes: 7.
- Aprobadas: 8.
- Ligadas a producto: 18.
- Solicitudes sin codigo de producto: 0.
- Coincidencias multiples detectadas: 0.
- Pedidos aprobados con diferencia entre total y suma de lineas: 0.

No se modificaron pedidos historicos durante el diagnostico.
