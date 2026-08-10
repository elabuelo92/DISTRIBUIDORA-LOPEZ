# Instalacion APK GPS nativo 8790

## Archivo

```text
C:\DistribuidoraLopez\release\DL-Preventa-GPS-NATIVO-8790.apk
```

Copia incluida dentro del paquete:

```text
C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\android-apk\out\DL-Preventa-GPS-NATIVO-8790.apk
```

## Identificacion

Nombre visible:

```text
DL Preventa GPS
```

Package Android:

```text
com.distribuidora.lopez.gps
```

Hash vigente 2026-06-17:

```text
08C91A46436ECB1A8C81DAE0093456A3983C8AD99A2C85995071E6D66BFD345B
```

Se instala separada de la APK anterior para evitar conflicto de firma.

## Antes de instalar

En la PC:

```text
http://127.0.0.1:8790/api/health
```

Debe responder:

```text
ok: true
instance: SERVIDOR_UNICO_8790
port: 8790
```

En el telefono:

1. Activar Tailscale.
2. Verificar que el telefono este conectado al mismo tailnet.
3. Activar Ubicacion de Android.
4. Permitir instalacion de APK desde el origen usado para abrir el archivo.

## Instalacion

1. Pasar el APK al telefono.
2. Abrir el archivo `DL-Preventa-GPS-NATIVO-8790.apk`.
3. Instalar.
4. Abrir `DL Preventa GPS`.
5. Cuando Android pida permiso de ubicacion, elegir permitir.
6. Si Android pregunta precision, elegir ubicacion precisa.

## Prueba GPS

1. Entrar con usuario vendedor.
2. La app debe abrir Preventa e iniciar GPS automaticamente.
3. El sistema debe mostrar:

```text
GPS real nativo
```

4. En el dashboard de la PC debe aparecer el vendedor con coordenadas nuevas.

## Si no conecta

Verificar:

- Tailscale activo en telefono.
- Tailscale activo en PC.
- Servidor abierto en la PC.
- URL interna usada por APK:

```text
http://desktop-c2c0q4v:8790/index.html#preventa
```

La APK tambien intenta fallback:

```text
http://desktop-c2c0q4v.tail6f19de.ts.net:8790/index.html#preventa
```

No usar `http://100.116.67.7:8790` como prueba principal: Tailscale Serve puede devolver 404 por IP directa.

## Si no toma GPS

1. Android > Ajustes > Apps > DL Preventa GPS > Permisos.
2. Ubicacion: permitir.
3. Precision: precisa.
4. Activar Ubicacion general del telefono.
5. Probar en exterior o cerca de una ventana si Android tarda en obtener lectura.
