# Prompt 5 - Comprobantes obligatorios

Fecha: 2026-07-01  
Version: v30 - COMPROBANTES  
Servidor: `http://127.0.0.1:8790`

## Objetivo

Agregar control obligatorio de comprobantes cuando una entrega se cobra por transferencia, evitando cerrar pedidos sin respaldo documental.

## Alcance implementado

- En Reparto, al seleccionar `Transferencia`, se habilita un bloque de comprobante obligatorio.
- El sistema exige:
  - Importe cobrado mayor a cero.
  - Banco.
  - Alias.
  - CBU/CVU.
  - Foto, captura o PDF del comprobante.
  - Observaciones opcionales.
- Si falta cualquiera de esos datos, no permite confirmar la entrega.
- El servidor acepta comprobantes `PNG`, `JPG/JPEG` o `PDF`.
- Los comprobantes se guardan en `data/delivery-uploads`.
- La cobranza guarda en el pedido:
  - Fecha.
  - Hora.
  - Importe.
  - Banco.
  - Alias.
  - CBU/CVU.
  - Observaciones.
  - Archivo adjunto.
- La auditoria de reparto registra que se guardo comprobante de transferencia.

## Configuracion administrativa

En `Reparto > Configuracion de cobranza` ahora se puede cargar:

- Alias bancario.
- Titular.
- CBU/CVU.
- Coordenadas del deposito.

El alias y CBU/CVU quedan precargados para el repartidor al cobrar por transferencia.

## Prueba tecnica

Script:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\smoke-v30.ps1
```

La prueba valida:

- Sintaxis de los archivos principales.
- Que el servidor sirva la version `8790-30`.
- Que una transferencia sin comprobante sea rechazada.
- Que una transferencia con comprobante quede cobrada y guarde los datos obligatorios.

## Criterio operativo

Un pedido cobrado por transferencia no debe pasar a `Cobrado` si no existe comprobante asociado.
