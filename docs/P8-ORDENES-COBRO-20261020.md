# P8 - Ordenes de cobro separadas

Estado: integracion local completada para 8790-177; despliegue autorizado en curso. Confirmacion final en DESPLIEGUE-P7-P8-20261020.md.

Actualizacion: API autenticada, paginacion, alta/asignacion/cobro/finalizacion, comprobantes, submodulo Reparto, manifiestos y proteccion de cierre integrados. Prueba HTTP concurrente y manifiestos aprobada. Demo movil verificada con alta y cobro ficticios. Cada orden se asigna a una ruta existente; no se crea una venta ficticia. El mapa se abre con el GPS actual del cliente mediante Ir.

## Alcance implementado

- Entidad collectionVisits separada de orders, sin producto ficticio.
- Alta administrativa por ID de cliente con saldo; importe numerico positivo y limite por saldo ya comprometido en otras visitas.
- Asignacion a ruta abierta o bolsa, con historial; reasignacion solo sin pagos.
- Consulta del GPS actual del cliente, sin modificar coordenadas.
- Cobro parcial efectivo/transferencia; reutiliza account-engine.
- Efectivo impacta cuenta corriente y efectivo de ruta. Transferencia queda pendiente hasta validacion bancaria.
- Estado consultado desde conciliacion vigente: Pendiente, Parcial, Pendiente de validacion, Cobrada, No cobrada.
- No cobrada exige motivo y no acepta visitas con pagos previos.
- Reintento con mismo identificador no duplica movimientos; con contenido distinto se rechaza. Ruta cerrada no recibe nuevos cobros.
- Repartidor debe coincidir con usuario y dispositivo asignados; Administracion conserva acceso.
- Comprobante observado sigue pendiente de validacion y no libera automaticamente el importe para cobrarlo otra vez.

## Correcciones al prototipo anterior

1. Estado de visita consultado tras validacion bancaria, no solo snapshot previo.
2. Idempotencia incluye banco y conserva ruta inicial para reintentos del alta.
3. Validacion estricta de tipos numericos, importes finitos y decimales.
4. Nombres ambiguos bloqueados porque el motor contable existente resuelve la cuenta por nombre.
5. Limite de visitas pendientes para no planificar el mismo saldo varias veces.
6. Asignacion, no cobro y GPS actual agregados; importes comparados redondeados a centavos.

## Prueba aprobada

Saldo 1000, orden 900, efectivo 400 y transferencia 500: saldo 600 hasta validar y 100 luego de validar. Revalidar o reenviar no duplica el pago. Caja de ruta recibe 400; pedidos, productos y comisiones permanecen identicos.

## Lista de integracion revisada

- API autenticada y auditada con persistencia atomica, proyeccion por rol y proteccion ante sincronizacion general.
- Submodulo administrativo para crear/asignar; bandeja de reparto con GPS y cobros, sin mezclar con pedidos de venta.
- Comprobantes por el circuito de carga existente; el motor no es frontera de seguridad para URLs o archivos.
- Inclusiones separadas en manifiesto y cierre: nunca presentarlas como entregas ni generar comisiones.
- Resolver pendientes antes del cierre de ruta y probar ruta sin pedidos, solo visitas de cobro.
- HTTP, concurrencia real, pruebas de navegador y recorrido completo con validacion bancaria.

Los puntos anteriores se comprobaron en el circuito integrado local (ver smoke-p8-http.js y smoke-p8-manifests.js). Para transferencias observadas se conserva la deuda y el importe por validar, sin habilitar recobro automatico; se regularizan por Conciliacion. No se agregaron correcciones de cobros cerrados de P9.
