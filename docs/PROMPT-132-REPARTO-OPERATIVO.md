# Prompt 132 - Reparto operativo para 50 a 100 pedidos

## Alcance aplicado

- La etiqueta y la cantidad de bultos siguen siendo obligatorias antes del despacho.
- El escaneo fisico queda disponible y auditado, pero deja de bloquear el paso a `Listo para Despacho`.
- La firma digital queda disponible como evidencia opcional tanto en entrega como en rechazo.
- La hoja de ruta utiliza una lista compacta y conserva secuencia numerica, botones Subir/Bajar y arrastre.
- Todo cambio de orden usa `POST /api/delivery/routes/:id/reorder` y queda persistido con auditoria.

## Usuario Darío

- Usuario: `dario`.
- Rol base: `driver`.
- Acceso visible: Reparto, Planificacion rapida, Legal, Ayuda y Acerca.
- Acciones especiales: planificar, deshacer planificacion, reordenar y publicar rutas.
- Sin acceso: configuracion de cobranza, auditoria administrativa, usuarios, precios, proveedores, stock y configuraciones generales.

La autorizacion se valida tambien en backend. No depende solamente de ocultar botones.

## Prueba de aceptacion

Ejecutar:

```powershell
npm.cmd run test:delivery-operations
```

La prueba crea 60 pedidos, los planifica para Darío, invierte y persiste el orden, publica la ruta sin scanner y registra un rechazo sin firma.

## Operacion

1. En Armado, generar etiqueta y confirmar bultos.
2. Usar `Listo para despacho`; el scanner puede utilizarse antes o despues como control adicional.
3. En Reparto, seleccionar pedidos por lote y crear la hoja.
4. Reordenar arrastrando desde `Mover`, con secuencia numerica o con Subir/Bajar.
5. Publicar la ruta.
6. En la entrega, firmar solo cuando resulte conveniente como evidencia.
