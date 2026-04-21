CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT NOT NULL,
  id_type TEXT NOT NULL DEFAULT 'ktp',
  address TEXT,
  notes TEXT,
  total_bookings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  plate_number TEXT NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  ownership TEXT NOT NULL DEFAULT 'internal',
  partner_name TEXT,
  daily_rate NUMERIC(15,2) NOT NULL,
  profit_share_percent NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  rental_type TEXT NOT NULL DEFAULT 'self_drive',
  status TEXT NOT NULL DEFAULT 'pending',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  start_km INTEGER,
  end_km INTEGER,
  base_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  late_fee NUMERIC(15,2) DEFAULT 0,
  wash_fee NUMERIC(15,2) DEFAULT 0,
  damage_fee NUMERIC(15,2) DEFAULT 0,
  other_fee NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id),
  invoice_number TEXT NOT NULL UNIQUE,
  amount NUMERIC(15,2) NOT NULL,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unpaid',
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  cost NUMERIC(15,2),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  related_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (username, name, password_hash, role)
SELECT 'admin', 'Administrator', 'change-me', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE username = 'admin'
);

INSERT INTO vehicles (name, plate_number, year, color, status, ownership, daily_rate, notes)
SELECT 'Toyota Avanza 1.5 G', 'B1234CD', 2023, 'Hitam', 'available', 'internal', 350000, 'Seed default vehicle'
WHERE NOT EXISTS (
  SELECT 1 FROM vehicles WHERE plate_number = 'B1234CD'
);

INSERT INTO customers (name, phone, email, id_number, id_type, address)
SELECT 'Andi Saputra', '081234567890', 'andi@example.com', '3174010101010001', 'ktp', 'Jl. Melati No. 12, Jakarta'
WHERE NOT EXISTS (
  SELECT 1 FROM customers WHERE id_number = '3174010101010001'
);