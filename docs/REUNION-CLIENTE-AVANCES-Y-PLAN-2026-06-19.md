# Reunion cliente - avances y plan

Fecha de preparacion: 2026-06-18.

Reunion prevista: 2026-06-19.

## Objetivo de la reunion

Mostrar avances concretos del sistema Distribuidora Lopez, validar con el cliente el flujo operativo real y acordar prioridades para la semana siguiente.

La reunion debe enfocarse en una idea central:

```text
Ya no estamos mostrando solo una demo visual.
Estamos mostrando una base operativa que empieza a reemplazar planillas, pedidos manuales y seguimiento informal.
```

## Estado actual del sistema

Version vigente:

```text
8790-18
```

Servidor activo:

```text
http://localhost:8790
```

Estado tecnico:

```text
Servidor OK
Puerto 8790
Datos vivos sincronizados
Compatibilidad Windows y MacBook Air preparada
```

Datos actuales cargados:

```text
Clientes: 756
Productos: 644
Pedidos: 23
Ultimo pedido: PED-2074
Productos en stock critico: 5
Productos sin stock: 383
Vendedores configurados: 5
Vendedores con ubicacion registrada: 4
```

Pedidos por estado:

```text
Recibido: 5
En armado: 16
Listo reparto: 1
Facturado/entregado: 1
```

## Avances principales para mostrar

### 1. Acceso y roles

- Login con usuarios administradores y vendedores.
- Sesion visible.
- Cierre de sesion.
- Recupero de clave solicitado desde el login.
- Acceso de vendedor limitado a preventa.

### 2. Preventa movil

- Vista tipo celular.
- Vendedor asignado.
- Buscador/desplegable de clientes.
- Alta rapida de cliente desde el celular.
- Buscador/desplegable de productos cargados desde CSV.
- Validacion de stock antes de enviar pedido.
- Pedido enviado a administracion.
- Sincronizacion con dashboard.

### 3. Pedidos y deposito

- Pedidos recibidos desde celulares.
- Notificacion emergente para administradores.
- Trazabilidad por pedido.
- Estados:
  - Recibido.
  - En armado.
  - Listo reparto.
  - En reparto.
  - Entregado.
- Marca de urgencia.
- Deteccion de demora por etapa.
- Panel lateral de pedidos activos.

### 4. Tablero general

- Metricas principales:
  - Ventas del dia.
  - Saldos de clientes.
  - Deuda proveedores.
  - Stock critico.
- Pipeline grafico de pedidos.
- Conteo por etapa.
- Alertas operativas reducidas a las 4 mas criticas.
- Cortes PDF por etapa de pedido.

### 5. Stock

- Stock normalizado desde CSV.
- Buscador de productos.
- Graficos de stock.
- Stock critico.
- Exportacion CSV.
- Exportacion PDF.
- Impresion directa preparada para impresora real.
- Modificacion de producto protegida por clave admin.

### 6. Clientes

- Padron normalizado.
- Campos fiscales y comerciales.
- Vendedor asignado.
- Ruta/zona.
- Estado del cliente.
- Cuenta corriente/saldo.
- Alta manual desde administracion.
- Alta rapida desde preventa.

### 7. GPS y ubicacion

- GPS nativo en APK Android.
- Ubicacion visible en dashboard.
- Mapa real con Google Maps cuando la API esta configurada.
- Vendedores con ubicacion registrada.
- Pendiente: URL HTTPS definitiva para GPS confiable en iPhone/Safari.

### 8. Plataforma e instalacion

- Servidor unico `8790`.
- Limpieza de versiones viejas.
- Paquete ZIP regenerado.
- Compatibilidad Windows.
- Compatibilidad MacBook Air preparada.
- Scripts de arranque macOS.
- Guia de instalacion MacBook Air.
- Preparacion para uso web app en iPhone.

## Que conviene demostrar manana

Orden recomendado:

1. Iniciar sesion como administrador.
2. Mostrar tablero general:
   - Metricas.
   - Pipeline de pedidos.
   - Alertas criticas.
3. Entrar a Pedidos:
   - Mostrar trazabilidad.
   - Avanzar un pedido de etapa.
   - Marcar urgencia.
4. Volver al Tablero:
   - Mostrar cambio reflejado.
   - Generar PDF de corte desde una etapa.
5. Entrar a Stock:
   - Buscar producto.
   - Mostrar graficos.
   - Exportar PDF/CSV.
   - Explicar que impresion directa requiere impresora real instalada.
6. Entrar a Preventa:
   - Seleccionar cliente.
   - Seleccionar producto.
   - Armar pedido.
   - Enviar pedido.
7. Volver a administrador:
   - Mostrar que llego el pedido.
   - Mostrar notificacion si hay dos ventanas/dispositivos.
8. Mostrar GPS:
   - Ubicaciones registradas.
   - Aclarar condicion HTTPS para iPhone.
9. Cerrar con plan de semana proxima.

## Que no conviene prometer como terminado

Estos puntos deben presentarse como pendientes controlados:

- Facturacion fiscal real.
- Integracion bancaria automatica.
- App iOS nativa publicada.
- GPS permanente en segundo plano.
- Impresion real sin instalar/configurar la impresora.
- Auditoria contable completa.
- Gestion avanzada de reparto/cobranza cerrada.
- Base de datos productiva definitiva.

## Prioridades para lo que resta del dia

### Prioridad 1 - Preparar demo estable

- Abrir dashboard y verificar login admin.
- Abrir preventa y verificar login vendedor.
- Hacer un pedido de prueba corto.
- Confirmar que aparece en Pedidos.
- Confirmar que el pipeline se actualiza.
- Probar PDF por etapa.
- Probar exportacion Stock PDF/CSV.
- No tocar datos masivos antes de la reunion.

### Prioridad 2 - Preparar narrativa para el cliente

Explicar el sistema como circuito:

```text
Vendedor carga pedido -> Administracion lo ve -> Deposito arma -> Reparto entrega -> Stock y cuentas se actualizan.
```

### Prioridad 3 - Definir ambiente de demostracion

Elegir donde se muestra:

- PC Windows actual.
- MacBook Air.
- Celular Android con APK.
- iPhone como web app/Safari.

Si la reunion es manana, lo mas seguro es mostrar desde la PC actual y llevar el ZIP preparado para MacBook Air como avance tecnico.

## Plan propuesto para semana proxima

### Dia 1 - Validacion de datos reales

- Revisar clientes importados.
- Definir campos obligatorios finales.
- Marcar clientes duplicados o incompletos.
- Revisar productos sin stock.
- Separar productos activos/inactivos.

Resultado esperado:

```text
Padron y stock confiables para prueba operativa.
```

### Dia 2 - Preventa real controlada

- Elegir 1 o 2 vendedores.
- Cargar pedidos reales de baja complejidad.
- Validar alta rapida de cliente.
- Validar stock antes de enviar.
- Medir errores de uso.

Resultado esperado:

```text
Primer circuito real de pedido desde celular.
```

### Dia 3 - Deposito y despacho

- Definir quien recibe pedidos.
- Definir estados reales del deposito.
- Probar hoja/corte de armado.
- Probar urgencias y demoras.
- Probar cortes PDF por etapa.

Resultado esperado:

```text
Deposito puede usar Pedidos como tablero de trabajo.
```

### Dia 4 - Stock y compras

- Cargar ingreso de mercaderia.
- Registrar ajuste de stock.
- Definir autorizacion para modificar productos.
- Definir proceso de cierre semanal.
- Confirmar impresora real si aplica.

Resultado esperado:

```text
Stock deja de depender solo de planilla.
```

### Dia 5 - Cuentas, cobranza y decision de plataforma

- Revisar cuenta corriente.
- Definir cobranzas.
- Definir reparto/rendicion.
- Decidir servidor final:
  - PC Windows.
  - Mini PC.
  - MacBook Air.
- Definir acceso externo:
  - Tailscale HTTPS.
  - Cloudflare Tunnel.
  - Dominio propio.

Resultado esperado:

```text
Plan de salida operativa y responsables definidos.
```

## Preguntas clave para hacerle al cliente

- Quien administra clientes nuevos.
- Quien puede modificar stock.
- Quien autoriza descuentos.
- Quien imprime o arma pedidos.
- Como se define un pedido urgente.
- Cuanto tiempo maximo puede quedar un pedido en armado.
- Quien confirma entrega.
- Quien registra cobranza.
- Que impresora se usara.
- Que equipo sera servidor definitivo.
- Si los vendedores usaran Android, iPhone o ambos.

## Decision recomendada

Para manana, mostrar el avance como:

```text
Sistema en fase piloto avanzado.
Listo para prueba controlada con datos reales y 1 o 2 usuarios.
No listo todavia para reemplazar todo el circuito administrativo sin supervision.
```

Esto es honesto y favorable: muestra avance fuerte sin sobredimensionar la estabilidad productiva.

## Proximo hito sugerido

Hito:

```text
Prueba operativa controlada de preventa + deposito + stock.
```

Duracion:

```text
5 dias habiles.
```

Criterio de exito:

```text
Un vendedor carga pedidos reales, administracion los ve, deposito los procesa, stock descuenta y el tablero refleja el estado sin volver a Excel para ese circuito.
```
