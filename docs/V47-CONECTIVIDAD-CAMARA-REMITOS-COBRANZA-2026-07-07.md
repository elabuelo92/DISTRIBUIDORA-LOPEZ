# V47 - Conectividad, camara, remitos y cobranza mixta

Fecha: 2026-07-07

## Alcance

Esta version incorpora los Prompts 31 al 35 y la refactorizacion de conectividad por cambio de Tailnet/Tailscale.

## Prompt 31 - Camara para remitos de proveedor

- En Proveedores > Cargar remito se agrego:
  - Sacar foto del remito.
  - Adjuntar imagen desde galeria.
  - Adjuntar PDF / imagen.
- El adjunto es obligatorio.
- El remito queda asociado a proveedor, fecha, usuario, hora y productos recibidos.
- El adjunto queda visible desde Administracion/Proveedores mediante `Ver adjunto`.

## Prompt 32 - Camara para comprobantes en Reparto

- En Reparto > Confirmar entrega se agrego selector compatible con celular.
- Si el pago contiene transferencia, el comprobante es obligatorio.
- El comprobante se asocia al pedido, cliente, repartidor, metodo de pago y ruta.
- Se conserva la foto/PDF en `data/delivery-uploads`.

## Prompt 33 - Buscador, nomenclador y multiplicador en remitos

- La carga de remito ahora usa buscador de productos por:
  - nombre
  - codigo
  - rubro/categoria
  - proveedor
  - nomenclador interno
- Cada renglon permite:
  - cantidad
  - unidad
  - precio unitario
  - multiplicador de stock
  - subtotal automatico
- Al guardar:
  - actualiza stock fisico
  - actualiza cuenta corriente de proveedor
  - destraba pedidos pendientes de abastecimiento cuando corresponde

## Prompt 34 - Calculadora de cobranza mixta

- Reparto permite combinar:
  - efectivo
  - transferencia
  - cuenta corriente / saldo pendiente
- Validacion obligatoria:
  - efectivo + transferencia + cuenta corriente = total cobrable
- Si hay transferencia:
  - exige banco, alias, CBU/CVU y comprobante
  - deja comprobante en estado Pendiente
- Si hay cuenta corriente:
  - impacta saldo pendiente del cliente
  - registra movimiento automatico
- La ruta acumula efectivo y transferencias por separado.

## Prompt 35 - Adjuntos desde celular

- Se agrego compatibilidad Android Chrome/WebView:
  - `accept="image/*" capture="environment"` para camara
  - `accept="image/*"` para galeria
  - `accept="application/pdf,image/*"` para PDF/imagen
- La APK ahora implementa `onShowFileChooser`, necesario para que Android WebView abra camara, galeria o selector de archivos.

## Refactor de conectividad Tailnet

Se centralizo la configuracion en `config.js`:

```js
window.DL_CONNECTION_CONFIG = {
  API_BASE_URL: "",
  API_PORT: 8790,
  SOCKET_URL: "",
  SERVER_NAME: "SERVIDOR_UNICO_8790",
  MAGIC_DNS_HOST: "",
  VERSION: "8790-47",
  TIMEOUTS: {}
};
```

Regla operativa:

- En navegador normal, si `API_BASE_URL` esta vacio, usa el mismo origen actual.
- En PC local, usa `http://127.0.0.1:8790`.
- Para Tailnet/MagicDNS, configurar preferentemente:
  - `DL_API_BASE_URL=https://servidor.tailnet.ts.net`
  - o editar `config.js`.
- No se debe hardcodear IP 100.x ni IP 192.168.x dentro del frontend.

## APK v47

La APK ya no queda atada al Tailnet anterior.

- URL por defecto: `https://servidor.tailnet.ts.net/index.html?v=8790-47#preventa`.
- Si no conecta, muestra un dialogo para cambiar la URL.
- Tambien se puede abrir desde Diagnostico > Configurar APK.
- Mantener presionada la pantalla tambien abre la configuracion.

Cuando se sepa el MagicDNS definitivo, cargar por ejemplo:

```text
https://nombre-servidor.nueva-tailnet.ts.net/index.html#preventa
```

## Diagnostico tecnico

Se agrego pestaña `Diagnostico` para administradores:

- estado de conexion
- servidor usado
- URL API
- latencia
- estado API
- estado base de datos
- sincronizacion
- Tailnet/MagicDNS
- ultima conexion correcta
- ultimo error

## Pruebas realizadas

- `node --check SERVIDOR_UNICO_8790/app.js`: OK.
- `node --check SERVIDOR_UNICO_8790/server.js`: OK.
- `node --check SERVIDOR_UNICO_8790/delivery-engine.js`: OK.
- Prueba motor de reparto con cobranza mixta: OK.
- Prueba servidor temporal `/api/health` + `config.js` dinamico: OK.
- Prueba endpoint `/api/suppliers/remits` con item normalizado y adjunto: OK.
- APK v47 compilada y firmada con `apksigner verify`: OK.

## Archivos generados

- APK: `SERVIDOR_UNICO_8790/android-apk/out/DL-Preventa-GPS-NATIVO-8790-v47.apk`
- APK alias: `SERVIDOR_UNICO_8790/android-apk/out/DL-Preventa.apk`

