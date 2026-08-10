# v59 - Entidades mixtas y base de aprendizaje de rutas

Fecha de corte: 2026-07-21

## Objetivo de la version

Cerrar el soporte operativo para empresas que pueden actuar como cliente y proveedor, sin mezclar cuentas corrientes, ventas ni compras.

Tambien se deja preparada la base de datos operativa para aprendizaje futuro de rutas, respetando la decision de mantener una primera version estable y dejar automatizaciones avanzadas para Fase 2.

## Prompt 52 - Clientes que tambien son proveedores

Implementado en v59:

- Una misma entidad puede existir como Cliente y Proveedor.
- La relacion se detecta automaticamente por CUIT.
- Si no hay CUIT, se usa razon social / nombre normalizado como respaldo.
- Se comparten datos generales:
  - CUIT
  - domicilio
  - telefono
  - email
  - razon social
- No se mezclan datos operativos:
  - cuenta corriente de cliente
  - cuenta corriente de proveedor
  - ventas
  - compras
- En Clientes y Proveedores aparece la accion "Ficha mixta" cuando corresponde.
- La ficha mixta muestra:
  - datos generales compartidos
  - relacion cliente
  - relacion proveedor
  - saldo cliente
  - saldo proveedor
  - ventas registradas
  - compras registradas
  - movimientos recientes

Regla de proteccion:

Si ambos lados ya tienen datos cargados, el sistema no los pisa automaticamente. Solo completa campos faltantes usando la otra ficha.

## Prompt 53 - Aprendizaje automatico de rutas

Implementado como base tecnica en v59:

- Cada parada gestionada desde Reparto puede registrar:
  - cliente
  - pedido
  - ruta
  - dispositivo
  - usuario
  - GPS real recibido desde el dispositivo
  - fecha
  - hora
  - duracion
  - secuencia
  - resultado final
- El sistema acumula estadisticas por cliente:
  - cantidad de visitas
  - visitas completadas
  - incidencias
  - duracion promedio
  - secuencia promedio
  - horarios habituales
  - tasa de exito

Esto no reemplaza todavia el criterio administrativo de armado de ruta.

## Backlog Fase 2

Queda documentado para una segunda etapa, sin comprometer la estabilidad de la primera version:

- WhatsApp automatico.
- Optimizacion inteligente de rutas.
- Escaneo QR desde celular.
- Conciliacion bancaria automatica.
- Integracion con Google Workspace.
- OCR para leer remitos y comprobantes.
- IA para sugerir reposiciones.
- IA para optimizar rutas.
- IA para detectar anomalias comerciales, logisticas o financieras.

## Criterio recomendado

La primera version debe priorizar estabilidad, trazabilidad y operacion diaria.

Las automatizaciones avanzadas se incorporaran sobre los datos ya registrados por el sistema, sin redisenar la arquitectura.
