# Servidor unico 8790

Esta instalacion evita las copias anteriores y usa un puerto nuevo fijo: `8790`.

## Carpeta unica

```text
C:\DLPreventaServer
```

## Iniciar servidor

Abrir:

```text
C:\DLPreventaServer\INICIAR-SERVIDOR-UNICO-8790.cmd
```

Dejar esa ventana abierta.

## URLs correctas

PC local:

```text
http://localhost:8790/index.html#dashboard
```

Celular con datos moviles + Tailscale:

```text
http://100.116.67.7:8790/index.html#preventa
```

Diagnostico desde PC o celular:

```text
http://100.116.67.7:8790/api/health
```

Debe decir:

```json
"instance": "SERVIDOR_UNICO_8790"
```

## Credenciales

```text
admin1 / Lopez2026!
sofia / Lopez2026!
```

## Regla importante

No usar mas:

```text
http://192.168.88.3:8789
http://100.116.67.7:8789
```

Para estas pruebas usar solamente:

```text
http://100.116.67.7:8790
```
