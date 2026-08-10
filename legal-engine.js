(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("crypto"));
  } else {
    root.DLLegalEngine = factory(null);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (cryptoModule) {
  const CURRENT_LEGAL_VERSION = "LEGAL-2026-07-27-v1";
  const COPYRIGHT_TEXT = "Copyright 2026 Grupo Rocha Solutions. Sistema de Gestion Distribuidora Lopez. Todos los derechos reservados.";

  const DEFAULT_LEGAL_DOCUMENTS = [
    {
      id: "terms",
      title: "Terminos y Condiciones",
      summary: "Condiciones generales para el uso operativo del Sistema de Gestion Distribuidora Lopez.",
      body: [
        "El sistema se entrega para uso interno, operativo y administrativo de Distribuidora Lopez.",
        "El usuario debe utilizar la plataforma con datos reales, mantener sus credenciales bajo resguardo y no compartir accesos.",
        "Toda accion registrada en el sistema podra ser auditada para trazabilidad, seguridad, soporte y mejora del servicio.",
        "El acceso al sistema implica aceptar estas condiciones, la licencia de uso, la politica de privacidad y el tratamiento de datos operativos."
      ]
    },
    {
      id: "license",
      title: "Licencia de Uso",
      summary: "El cliente adquiere una licencia de uso, no la propiedad intelectual del software.",
      body: [
        "El software, codigo fuente, arquitectura, base estructural, diseno, algoritmos, interfaces, manuales, diagramas y documentacion tecnica pertenecen exclusivamente a Grupo Rocha Solutions.",
        "Queda prohibido copiar, modificar, descompilar, distribuir, vender, alquilar, sublicenciar o reutilizar componentes sin autorizacion escrita del titular.",
        "La licencia permite usar el sistema en la instalacion contratada y para la operacion declarada por el cliente.",
        "Los cambios, extensiones, integraciones y mantenimientos quedan sujetos a autorizacion y alcance contratado."
      ]
    },
    {
      id: "privacy",
      title: "Politica de Privacidad y Datos Personales",
      summary: "Uso operativo de usuarios, clientes, pedidos, cobranzas, GPS, auditoria, IP y dispositivos.",
      body: [
        "El sistema podra registrar usuarios, clientes, pedidos, productos, cobros, comprobantes, GPS, horarios, auditoria, direcciones IP y dispositivos.",
        "La informacion sera utilizada unicamente para fines operativos, administrativos, logisticos, comerciales, soporte tecnico y seguridad del sistema.",
        "La informacion cargada por el cliente sera tratada como confidencial.",
        "El desarrollador solo accedera a la informacion cuando exista autorizacion, necesidad de soporte o mantenimiento contratado."
      ]
    },
    {
      id: "gps",
      title: "Uso del GPS",
      summary: "Seguimiento de preventistas y repartidores durante la sesion laboral activa.",
      body: [
        "La geolocalizacion se utilizara durante la sesion activa y mientras el usuario se encuentre realizando tareas laborales.",
        "El GPS permite seguimiento de preventistas, seguimiento de repartidores, optimizacion de rutas, auditoria de recorridos y validacion de visitas.",
        "Al cerrar sesion debera detenerse el seguimiento de ubicacion desde la aplicacion.",
        "Si el GPS se encuentra desactivado, bloqueado o con precision insuficiente, el sistema podra advertir al usuario y a Administracion."
      ]
    },
    {
      id: "legal-notice",
      title: "Avisos Legales",
      summary: "Derechos de autor, confidencialidad, seguridad y prohibiciones de reproduccion.",
      body: [
        COPYRIGHT_TEXT,
        "Software protegido por derechos de autor. Prohibida su reproduccion total o parcial sin autorizacion expresa del titular.",
        "La informacion registrada en el sistema forma parte de la operatoria interna del cliente y debe ser manipulada solo por usuarios autorizados.",
        "Las nuevas versiones de estos documentos podran requerir una nueva aceptacion electronica por parte de cada usuario."
      ]
    }
  ];

  const DEFAULT_HELP_TOPICS = [
    {
      id: "dashboard",
      module: "Tablero",
      roles: ["admin"],
      title: "Lectura del tablero operativo",
      keywords: ["dashboard", "tablero", "indicadores", "pedidos", "ventas"],
      steps: [
        "Revisar pedidos por estado y alertas criticas.",
        "Controlar transferencias pendientes, stock critico y deuda de clientes.",
        "Abrir cada indicador para llegar al listado filtrado correspondiente."
      ]
    },
    {
      id: "preventa",
      module: "Preventa",
      roles: ["seller", "admin"],
      title: "Carga de pedido desde preventa movil",
      keywords: ["preventa", "vendedor", "cliente", "pedido", "sin compra", "gps"],
      steps: [
        "Seleccionar cliente de la cartera asignada o registrar cliente nuevo con telefono, direccion y GPS.",
        "Agregar productos, revisar stock disponible y confirmar pedido.",
        "Si el cliente no compra, registrar motivo obligatorio para estadisticas comerciales."
      ]
    },
    {
      id: "pedidos",
      module: "Pedidos y armado",
      roles: ["admin"],
      title: "Gestion de pedidos y deposito",
      keywords: ["pedido", "armado", "etiqueta", "despacho", "estado"],
      steps: [
        "Filtrar pedidos por cliente, zona, vendedor o estado.",
        "Imprimir factura/guia de armado, generar etiquetas y avanzar estados segun control de deposito.",
        "Usar acciones masivas cuando haya varios pedidos seleccionados."
      ]
    },
    {
      id: "reparto",
      module: "Reparto",
      roles: ["driver", "admin"],
      title: "Ruta, entrega y cobranza",
      keywords: ["reparto", "ruta", "cobro", "transferencia", "efectivo", "gps"],
      steps: [
        "Tomar una ruta publicada y seguir el orden definido por Administracion.",
        "Usar Ir al cliente para abrir navegacion externa.",
        "Al entregar, registrar cobranza, comprobante si corresponde, fotos, firma o motivo de no entrega."
      ]
    },
    {
      id: "cuentas",
      module: "Cuentas corrientes",
      roles: ["admin"],
      title: "Control de saldos y transferencias",
      keywords: ["cuenta", "cobranza", "transferencia", "validacion", "saldo"],
      steps: [
        "Revisar saldo actual, vencido y movimientos pendientes.",
        "Cargar comprobantes recibidos sin cancelar deuda automaticamente.",
        "Validar la transferencia solo cuando el dinero impacto en banco."
      ]
    },
    {
      id: "stock",
      module: "Stock y control fisico",
      roles: ["admin", "receiver"],
      title: "Stock disponible y stock fisico",
      keywords: ["stock", "inventario", "remito", "proveedor", "recepcion"],
      steps: [
        "Usar Stock para consultar disponibilidad de venta.",
        "Usar Control Stock para inventario fisico esperado en deposito.",
        "Recepcion solo carga proveedor, cantidades y foto del remito; Administracion valida impacto final."
      ]
    },
    {
      id: "admin",
      module: "Administracion",
      roles: ["admin"],
      title: "Auditoria, usuarios y configuracion",
      keywords: ["administracion", "usuarios", "auditoria", "sesiones", "licencia"],
      steps: [
        "Consultar auditoria global para ver cambios por usuario, IP, dispositivo y GPS.",
        "Controlar sesiones activas y forzar cierre si un dispositivo queda retenido.",
        "Revisar licencia, integridad y diagnostico tecnico antes de soporte."
      ]
    },
    {
      id: "legal",
      module: "Legal",
      roles: ["admin", "seller", "driver", "receiver"],
      title: "Documentos legales y aceptacion",
      keywords: ["legal", "terminos", "licencia", "privacidad", "gps"],
      steps: [
        "Leer terminos, licencia, privacidad, tratamiento de datos y uso del GPS.",
        "Aceptar la version vigente para poder acceder al sistema.",
        "Administracion puede consultar evidencias e historial de versiones."
      ]
    }
  ];

  const DEFAULT_RELEASE_NOTES = [
    { version: "8790-71", date: "2026-07-28", title: "Preventa movil por plantillas", text: "Frente de preventa reorganizado en Pedido, Cliente nuevo y Estado, conservando boton Volver y proteccion del back nativo Android." },
    { version: "8790-70", date: "2026-07-28", title: "Boton Volver Android", text: "Boton Volver interno y proteccion del back nativo Android. El frente movil fue simplificado luego en v71." },
    { version: "8790-69", date: "2026-07-27", title: "Impresion inteligente y branding institucional", text: "Hoja de armado con bultos, control, QR visual, auditoria de impresion y presencia discreta de Grupo Rocha Solutions." },
    { version: "8790-68", date: "2026-07-27", title: "Legal, ayuda y acerca del sistema", text: "Aceptacion obligatoria de terminos, centro de ayuda integrado y pantalla de informacion tecnica." },
    { version: "8790-67", date: "2026-07-24", title: "Comisiones configurables", text: "Reglas por rol, usuario, rubro, producto y vigencia." },
    { version: "8790-52", date: "2026-07-13", title: "Control de Stock Fisico", text: "Separacion entre stock disponible y stock fisico esperado para inventario." }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
    if (value && typeof value === "object") {
      return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  function fallbackHash(text) {
    let hash = 2166136261;
    const input = String(text || "");
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
  }

  function hashDocuments(documents) {
    const payload = stableStringify(documents || []);
    if (cryptoModule && typeof cryptoModule.createHash === "function") {
      return cryptoModule.createHash("sha256").update(payload, "utf8").digest("hex");
    }
    return fallbackHash(payload);
  }

  function defaultLegalSettings() {
    const documents = clone(DEFAULT_LEGAL_DOCUMENTS);
    return {
      currentVersion: CURRENT_LEGAL_VERSION,
      title: "Terminos, Licencia y Privacidad",
      publishedAt: "2026-07-27T00:00:00.000Z",
      publishedBy: "Grupo Rocha Solutions",
      documents,
      hash: hashDocuments(documents),
      history: [{
        version: CURRENT_LEGAL_VERSION,
        title: "Terminos, Licencia y Privacidad",
        publishedAt: "2026-07-27T00:00:00.000Z",
        publishedBy: "Grupo Rocha Solutions",
        hash: hashDocuments(documents),
        summary: "Version inicial con licencia de uso, privacidad, GPS y avisos legales."
      }]
    };
  }

  function migrateState(state) {
    if (!state || typeof state !== "object") return state;
    const baseLegal = defaultLegalSettings();
    state.legalSettings = state.legalSettings && typeof state.legalSettings === "object" ? state.legalSettings : {};
    state.legalSettings.currentVersion = state.legalSettings.currentVersion || baseLegal.currentVersion;
    state.legalSettings.title = state.legalSettings.title || baseLegal.title;
    state.legalSettings.publishedAt = state.legalSettings.publishedAt || baseLegal.publishedAt;
    state.legalSettings.publishedBy = state.legalSettings.publishedBy || baseLegal.publishedBy;
    state.legalSettings.documents = Array.isArray(state.legalSettings.documents) && state.legalSettings.documents.length
      ? state.legalSettings.documents
      : clone(baseLegal.documents);
    state.legalSettings.hash = hashDocuments(state.legalSettings.documents);
    state.legalSettings.history = Array.isArray(state.legalSettings.history) && state.legalSettings.history.length
      ? state.legalSettings.history
      : clone(baseLegal.history);
    state.legalAcceptances = Array.isArray(state.legalAcceptances) ? state.legalAcceptances : [];
    state.legalAudit = Array.isArray(state.legalAudit) ? state.legalAudit : [];
    state.helpCenter = state.helpCenter && typeof state.helpCenter === "object" ? state.helpCenter : {};
    state.helpCenter.topics = Array.isArray(state.helpCenter.topics) && state.helpCenter.topics.length
      ? state.helpCenter.topics
      : clone(DEFAULT_HELP_TOPICS);
    state.helpCenter.tourCompletions = Array.isArray(state.helpCenter.tourCompletions) ? state.helpCenter.tourCompletions : [];
    state.helpCenter.feedback = Array.isArray(state.helpCenter.feedback) ? state.helpCenter.feedback : [];
    state.aboutSystem = state.aboutSystem && typeof state.aboutSystem === "object" ? state.aboutSystem : {};
    state.aboutSystem.name = state.aboutSystem.name || "Sistema de Gestion Distribuidora Lopez";
    state.aboutSystem.developer = state.aboutSystem.developer || "Grupo Rocha Solutions";
    state.aboutSystem.support = state.aboutSystem.support || "WhatsApp soporte";
    state.aboutSystem.buildDate = state.aboutSystem.buildDate || "2026-07-27";
    state.aboutSystem.lastUpdate = "2026-07-27";
    state.aboutSystem.supportContact = state.aboutSystem.supportContact || {
      website: "https://gruporochasolutions.com",
      email: "soporte@gruporochasolutions.com",
      phone: "+54 9 351 241 0535",
      hours: "Lunes a viernes de 9 a 18 hs"
    };
    state.aboutSystem.releaseNotes = Array.isArray(state.aboutSystem.releaseNotes) && state.aboutSystem.releaseNotes.length
      ? state.aboutSystem.releaseNotes
      : clone(DEFAULT_RELEASE_NOTES);
    if (!state.aboutSystem.releaseNotes.some((item) => item.version === "8790-71")) {
      state.aboutSystem.releaseNotes.unshift(clone(DEFAULT_RELEASE_NOTES[0]));
    }
    return state;
  }

  function publicLegalPacket(state) {
    migrateState(state);
    return {
      currentVersion: state.legalSettings.currentVersion,
      title: state.legalSettings.title,
      publishedAt: state.legalSettings.publishedAt,
      publishedBy: state.legalSettings.publishedBy,
      hash: state.legalSettings.hash,
      documents: clone(state.legalSettings.documents),
      history: clone(state.legalSettings.history || [])
    };
  }

  function userAcceptedCurrent(state, username) {
    migrateState(state);
    const normalized = String(username || "").trim().toLowerCase();
    return state.legalAcceptances.some((item) => String(item.username || "").trim().toLowerCase() === normalized
      && item.version === state.legalSettings.currentVersion
      && item.hash === state.legalSettings.hash
      && item.revoked !== true);
  }

  function acceptanceIsValid(state, input) {
    migrateState(state);
    return Boolean(input
      && input.accepted === true
      && input.version === state.legalSettings.currentVersion
      && input.hash === state.legalSettings.hash);
  }

  function registerAcceptance(state, user, evidence) {
    migrateState(state);
    const at = evidence.at || new Date().toISOString();
    const record = {
      id: evidence.id || `LEGAL-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      at,
      date: evidence.date || "",
      time: evidence.time || "",
      username: user.username,
      user: user.name,
      role: user.role,
      ip: evidence.ip || "",
      device: evidence.device || null,
      gps: evidence.gps || null,
      userAgent: evidence.userAgent || "",
      version: state.legalSettings.currentVersion,
      hash: state.legalSettings.hash,
      title: state.legalSettings.title,
      accepted: true
    };
    state.legalAcceptances = state.legalAcceptances.filter((item) => !(String(item.username || "").toLowerCase() === String(user.username || "").toLowerCase()
      && item.version === record.version
      && item.hash === record.hash));
    state.legalAcceptances.unshift(record);
    state.legalAudit.unshift({
      id: `LEGAUD-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      at,
      action: "TERMINOS_ACEPTADOS",
      username: user.username,
      user: user.name,
      role: user.role,
      ip: record.ip,
      device: record.device,
      gps: record.gps,
      version: record.version,
      hash: record.hash,
      note: "Aceptacion electronica obligatoria registrada."
    });
    return record;
  }

  function publishLegalVersion(state, input, user) {
    migrateState(state);
    const previous = clone(state.legalSettings);
    const documents = Array.isArray(input.documents) && input.documents.length
      ? input.documents.map((doc) => ({
        id: String(doc.id || "").trim() || `doc-${Math.random().toString(16).slice(2, 8)}`,
        title: String(doc.title || "").trim() || "Documento legal",
        summary: String(doc.summary || "").trim(),
        body: Array.isArray(doc.body) ? doc.body.map((line) => String(line || "").trim()).filter(Boolean) : String(doc.body || "").split(/\n+/).map((line) => line.trim()).filter(Boolean)
      }))
      : clone(previous.documents);
    const nextVersion = String(input.version || "").trim() || `LEGAL-${new Date().toISOString().slice(0, 10)}-${Date.now()}`;
    const hash = hashDocuments(documents);
    state.legalSettings = {
      currentVersion: nextVersion,
      title: String(input.title || previous.title || "Terminos legales").trim(),
      publishedAt: new Date().toISOString(),
      publishedBy: user && user.name || "Administracion",
      documents,
      hash,
      history: [
        {
          version: nextVersion,
          title: String(input.title || previous.title || "Terminos legales").trim(),
          publishedAt: new Date().toISOString(),
          publishedBy: user && user.name || "Administracion",
          hash,
          summary: String(input.summary || input.motive || "Nueva version legal publicada.").trim()
        },
        ...(previous.history || [])
      ].slice(0, 50)
    };
    state.legalAudit.unshift({
      id: `LEGAUD-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      at: new Date().toISOString(),
      action: "TERMINOS_PUBLICADOS",
      username: user && user.username || "",
      user: user && user.name || "Administracion",
      role: user && user.role || "admin",
      version: nextVersion,
      hash,
      previousVersion: previous.currentVersion,
      note: String(input.motive || input.summary || "Nueva version publicada.").trim()
    });
    return state.legalSettings;
  }

  function completeTour(state, user, topicId) {
    migrateState(state);
    const completion = {
      id: `HELP-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
      at: new Date().toISOString(),
      username: user.username,
      user: user.name,
      role: user.role,
      topicId: String(topicId || "general")
    };
    state.helpCenter.tourCompletions.unshift(completion);
    state.helpCenter.tourCompletions = state.helpCenter.tourCompletions.slice(0, 1000);
    return completion;
  }

  return {
    CURRENT_LEGAL_VERSION,
    COPYRIGHT_TEXT,
    DEFAULT_LEGAL_DOCUMENTS,
    DEFAULT_HELP_TOPICS,
    DEFAULT_RELEASE_NOTES,
    defaultLegalSettings,
    hashDocuments,
    migrateState,
    publicLegalPacket,
    userAcceptedCurrent,
    acceptanceIsValid,
    registerAcceptance,
    publishLegalVersion,
    completeTour
  };
});
