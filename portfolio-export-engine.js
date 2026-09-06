(function initPortfolioExportEngine(root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  if (root) root.DLPortfolioExportEngine = engine;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildPortfolioExportEngine() {
  "use strict";

  function numeric(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function text(value, fallback = "-") {
    const result = String(value ?? "").trim();
    return result || fallback;
  }

  function compact(value, max = 44) {
    const result = text(value).replace(/\s+/g, " ");
    return result.length > max ? `${result.slice(0, Math.max(1, max - 3))}...` : result;
  }

  function money(value) {
    return `$ ${Math.round(numeric(value, 0) * 100) / 100}`;
  }

  function clientDays(client) {
    if (Array.isArray(client.dias_visita) && client.dias_visita.length) return client.dias_visita.join("/");
    return text(client.dia_visita, "Sin dia");
  }

  function clientPdfLines(clients) {
    return [...(clients || [])]
      .sort((left, right) => text(left.name || left.nombre_comercial).localeCompare(text(right.name || right.nombre_comercial), "es", { sensitivity: "base" }))
      .flatMap((client, index) => {
        const name = text(client.name || client.nombre_comercial, "Cliente");
        const code = text(client.codigo_cliente || client.id, "S/C");
        const seller = text(client.seller || client.vendedor_asignado, "Sin vendedor");
        const route = text(client.ruta || client.route, "Sin ruta");
        const zone = text(client.zona || client.zone, "Sin zona");
        const status = text(client.estado || client.status, "Activo");
        const gps = Number.isFinite(Number(client.latitud)) && Number.isFinite(Number(client.longitud))
          ? `${client.latitud},${client.longitud}`
          : "Sin GPS";
        return [
          `${index + 1}. ${code} | ${compact(name, 50)} | CUIT ${text(client.cuit, "S/D")} | ${text(client.telefono, "Sin tel.")}`,
          `   ${compact(client.domicilio || client.address, 58)} | ${text(client.localidad, "S/L")} | ${zone} | ${route}`,
          `   Vendedor ${seller} | Dias ${clientDays(client)} | Horario ${compact(client.horario_atencion, 45)} | ${status}`,
          `   Pago ${text(client.forma_pago, "Sin informar")} | Saldo ${money(client.balance ?? client.saldo_actual)} | GPS ${gps}`
        ];
      });
  }

  function productPrice(product, number) {
    return numeric(product[`precio_lista_${number}`] ?? product[`priceList${number}`] ?? (number === 2 ? product.price : 0), 0);
  }

  function isProductActive(product) {
    const value = product?.activo ?? product?.active ?? "SI";
    if (typeof value === "boolean") return value;
    return !["NO", "INACTIVO", "FALSE", "0"].includes(String(value).trim().toUpperCase());
  }

  function productPdfLines(products) {
    return [...(products || [])]
      .sort((left, right) => text(left.name || left.descripcion).localeCompare(text(right.name || right.descripcion), "es", { sensitivity: "base" }))
      .flatMap((product, index) => {
        const name = text(product.name || product.descripcion, "Producto");
        const code = text(product.codigo_producto || product.id, "S/C");
        const barcode = text(product.codigo_barras, "Sin EAN");
        const supplier = text(product.proveedor || product.supplier, "Sin proveedor");
        const status = isProductActive(product) ? "Activo" : "Inactivo";
        const stock = numeric(product.stock_disponible ?? product.stock_actual ?? product.stock, 0);
        return [
          `${index + 1}. ${code} | ${compact(name, 55)} | EAN ${barcode}`,
          `   ${text(product.rubro, "S/D")} | ${text(product.marca, "S/D")} | Proveedor ${compact(supplier, 42)} | ${status}`,
          `   Costo ${money(product.costo ?? product.cost)} | Stock ${stock} | Unidad ${text(product.unidad_venta || product.unit, "unidad")}`,
          `   L1 ${money(productPrice(product, 1))} | L2 ${money(productPrice(product, 2))} | L3 ${money(productPrice(product, 3))} | L4 ${money(productPrice(product, 4))} | L5 ${money(productPrice(product, 5))}`
        ];
      });
  }

  return { clientPdfLines, productPdfLines, productPrice, isProductActive };
});
