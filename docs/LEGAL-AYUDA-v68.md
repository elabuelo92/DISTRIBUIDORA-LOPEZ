# Legal, Ayuda y Acerca del Sistema - v68

Fecha: 2026-07-27  
Version del sistema: 8790-68  
Desarrollado por: Grupo Rocha Solutions

## Objetivo

Incorporar un modulo transversal para proteger legalmente el software, informar condiciones de uso, registrar aceptacion electronica antes del acceso y agregar ayuda operativa dentro del sistema.

## Modulo Legal

Incluye:

- Terminos y Condiciones.
- Licencia de Uso.
- Politica de Privacidad.
- Tratamiento de Datos Personales.
- Uso del GPS.
- Avisos legales y copyright.

El sistema bloquea el ingreso si el usuario no acepto la version legal vigente. El servidor responde `TERMS_REQUIRED` y la aplicacion muestra una pantalla obligatoria de lectura y aceptacion.

## Evidencia de aceptacion

Cada aceptacion registra:

- Usuario.
- Rol.
- Fecha y hora.
- Direccion IP.
- Dispositivo.
- GPS informado en login, si existe.
- Version aceptada.
- Hash del documento legal.
- User-Agent del navegador o WebView.

Las evidencias quedan en `legalAcceptances` y la auditoria legal en `legalAudit`.

## Nuevas versiones legales

Administracion puede publicar una nueva version desde la solapa Legal.

Al publicar:

- cambia `legalSettings.currentVersion`;
- se recalcula el hash;
- se agrega historial de version;
- los usuarios deben aceptar nuevamente antes de ingresar.

## Copyright visible

El pie de la aplicacion muestra permanentemente:

Copyright 2026 Grupo Rocha Solutions. Sistema de Gestion Distribuidora Lopez. Todos los derechos reservados. Software protegido por derechos de autor.

## Centro de Ayuda

Se agrego una solapa Ayuda con:

- manual por modulos;
- busqueda;
- filtros por rol y modulo;
- paso a paso por pantalla;
- impresion de instructivo;
- descarga de manual PDF;
- reporte de problema por WhatsApp;
- registro de recorrido completado.

Los temas se cargan desde `helpCenter.topics`, lo que permite agregar documentacion nueva sin modificar la pantalla principal.

## Acerca del Sistema

Se agrego una solapa Acerca con:

- nombre del sistema;
- desarrollador;
- version instalada;
- servidor;
- URL de API;
- estado de licencia;
- soporte;
- historial de versiones.

## Archivos principales

- `legal-engine.js`
- `server.js`
- `app.js`
- `index.html`
- `styles.css`
- `config.js`
- `sw.js`

## Criterio operativo

Ningun usuario debe poder iniciar sesion normal sin aceptar la version vigente. La aceptacion local solo aplica al modo demo; en operacion real la evidencia valida queda guardada en el servidor.
