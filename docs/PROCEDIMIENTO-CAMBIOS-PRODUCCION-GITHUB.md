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

## Procedimiento manual en servidor Vultr

Servidor actual:

- Host: `216.128.169.34`
- Usuario SSH: `dlops`
- Codigo: `/opt/distribuidora-lopez/app`
- Datos productivos: `/opt/distribuidora-lopez/data`
- Servicio: `distribuidora-lopez.service`
- URL publica: `https://lopez.gruporochaapp.com`
- Health: `https://lopez.gruporochaapp.com/api/health`
- Repo GitHub: `https://github.com/elabuelo92/DISTRIBUIDORA-LOPEZ.git`

### 1. Entrar por SSH

Desde PowerShell:

```powershell
ssh -i C:\DistribuidoraLopez\.ssh\dl_vultr_ed25519 dlops@216.128.169.34
```

Si se usa la llave interna de despliegue de Codex:

```powershell
ssh -i C:\DistribuidoraLopez\SERVIDOR_UNICO_8790\.deploy-tools\dl_vultr_ed25519 dlops@216.128.169.34
```

### 2. Verificar estado antes de tocar

En Ubuntu:

```bash
date -Is
systemctl is-active distribuidora-lopez.service
curl -fsS http://127.0.0.1:8790/api/health
```

Confirmar que el servicio responde y mirar `version`, `runtimeVersion`, `orders`, `deliveryRoutes`, `productsCount`, `license.code` e `integrity.code`.

### 3. Crear backup obligatorio

```bash
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR=/opt/distribuidora-lopez/backups/manual-$STAMP
sudo mkdir -p "$BACKUP_DIR"
sudo tar -C /opt/distribuidora-lopez -czf "$BACKUP_DIR/app.tar.gz" app
sudo tar -C /opt/distribuidora-lopez -czf "$BACKUP_DIR/data.tar.gz" data
sudo chown -R dlops:dlops "$BACKUP_DIR"
echo "$BACKUP_DIR"
```

Ese directorio es el punto de retorno si algo falla.

### 4. Actualizar codigo desde GitHub

Primera vez si `/opt/distribuidora-lopez/app` no es un repo Git:

```bash
cd /opt/distribuidora-lopez
rm -rf app-next
git clone --branch main https://github.com/elabuelo92/DISTRIBUIDORA-LOPEZ.git app-next
sudo rm -rf app
sudo mv app-next app
sudo chown -R dlops:dlops /opt/distribuidora-lopez/app
```

Luego de esa conversion, para futuros cambios usar:

```bash
cd /opt/distribuidora-lopez/app
git fetch origin main
git status --short
git reset --hard origin/main
```

No tocar `/opt/distribuidora-lopez/data` salvo que exista una migracion documentada.

Si `package.json` o `pnpm-lock.yaml` cambiaron, instalar dependencias antes de reiniciar:

```bash
cd /opt/distribuidora-lopez/app
npm install --omit=dev
```

### 5. Verificar sintaxis

```bash
cd /opt/distribuidora-lopez/app
node --check server.js
node --check app.js
node --check order-engine.js
```

### 6. Regenerar integridad

Hacerlo cuando cambien archivos criticos.

```bash
cd /opt/distribuidora-lopez/app
DATA_DIR=/opt/distribuidora-lopez/data \
STATE_FILE=/opt/distribuidora-lopez/data/demo-state.json \
USERS_FILE=/opt/distribuidora-lopez/data/users.json \
DL_LICENSE_FILE=/opt/distribuidora-lopez/data/license.json \
DL_INTEGRITY_FILE=/opt/distribuidora-lopez/data/integrity-manifest.json \
DL_INSTALLATION_NAME=SERVIDOR_UNICO_8790 \
DL_VERSION=8790-106 \
node scripts/license-admin.js manifest

DATA_DIR=/opt/distribuidora-lopez/data \
STATE_FILE=/opt/distribuidora-lopez/data/demo-state.json \
USERS_FILE=/opt/distribuidora-lopez/data/users.json \
DL_LICENSE_FILE=/opt/distribuidora-lopez/data/license.json \
DL_INTEGRITY_FILE=/opt/distribuidora-lopez/data/integrity-manifest.json \
DL_INSTALLATION_NAME=SERVIDOR_UNICO_8790 \
DL_VERSION=8790-106 \
node scripts/license-admin.js status
```

El resultado debe indicar `LICENSE_OK` e `INTEGRITY_OK`.

### 7. Reiniciar controlado

```bash
sudo systemctl restart distribuidora-lopez.service
sleep 3
sudo systemctl status distribuidora-lopez.service --no-pager -l
```

Si no arranca:

```bash
sudo journalctl -u distribuidora-lopez.service -n 120 --no-pager
```

### 8. Validar produccion

```bash
curl -fsS http://127.0.0.1:8790/api/health
curl -fsS https://lopez.gruporochaapp.com/api/health
```

Luego probar en navegador:

- `https://lopez.gruporochaapp.com/index.html#dashboard`
- `https://lopez.gruporochaapp.com/index.html#proveedores`
- modulo afectado por el cambio

### 9. Rollback si algo falla

Usar el `BACKUP_DIR` creado en el paso 3:

```bash
sudo systemctl stop distribuidora-lopez.service
cd /opt/distribuidora-lopez
sudo rm -rf app data
sudo tar -xzf "$BACKUP_DIR/app.tar.gz" -C /opt/distribuidora-lopez
sudo tar -xzf "$BACKUP_DIR/data.tar.gz" -C /opt/distribuidora-lopez
sudo chown -R dlops:dlops /opt/distribuidora-lopez
sudo systemctl start distribuidora-lopez.service
curl -fsS http://127.0.0.1:8790/api/health
```

Si el health vuelve a OK, informar rollback aplicado y conservar logs para diagnostico.
