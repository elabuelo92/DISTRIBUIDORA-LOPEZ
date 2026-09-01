# Implementacion v125 - Horarios moviles y etiqueta Mac

## Alcance

- Preventa movil muestra junto al dia de visita cuatro campos visibles: manana desde/hasta y tarde desde/hasta.
- Los rangos se guardan en `horarios_atencion` para el dia comercial seleccionado.
- Se mantienen la observacion de horario y la compatibilidad con horarios historicos.
- La etiqueta usa pagina fisica exacta de 100 x 60 mm en Safari/macOS.
- El codigo Code 39 ocupa el ancho util, sin texto deformado dentro del SVG, con barras nitidas y codigo legible debajo.

## Configuracion de impresion en macOS

1. Seleccionar la impresora Xprinter.
2. Elegir el papel personalizado `100 x 60 mm`.
3. Orientacion horizontal.
4. Escala 100%.
5. Desactivar encabezados y pies de pagina.
6. Imprimir una etiqueta de prueba y validar el codigo con la pistola antes de una tanda.

No usar `Ajustar al tamano del papel`: el documento ya sale en 100 x 60 mm y esa opcion puede volver a reducirlo.

## Validacion

- `npm.cmd run test:client-hours`
- `npm.cmd run test:print-label`
- `node --check app.js`
- Prueba visual movil y etiqueta 100 x 60 mm.
