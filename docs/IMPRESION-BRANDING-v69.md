# Impresion inteligente y branding institucional - v69

Fecha: 2026-07-27

## Objetivo

Incorporar una hoja de armado clara para deposito y una presencia institucional discreta de Grupo Rocha Solutions dentro del sistema.

## Impresion para Armado

La solapa Pedidos ahora emite una hoja por pedido, tanto individual como masiva.

Incluye:

- Pedido destacado como `PEDIDO Nro`.
- Bultos o bolsas en recuadro visible.
- Cliente, direccion, localidad, fecha, hora, vendedor y condicion.
- Estado operativo del pedido.
- Detalle en el orden original de carga.
- Columnas: codigo, cantidad, descripcion, precio unitario, importe y control.
- Columna `CONTROL` vacia para marcado manual del armador.
- Resumen de articulos, unidades, bultos y total.
- Codigo visual de recuperacion con pedido, cliente e ID interno.
- Pie institucional del documento.

## Configuracion administrativa

Desde Pedidos, Administracion puede abrir `Configuracion de impresion de Armado` y definir:

- Mostrar u ocultar precios.
- Mostrar u ocultar importes.
- Mostrar u ocultar codigo interno.
- Mostrar u ocultar observaciones.
- Mostrar u ocultar QR / codigo de recuperacion.
- Mostrar u ocultar logo del cliente.
- Tamano de fuente.
- Colores para productos promocionales, fragiles, refrigerados y especiales.

Los cambios quedan auditados en Auditoria Global.

## Auditoria de impresion

Cada impresion registra:

- Usuario.
- Fecha.
- Hora.
- Pedido.
- Cliente.
- Cantidad de impresiones.
- Si fue reimpresion.
- Motivo de reimpresion.
- Configuracion aplicada.

La auditoria se guarda en `printAudit` y tambien deja evento en `globalAudit`.

## Branding Grupo Rocha Solutions

Se agrego presencia institucional discreta en:

- Login.
- Pie de pagina general.
- Centro de ayuda.
- Acerca del sistema.
- PDFs y reportes generados por el sistema.
- Hoja de armado impresa.

Texto principal:

`Sistema desarrollado por Grupo Rocha Solutions`

Leyenda tecnica:

`Desarrollado con tecnologia de Grupo Rocha Solutions`

`Transformando procesos empresariales mediante software, automatizacion e inteligencia aplicada.`

`Powered by Grupo Rocha Solutions`

## Logo institucional

Como no se adjunto un archivo oficial de logo de Grupo Rocha Solutions, v69 usa un monograma sobrio `GRS` generado con CSS.

Cuando este disponible el logo oficial, reemplazar el monograma por un archivo en `icons/` y ajustar la clase `.developer-mark` o el HTML de login/acerca.

## Pruebas sugeridas

1. Entrar como `admin1`.
2. Abrir Pedidos.
3. Seleccionar uno o varios pedidos listos para armado.
4. Ejecutar `Imprimir para Armado`.
5. Confirmar que cada pedido empieza en una hoja nueva.
6. Verificar pedido grande, bultos, detalle, control y pie institucional.
7. Abrir Acerca del sistema y Ayuda.
8. Exportar un PDF desde Stock o Auditoria y verificar el pie institucional.

## Version

Version del sistema: `8790-69`

