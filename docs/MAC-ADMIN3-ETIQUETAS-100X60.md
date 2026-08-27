# MacBook Air - admin3 - Etiquetas 100 x 60 mm

## Estado del sistema

- Usuario: `admin3`
- Nombre: Administracion 3
- Rol: administrador
- Estado: activo
- URL: `https://lopez.gruporochaapp.com`
- La etiqueta del sistema ya esta definida como `100 mm x 60 mm`, horizontal y sin margenes.

La configuracion de impresion pertenece a macOS y a la cola de la impresora. No se guarda dentro del usuario ERP.

## 1. Verificar el controlador

Abrir:

`Apple > Configuracion del Sistema > Impresoras y escaneres`

Seleccionar la impresora y revisar `Opciones y suministros`.

Debe figurar el controlador del modelo XPrinter instalado. Si figura `AirPrint` o `Generic PostScript Printer`, eliminar la cola y agregarla nuevamente eligiendo el controlador exacto en el campo `Usar`.

## 2. Crear el papel personalizado

1. Abrir cualquier dialogo `Archivo > Imprimir`.
2. En `Tamano del papel`, elegir `Administrar tamanos personalizados`.
3. Agregar `DL Etiqueta 100x60`.
4. Ancho: `100 mm`.
5. Alto: `60 mm`.
6. Margenes superior, inferior, izquierdo y derecho: `0 mm`.
7. Guardar.

## 3. Configuracion del dialogo de impresion

Al imprimir una etiqueta desde el sistema seleccionar:

- Impresora: XPrinter instalada.
- Papel: `DL Etiqueta 100x60`.
- Orientacion: horizontal.
- Escala: `100%`.
- Margenes: ninguno / `0`.
- Paginas por hoja: `1`.
- Encabezados y pies: desactivados.
- Ajustar al papel / Fit to page: desactivado.
- Doble faz: desactivado.

Guardar como preset:

`Preajustes > Guardar configuracion actual como preajuste > DL Etiquetas 100x60`

Elegir que el preset se aplique solamente a esa impresora.

## 4. Dejarla como predeterminada

En `Configuracion del Sistema > Impresoras y escaneres`:

- Impresora predeterminada: XPrinter.
- Tamano de papel predeterminado: `DL Etiqueta 100x60`.

## 5. Diagnostico desde Terminal

Ejecutar:

```bash
lpstat -p -d
```

Luego reemplazar `NOMBRE_IMPRESORA` por el nombre exacto obtenido:

```bash
lpoptions -p "NOMBRE_IMPRESORA" -l
```

Guardar o enviar la salida. Los nombres internos de papel, sensor, velocidad y densidad cambian segun el driver; no aplicar comandos `lpoptions -o` hasta revisar esa lista.

## 6. Como interpretar el defecto

- Sale girada 90 grados: orientacion incorrecta.
- Sale chica o ampliada: escala distinta de 100% o ajuste automatico activo.
- Todo sale corrido siempre igual: margenes u offset del driver.
- La primera sale bien y las siguientes se desplazan: falta calibrar el sensor de separacion/gap.
- Salta etiquetas: tipo de sensor incorrecto o medida de alto distinta de 60 mm.

## 7. Calibracion fisica

No ejecutar una secuencia generica de encendido/FEED sin identificar antes el modelo exacto. Revisar la etiqueta inferior o trasera de la impresora y registrar:

- modelo exacto;
- resolucion 203 o 300 dpi;
- tipo de etiqueta: separacion/gap o marca negra;
- conexion USB o red.

Con esos datos se aplica la calibracion correspondiente sin resetear parametros innecesarios.

## 8. Prueba desde el ERP

1. Ingresar como `admin3`.
2. Abrir `Armado / Deposito`.
3. Elegir un solo pedido en estado `En Armado`.
4. Confirmar `1` bulto.
5. Generar e imprimir una etiqueta.
6. Seleccionar el preset `DL Etiquetas 100x60`.

No probar primero con varias etiquetas: una unica impresion permite identificar orientacion, escala y desplazamiento sin desperdiciar rollo.
