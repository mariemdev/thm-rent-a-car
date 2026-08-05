import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import pg from 'pg';
const { Pool } = pg;
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'thm_rent_a_car',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
});

const JWT_SECRET = "super-secret-key";

// Migration: Add missing columns to rentals if they don't exist
const columnsToAdd = [
  "customer_id_issued_date",
  "customer_id_issued_at",
  "customer_birth_date",
  "customer_birth_place",
  "customer_address",
  "customer_profession",
  "customer_license_number",
  "customer_license_issued_date",
  "customer_license_issued_at",
  "second_driver_name",
  "second_driver_id_number",
  "second_driver_id_issued_date",
  "second_driver_id_issued_at",
  "second_driver_birth_date",
  "second_driver_birth_place",
  "second_driver_address",
  "second_driver_phone",
  "second_driver_profession",
  "second_driver_license_number",
  "second_driver_license_issued_date",
  "second_driver_license_issued_at",
  "departure_place",
  "departure_time",
  "return_place",
  "return_time",
  "prolongation_date",
  "prolongation_place",
  "prolongation_time",
  "km_depart",
  "km_retour",
  "km_parcouru",
  "km_factures",
  "payment_mode",
  "deposit_amount",
  "tax_id",
  "fuel_level",
  "car_condition_notes",
  "start_date",
  "end_date",
  "daily_price",
  "deposit",
  "vat",
  "stamp_duty",
  "other_charges",
  "total_price",
  "car_id",
  "branch_id",
  "agent_id",
  "driver_id",
  "status",
  "min_age_confirmed",
  "license_duration_confirmed",
  "excess_km_price",
  "km_allowance",
  "has_second_driver",
  "customer_id",
  "customer_type",
  "is_client_first_driver",
  "amount_paid",
  "amount_remaining",
  "is_damaged",
  "damage_deduction",
  "created_by_id",
  "contract_number",
  "customer_id_type",
  "lease_group_number",
  "lease_suffix",
  "rental_days",
  "is_rental_days_overridden"
];

// Migration: Add missing columns to rentals if they don't exist
columnsToAdd.forEach(column => {
  try {
    db.prepare(`ALTER TABLE rentals ADD COLUMN ${column} TEXT`).run();
    console.log(`Added column ${column} to rentals table`);
  } catch (e) {
    // Column likely already exists
  }
});

// Migration: Fix rentals table foreign keys and NOT NULL constraints if needed
try {
  const fkList = db.prepare("PRAGMA foreign_key_list(rentals)").all() as any[];
  const driverIdFk = fkList.find(fk => fk.from === 'driver_id');
  
  const tableInfoRentals = db.prepare("PRAGMA table_info(rentals)").all() as any[];
  const customerIdNumberCol = tableInfoRentals.find(c => c.name === 'customer_id_number');
  const needsNotNullFix = customerIdNumberCol && customerIdNumberCol.notnull === 1;

  if ((driverIdFk && driverIdFk.table === 'drivers') || needsNotNullFix) {
    console.log("Fixing rentals table schema (foreign keys or NOT NULL constraints)...");
    db.transaction(() => {
      // 1. Create temporary table with correct schema
      db.exec(`
        CREATE TABLE rentals_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_name TEXT,
          customer_phone TEXT,
          customer_id_type TEXT,
          customer_id_number TEXT,
          customer_id_issued_date TEXT,
          customer_id_issued_at TEXT,
          customer_birth_date TEXT,
          customer_birth_place TEXT,
          customer_address TEXT,
          customer_profession TEXT,
          customer_license_number TEXT,
          customer_license_issued_date TEXT,
          customer_license_issued_at TEXT,
          
          second_driver_name TEXT,
          second_driver_id_number TEXT,
          second_driver_id_issued_date TEXT,
          second_driver_id_issued_at TEXT,
          second_driver_birth_date TEXT,
          second_driver_birth_place TEXT,
          second_driver_address TEXT,
          second_driver_phone TEXT,
          second_driver_profession TEXT,
          second_driver_license_number TEXT,
          second_driver_license_issued_date TEXT,
          second_driver_license_issued_at TEXT,

          departure_place TEXT,
          departure_time TEXT,
          return_place TEXT,
          return_time TEXT,
          
          prolongation_date TEXT,
          prolongation_place TEXT,
          prolongation_time TEXT,

          km_depart INTEGER,
          km_retour INTEGER,
          km_parcouru INTEGER,
          km_factures INTEGER,

          payment_mode TEXT,
          deposit_amount REAL,

          tax_id TEXT,
          other_charges REAL DEFAULT 0,
          vat REAL DEFAULT 0,
          stamp_duty REAL DEFAULT 0,

          fuel_level INTEGER DEFAULT 0,
          car_condition_notes TEXT,

          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          total_price REAL NOT NULL,
          daily_price REAL NOT NULL,
          deposit REAL DEFAULT 0,
          current_mileage INTEGER DEFAULT 0,
          car_id INTEGER NOT NULL,
          branch_id INTEGER NOT NULL,
          agent_id INTEGER NOT NULL,
          driver_id INTEGER,
          has_second_driver INTEGER DEFAULT 0,
          rental_days TEXT,
          is_rental_days_overridden INTEGER DEFAULT 0,
          status TEXT DEFAULT 'active',
          state_photos TEXT, -- JSON string
          return_date TEXT,
          return_mileage INTEGER,
          return_photos TEXT, -- JSON string
          min_age_confirmed INTEGER DEFAULT 0,
          license_duration_confirmed INTEGER DEFAULT 0,
          excess_km_price REAL DEFAULT 5,
          km_allowance INTEGER DEFAULT 280,
          customer_id INTEGER,
          is_client_first_driver INTEGER DEFAULT 0,
          amount_paid REAL DEFAULT 0,
          amount_remaining REAL DEFAULT 0,
          customer_type TEXT,
          is_damaged INTEGER DEFAULT 0,
          damage_deduction REAL DEFAULT 0,
          fuel_total_bars INTEGER DEFAULT 8,
          fuel_depart_bars INTEGER DEFAULT 8,
          fuel_return_bars INTEGER,
          created_by_id INTEGER,
          contract_number TEXT,
          second_driver_id INTEGER,
          lease_group_number TEXT,
          lease_suffix TEXT,
          FOREIGN KEY (car_id) REFERENCES cars(id),
          FOREIGN KEY (branch_id) REFERENCES branches(id),
          FOREIGN KEY (agent_id) REFERENCES users(id),
          FOREIGN KEY (driver_id) REFERENCES customers(id),
          FOREIGN KEY (customer_id) REFERENCES customers(id),
          FOREIGN KEY (second_driver_id) REFERENCES customers(id)
        )
      `);

      // 2. Identify common columns between old and new
      const tableInfo = db.prepare("PRAGMA table_info(rentals)").all() as any[];
      const existingColumns = tableInfo.map(c => c.name);
      
      const targetTableInfo = db.prepare("PRAGMA table_info(rentals_new)").all() as any[];
      const targetColumns = targetTableInfo.map(c => c.name);
      
      const commonColumns = existingColumns.filter(c => targetColumns.includes(c) && c !== 'id');
      const colStr = commonColumns.join(', ');

      // 3. Copy data
      db.exec(`INSERT INTO rentals_new (${colStr}) SELECT ${colStr} FROM rentals`);

      // 4. Replace table
      db.exec("DROP TABLE rentals");
      db.exec("ALTER TABLE rentals_new RENAME TO rentals");
    })();
    console.log("Rentals table recreated with correct foreign keys.");
  }
} catch (e) {
  console.error("Migration error for rentals table:", e);
}

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    agency_id INTEGER,
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
  );

  CREATE TABLE IF NOT EXISTS colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    agency_id INTEGER,
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
  );

  CREATE TABLE IF NOT EXISTS agencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT
  );

  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    agency_id INTEGER NOT NULL,
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('superadmin', 'admin', 'manager', 'agent')),
    agency_id INTEGER,
    branch_id INTEGER,
    created_by_id INTEGER,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    reset_token TEXT,
    reset_token_expiry TEXT,
    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (created_by_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('individual', 'company')),
    name TEXT NOT NULL, -- raison_sociale for company
    first_name TEXT,
    birth_date TEXT,
    birth_place TEXT,
    nationality TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    observation TEXT,
    id_type TEXT,
    id_number TEXT,
    id_issued_date TEXT,
    id_issued_place TEXT,
    id_expiry_date TEXT,
    license_number TEXT,
    license_issued_date TEXT,
    license_issued_place TEXT,
    license_expiry_date TEXT,
    agency_id INTEGER NOT NULL,
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
  );

  CREATE TABLE IF NOT EXISTS cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    registration TEXT UNIQUE NOT NULL,
    mileage INTEGER DEFAULT 0,
    fuel_type TEXT,
    fuel_total_bars INTEGER DEFAULT 8,
    fuel_current_bars INTEGER DEFAULT 8,
    daily_price REAL DEFAULT 0,
    oil_change_mileage INTEGER DEFAULT 0,
    insurance_start_date TEXT,
    insurance_expiry_date TEXT,
    technical_inspection_start_date TEXT,
    technical_inspection_expiry_date TEXT,
    last_oil_change_mileage INTEGER DEFAULT 0,
    next_oil_change_mileage INTEGER DEFAULT 0,
    last_oil_change_date TEXT,
    vignette_expiry_date TEXT,
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'rented', 'maintenance', 'archived')),
    images TEXT, -- JSON string
    year INTEGER,
    transmission TEXT,
    power TEXT,
    color TEXT,
    seats INTEGER,
    category TEXT,
    parking_location TEXT,
    chassis_number TEXT,
    abs INTEGER DEFAULT 0,
    alarm INTEGER DEFAULT 0,
    fog_lights INTEGER DEFAULT 0,
    ac INTEGER DEFAULT 0,
    power_steering INTEGER DEFAULT 0,
    is_sold INTEGER DEFAULT 0,
    sale_date TEXT,
    exploitation_start_date TEXT,
    exploitation_end_date TEXT,
    agency_id INTEGER NOT NULL,
    branch_id INTEGER,
    FOREIGN KEY (agency_id) REFERENCES agencies(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT,
    customer_phone TEXT,
    customer_id_type TEXT,
    customer_id_number TEXT,
    customer_id_issued_date TEXT,
    customer_id_issued_at TEXT,
    customer_birth_date TEXT,
    customer_birth_place TEXT,
    customer_address TEXT,
    customer_profession TEXT,
    customer_license_number TEXT,
    customer_license_issued_date TEXT,
    customer_license_issued_at TEXT,
    
    second_driver_name TEXT,
    second_driver_id_number TEXT,
    second_driver_id_issued_date TEXT,
    second_driver_id_issued_at TEXT,
    second_driver_birth_date TEXT,
    second_driver_birth_place TEXT,
    second_driver_address TEXT,
    second_driver_phone TEXT,
    second_driver_profession TEXT,
    second_driver_license_number TEXT,
    second_driver_license_issued_date TEXT,
    second_driver_license_issued_at TEXT,

    departure_place TEXT,
    departure_time TEXT,
    return_place TEXT,
    return_time TEXT,
    
    prolongation_date TEXT,
    prolongation_place TEXT,
    prolongation_time TEXT,

    km_depart INTEGER,
    km_retour INTEGER,
    km_parcouru INTEGER,
    km_factures INTEGER,

    payment_mode TEXT,
    deposit_amount REAL,

    tax_id TEXT,
    other_charges REAL DEFAULT 0,
    vat REAL DEFAULT 0,
    stamp_duty REAL DEFAULT 0,

    fuel_level INTEGER DEFAULT 0,
    car_condition_notes TEXT,

    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    total_price REAL NOT NULL,
    daily_price REAL NOT NULL,
    deposit REAL DEFAULT 0,
    current_mileage INTEGER DEFAULT 0,
    car_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    driver_id INTEGER,
    has_second_driver INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    state_photos TEXT, -- JSON string
    return_date TEXT,
    return_mileage INTEGER,
    return_photos TEXT, -- JSON string
    min_age_confirmed INTEGER DEFAULT 0,
    license_duration_confirmed INTEGER DEFAULT 0,
    excess_km_price REAL DEFAULT 5,
    km_allowance INTEGER DEFAULT 280,
    customer_id INTEGER,
    is_client_first_driver INTEGER DEFAULT 0,
    amount_paid REAL DEFAULT 0,
    amount_remaining REAL DEFAULT 0,
    customer_type TEXT,
    is_damaged INTEGER DEFAULT 0,
    deposit_deduction REAL DEFAULT 0,
    fuel_total_bars INTEGER DEFAULT 8,
    fuel_depart_bars INTEGER DEFAULT 8,
    fuel_return_bars INTEGER,
    created_by_id INTEGER,
    contract_number TEXT,
    second_driver_id INTEGER, -- Added missing field
    lease_group_number TEXT,
    lease_suffix TEXT,
    FOREIGN KEY (car_id) REFERENCES cars(id),
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (agent_id) REFERENCES users(id),
    FOREIGN KEY (driver_id) REFERENCES customers(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (second_driver_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    car_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL DEFAULT 0,
    mileage INTEGER,
    FOREIGN KEY (car_id) REFERENCES cars(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    company_name TEXT,
    company_address TEXT,
    company_phone TEXT,
    company_whatsapp TEXT,
    company_mf TEXT,
    company_email TEXT,
    company_logo TEXT,
    km_allowance INTEGER DEFAULT 280,
    excess_km_price REAL DEFAULT 0.5,
    terms_fr TEXT,
    terms_ar TEXT,
    vehicle_condition_image TEXT
  );
`);

// Migration for new columns
const tables = {
  cars: [
    { name: 'fuel_type', type: 'TEXT' },
    { name: 'fuel_total_bars', type: 'INTEGER DEFAULT 8' },
    { name: 'fuel_current_bars', type: 'INTEGER DEFAULT 8' },
    { name: 'daily_price', type: 'REAL DEFAULT 0' }
  ],
  rentals: [
    { name: 'customer_id_type', type: 'TEXT' },
    { name: 'fuel_total_bars', type: 'INTEGER DEFAULT 8' },
    { name: 'fuel_depart_bars', type: 'INTEGER DEFAULT 8' },
    { name: 'fuel_return_bars', type: 'INTEGER' },
    { name: 'customer_type', type: 'TEXT' },
    { name: 'second_driver_id', type: 'INTEGER' },
    { name: 'damage_deduction', type: 'REAL DEFAULT 0' },
    { name: 'swaps', type: 'TEXT' },
    { name: 'lease_group_number', type: 'TEXT' },
    { name: 'lease_suffix', type: 'TEXT' }
  ]
};

Object.entries(tables).forEach(([table, columns]) => {
  const existingColumns = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
  const existingNames = existingColumns.map(c => c.name);
  
  columns.forEach(col => {
    if (!existingNames.includes(col.name)) {
      try {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`);
      } catch (e) {
        console.error(`Error adding column ${col.name} to ${table}:`, e);
      }
    }
  });
});

// Migration: Add missing columns to cars if they don't exist
const carColumnsToAdd = [
  "insurance_start_date",
  "insurance_expiry_date",
  "technical_inspection_start_date",
  "technical_inspection_expiry_date",
  "last_oil_change_mileage",
  "next_oil_change_mileage",
  "last_oil_change_date",
  "vignette_expiry_date",
  "vignette_start_date",
  "circulation_date",
  "exit_date",
  "oil_change_mileage",
  "year",
  "transmission",
  "power",
  "color",
  "seats",
  "category",
  "parking_location",
  "chassis_number",
  "abs",
  "alarm",
  "fog_lights",
  "ac",
  "power_steering",
  "is_sold",
  "sale_date",
  "exploitation_start_date",
  "exploitation_end_date"
];

const carInfo = db.prepare(`PRAGMA table_info(cars)`).all() as any[];
const existingCarColumns = carInfo.map(c => c.name);

for (const col of carColumnsToAdd) {
  if (!existingCarColumns.includes(col)) {
    try {
      console.log(`Adding missing column ${col} to cars table`);
      const type = col.includes('mileage') ? 'INTEGER DEFAULT 0' : 'TEXT';
      db.prepare(`ALTER TABLE cars ADD COLUMN ${col} ${type}`).run();
    } catch (e) {
      console.error(`Error adding column ${col} to cars:`, e);
    }
  }
}

// Migration: Add missing columns to customers if they don't exist
const customerColumnsToAdd = [
  "id_type",
  "id_number",
  "id_issued_date",
  "id_issued_place",
  "id_expiry_date",
  "license_number",
  "license_issued_date",
  "license_issued_place",
  "license_expiry_date",
  "nationality",
  "city",
  "postal_code",
  "observation"
];

const customerInfo = db.prepare(`PRAGMA table_info(customers)`).all() as any[];
const existingCustomerColumns = customerInfo.map(c => c.name);

for (const col of customerColumnsToAdd) {
  if (!existingCustomerColumns.includes(col)) {
    try {
      console.log(`Adding missing column ${col} to customers table`);
      db.prepare(`ALTER TABLE customers ADD COLUMN ${col} TEXT`).run();
    } catch (e) {
      console.error(`Error adding column ${col} to customers:`, e);
    }
  }
}

// Ensure users table has verification and reset columns
const userColumnsToAdd = ["is_verified", "verification_token", "reset_token", "reset_token_expiry"];
const userInfo = db.prepare(`PRAGMA table_info(users)`).all() as any[];
const existingUserColumns = userInfo.map(c => c.name);

for (const col of userColumnsToAdd) {
  if (!existingUserColumns.includes(col)) {
    try {
      console.log(`Adding missing column ${col} to users table`);
      if (col === "is_verified") {
        db.prepare(`ALTER TABLE users ADD COLUMN ${col} INTEGER DEFAULT 0`).run();
      } else {
        db.prepare(`ALTER TABLE users ADD COLUMN ${col} TEXT`).run();
      }
    } catch (e) {
      console.error(`Error adding column ${col} to users:`, e);
    }
  }
}

// Ensure pre-existing admin/superadmin accounts are verified in database
try {
  db.prepare("UPDATE users SET is_verified = 1 WHERE email IN ('superadmin@automanager.com', 'admin@automanager.com')").run();
} catch (e) {}

// Transporter and email sending helpers
function getTransporter() {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT || 465),
      secure: Number(process.env.SMTP_PORT || 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
}

async function sendVerificationEmail(email: string, name: string, token: string, baseUrl?: string) {
  const base = baseUrl || process.env.APP_URL || "http://localhost:3000";
  const verifyUrl = `${base}/verify-email?token=${token}`;
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.SMTP_USER || "roukayabel01@gmail.com",
    to: email,
    subject: "Vérification de votre compte - AutoManager",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">Bienvenue sur AutoManager</h2>
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Votre compte d'utilisateur a été créé avec succès par l'administrateur.</p>
        <p>Veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email et activer votre compte :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Activer mon compte</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Si le bouton ne fonctionne pas, copiez et collez le lien suivant dans votre navigateur :</p>
        <p style="font-size: 12px; color: #4f46e5; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">© AutoManager. Tous droits réservés.</p>
      </div>
    `
  };

  console.log(`[EMAIL VERIFICATION] Token: ${token} | URL: ${verifyUrl}`);

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification email successfully sent to ${email}`);
    } catch (e) {
      console.error("Error sending verification email via SMTP:", e);
    }
  }
}

async function sendPasswordResetEmail(email: string, name: string, token: string, baseUrl?: string) {
  const base = baseUrl || process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${base}/reset-password?token=${token}`;
  const transporter = getTransporter();
  const mailOptions = {
    from: process.env.SMTP_USER || "roukayabel01@gmail.com",
    to: email,
    subject: "Récupération de mot de passe - AutoManager",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ea580c; text-align: center;">Réinitialisation de mot de passe</h2>
        <p>Bonjour <strong>${name}</strong>,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte AutoManager.</p>
        <p>Veuillez cliquer sur le bouton ci-dessous pour choisir un nouveau mot de passe (ce lien est valide pendant 1 heure) :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Réinitialiser mon mot de passe</a>
        </div>
        <p style="font-size: 12px; color: #64748b;">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center;">© AutoManager. Tous droits réservés.</p>
      </div>
    `
  };

  console.log(`[PASSWORD RESET] Token: ${token} | URL: ${resetUrl}`);

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email successfully sent to ${email}`);
    } catch (e) {
      console.error("Error sending password reset email via SMTP:", e);
    }
  }
}

// Seed admin user if not exists
const superadmin = db.prepare("SELECT * FROM users WHERE email = ?").get("superadmin@automanager.com");
if (!superadmin) {
  const hashedPassword = bcrypt.hashSync("superadmin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)").run(
    "Super Admin",
    "superadmin@automanager.com",
    hashedPassword,
    "superadmin"
  );
}

const admin = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@automanager.com");
if (!admin) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)").run(
    "Admin",
    "admin@automanager.com",
    hashedPassword,
    "admin"
  );
}

// Seed test data if empty
// Seed test data if empty
const brandCount = db.prepare("SELECT COUNT(*) as count FROM brands").get() as any;
if (brandCount.count === 0) {
  const brands = ["Mercedes-Benz", "BMW", "Audi", "Tesla", "Porsche", "Renault", "Peugeot", "Volkswagen", "Toyota", "Kia", "Hyundai", "Fiat"];
  const insertBrand = db.prepare("INSERT INTO brands (name) VALUES (?)");
  brands.forEach(b => insertBrand.run(b));
}

const colorCount = db.prepare("SELECT COUNT(*) as count FROM colors").get() as any;
if (colorCount.count === 0) {
  const colors = ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Argent", "Beige", "Marron"];
  const insertColor = db.prepare("INSERT INTO colors (name) VALUES (?)");
  colors.forEach(c => insertColor.run(c));
}

const agencyCount = db.prepare("SELECT COUNT(*) as count FROM agencies").get() as any;
if (agencyCount.count === 0) {
  const agencyResult = db.prepare("INSERT INTO agencies (name, address, phone) VALUES (?, ?, ?)").run(
    "THM RENT A CAR",
    "Tunis, Tunisie",
    "+216 71 000 000"
  );
  const agencyId = agencyResult.lastInsertRowid;

  const branchResult = db.prepare("INSERT INTO branches (name, address, phone, agency_id) VALUES (?, ?, ?, ?)").run(
    "Tunis",
    "Tunis Centre",
    "+216 71 000 001",
    agencyId
  );
  const branchId = branchResult.lastInsertRowid;

  db.prepare("INSERT INTO branches (name, address, phone, agency_id) VALUES (?, ?, ?, ?)").run(
    "Bizerte",
    "Bizerte Port",
    "+216 72 000 002",
    agencyId
  );

  const testCars = [
    { brand: "Mercedes-Benz", model: "Classe S", reg: "AA-123-BB" },
    { brand: "BMW", model: "Série 5", reg: "CC-456-DD" },
    { brand: "Audi", model: "A6", reg: "EE-789-FF" },
    { brand: "Tesla", model: "Model 3", reg: "GG-012-HH" },
    { brand: "Porsche", model: "911", reg: "II-345-JJ" }
  ];

  for (const car of testCars) {
    db.prepare("INSERT INTO cars (brand, model, registration, mileage, agency_id, branch_id, images) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      car.brand,
      car.model,
      car.reg,
      5000,
      agencyId,
      branchId,
      JSON.stringify([`https://picsum.photos/seed/${car.reg}/800/600`])
    );
  }

  // Update admin users with agency_id
  db.prepare("UPDATE users SET agency_id = ?, branch_id = ? WHERE role IN ('superadmin', 'admin')").run(agencyId, branchId);
}

// Seed settings if empty
const settingsCount = db.prepare("SELECT COUNT(*) as count FROM settings").get() as any;
if (settingsCount.count === 0) {
  db.prepare(`
    INSERT INTO settings (
      id, company_name, company_address, company_phone, company_whatsapp, 
      company_mf, company_email, km_allowance, excess_km_price, terms_fr, terms_ar
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "THM RENT A CAR",
    "Tunis, Tunisie",
    "+216 71 000 000",
    "+216 71 000 000",
    "1234567/A/P/000",
    "contact@thm-rentacar.com",
    280,
    0.5,
    "Le locataire soussigné accepte sans réserve les conditions générales de location figurant au verso dont il a pris connaissance et s'engage à restituer le véhicule à la date prévue ci-dessus.",
    "إطلعت علي المعلومات و الشروط الموجودة أعلاه و في الخلف و وافقت عليها"
  );
}

// Ensure all admins have an agency_id if one exists
const firstAgency = db.prepare("SELECT id FROM agencies LIMIT 1").get() as any;
const firstBranch = db.prepare("SELECT id FROM branches LIMIT 1").get() as any;
if (firstAgency && firstBranch) {
  db.prepare("UPDATE users SET agency_id = ?, branch_id = ? WHERE role IN ('superadmin', 'admin') AND agency_id IS NULL").run(firstAgency.id, firstBranch.id);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) return res.sendStatus(403);
      
      // Verify that the user still exists in the database to prevent foreign key errors
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id) as any;
      if (!user) {
        return res.status(401).json({ message: "Utilisateur non trouvé. Veuillez vous reconnecter." });
      }
      
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check if verified
    if (user.is_verified === 0) {
      return res.status(403).json({ 
        message: "Compte non vérifié. Veuillez vérifier votre boîte de réception pour activer votre compte.",
        unverified: true,
        email: user.email
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role, agency_id: user.agency_id, branch_id: user.branch_id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, agency_id: user.agency_id, branch_id: user.branch_id } });
  });

  // Verification & Password Recovery Routes
  app.get("/verify-email", (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send("Token manquant");
    
    const user = db.prepare("SELECT * FROM users WHERE verification_token = ?").get(token) as any;
    if (!user) {
      return res.status(400).send("Lien de vérification invalide ou expiré.");
    }
    
    db.prepare("UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?").run(user.id);
    res.redirect("/login?verified=true");
  });

  app.post("/api/auth/resend-verification", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });
    
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    
    if (user.is_verified === 1) {
      return res.status(400).json({ message: "Compte déjà vérifié" });
    }
    
    let token = user.verification_token;
    if (!token) {
      token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      db.prepare("UPDATE users SET verification_token = ? WHERE id = ?").run(token, user.id);
    }
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    sendVerificationEmail(user.email, user.name, token, baseUrl);
    res.json({ success: true, message: "Email de vérification renvoyé." });
  });

  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });
    
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      return res.json({ success: true, message: "Si l'adresse email existe, un email a été envoyé." });
    }
    
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    
    db.prepare("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?").run(token, expiry, user.id);
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    sendPasswordResetEmail(user.email, user.name, token, baseUrl);
    
    res.json({ 
      success: true, 
      message: "Un email de récupération a été envoyé.",
      dev_reset_token: token
    });
  });

  app.post("/api/auth/reset-password", (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Champs requis" });
    
    const user = db.prepare("SELECT * FROM users WHERE reset_token = ?").get(token) as any;
    if (!user) {
      return res.status(400).json({ message: "Lien de réinitialisation invalide ou expiré" });
    }
    
    const now = new Date().toISOString();
    if (user.reset_token_expiry && now > user.reset_token_expiry) {
      return res.status(400).json({ message: "Le lien de réinitialisation a expiré" });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?").run(hashedPassword, user.id);
    
    res.json({ success: true, message: "Votre mot de passe a été réinitialisé." });
  });

  // Brands
  app.get("/api/brands", authenticateToken, (req: any, res) => {
    const brands = db.prepare("SELECT * FROM brands ORDER BY name ASC").all();
    res.json(brands);
  });

  app.post("/api/brands", authenticateToken, (req: any, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO brands (name, agency_id) VALUES (?, ?)").run(name, req.user.agency_id);
      res.json({ id: result.lastInsertRowid, name });
    } catch (e: any) {
      if (e.message.includes("UNIQUE constraint failed")) {
        const brand = db.prepare("SELECT * FROM brands WHERE name = ?").get(name);
        return res.json(brand);
      }
      res.status(400).json({ message: e.message });
    }
  });

  // Colors
  app.get("/api/colors", authenticateToken, (req: any, res) => {
    const colors = db.prepare("SELECT * FROM colors ORDER BY name ASC").all();
    res.json(colors);
  });

  app.post("/api/colors", authenticateToken, (req: any, res) => {
    const { name } = req.body;
    try {
      const result = db.prepare("INSERT INTO colors (name, agency_id) VALUES (?, ?)").run(name, req.user.agency_id);
      res.json({ id: result.lastInsertRowid, name });
    } catch (e: any) {
      if (e.message.includes("UNIQUE constraint failed")) {
        const color = db.prepare("SELECT * FROM colors WHERE name = ?").get(name);
        return res.json(color);
      }
      res.status(400).json({ message: e.message });
    }
  });

  // Users
  app.get("/api/users", authenticateToken, (req: any, res) => {
    if (req.user.role === 'agent') return res.sendStatus(403);
    
    let users;
    if (req.user.role === 'superadmin') {
      users = db.prepare("SELECT id, name, email, role, agency_id, branch_id, created_by_id, is_verified FROM users").all();
    } else {
      users = db.prepare("SELECT id, name, email, role, agency_id, branch_id, created_by_id, is_verified FROM users WHERE agency_id = ?").all(req.user.agency_id);
    }
    res.json(users);
  });

  app.post("/api/users", authenticateToken, (req: any, res) => {
    if (req.user.role === 'agent') return res.sendStatus(403);
    const { name, email, password, role, agency_id, branch_id, is_verified } = req.body;
    
    // Role restrictions
    if (req.user.role === 'admin' && role === 'superadmin') return res.sendStatus(403);
    
    const targetAgencyId = req.user.role === 'superadmin' ? agency_id : req.user.agency_id;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const verificationToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Default to verified (1) if not explicitly set to 0/false, to avoid blocked users on SMTP failure
    const verifiedStatus = is_verified !== undefined ? (is_verified ? 1 : 0) : 1;
    const tokenVal = verifiedStatus === 0 ? verificationToken : null;
    
    try {
      const result = db.prepare("INSERT INTO users (name, email, password, role, agency_id, branch_id, created_by_id, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        name, email, hashedPassword, role, targetAgencyId, branch_id, req.user.id, verifiedStatus, tokenVal
      );
      
      // Only send verification email if account is not auto-verified
      if (verifiedStatus === 0) {
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        sendVerificationEmail(email, name, verificationToken, baseUrl);
      }
      
      res.json({ id: result.lastInsertRowid, dev_verification_token: tokenVal });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", authenticateToken, (req: any, res) => {
    if (req.user.role === 'agent') return res.sendStatus(403);
    const { id } = req.params;
    const { name, email, password, role, agency_id, branch_id, is_verified } = req.body;
    
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Role restrictions
    if (req.user.role === 'admin' && (role === 'superadmin' || user.role === 'superadmin')) return res.sendStatus(403);
    if (req.user.role === 'admin' && user.agency_id !== req.user.agency_id) return res.sendStatus(403);

    const targetIsVerified = is_verified !== undefined ? (is_verified ? 1 : 0) : user.is_verified;

    let query = "UPDATE users SET name = ?, email = ?, role = ?, agency_id = ?, branch_id = ?, is_verified = ?";
    let params = [
      name || user.name, 
      email || user.email, 
      role || user.role, 
      agency_id !== undefined ? agency_id : user.agency_id, 
      branch_id !== undefined ? branch_id : user.branch_id,
      targetIsVerified
    ];
    
    if (password) {
      query += ", password = ?";
      params.push(bcrypt.hashSync(password, 10));
    }
    
    query += " WHERE id = ?";
    params.push(id);
    
    db.prepare(query).run(...params);
    res.json({ success: true });
  });

  app.delete("/api/users/:id", authenticateToken, (req: any, res) => {
    if (req.user.role === 'agent') return res.sendStatus(403);
    const { id } = req.params;
    
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as any;
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (req.user.role === 'admin' && user.role === 'superadmin') return res.sendStatus(403);
    if (req.user.role === 'admin' && user.agency_id !== req.user.agency_id) return res.sendStatus(403);
    if (Number(id) === req.user.id) return res.status(400).json({ message: "Cannot delete yourself" });

    db.transaction(() => {
      db.prepare("UPDATE users SET created_by_id = NULL WHERE created_by_id = ?").run(id);
      db.prepare("UPDATE rentals SET agent_id = NULL WHERE agent_id = ?").run(id);
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
    })();
    res.json({ success: true });
  });

  // Agencies
  app.get("/api/agencies", authenticateToken, (req, res) => {
    const agencies = db.prepare("SELECT * FROM agencies").all();
    res.json(agencies);
  });

  app.post("/api/agencies", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.sendStatus(403);
    const { name, address, phone } = req.body;
    const result = db.prepare("INSERT INTO agencies (name, address, phone) VALUES (?, ?, ?)").run(name, address, phone);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/agencies/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.sendStatus(403);
    const { name, address, phone } = req.body;
    const { id } = req.params;
    db.prepare("UPDATE agencies SET name = ?, address = ?, phone = ? WHERE id = ?").run(name, address, phone, id);
    res.json({ success: true });
  });

  app.delete("/api/agencies/:id", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.sendStatus(403);
    const { id } = req.params;
    
    const branches = db.prepare("SELECT id FROM branches WHERE agency_id = ?").all(id);
    if (branches.length > 0) return res.status(400).json({ message: "Cannot delete agency with existing branches" });

    db.prepare("DELETE FROM agencies WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Branches
  app.get("/api/branches", authenticateToken, (req: any, res) => {
    let branches;
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      branches = db.prepare("SELECT * FROM branches").all();
    } else {
      branches = db.prepare("SELECT * FROM branches WHERE agency_id = ?").all(req.user.agency_id);
    }
    res.json(branches);
  });

  app.post("/api/branches", authenticateToken, (req: any, res) => {
    if (req.user.role === 'agent') return res.sendStatus(403);
    const { name, address, phone, agency_id } = req.body;
    const targetAgencyId = (req.user.role === 'admin' || req.user.role === 'superadmin') ? agency_id : req.user.agency_id;
    const result = db.prepare("INSERT INTO branches (name, address, phone, agency_id) VALUES (?, ?, ?, ?)").run(name, address, phone, targetAgencyId);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/branches/:id", authenticateToken, (req: any, res) => {
    if (req.user.role === 'agent') return res.sendStatus(403);
    const { name, address, phone, agency_id } = req.body;
    const { id } = req.params;
    
    const branch = db.prepare("SELECT * FROM branches WHERE id = ?").get(id) as any;
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && branch.agency_id !== req.user.agency_id) return res.sendStatus(403);

    const targetAgencyId = (req.user.role === 'admin' || req.user.role === 'superadmin') ? (agency_id || branch.agency_id) : branch.agency_id;
    db.prepare("UPDATE branches SET name = ?, address = ?, phone = ?, agency_id = ? WHERE id = ?").run(name, address, phone, targetAgencyId, id);
    res.json({ success: true });
  });

  app.delete("/api/branches/:id", authenticateToken, (req: any, res) => {
    if (req.user.role === 'agent') return res.sendStatus(403);
    const { id } = req.params;

    const branch = db.prepare("SELECT * FROM branches WHERE id = ?").get(id) as any;
    if (!branch) return res.status(404).json({ message: "Branch not found" });
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && branch.agency_id !== req.user.agency_id) return res.sendStatus(403);

    const rentals = db.prepare("SELECT id FROM rentals WHERE branch_id = ?").all(id);
    if (rentals.length > 0) return res.status(400).json({ message: "Cannot delete branch with existing rentals" });

    db.prepare("DELETE FROM branches WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Cars
  app.get("/api/cars", authenticateToken, (req: any, res) => {
    let cars;
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      cars = db.prepare(`
        SELECT c.*, b.name as branch_name 
        FROM cars c 
        LEFT JOIN branches b ON c.branch_id = b.id 
        ORDER BY c.id DESC
      `).all();
    } else {
      cars = db.prepare(`
        SELECT c.*, b.name as branch_name 
        FROM cars c 
        LEFT JOIN branches b ON c.branch_id = b.id 
        WHERE c.agency_id = ? 
        ORDER BY c.id DESC
      `).all(req.user.agency_id);
    }
    res.json(cars.map((c: any) => ({ ...c, images: JSON.parse(c.images || '[]') })));
  });

  app.post("/api/cars", authenticateToken, (req: any, res) => {
    const { 
      brand, model, registration, mileage, fuel_type, fuel_total_bars, daily_price,
      insurance_start_date, insurance_expiry_date,
      technical_inspection_start_date, technical_inspection_expiry_date,
      last_oil_change_mileage, next_oil_change_mileage,
      vignette_start_date, vignette_expiry_date,
      circulation_date, exit_date, exploitation_start_date, exploitation_end_date,
      year, transmission,
      power, color, seats, category, parking_location, chassis_number,
      abs, alarm, fog_lights, ac, power_steering, is_sold, sale_date,
      agency_id, branch_id, images 
    } = req.body;
    const targetAgencyId = (req.user.role === 'admin' || req.user.role === 'superadmin') ? (agency_id || req.user.agency_id) : req.user.agency_id;
    
    if (!targetAgencyId) {
      return res.status(400).json({ message: "Agency ID is required" });
    }

    try {
      const result = db.prepare(`
        INSERT INTO cars (
          brand, model, registration, mileage, fuel_type, fuel_total_bars, daily_price,
          insurance_start_date, insurance_expiry_date,
          technical_inspection_start_date, technical_inspection_expiry_date,
          last_oil_change_mileage, next_oil_change_mileage,
          vignette_start_date, vignette_expiry_date,
          circulation_date, exit_date, exploitation_start_date, exploitation_end_date,
          year, transmission,
          power, color, seats, category, parking_location, chassis_number,
          abs, alarm, fog_lights, ac, power_steering, is_sold, sale_date,
          agency_id, branch_id, images
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        brand, model, registration, mileage || 0, fuel_type || "Essence", fuel_total_bars || 8, daily_price || 0,
        insurance_start_date || null, insurance_expiry_date || null,
        technical_inspection_start_date || null, technical_inspection_expiry_date || null,
        last_oil_change_mileage || 0, next_oil_change_mileage || 0,
        vignette_start_date || null, vignette_expiry_date || null,
        circulation_date || null, exit_date || null, exploitation_start_date || null, exploitation_end_date || null,
        year || null, transmission || null,
        power || null, color || null, seats || 5, category || "Tourisme", parking_location || null, chassis_number || null,
        abs ? 1 : 0, alarm ? 1 : 0, fog_lights ? 1 : 0, ac ? 1 : 0, power_steering ? 1 : 0, is_sold ? 1 : 0, sale_date || null,
        targetAgencyId, branch_id || null, JSON.stringify(images || [])
      );
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed: cars.registration")) {
        return res.status(400).json({ message: "Un véhicule avec ce numéro d'immatriculation existe déjà." });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/cars/:id", authenticateToken, (req: any, res) => {
    const { 
      brand, model, registration, mileage, fuel_type, fuel_total_bars, fuel_current_bars, daily_price,
      insurance_start_date, insurance_expiry_date,
      technical_inspection_start_date, technical_inspection_expiry_date,
      last_oil_change_mileage, next_oil_change_mileage,
      vignette_start_date, vignette_expiry_date,
      circulation_date, exit_date, exploitation_start_date, exploitation_end_date,
      year, transmission,
      power, color, seats, category, parking_location, chassis_number,
      abs, alarm, fog_lights, ac, power_steering, is_sold, sale_date,
      branch_id, images, status 
    } = req.body;
    const { id } = req.params;

    const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(id) as any;
    if (!car) return res.status(404).json({ message: "Car not found" });
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && car.agency_id !== req.user.agency_id) return res.sendStatus(403);

    try {
      db.prepare(`
        UPDATE cars 
        SET brand = ?, model = ?, registration = ?, mileage = ?, fuel_type = ?, fuel_total_bars = ?, fuel_current_bars = ?, daily_price = ?,
            insurance_start_date = ?, insurance_expiry_date = ?,
            technical_inspection_start_date = ?, technical_inspection_expiry_date = ?,
            last_oil_change_mileage = ?, next_oil_change_mileage = ?,
            vignette_start_date = ?, vignette_expiry_date = ?,
            circulation_date = ?, exit_date = ?, exploitation_start_date = ?, exploitation_end_date = ?,
            year = ?, transmission = ?,
            power = ?, color = ?, seats = ?, category = ?, parking_location = ?, chassis_number = ?,
            abs = ?, alarm = ?, fog_lights = ?, ac = ?, power_steering = ?, is_sold = ?, sale_date = ?,
            images = ?, status = ?, branch_id = ?
        WHERE id = ?
      `).run(
        brand || car.brand,
        model || car.model,
        registration || car.registration,
        mileage !== undefined ? mileage : car.mileage,
        fuel_type || car.fuel_type,
        fuel_total_bars || car.fuel_total_bars,
        fuel_current_bars !== undefined ? fuel_current_bars : car.fuel_current_bars,
        daily_price !== undefined ? daily_price : car.daily_price,
        insurance_start_date !== undefined ? insurance_start_date : car.insurance_start_date,
        insurance_expiry_date !== undefined ? insurance_expiry_date : car.insurance_expiry_date,
        technical_inspection_start_date !== undefined ? technical_inspection_start_date : car.technical_inspection_start_date,
        technical_inspection_expiry_date !== undefined ? technical_inspection_expiry_date : car.technical_inspection_expiry_date,
        last_oil_change_mileage !== undefined ? last_oil_change_mileage : car.last_oil_change_mileage,
        next_oil_change_mileage !== undefined ? next_oil_change_mileage : car.next_oil_change_mileage,
        vignette_start_date !== undefined ? vignette_start_date : car.vignette_start_date,
        vignette_expiry_date !== undefined ? vignette_expiry_date : car.vignette_expiry_date,
        circulation_date !== undefined ? circulation_date : car.circulation_date,
        exit_date !== undefined ? exit_date : car.exit_date,
        exploitation_start_date !== undefined ? exploitation_start_date : car.exploitation_start_date,
        exploitation_end_date !== undefined ? exploitation_end_date : car.exploitation_end_date,
        year !== undefined ? year : car.year,
        transmission !== undefined ? transmission : car.transmission,
        power !== undefined ? power : car.power,
        color !== undefined ? color : car.color,
        seats !== undefined ? seats : car.seats,
        category !== undefined ? category : car.category,
        parking_location !== undefined ? parking_location : car.parking_location,
        chassis_number !== undefined ? chassis_number : car.chassis_number,
        abs !== undefined ? (abs ? 1 : 0) : car.abs,
        alarm !== undefined ? (alarm ? 1 : 0) : car.alarm,
        fog_lights !== undefined ? (fog_lights ? 1 : 0) : car.fog_lights,
        ac !== undefined ? (ac ? 1 : 0) : car.ac,
        power_steering !== undefined ? (power_steering ? 1 : 0) : car.power_steering,
        is_sold !== undefined ? (is_sold ? 1 : 0) : car.is_sold,
        sale_date !== undefined ? sale_date : car.sale_date,
        images ? JSON.stringify(images) : car.images,
        status || car.status,
        branch_id !== undefined ? branch_id : car.branch_id,
        id
      );
      res.json({ success: true });
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed: cars.registration")) {
        return res.status(400).json({ message: "Un véhicule avec ce numéro d'immatriculation existe déjà." });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/cars/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;

    const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(id) as any;
    if (!car) return res.status(404).json({ message: "Car not found" });
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && car.agency_id !== req.user.agency_id) return res.sendStatus(403);

    const rentals = db.prepare("SELECT id FROM rentals WHERE car_id = ?").all(id);
    if (rentals.length > 0) {
      return res.status(400).json({ message: "Impossible de supprimer ce véhicule car il possède des contrats de location existants." });
    }

    db.prepare("DELETE FROM cars WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/cars/bulk-delete", authenticateToken, (req: any, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ message: "Ids must be an array" });

    try {
      const results = { deleted: 0, failed: 0, reasons: [] as string[] };
      
      const deleteStmt = db.prepare("DELETE FROM cars WHERE id = ?");
      const checkRentalsStmt = db.prepare("SELECT id FROM rentals WHERE car_id = ? LIMIT 1");
      const checkAgencyStmt = db.prepare("SELECT agency_id FROM cars WHERE id = ?");

      const transaction = db.transaction((carIds: number[]) => {
        for (const id of carIds) {
          const car = checkAgencyStmt.get(id) as any;
          if (!car) {
            results.failed++;
            continue;
          }
          if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && car.agency_id !== req.user.agency_id) {
            results.failed++;
            continue;
          }

          const hasRental = checkRentalsStmt.get(id);
          if (hasRental) {
            results.failed++;
            continue;
          }

          deleteStmt.run(id);
          results.deleted++;
        }
      });

      transaction(ids);
      res.json({ success: true, ...results });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Drivers
  app.get("/api/drivers", authenticateToken, (req: any, res) => {
    const agencyId = req.user.agency_id;
    const drivers = req.user.role === 'admin' 
      ? db.prepare("SELECT * FROM drivers").all()
      : db.prepare("SELECT * FROM drivers WHERE agency_id = ?").all(agencyId);
    res.json(drivers);
  });

  app.post("/api/drivers", authenticateToken, (req: any, res) => {
    const { name, phone, license_number } = req.body;
    const agencyId = req.user.agency_id;
    const result = db.prepare("INSERT INTO drivers (name, phone, license_number, agency_id) VALUES (?, ?, ?, ?)").run(name, phone, license_number, agencyId);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/drivers/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const { name, phone, license_number } = req.body;
    db.prepare("UPDATE drivers SET name = ?, phone = ?, license_number = ? WHERE id = ?").run(name, phone, license_number, id);
    res.json({ success: true });
  });

  app.delete("/api/drivers/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM drivers WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Customers
  app.get("/api/customers", authenticateToken, (req: any, res) => {
    try {
      const agencyId = req.user.agency_id;
      const customers = req.user.role === 'admin' && !agencyId
        ? db.prepare("SELECT * FROM customers").all()
        : db.prepare("SELECT * FROM customers WHERE agency_id = ?").all(agencyId);
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/customers", authenticateToken, (req: any, res) => {
    try {
      const fields = { ...req.body };
      delete fields.id;
      
      const allowedColumns = [
        "type", "name", "first_name", "birth_date", "birth_place", "nationality",
        "address", "city", "postal_code", "phone", "email", "observation",
        "id_type", "id_number", "id_issued_date", "id_issued_place", "id_expiry_date",
        "license_number", "license_issued_date", "license_issued_place", "license_expiry_date"
      ];

      const filteredFields = Object.keys(fields)
        .filter(key => allowedColumns.includes(key))
        .reduce((obj, key) => {
          obj[key] = fields[key];
          return obj;
        }, {} as any);

      let agencyId = req.user.agency_id;
      
      if (!agencyId && req.user.role === 'admin') {
        const firstAgency = db.prepare("SELECT id FROM agencies LIMIT 1").get() as any;
        if (firstAgency) agencyId = firstAgency.id;
      }

      if (!agencyId) {
        return res.status(400).json({ message: "L'utilisateur doit être rattaché à une agence" });
      }

      const columns = ["agency_id", ...Object.keys(filteredFields)].join(", ");
      const placeholders = ["?", ...Object.keys(filteredFields).map(() => "?")].join(", ");
      const values = [agencyId, ...Object.values(filteredFields)];
      
      const result = db.prepare(`INSERT INTO customers (${columns}) VALUES (${placeholders})`).run(...values);
      res.json({ id: result.lastInsertRowid });
    } catch (error: any) {
      console.error("Customer creation error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/customers/:id", authenticateToken, (req: any, res) => {
    try {
      const { id } = req.params;
      const fields = { ...req.body };
      delete fields.id;
      
      const allowedColumns = [
        "type", "name", "first_name", "birth_date", "birth_place", "nationality",
        "address", "city", "postal_code", "phone", "email", "observation",
        "id_type", "id_number", "id_issued_date", "id_issued_place", "id_expiry_date",
        "license_number", "license_issued_date", "license_issued_place", "license_expiry_date"
      ];

      const filteredFields = Object.keys(fields)
        .filter(key => allowedColumns.includes(key))
        .reduce((obj, key) => {
          obj[key] = fields[key];
          return obj;
        }, {} as any);

      if (Object.keys(filteredFields).length === 0) {
        return res.json({ success: true, message: "No fields to update" });
      }

      const sets = Object.keys(filteredFields).map(key => `${key} = ?`).join(", ");
      const values = Object.values(filteredFields);
      
      db.prepare(`UPDATE customers SET ${sets} WHERE id = ?`).run(...values, id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Customer update error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, (req: any, res) => {
    try {
      const { id } = req.params;
      const cascade = req.query.cascade === "true";
      
      if (cascade) {
        db.prepare("DELETE FROM rentals WHERE customer_id = ? OR driver_id = ? OR second_driver_id = ?").run(id, id, id);
      } else {
        // Check if the customer has associated rentals as customer, driver, or second driver
        const hasRentals = db.prepare("SELECT COUNT(*) as count FROM rentals WHERE customer_id = ? OR driver_id = ? OR second_driver_id = ?").get(id, id, id) as any;
        if (hasRentals && hasRentals.count > 0) {
          return res.status(400).json({ message: "Ce client ne peut pas être supprimé car il possède des contrats de location existants (actifs, programmés ou passés)." });
        }
      }

      db.prepare("DELETE FROM customers WHERE id = ?").run(id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: error.message || "Erreur lors de la suppression du client." });
    }
  });

  // Repairs
  app.get("/api/cars/:carId/repairs", authenticateToken, (req: any, res) => {
    const { carId } = req.params;
    const repairs = db.prepare("SELECT * FROM repairs WHERE car_id = ? ORDER BY date DESC").all(carId);
    res.json(repairs);
  });

  app.post("/api/cars/:carId/repairs", authenticateToken, (req: any, res) => {
    const { carId } = req.params;
    const { date, description, amount, mileage } = req.body;
    const result = db.prepare("INSERT INTO repairs (car_id, date, description, amount, mileage) VALUES (?, ?, ?, ?, ?)").run(carId, date, description, amount || 0, mileage || null);
    res.json({ id: result.lastInsertRowid });
  });

  app.delete("/api/repairs/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM repairs WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.put("/api/repairs/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const { date, description, amount, mileage } = req.body;
    db.prepare(`
      UPDATE repairs
      SET date = ?, description = ?, amount = ?, mileage = ?
      WHERE id = ?
    `).run(date, description, amount || 0, mileage || null, id);
    res.json({ success: true });
  });

  // Rentals
  app.get("/api/rentals", authenticateToken, (req: any, res) => {
    let rentals;
    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      rentals = db.prepare(`
        SELECT r.*, c.brand, c.model, c.registration, c.year, c.color, c.power, c.seats, c.transmission, c.fuel_type, b.name as branch_name, (CASE WHEN cust.type = 'company' THEN cust.name ELSE (IFNULL(cust.first_name, '') || ' ' || IFNULL(cust.name, '')) END) as driver_name, u.name as creator_name
        FROM rentals r 
        JOIN cars c ON r.car_id = c.id 
        JOIN branches b ON r.branch_id = b.id
        LEFT JOIN customers cust ON r.driver_id = cust.id
        LEFT JOIN users u ON r.created_by_id = u.id
        ORDER BY r.id DESC
      `).all();
    } else {
      rentals = db.prepare(`
        SELECT r.*, c.brand, c.model, c.registration, c.year, c.color, c.power, c.seats, c.transmission, c.fuel_type, b.name as branch_name, (CASE WHEN cust.type = 'company' THEN cust.name ELSE (IFNULL(cust.first_name, '') || ' ' || IFNULL(cust.name, '')) END) as driver_name, u.name as creator_name
        FROM rentals r 
        JOIN cars c ON r.car_id = c.id 
        JOIN branches b ON r.branch_id = b.id
        LEFT JOIN customers cust ON r.driver_id = cust.id
        LEFT JOIN users u ON r.created_by_id = u.id
        WHERE c.agency_id = ?
        ORDER BY r.id DESC
      `).all(req.user.agency_id);
    }
    res.json(rentals);
  });

  app.get("/api/rentals/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const rental = db.prepare(`
      SELECT r.*, c.brand, c.model, c.registration, c.year, c.color, c.power, c.seats, c.transmission, c.fuel_type, b.name as branch_name, (CASE WHEN cust.type = 'company' THEN cust.name ELSE (IFNULL(cust.first_name, '') || ' ' || IFNULL(cust.name, '')) END) as driver_name, u.name as creator_name
      FROM rentals r 
      JOIN cars c ON r.car_id = c.id 
      JOIN branches b ON r.branch_id = b.id
      LEFT JOIN customers cust ON r.driver_id = cust.id
      LEFT JOIN users u ON r.created_by_id = u.id
      WHERE r.id = ?
    `).get(id) as any;

    if (!rental) return res.status(404).json({ message: "Rental not found" });
    
    // Authorization check
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && rental.agency_id !== req.user.agency_id) {
      // Need to join cars to check agency_id if it's not in rentals table
      const car = db.prepare("SELECT agency_id FROM cars WHERE id = ?").get(rental.car_id) as any;
      if (car.agency_id !== req.user.agency_id) return res.sendStatus(403);
    }

    res.json(rental);
  });

  app.post("/api/rentals", authenticateToken, (req: any, res) => {
    try {
      const fields = req.body;
      console.log("POST /api/rentals payload:", JSON.stringify(fields, null, 2));
      const { car_id } = fields;
      
      if (!car_id) {
        return res.status(400).json({ message: "ID de véhicule manquant." });
      }
      
      const car = db.prepare("SELECT * FROM cars WHERE id = ?").get(car_id) as any;
      if (!car) {
        return res.status(400).json({ message: "Car not found" });
      }

      const currentYear = new Date().getFullYear();
      let contract_number = "";
      let finalGroupNumber = fields.lease_group_number || null;
      let finalSuffix = fields.lease_suffix || null;

      // Find the maximum numeric contract base prefix currently used for any rentals of the current year
      let maxNumericNum = 0;
      const allYearRentals = db.prepare("SELECT contract_number FROM rentals WHERE contract_number LIKE ?").all(`%/${currentYear}`) as any[];
      allYearRentals.forEach(r => {
        if (r.contract_number) {
          const match = r.contract_number.match(/^(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num) && num > maxNumericNum) {
              maxNumericNum = num;
            }
          }
        }
      });

      if (fields.lease_group_number) {
        // Adding to an existing lease group: find next alphabetical suffix
        const existing = db.prepare("SELECT lease_suffix FROM rentals WHERE lease_group_number = ? ORDER BY lease_suffix ASC").all(fields.lease_group_number) as any[];
        let nextSuffixLetter = "A";
        if (existing.length > 0) {
          const lastSuffix = existing[existing.length - 1].lease_suffix || "A";
          nextSuffixLetter = String.fromCharCode(lastSuffix.charCodeAt(0) + 1);
        }
        finalSuffix = nextSuffixLetter;
        fields.lease_suffix = nextSuffixLetter;
        contract_number = `${fields.lease_group_number}${nextSuffixLetter}/${currentYear}`;
      } else if (fields.create_lease_group && fields.customer_type === "company") {
        // Create a brand new lease group
        let maxBase = 0;
        const rentalsWithGroups = db.prepare("SELECT lease_group_number FROM rentals WHERE lease_group_number IS NOT NULL").all() as any[];
        rentalsWithGroups.forEach(r => {
          const base = parseInt(r.lease_group_number);
          if (!isNaN(base) && base > maxBase) {
            maxBase = base;
          }
        });

        const nextBaseNum = Math.max(maxNumericNum + 1, maxBase + 1);
        const groupStr = nextBaseNum.toString().padStart(3, '0');
        
        finalGroupNumber = groupStr;
        finalSuffix = "A";
        fields.lease_group_number = groupStr;
        fields.lease_suffix = "A";
        contract_number = `${groupStr}A/${currentYear}`;
      } else {
        // Standard sequential lease
        const nextNumber = maxNumericNum + 1;
        contract_number = `${nextNumber.toString().padStart(3, '0')}/${currentYear}`;
      }

      const columnsInfo = db.prepare("PRAGMA table_info(rentals)").all() as { name: string }[];
      const validColumns = columnsInfo.map(col => col.name);

      const transaction = db.transaction(() => {
        const dataToInsert = {} as any;
        for (const key of Object.keys(fields)) {
          if (validColumns.includes(key)) {
            dataToInsert[key] = fields[key];
          }
        }
        // Remove fields that are added manually in the query below
        delete dataToInsert.id;
        delete dataToInsert.agent_id;
        delete dataToInsert.created_by_id;
        delete dataToInsert.status;
        delete dataToInsert.contract_number;
        delete dataToInsert.create_lease_group;

        const columnsArr = Object.keys(dataToInsert);
        const columns = [...columnsArr, "contract_number"].join(", ");
        const placeholders = [...columnsArr.map(() => "?"), "?"].join(", ");
        const values = [...Object.values(dataToInsert), contract_number].map(v => {
          if (typeof v === 'boolean') return v ? 1 : 0;
          if (v !== null && typeof v === 'object') return JSON.stringify(v);
          // Convert empty strings to null for foreign keys and optional fields
          if (v === "" || v === "none") return null;
          return v;
        });

        const result = db.prepare(`
          INSERT INTO rentals (${columns}, agent_id, created_by_id, status) 
          VALUES (${placeholders}, ?, ?, ?)
        `).run(...values, req.user.id, req.user.id, fields.status || 'active');

        if ((fields.status || 'active') === 'active') {
          db.prepare("UPDATE cars SET status = 'rented' WHERE id = ?").run(car_id);
        }
        return result.lastInsertRowid;
      });

      const id = transaction();
      res.json({ id, contract_number });
    } catch (e: any) {
      console.error("Error in POST /api/rentals:", e);
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/rentals/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const fields = req.body;
    const { car_id } = fields;
    
    try {
      const rental = db.prepare("SELECT * FROM rentals WHERE id = ?").get(id) as any;
      if (!rental) return res.status(404).json({ message: "Rental not found" });

      const transaction = db.transaction(() => {
        // If car changed, update status of old and new car
        if (car_id && Number(car_id) !== rental.car_id) {
          db.prepare("UPDATE cars SET status = 'available' WHERE id = ?").run(rental.car_id);
          if ((fields.status || rental.status) === 'active') {
            db.prepare("UPDATE cars SET status = 'rented' WHERE id = ?").run(car_id);
          }
        } else if (fields.status && fields.status !== rental.status) {
          // If status changed to active, set car to rented
          if (fields.status === 'active') {
            db.prepare("UPDATE cars SET status = 'rented' WHERE id = ?").run(rental.car_id);
          } else if (rental.status === 'active' && (fields.status === 'completed' || fields.status === 'cancelled' || fields.status === 'scheduled')) {
            // If status changed from active to something else, set car to available
            db.prepare("UPDATE cars SET status = 'available' WHERE id = ?").run(rental.car_id);
          }
        }

        const columnsInfo = db.prepare("PRAGMA table_info(rentals)").all() as { name: string }[];
        const validColumns = columnsInfo.map(col => col.name).filter(name => name !== 'id');

        const filteredFields: Record<string, any> = {};
        for (const key of Object.keys(fields)) {
          if (validColumns.includes(key)) {
            filteredFields[key] = fields[key];
          }
        }

        if (Object.keys(filteredFields).length > 0) {
          const sets = Object.keys(filteredFields).map(key => `${key} = ?`).join(", ");
          const values = Object.values(filteredFields).map(v => {
            if (typeof v === 'boolean') return v ? 1 : 0;
            if (v !== null && typeof v === 'object') return JSON.stringify(v);
            // Do not convert empty strings to null for customer identity fields as they might have NOT NULL constraints
            if (v === "none") return null;
            return v;
          });

          db.prepare(`
            UPDATE rentals 
            SET ${sets}
            WHERE id = ?
          `).run(...values, id);
        }
      });

      transaction();
      res.json({ success: true });
    } catch (e: any) {
      console.error("Error in PUT /api/rentals/:id:", e);
      res.status(500).json({ message: e.message || "Internal server error" });
    }
  });

  app.post("/api/rentals/:id/swap-car", authenticateToken, (req: any, res) => {
    const { id } = req.params;

    const { 
      new_car_id, 
      old_car_return_mileage, 
      old_car_return_fuel,
      new_car_start_mileage,
      new_car_start_fuel,
      swap_date,
      swap_reason,
      daily_price,
      total_price,
      amount_remaining,
      amount_paid,
      payment_mode
    } = req.body;

    const rental = db.prepare("SELECT * FROM rentals WHERE id = ?").get(id) as any;
    if (!rental) return res.status(404).json({ message: "Rental not found" });

    const oldCar = db.prepare("SELECT * FROM cars WHERE id = ?").get(rental.car_id) as any;
    const newCar = db.prepare("SELECT * FROM cars WHERE id = ?").get(new_car_id) as any;

    if (!newCar) return res.status(400).json({ message: "New car not found" });

    const transaction = db.transaction(() => {
      // 1. Store swap in history
      const currentSwaps = JSON.parse(rental.swaps || '[]');
      const newSwap = {
        date: swap_date || new Date().toISOString(),
        reason: swap_reason || "",
        old_car: {
          id: oldCar.id,
          brand: oldCar.brand,
          model: oldCar.model,
          registration: oldCar.registration,
          return_mileage: old_car_return_mileage,
          return_fuel: old_car_return_fuel,
          fuel_total_bars: oldCar.fuel_total_bars || 8,
          daily_price: rental.daily_price
        },
        new_car: {
          id: newCar.id,
          brand: newCar.brand,
          model: newCar.model,
          registration: newCar.registration,
          start_mileage: new_car_start_mileage,
          start_fuel: new_car_start_fuel,
          fuel_total_bars: newCar.fuel_total_bars || 8,
          daily_price: daily_price !== undefined ? parseFloat(daily_price) : newCar.daily_price
        }
      };
      currentSwaps.push(newSwap);

      // 2. Update rental
      db.prepare(`
        UPDATE rentals 
        SET car_id = ?, 
            swaps = ?,
            current_mileage = ?,
            fuel_total_bars = ?,
            fuel_depart_bars = ?,
            daily_price = ?,
            total_price = ?,
            amount_remaining = ?,
            amount_paid = ?,
            payment_mode = ?
        WHERE id = ?
      `).run(
        new_car_id, 
        JSON.stringify(currentSwaps), 
        new_car_start_mileage, 
        newCar.fuel_total_bars || 8, 
        new_car_start_fuel,
        daily_price !== undefined ? parseFloat(daily_price) : rental.daily_price,
        total_price !== undefined ? parseFloat(total_price) : rental.total_price,
        amount_remaining !== undefined ? parseFloat(amount_remaining) : rental.amount_remaining,
        amount_paid !== undefined ? parseFloat(amount_paid) : rental.amount_paid,
        payment_mode !== undefined ? payment_mode : rental.payment_mode,
        id
      );

      // 3. Update old car (make it available)
      db.prepare("UPDATE cars SET status = 'available', mileage = ?, fuel_current_bars = ? WHERE id = ?")
        .run(old_car_return_mileage, old_car_return_fuel, oldCar.id);

      // 4. Update new car (make it rented)
      db.prepare("UPDATE cars SET status = 'rented', mileage = ?, fuel_current_bars = ? WHERE id = ?")
        .run(new_car_start_mileage, new_car_start_fuel, newCar.id);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/rentals/:id/return", authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const { 
      return_date, return_mileage, return_photos, km_retour, km_parcouru, km_factures, 
      excess_amount, is_damaged, damage_deduction, fuel_return_bars
    } = req.body;

    const rental = db.prepare("SELECT * FROM rentals WHERE id = ?").get(id) as any;
    if (!rental) return res.status(404).json({ message: "Rental not found" });

    const transaction = db.transaction(() => {
      const extraCharges = (excess_amount || 0) + (damage_deduction || 0);

      db.prepare(`
        UPDATE rentals 
        SET return_date = ?, 
            return_mileage = ?, 
            return_photos = ?, 
            km_retour = ?, 
            km_parcouru = ?, 
            km_factures = ?, 
            other_charges = other_charges + ?,
            is_damaged = ?,
            damage_deduction = ?,
            fuel_return_bars = ?,
            status = 'completed',
            total_price = total_price + ?,
            amount_paid = total_price + ?,
            amount_remaining = 0
        WHERE id = ?
      `).run(
        return_date, 
        return_mileage, 
        return_photos ? JSON.stringify(return_photos) : null, 
        km_retour, 
        km_parcouru, 
        km_factures, 
        excess_amount || 0,
        is_damaged ? 1 : 0,
        damage_deduction || 0,
        fuel_return_bars || null,
        extraCharges,
        extraCharges,
        id
      );

      db.prepare("UPDATE cars SET status = 'available', mileage = ? WHERE id = ?").run(return_mileage, rental.car_id);
    });

    transaction();
    res.json({ success: true });
  });

  app.delete("/api/rentals/:id", authenticateToken, (req: any, res) => {
    const { id } = req.params;

    const rental = db.prepare("SELECT * FROM rentals WHERE id = ?").get(id) as any;
    if (!rental) return res.status(404).json({ message: "Rental not found" });

    const transaction = db.transaction(() => {
      if (rental.status === 'active') {
        db.prepare("UPDATE cars SET status = 'available' WHERE id = ?").run(rental.car_id);
      }
      db.prepare("DELETE FROM rentals WHERE id = ?").run(id);
    });

    transaction();
    res.json({ success: true });
  });

  // Lease Groups Management
  app.post("/api/rentals/group", authenticateToken, (req: any, res) => {
    const { rentalIds } = req.body;
    if (!rentalIds || !Array.isArray(rentalIds) || rentalIds.length === 0) {
      return res.status(400).json({ message: "Locations invalides" });
    }

    try {
      const transaction = db.transaction(() => {
        // Find rentals
        const rentals = db.prepare(`SELECT * FROM rentals WHERE id IN (${rentalIds.map(() => "?").join(",")})`).all(...rentalIds) as any[];
        if (rentals.length === 0) {
          throw new Error("Aucune location correspondante trouvée.");
        }

        const currentYear = new Date().getFullYear();

        // Find next incremental lease group base number
        let maxBase = 0;
        const rentalsWithGroups = db.prepare("SELECT lease_group_number FROM rentals WHERE lease_group_number IS NOT NULL").all() as any[];
        rentalsWithGroups.forEach(r => {
          const base = parseInt(r.lease_group_number);
          if (!isNaN(base) && base > maxBase) {
            maxBase = base;
          }
        });

        // Find the maximum numeric contract base prefix currently used for any rentals of the current year
        let maxNumericNum = 0;
        const allYearRentals = db.prepare("SELECT contract_number FROM rentals WHERE contract_number LIKE ?").all(`%/${currentYear}`) as any[];
        allYearRentals.forEach(r => {
          if (r.contract_number) {
            const match = r.contract_number.match(/^(\d+)/);
            if (match) {
              const num = parseInt(match[1]);
              if (!isNaN(num) && num > maxNumericNum) {
                maxNumericNum = num;
              }
            }
          }
        });

        const nextBaseNum = Math.max(maxNumericNum + 1, maxBase + 1);
        const groupStr = nextBaseNum.toString().padStart(3, '0');

        // Order rentals by start_date so alphabet letters correspond to chronological order
        rentals.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (let i = 0; i < rentals.length; i++) {
          const rental = rentals[i];
          const suffix = alphabet[i % alphabet.length];
          const contract_number = `${groupStr}${suffix}/${currentYear}`;

          db.prepare(`
            UPDATE rentals 
            SET lease_group_number = ?, lease_suffix = ?, contract_number = ? 
            WHERE id = ?
          `).run(groupStr, suffix, contract_number, rental.id);
        }

        return groupStr;
      });

      const groupStr = transaction();
      res.json({ success: true, lease_group_number: groupStr });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/rentals/group/add", authenticateToken, (req: any, res) => {
    const { groupNumber, rentalIds } = req.body;
    if (!groupNumber || !rentalIds || !Array.isArray(rentalIds) || rentalIds.length === 0) {
      return res.status(400).json({ message: "Requête invalide" });
    }

    try {
      const transaction = db.transaction(() => {
        // Find existing rentals in this group
        const existing = db.prepare("SELECT * FROM rentals WHERE lease_group_number = ? ORDER BY lease_suffix ASC").all(groupNumber) as any[];
        
        let nextLetterCode = 65; // 'A' in ASCII
        if (existing.length > 0) {
          // Find max suffix letter used so far
          const lastSuffix = existing[existing.length - 1].lease_suffix || 'A';
          nextLetterCode = lastSuffix.charCodeAt(0) + 1;
        }

        const currentYear = new Date().getFullYear();

        rentalIds.forEach((id) => {
          const suffix = String.fromCharCode(nextLetterCode);
          const contract_number = `${groupNumber}${suffix}/${currentYear}`;
          
          db.prepare(`
            UPDATE rentals 
            SET lease_group_number = ?, lease_suffix = ?, contract_number = ? 
            WHERE id = ?
          `).run(groupNumber, suffix, contract_number, id);

          nextLetterCode++;
        });
      });

      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/rentals/group/remove", authenticateToken, (req: any, res) => {
    const { rentalId } = req.body;
    if (!rentalId) {
      return res.status(400).json({ message: "ID de location manquant" });
    }

    try {
      const transaction = db.transaction(() => {
        const rental = db.prepare("SELECT * FROM rentals WHERE id = ?").get(rentalId) as any;
        if (!rental) throw new Error("Location non trouvée.");

        const currentYear = new Date().getFullYear();
        const cleanContractNumber = `${rental.lease_group_number || rental.id}/${currentYear}`;

        db.prepare(`
          UPDATE rentals 
          SET lease_group_number = NULL, lease_suffix = NULL, contract_number = ? 
          WHERE id = ?
        `).run(cleanContractNumber, rentalId);
      });

      transaction();
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Analytics
  app.get("/api/analytics", authenticateToken, (req: any, res) => {
    const agencyId = req.user.agency_id;
    const baseWhere = req.user.role === 'admin' ? "" : `WHERE c.agency_id = ${agencyId}`;
    const baseWhereAnd = req.user.role === 'admin' ? "" : `AND c.agency_id = ${agencyId}`;
    
    const income = db.prepare(`SELECT SUM(total_price) as total FROM rentals r JOIN cars c ON r.car_id = c.id ${baseWhere}`).get() as any;
    const activeRentals = db.prepare(`SELECT COUNT(*) as count FROM rentals r JOIN cars c ON r.car_id = c.id ${baseWhere} ${baseWhere ? 'AND' : 'WHERE'} r.status = 'active'`).get() as any;
    const availableCars = db.prepare(`SELECT COUNT(*) as count FROM cars c ${req.user.role === 'admin' ? "" : `WHERE agency_id = ${agencyId}`} ${req.user.role === 'admin' ? 'WHERE' : 'AND'} status = 'available'`).get() as any;
    
    const rentalsPerMonth = db.prepare(`
      SELECT strftime('%Y-%m', start_date) as month, COUNT(*) as count 
      FROM rentals r 
      JOIN cars c ON r.car_id = c.id 
      ${baseWhere}
      GROUP BY month 
      ORDER BY month DESC 
      LIMIT 12
    `).all();

    // Get actual clients count for client's agency
    const clientsCountQuery = req.user.role === 'admin' 
      ? `SELECT COUNT(*) as count FROM customers` 
      : `SELECT COUNT(*) as count FROM customers WHERE agency_id = ?`;
    const totalClients = req.user.role === 'admin'
      ? db.prepare(clientsCountQuery).get() as any
      : db.prepare(clientsCountQuery).get(agencyId) as any;

    // Get upcoming active rental returns sorted by return date
    const upcomingReturns = db.prepare(`
      SELECT r.id, r.end_date, r.return_time, r.customer_name, r.customer_phone, 
             c.brand, c.model, c.registration, 
             (CASE WHEN cust.type = 'company' THEN cust.name ELSE (IFNULL(cust.first_name, '') || ' ' || IFNULL(cust.name, '')) END) as driver_name
      FROM rentals r
      JOIN cars c ON r.car_id = c.id
      LEFT JOIN customers cust ON r.driver_id = cust.id
      WHERE r.status = 'active' ${baseWhereAnd}
      ORDER BY r.end_date ASC
      LIMIT 5
    `).all() as any[];

    // Get payment sums
    const financeSummary = db.prepare(`
      SELECT SUM(r.total_price) as total_contracts, SUM(r.amount_paid) as total_received
      FROM rentals r
      JOIN cars c ON r.car_id = c.id
      ${baseWhere}
    `).get() as any;

    // Get status breakdown
    const statusSummary = db.prepare(`
      SELECT r.status, COUNT(*) as count
      FROM rentals r
      JOIN cars c ON r.car_id = c.id
      ${baseWhere}
      GROUP BY r.status
    `).all() as any[];

    res.json({
      income: income.total || 0,
      activeRentals: activeRentals.count || 0,
      availableCars: availableCars.count || 0,
      totalClients: totalClients?.count || 0,
      upcomingReturns,
      financeSummary: {
        totalContracts: financeSummary?.total_contracts || 0,
        totalReceived: financeSummary?.total_received || 0,
        totalRemaining: Math.max(0, (financeSummary?.total_contracts || 0) - (financeSummary?.total_received || 0))
      },
      statusSummary,
      rentalsPerMonth
    });
  });

  // Settings
  app.get("/api/settings", authenticateToken, (req, res) => {
    const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
    res.json(settings);
  });

  app.post("/api/settings", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.sendStatus(403);
    const fields = req.body;
    const columns = ["id", ...Object.keys(fields)].join(", ");
    const placeholders = ["1", ...Object.keys(fields).map(() => "?")].join(", ");
    const values = Object.values(fields);
    
    try {
      db.prepare(`INSERT INTO settings (${columns}) VALUES (${placeholders})`).run(...values);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/settings", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.sendStatus(403);
    const fields = req.body;
    const sets = Object.keys(fields).map(key => `${key} = ?`).join(", ");
    const values = Object.values(fields);
    
    db.prepare(`UPDATE settings SET ${sets} WHERE id = 1`).run(...values);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
