# Seguridad, Licenciamiento e Integridad v64

Fecha: 2026-07-23

## Objetivo

Esta version agrega blindaje por capas para reducir copia no autorizada, ejecucion en otro servidor, modificacion de archivos criticos y perdida de trazabilidad.

## Componentes instalados

- `license-engine.js`: motor de licencia, huella e integridad.
- `scripts/license-admin.js`: herramienta tecnica para huella, emision de licencia y manifiesto.
- `config/license-public-key.pem`: clave publica usada para validar la licencia.
- `data/license.json`: licencia firmada para esta instalacion.
- `data/install-id.json`: identificador local generado durante activacion.
- `data/integrity-manifest.json`: hashes de archivos criticos.
- `data/security-audit.log`: auditoria de seguridad.

La clave privada no debe copiarse al cliente ni al paquete productivo. Queda fuera de la instalacion, en:

`C:\DistribuidoraLopez\.security\distribuidora-lopez-license-private.pem`

## Como funciona

Al iniciar el servidor:

1. Calcula una huella del servidor usando varias senales disponibles.
2. Valida la firma digital de `data/license.json`.
3. Verifica que la licencia corresponda a la huella actual.
4. Verifica archivos criticos contra `data/integrity-manifest.json`.
5. Si algo falla, el servidor no arranca y registra el evento.

## Comandos tecnicos

Ver huella del servidor:

```powershell
cd C:\DistribuidoraLopez\SERVIDOR_UNICO_8790
node .\scripts\license-admin.js fingerprint
```

Generar claves:

```powershell
node .\scripts\license-admin.js keygen
```

Emitir licencia:

```powershell
node .\scripts\license-admin.js issue --client "Distribuidora Lopez" --installation "SERVIDOR_UNICO_8790"
```

Generar manifiesto de integridad:

```powershell
node .\scripts\license-admin.js manifest
```

Ver estado:

```powershell
node .\scripts\license-admin.js status
```

## Renovacion de licencia

1. Entrar al servidor autorizado.
2. Ejecutar `fingerprint`.
3. Emitir una nueva licencia con la clave privada.
4. Reemplazar solamente `data/license.json`.
5. Reiniciar el servidor.
6. Verificar `/api/health` y el panel Admin > Licencia e integridad.

## Restauracion

Para restaurar en el mismo servidor:

- Restaurar `data/demo-state.json`.
- Restaurar `data/users.json`.
- Restaurar `data/license.json`.
- Restaurar `data/install-id.json`.
- Restaurar documentos, comprobantes y remitos.
- Regenerar `integrity-manifest.json` solo despues de confirmar que los archivos instalados son oficiales.

Para migrar a otro servidor:

- No reutilizar la licencia anterior.
- Generar nueva huella.
- Emitir nueva licencia.
- Generar nuevo manifiesto de integridad.

## Permisos recomendados en Windows

- Crear una cuenta operativa dedicada para el servicio.
- Dar permisos de lectura/ejecucion sobre la carpeta del sistema.
- Dar escritura solo sobre `data`, `logs` y carpetas de adjuntos.
- Restringir `config`, scripts y archivos `.js` a administradores tecnicos.
- No entregar la clave privada ni archivos de desarrollo.

## Backups

Los backups deben incluir:

- `data/demo-state.json`
- `data/users.json`
- `data/license.json`
- `data/install-id.json`
- `data/session-config.json`
- comprobantes y remitos
- auditorias

No deben incluir:

- clave privada
- repositorio Git
- temporales
- backups viejos de codigo fuente

## Panel administrativo

Desde Admin > Licencia e integridad se puede consultar:

- cliente licenciado
- instalacion
- estado de licencia
- version habilitada
- vencimiento
- modulos habilitados
- integridad de archivos criticos
- eventos recientes de seguridad

No se muestran secretos ni claves criptograficas.
