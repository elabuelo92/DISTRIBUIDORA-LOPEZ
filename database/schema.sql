CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,
  name VARCHAR(80) NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  area VARCHAR(80),
  role_id INTEGER NOT NULL REFERENCES roles(id),
  seller_id INTEGER NULL,
  password_hash TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sellers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  route VARCHAR(160) NOT NULL,
  commission_rate NUMERIC(6, 4) NOT NULL DEFAULT 0.0300,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  cuit VARCHAR(20),
  address VARCHAR(240),
  phone VARCHAR(80),
  tax_condition VARCHAR(80),
  payment_method VARCHAR(80),
  client_type VARCHAR(80),
  zone VARCHAR(120) NOT NULL,
  seller_id INTEGER REFERENCES sellers(id),
  status VARCHAR(40) NOT NULL DEFAULT 'Activo',
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  credit_limit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  average_ticket NUMERIC(14, 2) NOT NULL DEFAULT 0,
  purchase_frequency_days INTEGER,
  last_visit_at TIMESTAMP NULL
);

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  cuit VARCHAR(20),
  address VARCHAR(240),
  phone VARCHAR(80),
  tax_condition VARCHAR(80),
  contact VARCHAR(200),
  sector VARCHAR(120),
  payment_terms VARCHAR(160),
  current_price_list_date DATE,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(80) UNIQUE,
  barcode VARCHAR(80),
  category VARCHAR(120),
  brand VARCHAR(120),
  stock NUMERIC(14, 2) NOT NULL DEFAULT 0,
  min_stock NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  rotation_days INTEGER,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  seller_id INTEGER NOT NULL REFERENCES sellers(id),
  channel VARCHAR(40) NOT NULL DEFAULT 'preventa',
  status VARCHAR(40) NOT NULL DEFAULT 'Recibido',
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  discount_authorized_by INTEGER REFERENCES users(id),
  print_requested BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity NUMERIC(14, 2) NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  subtotal NUMERIC(14, 2) NOT NULL
);

CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  movement_type VARCHAR(40) NOT NULL,
  quantity NUMERIC(14, 2) NOT NULL,
  reference VARCHAR(160),
  user_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE account_movements (
  id SERIAL PRIMARY KEY,
  movement_date DATE NOT NULL,
  account_type VARCHAR(40) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  client_id INTEGER REFERENCES clients(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  method VARCHAR(80),
  external_reference VARCHAR(160),
  debit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(14, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  supplier_id INTEGER REFERENCES suppliers(id),
  order_id INTEGER REFERENCES orders(id),
  payment_type VARCHAR(40) NOT NULL,
  method VARCHAR(80) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  reference VARCHAR(160),
  merchandise_description TEXT,
  received_by INTEGER REFERENCES users(id),
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  status VARCHAR(40) NOT NULL DEFAULT 'Pendiente',
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  requested_by INTEGER REFERENCES users(id),
  authorized_by INTEGER REFERENCES users(id),
  authorized_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity NUMERIC(14, 2) NOT NULL,
  unit_cost NUMERIC(14, 2) NOT NULL,
  subtotal NUMERIC(14, 2) NOT NULL
);

CREATE TABLE price_lists (
  id SERIAL PRIMARY KEY,
  supplier_id INTEGER REFERENCES suppliers(id),
  name VARCHAR(160) NOT NULL,
  valid_from DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE price_list_items (
  id SERIAL PRIMARY KEY,
  price_list_id INTEGER NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  cost NUMERIC(14, 2) NOT NULL,
  suggested_price NUMERIC(14, 2)
);

CREATE TABLE inventory_counts (
  id SERIAL PRIMARY KEY,
  count_date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Abierto',
  created_by INTEGER REFERENCES users(id),
  closed_by INTEGER REFERENCES users(id),
  closed_at TIMESTAMP NULL
);

CREATE TABLE inventory_count_items (
  id SERIAL PRIMARY KEY,
  inventory_count_id INTEGER NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  system_stock NUMERIC(14, 2) NOT NULL,
  physical_stock NUMERIC(14, 2) NOT NULL,
  difference NUMERIC(14, 2) NOT NULL,
  notes TEXT
);

CREATE TABLE vehicles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  plate VARCHAR(40),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE delivery_routes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  zone VARCHAR(120) NOT NULL,
  weekday VARCHAR(40),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE delivery_trips (
  id SERIAL PRIMARY KEY,
  route_id INTEGER REFERENCES delivery_routes(id),
  vehicle_id INTEGER REFERENCES vehicles(id),
  driver_id INTEGER REFERENCES users(id),
  assistant_id INTEGER REFERENCES users(id),
  status VARCHAR(40) NOT NULL DEFAULT 'Preparacion',
  started_at TIMESTAMP NULL,
  closed_at TIMESTAMP NULL
);

CREATE TABLE delivery_trip_orders (
  id SERIAL PRIMARY KEY,
  delivery_trip_id INTEGER NOT NULL REFERENCES delivery_trips(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  status VARCHAR(40) NOT NULL DEFAULT 'Pendiente',
  delivered_at TIMESTAMP NULL,
  notes TEXT
);

CREATE TABLE delivery_collections (
  id SERIAL PRIMARY KEY,
  delivery_trip_id INTEGER NOT NULL REFERENCES delivery_trips(id) ON DELETE CASCADE,
  payment_id INTEGER NOT NULL REFERENCES payments(id),
  reported_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE returns (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity NUMERIC(14, 2) NOT NULL,
  reason VARCHAR(160),
  returned_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE commercial_goals (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER REFERENCES sellers(id),
  zone VARCHAR(120),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_amount NUMERIC(14, 2) NOT NULL,
  created_by INTEGER REFERENCES users(id)
);

CREATE TABLE promotions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  authorized_by INTEGER REFERENCES users(id),
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE seller_locations (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  source VARCHAR(40) NOT NULL,
  reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle_locations (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  source VARCHAR(40) NOT NULL,
  reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  entity VARCHAR(120),
  entity_id VARCHAR(80),
  payload_json TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
