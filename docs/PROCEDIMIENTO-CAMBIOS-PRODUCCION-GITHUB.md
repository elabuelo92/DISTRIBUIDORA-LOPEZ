# Procedimiento fijo para cambios en produccion

Fecha de definicion: 2026-08-13

Este procedimiento queda como ruta obligatoria para cualquier cambio, mejora, correccion o prompt nuevo del Sistema de Gestion Distribuidora Lopez.

## Principio rector

La version productiva no debe modificarse manualmente como una carpeta suelta.

El servidor productivo debe ser el destino final controlado de un cambio probado, versionado y respaldado.

## Ruta obligatoria

1. Trabajar el cambio en el proyecto local controlado.
2. Revisar archivos afectados antes de editar.
3. Implementar el cambio con alcance claro.
4. Probar localmente:
   - `node --check app.js`
   - `node --check server.js`
   - pruebas del modulo afectado
   - `/api/health`
5. Actualizar documentacion del cambio.
6. Subir el cambio a GitHub.
7. En el servidor productivo:
   - hacer backup previo de `data`;
   - ejecutar `git pull`;
   - instalar dependencias solo si corresponde;
   - regenerar manifiesto de integridad si se tocaron archivos criticos;
   - reiniciar el servicio.
8. Validar en produccion:
   - `/api/health`;
   - login administrador;
   - modulo modificado;
   - app movil si corresponde;
   - integridad/licencia.
9. Si falla:
   - detener despliegue;
   - revisar logs;
   - restaurar backup o volver al commit anterior.

## Archivos criticos

Si se modifica alguno de estos archivos, hay que regenerar integridad antes de arrancar produccion:

- `server.js`
- `app.js`
- `index.html`
- `styles.css`
- `config.js`
- `sw.js`
- motores `*-engine.js`
- scripts de arranque o licencia

Comando local con rutas correctas del servidor unico:

```powershell
$env:DATA_DIR='C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\data'
$env:STATE_FILE='C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\data\demo-state.json'
$env:USERS_FILE='C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\data\users.json'
$env:DL_LICENSE_FILE='C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\data\license.json'
$env:DL_INTEGRITY_FILE='C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\data\integrity-manifest.json'
node .\scripts\license-admin.js manifest
node .\scripts\license-admin.js status
```

## Regla operativa

A partir de esta fecha, cada cambio debe terminar con una de estas dos salidas:

- `Desplegado en produccion y validado`.
- `Implementado localmente, pendiente de despliegue`.

Nunca debe quedar ambiguo si el cambio esta corriendo en el servidor real o solo en la PC local.

## Checklist rapido antes de cerrar un cambio

- Codigo probado.
- Documentacion actualizada.
- GitHub actualizado.
- Backup productivo creado.
- Servidor productivo actualizado.
- Servicio reiniciado.
- `/api/health` OK.
- Integridad/licencia OK.
- Usuario administrador probado.
- Modulo afectado probado.
- Resultado informado al cliente.

