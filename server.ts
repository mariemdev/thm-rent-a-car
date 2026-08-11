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

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

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

// Initialize Database Schema
async function initializeDatabase() {
  try {
    console.log('Initializing PostgreSQL database...');

    // Only drop tables if DATABASE_RESET environment variable is set to 'true'
    // This prevents accidental data loss when using online database
    if (process.env.DATABASE_RESET === 'true') {
      console.log('DATABASE_RESET is true, dropping all tables...');
      await pool.query(`DROP TABLE IF EXISTS repairs CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS rentals CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS customers CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS cars CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS branches CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS agencies CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS users CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS colors CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS brands CASCADE`);
      await pool.query(`DROP TABLE IF EXISTS settings CASCADE`);
    } else {
      console.log('DATABASE_RESET is not set, preserving existing tables...');
    }

    // Create agencies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS agencies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT
      );
    `);

    // Create brands table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        agency_id INTEGER,
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      );
    `);

    // Create colors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS colors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        agency_id INTEGER,
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      );
    `);

    // Create branches table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        agency_id INTEGER,
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      );
    `);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
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
    `);

    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('individual', 'company')),
        name TEXT NOT NULL,
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
    `);

    // Create cars table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cars (
        id SERIAL PRIMARY KEY,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        registration TEXT UNIQUE NOT NULL,
        mileage INTEGER DEFAULT 0,
        fuel_type TEXT,
        fuel_total_bars INTEGER DEFAULT 8,
        fuel_current_bars INTEGER DEFAULT 8,
        daily_price NUMERIC DEFAULT 0,
        oil_change_mileage INTEGER DEFAULT 0,
        insurance_start_date TEXT,
        insurance_expiry_date TEXT,
        technical_inspection_start_date TEXT,
        technical_inspection_expiry_date TEXT,
        last_oil_change_mileage INTEGER DEFAULT 0,
        next_oil_change_mileage INTEGER DEFAULT 0,
        last_oil_change_date TEXT,
        vignette_expiry_date TEXT,
        vignette_start_date TEXT,
        circulation_date TEXT,
        exit_date TEXT,
        status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'rented', 'maintenance', 'archived')),
        images TEXT,
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
        agency_id INTEGER,
        branch_id INTEGER,
        FOREIGN KEY (agency_id) REFERENCES agencies(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      );
    `);

    // Create rentals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rentals (
        id SERIAL PRIMARY KEY,
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
        deposit_amount NUMERIC,

        tax_id TEXT,
        other_charges NUMERIC DEFAULT 0,
        vat NUMERIC DEFAULT 0,
        stamp_duty NUMERIC DEFAULT 0,

        fuel_level INTEGER DEFAULT 0,
        car_condition_notes TEXT,

        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_price NUMERIC NOT NULL,
        daily_price NUMERIC NOT NULL,
        deposit NUMERIC DEFAULT 0,
        current_mileage INTEGER DEFAULT 0,
        car_id INTEGER NOT NULL,
        branch_id INTEGER NOT NULL,
        agent_id INTEGER NOT NULL,
        driver_id INTEGER,
        has_second_driver INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        state_photos TEXT,
        return_date TEXT,
        return_mileage INTEGER,
        return_photos TEXT,
        min_age_confirmed INTEGER DEFAULT 0,
        license_duration_confirmed INTEGER DEFAULT 0,
        excess_km_price NUMERIC DEFAULT 5,
        km_allowance INTEGER DEFAULT 280,
        customer_id INTEGER,
        is_client_first_driver INTEGER DEFAULT 0,
        amount_paid NUMERIC DEFAULT 0,
        amount_remaining NUMERIC DEFAULT 0,
        customer_type TEXT,
        is_damaged INTEGER DEFAULT 0,
        deposit_deduction NUMERIC DEFAULT 0,
        fuel_total_bars INTEGER DEFAULT 8,
        fuel_depart_bars INTEGER DEFAULT 8,
        fuel_return_bars INTEGER,
        created_by_id INTEGER,
        contract_number TEXT,
        second_driver_id INTEGER,
        lease_group_number TEXT,
        lease_suffix TEXT,
        rental_days TEXT,
        is_rental_days_overridden INTEGER DEFAULT 0,
        swaps TEXT,
        FOREIGN KEY (car_id) REFERENCES cars(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id),
        FOREIGN KEY (agent_id) REFERENCES users(id),
        FOREIGN KEY (driver_id) REFERENCES customers(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (second_driver_id) REFERENCES customers(id)
      );
    `);

    // Create repairs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS repairs (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC DEFAULT 0,
        mileage INTEGER,
        FOREIGN KEY (car_id) REFERENCES cars(id)
      );
    `);

    // Create settings table
    await pool.query(`DROP TABLE IF EXISTS settings CASCADE`);
    await pool.query(`
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        company_name TEXT,
        company_address TEXT,
        company_phone TEXT,
        company_whatsapp TEXT,
        company_mf TEXT,
        company_email TEXT,
        company_logo TEXT,
        km_allowance INTEGER DEFAULT 280,
        excess_km_price NUMERIC DEFAULT 0.5,
        terms_fr TEXT,
        terms_ar TEXT,
        vehicle_condition_image TEXT
      );
    `);

    console.log('Database schema initialized successfully');

    // Seed admin users
    const superadminResult = await pool.query('SELECT * FROM users WHERE email = $1', ['superadmin@automanager.com']);
    if (superadminResult.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("superadmin123", 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5)',
        ["Super Admin", "superadmin@automanager.com", hashedPassword, "superadmin", 1]
      );
      console.log('Created superadmin user');
    }

    const adminResult = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@automanager.com']);
    if (adminResult.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5)',
        ["Admin", "admin@automanager.com", hashedPassword, "admin", 1]
      );
      console.log('Created admin user');
    }

    // Seed brands - force re-seed
    console.log('Seeding brands...');
    await pool.query('DELETE FROM brands');
    const brands = ["Mercedes-Benz", "BMW", "Audi", "Tesla", "Porsche", "Renault", "Peugeot", "Volkswagen", "Toyota", "Kia", "Hyundai", "Fiat"];
    for (const brand of brands) {
      await pool.query('INSERT INTO brands (name) VALUES ($1)', [brand]);
    }
    console.log('Seeded brands');

    // Seed colors - force re-seed
    console.log('Seeding colors...');
    await pool.query('DELETE FROM colors');
    const colors = ["Noir", "Blanc", "Gris", "Bleu", "Rouge", "Argent", "Beige", "Marron"];
    for (const color of colors) {
      await pool.query('INSERT INTO colors (name) VALUES ($1)', [color]);
    }
    console.log('Seeded colors');

    // Seed agency and branches - only if they don't exist
    console.log('Seeding agency and branches...');
    let agencyId, branchId;

    // Check if agency exists
    const existingAgency = await pool.query('SELECT id FROM agencies WHERE name = $1', ["THM RENT A CAR"]);
    if (existingAgency.rows.length === 0) {
      console.log('Creating agency...');
      const agencyResult = await pool.query(
        'INSERT INTO agencies (name, address, phone) VALUES ($1, $2, $3) RETURNING id',
        ["THM RENT A CAR", "Tunis, Tunisie", "+216 71 000 000"]
      );
      agencyId = agencyResult.rows[0].id;
      console.log('Agency created with ID:', agencyId);
    } else {
      agencyId = existingAgency.rows[0].id;
      console.log('Agency already exists with ID:', agencyId);
    }

    // Check if branch exists
    const existingBranch = await pool.query('SELECT id FROM branches WHERE name = $1 AND agency_id = $2', ["Tunis", agencyId]);
    if (existingBranch.rows.length === 0) {
      console.log('Creating branch...');
      const branchResult = await pool.query(
        'INSERT INTO branches (name, address, phone, agency_id) VALUES ($1, $2, $3, $4) RETURNING id',
        ["Tunis", "Tunis Centre", "+216 71 000 001", agencyId]
      );
      branchId = branchResult.rows[0].id;
      console.log('Branch created with ID:', branchId);
    } else {
      branchId = existingBranch.rows[0].id;
      console.log('Branch already exists with ID:', branchId);
    }

    // Check if second branch exists
    const existingBranch2 = await pool.query('SELECT id FROM branches WHERE name = $1 AND agency_id = $2', ["Bizerte", agencyId]);
    if (existingBranch2.rows.length === 0) {
      console.log('Creating second branch...');
      await pool.query(
        'INSERT INTO branches (name, address, phone, agency_id) VALUES ($1, $2, $3, $4)',
        ["Bizerte", "Bizerte Port", "+216 72 000 002", agencyId]
      );
      console.log('Second branch created');
    } else {
      console.log('Second branch already exists');
    }

    console.log('Seeding test cars...');
    const testCars = [
      { brand: "Mercedes-Benz", model: "Classe S", reg: "AA-123-BB", daily_price: 350 },
      { brand: "BMW", model: "Série 5", reg: "CC-456-DD", daily_price: 280 },
      { brand: "Audi", model: "A6", reg: "EE-789-FF", daily_price: 300 },
      { brand: "Tesla", model: "Model 3", reg: "GG-012-HH", daily_price: 250 },
      { brand: "Porsche", model: "911", reg: "II-345-JJ", daily_price: 450 }
    ];

    for (const car of testCars) {
      // Check if car already exists by registration
      const existingCar = await pool.query('SELECT id FROM cars WHERE registration = $1', [car.reg]);
      if (existingCar.rows.length === 0) {
        await pool.query(
          'INSERT INTO cars (brand, model, registration, mileage, agency_id, branch_id, daily_price, images) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [car.brand, car.model, car.reg, 5000, agencyId || null, branchId || null, car.daily_price, JSON.stringify([`https://picsum.photos/seed/${car.reg}/800/600`])]
        );
        console.log('Car seeded:', car.reg);
      } else {
        console.log('Car already exists, skipping:', car.reg);
      }
    }

    // Update admin users with agency_id
    console.log('Updating admin users with agency_id...');
    await pool.query(
      'UPDATE users SET agency_id = $1, branch_id = $2 WHERE role = $3 OR role = $4',
      [agencyId, branchId, 'superadmin', 'admin']
    );
    console.log('Admin users updated');

    // Seed test customers
    console.log('Seeding test customers...');
    const testCustomers = [
      { type: 'individual', name: 'Ben Ali', first_name: 'Ahmed', phone: '+216 71 123 456', email: 'ahmed.benali@example.com', id_number: '12345678' },
      { type: 'individual', name: 'Trabelsi', first_name: 'Fatma', phone: '+216 74 987 654', email: 'fatma.trabelsi@example.com', id_number: '87654321' },
      { type: 'company', name: 'Société ABC', first_name: '', phone: '+216 71 555 666', email: 'contact@abc.tn', id_number: '1234567/A/M/000' }
    ];

    for (const customer of testCustomers) {
      // Check if customer already exists by id_number
      const existingCustomer = await pool.query('SELECT id FROM customers WHERE id_number = $1', [customer.id_number]);
      if (existingCustomer.rows.length === 0) {
        await pool.query(
          'INSERT INTO customers (type, name, first_name, phone, email, id_number, agency_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [customer.type, customer.name, customer.first_name, customer.phone, customer.email, customer.id_number, agencyId]
        );
        console.log('Customer seeded:', customer.name);
      } else {
        console.log('Customer already exists, skipping:', customer.name);
      }
    }

    console.log('Seeded agency, branches, and test cars');

    // Seed settings
    const settingsCount = await pool.query('SELECT COUNT(*) as count FROM settings');
    if (settingsCount.rows[0].count === 0) {
      await pool.query(`
        INSERT INTO settings (
          id, company_name, company_address, company_phone, company_whatsapp, 
          company_mf, company_email, km_allowance, excess_km_price, terms_fr, terms_ar
        ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
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
      ]);
      console.log('Seeded settings');
    }

    // Ensure all admins have an agency_id if one exists
    const firstAgency = await pool.query('SELECT id FROM agencies LIMIT 1');
    const firstBranch = await pool.query('SELECT id FROM branches LIMIT 1');
    if (firstAgency.rows.length > 0 && firstBranch.rows.length > 0) {
      await pool.query(
        'UPDATE users SET agency_id = $1, branch_id = $2 WHERE (role = $3 OR role = $4) AND agency_id IS NULL',
        [firstAgency.rows[0].id, firstBranch.rows[0].id, 'superadmin', 'admin']
      );
    }

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

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

const RENTAL_SELECT = `
  SELECT r.*, c.brand, c.model, c.registration, c.year, c.color, c.power, c.seats, c.transmission, c.fuel_type,
    b.name AS branch_name,
    CASE WHEN cust.type = 'company' THEN cust.name
         ELSE TRIM(CONCAT(COALESCE(cust.first_name, ''), ' ', COALESCE(cust.name, '')))
    END AS driver_name,
    u.name AS creator_name
  FROM rentals r
  LEFT JOIN cars c ON r.car_id = c.id
  LEFT JOIN branches b ON r.branch_id = b.id
  LEFT JOIN customers cust ON r.driver_id = cust.id
  LEFT JOIN users u ON r.created_by_id = u.id
`;

const RENTAL_INSERT_COLUMNS = [
  'customer_name', 'customer_phone', 'customer_id_type', 'customer_id_number',
  'customer_id_issued_date', 'customer_id_issued_at', 'customer_birth_date',
  'customer_birth_place', 'customer_address', 'customer_profession',
  'customer_license_number', 'customer_license_issued_date', 'customer_license_issued_at',
  'second_driver_name', 'second_driver_id_number', 'second_driver_id_issued_date',
  'second_driver_id_issued_at', 'second_driver_birth_date', 'second_driver_birth_place',
  'second_driver_address', 'second_driver_phone', 'second_driver_profession',
  'second_driver_license_number', 'second_driver_license_issued_date',
  'second_driver_license_issued_at', 'departure_place', 'departure_time',
  'return_place', 'return_time', 'prolongation_date', 'prolongation_place',
  'prolongation_time', 'km_depart', 'km_retour', 'km_parcouru', 'km_factures',
  'payment_mode', 'deposit_amount', 'tax_id', 'other_charges', 'vat', 'stamp_duty',
  'fuel_level', 'car_condition_notes', 'start_date', 'end_date', 'total_price',
  'daily_price', 'deposit', 'current_mileage', 'car_id', 'branch_id',
  'driver_id', 'has_second_driver', 'state_photos', 'return_date',
  'return_mileage', 'return_photos', 'min_age_confirmed', 'license_duration_confirmed',
  'excess_km_price', 'km_allowance', 'customer_id', 'is_client_first_driver',
  'amount_paid', 'amount_remaining', 'customer_type', 'is_damaged', 'deposit_deduction',
  'fuel_total_bars', 'fuel_depart_bars', 'fuel_return_bars',
  'second_driver_id', 'lease_group_number', 'lease_suffix',
  'rental_days', 'is_rental_days_overridden', 'swaps', 'contract_number',
];

function normalizeRentalValue(value: any) {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value !== null && typeof value === 'object') return JSON.stringify(value);
  if (value === '' || value === 'none') return null;
  return value;
}

async function generateContractInfo(client: pg.PoolClient, fields: any) {
  const currentYear = new Date().getFullYear();
  let contract_number = '';
  let lease_group_number: string | null = fields.lease_group_number || null;
  let lease_suffix: string | null = fields.lease_suffix || null;

  const yearRentals = await client.query(
    "SELECT contract_number FROM rentals WHERE contract_number LIKE $1",
    [`%/${currentYear}`]
  );
  let maxNumericNum = 0;
  for (const row of yearRentals.rows) {
    const match = row.contract_number?.match(/^(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > maxNumericNum) maxNumericNum = num;
    }
  }

  if (fields.lease_group_number) {
    const existing = await client.query(
      'SELECT lease_suffix FROM rentals WHERE lease_group_number = $1 ORDER BY lease_suffix ASC',
      [fields.lease_group_number]
    );
    let nextSuffixLetter = 'A';
    if (existing.rows.length > 0) {
      const lastSuffix = existing.rows[existing.rows.length - 1].lease_suffix || 'A';
      nextSuffixLetter = String.fromCharCode(lastSuffix.charCodeAt(0) + 1);
    }
    lease_suffix = nextSuffixLetter;
    contract_number = `${fields.lease_group_number}${nextSuffixLetter}/${currentYear}`;
  } else if (fields.create_lease_group && fields.customer_type === 'company') {
    const groups = await client.query(
      'SELECT lease_group_number FROM rentals WHERE lease_group_number IS NOT NULL'
    );
    let maxBase = 0;
    for (const row of groups.rows) {
      const base = parseInt(row.lease_group_number, 10);
      if (!Number.isNaN(base) && base > maxBase) maxBase = base;
    }
    const nextBaseNum = Math.max(maxNumericNum + 1, maxBase + 1);
    const groupStr = nextBaseNum.toString().padStart(3, '0');
    lease_group_number = groupStr;
    lease_suffix = 'A';
    contract_number = `${groupStr}A/${currentYear}`;
  } else {
    const nextNumber = maxNumericNum + 1;
    contract_number = `${nextNumber.toString().padStart(3, '0')}/${currentYear}`;
  }

  return { contract_number, lease_group_number, lease_suffix };
}

async function syncCarStatusForRental(
  client: pg.PoolClient,
  previous: any,
  next: { car_id?: number; status?: string }
) {
  const nextCarId = next.car_id !== undefined ? Number(next.car_id) : Number(previous.car_id);
  const nextStatus = next.status !== undefined ? next.status : previous.status;
  const prevCarId = Number(previous.car_id);
  const prevStatus = previous.status;

  if (nextCarId !== prevCarId) {
    await client.query("UPDATE cars SET status = 'available' WHERE id = $1", [prevCarId]);
    if (nextStatus === 'active') {
      await client.query("UPDATE cars SET status = 'rented' WHERE id = $1", [nextCarId]);
    }
    return;
  }

  if (nextStatus !== prevStatus) {
    if (nextStatus === 'active') {
      await client.query("UPDATE cars SET status = 'rented' WHERE id = $1", [nextCarId]);
    } else if (prevStatus === 'active' && ['completed', 'cancelled', 'scheduled'].includes(nextStatus)) {
      await client.query("UPDATE cars SET status = 'available' WHERE id = $1", [nextCarId]);
    }
  }
}

async function startServer() {
  await initializeDatabase();

  const app = express();
  const PORT = 3000;

  // Vite server - must be before API routes
  const vite = await createViteServer({
    server: { middlewareMode: true },
  });

  // Use Vite middleware for non-API routes only
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      next(); // Let API routes handle this
    } else {
      vite.middlewares(req, res, next);
    }
  });

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Token manquant" });

    jwt.verify(token, JWT_SECRET, async (err: any, decoded: any) => {
      if (err) return res.status(403).json({ message: "Token invalide" });
      
      // Verify that the user still exists in the database to prevent foreign key errors
      const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      const user = userResult.rows[0];
      if (!user) {
        return res.status(401).json({ message: "Utilisateur non trouvé. Veuillez vous reconnecter." });
      }
      
      req.user = user;
      next();
    });
  };

  // API Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Check if verified - temporarily disabled for testing
    // if (user.is_verified === 0) {
    //   return res.status(403).json({ 
    //     message: "Compte non vérifié. Veuillez vérifier votre boîte de réception pour activer votre compte.",
    //     unverified: true,
    //     email: user.email
    //   });
    // }

    const token = jwt.sign({ id: user.id, role: user.role, agency_id: user.agency_id, branch_id: user.branch_id }, JWT_SECRET);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, agency_id: user.agency_id, branch_id: user.branch_id } });
  });

  // Verification & Password Recovery Routes
  app.get("/verify-email", async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).send("Token manquant");
    
    const userResult = await pool.query('SELECT * FROM users WHERE verification_token = $1', [token]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(400).send("Lien de vérification invalide ou expiré.");
    }
    
    await pool.query('UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = $1', [user.id]);
    res.redirect("/login?verified=true");
  });

  app.post("/api/auth/resend-verification", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });
    
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });
    
    if (user.is_verified === 1) {
      return res.status(400).json({ message: "Compte déjà vérifié" });
    }
    
    let token = user.verification_token;
    if (!token) {
      token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await pool.query('UPDATE users SET verification_token = $1 WHERE id = $2', [token, user.id]);
    }
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    sendVerificationEmail(user.email, user.name, token, baseUrl);
    res.json({ success: true, message: "Email de vérification renvoyé." });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis" });
    
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now
    
    await pool.query('UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3', [token, expiry, user.id]);
    
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;
    
    sendPasswordResetEmail(user.email, user.name, token, baseUrl);
    res.json({ success: true, message: "Email de réinitialisation envoyé." });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token et nouveau mot de passe requis" });
    
    const userResult = await pool.query('SELECT * FROM users WHERE reset_token = $1', [token]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(400).json({ message: "Token invalide ou expiré" });
    }
    
    if (new Date() > new Date(user.reset_token_expiry)) {
      return res.status(400).json({ message: "Token expiré" });
    }
    
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2', [hashedPassword, user.id]);
    
    res.json({ success: true, message: "Mot de passe réinitialisé avec succès" });
  });

  // Users CRUD
  app.get("/api/users", authenticateToken, async (req, res) => {
    const { agency_id, branch_id, role } = req.user;
    let query = 'SELECT * FROM users';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (role !== 'superadmin' && agency_id) {
      conditions.push('agency_id = $' + (params.length + 1));
      params.push(agency_id);
    }
    
    if ((role === 'agent' || role === 'manager') && branch_id) {
      conditions.push('branch_id = $' + (params.length + 1));
      params.push(branch_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  });

  app.post("/api/users", authenticateToken, async (req, res) => {
    const { name, email, password, role, agency_id, branch_id } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    // Use authenticated user's agency_id/branch_id if not provided
    const finalAgencyId = agency_id !== undefined && agency_id !== '' ? agency_id : req.user.agency_id;
    const finalBranchId = branch_id !== undefined && branch_id !== '' ? branch_id : req.user.branch_id;
    
    try {
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role, agency_id, branch_id, created_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [name, email, hashedPassword, role, finalAgencyId, finalBranchId, req.user.id]
      );
      
      // Send verification email
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await pool.query('UPDATE users SET verification_token = $1 WHERE id = $2', [token, result.rows[0].id]);
      
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      
      sendVerificationEmail(email, name, token, baseUrl);
      
      res.json(result.rows[0]);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ message: "Email déjà utilisé" });
      }
      throw error;
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, email, role, agency_id, branch_id } = req.body;
    
    // Use authenticated user's agency_id/branch_id if not provided
    const finalAgencyId = agency_id !== undefined && agency_id !== '' ? agency_id : req.user.agency_id;
    const finalBranchId = branch_id !== undefined && branch_id !== '' ? branch_id : req.user.branch_id;
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3, agency_id = $4, branch_id = $5 WHERE id = $6 RETURNING *',
      [name, email, role, finalAgencyId, finalBranchId, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    res.json(result.rows[0]);
  });

  app.delete("/api/users/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    res.json({ message: "Utilisateur supprimé" });
  });

  // Agencies CRUD
  app.get("/api/agencies", authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM agencies');
    res.json(result.rows);
  });

  app.post("/api/agencies", authenticateToken, async (req, res) => {
    const { name, address, phone } = req.body;
    
    const result = await pool.query(
      'INSERT INTO agencies (name, address, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, address, phone]
    );
    
    res.json(result.rows[0]);
  });

  app.put("/api/agencies/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, address, phone } = req.body;
    
    const result = await pool.query(
      'UPDATE agencies SET name = $1, address = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, address, phone, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Agence non trouvée" });
    }
    
    res.json(result.rows[0]);
  });

  app.delete("/api/agencies/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM agencies WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Agence non trouvée" });
    }
    
    res.json({ message: "Agence supprimée" });
  });

  // Branches CRUD
  app.get("/api/branches", authenticateToken, async (req, res) => {
    const { agency_id, role } = req.user;
    let query = 'SELECT b.*, a.name as agency_name FROM branches b LEFT JOIN agencies a ON b.agency_id = a.id';
    const params: any[] = [];
    
    if (role !== 'superadmin' && agency_id) {
      query += ' WHERE b.agency_id = $1';
      params.push(agency_id);
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  });

  app.post("/api/branches", authenticateToken, async (req, res) => {
    const { name, address, phone, agency_id } = req.body;
    
    const result = await pool.query(
      'INSERT INTO branches (name, address, phone, agency_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, address, phone, agency_id || null]
    );
    
    res.json(result.rows[0]);
  });

  app.put("/api/branches/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, address, phone, agency_id } = req.body;
    
    const result = await pool.query(
      'UPDATE branches SET name = $1, address = $2, phone = $3, agency_id = $4 WHERE id = $5 RETURNING *',
      [name, address, phone, agency_id || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Bureau non trouvé" });
    }
    
    res.json(result.rows[0]);
  });

  app.delete("/api/branches/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM branches WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Bureau non trouvé" });
    }
    
    res.json({ message: "Bureau supprimé" });
  });

  // Cars CRUD
  app.get("/api/cars", authenticateToken, async (req, res) => {
    const { agency_id, branch_id, role } = req.user;
    let query = 'SELECT cars.*, branches.name as branch_name FROM cars LEFT JOIN branches ON cars.branch_id = branches.id';
    const params: any[] = [];
    const conditions: string[] = [];
    
    console.log('GET /api/cars - user:', { agency_id, branch_id, role });
    
    if (role !== 'superadmin' && agency_id) {
      conditions.push('cars.agency_id = $' + (params.length + 1));
      params.push(agency_id);
    }
    
    if ((role === 'agent' || role === 'manager') && branch_id) {
      conditions.push('cars.branch_id = $' + (params.length + 1));
      params.push(branch_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await pool.query(query, params);
    console.log('GET /api/cars - result count:', result.rows.length);
    res.json(result.rows);
  });

  app.post("/api/cars", authenticateToken, async (req, res) => {
    try {
      const carData = req.body;
      console.log('POST /api/cars - received carData.images:', carData.images?.substring(0, 100) || 'undefined');
      // Use authenticated user's agency_id/branch_id if not provided
      const agencyId = carData.agency_id !== undefined && carData.agency_id !== '' ? carData.agency_id : req.user.agency_id;
      const branchId = carData.branch_id !== undefined && carData.branch_id !== '' ? carData.branch_id : req.user.branch_id;
      
      const result = await pool.query(
        `INSERT INTO cars (
          brand, model, registration, mileage, fuel_type, fuel_total_bars, fuel_current_bars,
          daily_price, oil_change_mileage, insurance_start_date, insurance_expiry_date,
          technical_inspection_start_date, technical_inspection_expiry_date,
          last_oil_change_mileage, next_oil_change_mileage, last_oil_change_date,
          vignette_expiry_date, vignette_start_date, circulation_date, exit_date,
          status, images, year, transmission, power, color, seats, category,
          parking_location, chassis_number, abs, alarm, fog_lights, ac,
          power_steering, is_sold, sale_date, exploitation_start_date,
          exploitation_end_date, agency_id, branch_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
          $31, $32, $33, $34, $35, $36, $37, $38, $39, $40, $41
        ) RETURNING *`,
        [
          carData.brand, carData.model, carData.registration, carData.mileage || 0,
          carData.fuel_type, carData.fuel_total_bars || 8, carData.fuel_current_bars || 8,
          carData.daily_price || 0, carData.oil_change_mileage || 0, carData.insurance_start_date,
          carData.insurance_expiry_date, carData.technical_inspection_start_date,
          carData.technical_inspection_expiry_date, carData.last_oil_change_mileage || 0,
          carData.next_oil_change_mileage || 0, carData.last_oil_change_date,
          carData.vignette_expiry_date, carData.vignette_start_date, carData.circulation_date,
          carData.exit_date, carData.status || 'available', carData.images,
          carData.year, carData.transmission, carData.power, carData.color,
          carData.seats, carData.category, carData.parking_location, carData.chassis_number,
          carData.abs || 0, carData.alarm || 0, carData.fog_lights || 0, carData.ac || 0,
          carData.power_steering || 0, carData.is_sold || 0, carData.sale_date,
          carData.exploitation_start_date, carData.exploitation_end_date,
          agencyId, branchId
        ]
      );
      
      console.log('POST /api/cars - car created with images:', result.rows[0].images?.substring(0, 100) || 'undefined');
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error creating car:', error);
      res.status(500).json({ message: 'Erreur lors de la création du véhicule', error: error.message });
    }
  });

  app.put("/api/cars/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const carData = req.body;
    // Use authenticated user's agency_id/branch_id if not provided
    const agencyId = carData.agency_id !== undefined && carData.agency_id !== '' ? carData.agency_id : req.user.agency_id;
    const branchId = carData.branch_id !== undefined && carData.branch_id !== '' ? carData.branch_id : req.user.branch_id;
    
    // Get current car data to preserve required fields if not provided
    const currentCar = await pool.query('SELECT * FROM cars WHERE id = $1', [id]);
    if (currentCar.rows.length === 0) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }
    
    const result = await pool.query(
      `UPDATE cars SET
        brand = COALESCE($1, brand), model = COALESCE($2, model), registration = COALESCE($3, registration), mileage = COALESCE($4, mileage), fuel_type = COALESCE($5, fuel_type),
        fuel_total_bars = COALESCE($6, fuel_total_bars), fuel_current_bars = COALESCE($7, fuel_current_bars), daily_price = COALESCE($8, daily_price),
        oil_change_mileage = $9, insurance_start_date = $10, insurance_expiry_date = $11,
        technical_inspection_start_date = $12, technical_inspection_expiry_date = $13,
        last_oil_change_mileage = $14, next_oil_change_mileage = $15, last_oil_change_date = $16,
        vignette_expiry_date = $17, vignette_start_date = $18, circulation_date = $19,
        exit_date = $20, status = COALESCE($21, status), images = $22, year = COALESCE($23, year), transmission = COALESCE($24, transmission),
        power = COALESCE($25, power), color = COALESCE($26, color), seats = COALESCE($27, seats), category = COALESCE($28, category), parking_location = $29,
        chassis_number = $30, abs = $31, alarm = $32, fog_lights = $33, ac = $34,
        power_steering = $35, is_sold = COALESCE($36, is_sold), sale_date = $37, exploitation_start_date = $38,
        exploitation_end_date = $39, agency_id = $40, branch_id = $41
      WHERE id = $42 RETURNING *`,
      [
        carData.brand, carData.model, carData.registration, carData.mileage,
        carData.fuel_type, carData.fuel_total_bars, carData.fuel_current_bars,
        carData.daily_price, carData.oil_change_mileage, carData.insurance_start_date,
        carData.insurance_expiry_date, carData.technical_inspection_start_date,
        carData.technical_inspection_expiry_date, carData.last_oil_change_mileage,
        carData.next_oil_change_mileage, carData.last_oil_change_date,
        carData.vignette_expiry_date, carData.vignette_start_date, carData.circulation_date,
        carData.exit_date, carData.status, carData.images, carData.year,
        carData.transmission, carData.power, carData.color, carData.seats,
        carData.category, carData.parking_location, carData.chassis_number,
        carData.abs, carData.alarm, carData.fog_lights, carData.ac,
        carData.power_steering, carData.is_sold === true ? 1 : (carData.is_sold === false ? 0 : null), carData.sale_date,
        carData.exploitation_start_date, carData.exploitation_end_date,
        agencyId, branchId, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }
    
    res.json(result.rows[0]);
  });

  app.delete("/api/cars/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    
    // First delete associated repairs to avoid foreign key constraint violation
    await pool.query('DELETE FROM repairs WHERE car_id = $1', [id]);
    
    const result = await pool.query('DELETE FROM cars WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Véhicule non trouvé" });
    }
    
    res.json({ message: "Véhicule supprimé" });
  });

  // Repairs for a specific car
  app.get("/api/cars/:id/repairs", authenticateToken, async (req, res) => {
    const { id } = req.params;
    
    const result = await pool.query('SELECT * FROM repairs WHERE car_id = $1 ORDER BY date DESC', [id]);
    res.json(result.rows);
  });

  app.post("/api/cars/:id/repairs", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const repairData = req.body;
    
    const result = await pool.query(
      'INSERT INTO repairs (car_id, date, description, amount, mileage) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, repairData.date, repairData.description, repairData.amount || 0, repairData.mileage || null]
    );
    
    res.json(result.rows[0]);
  });

  // Customers CRUD
  app.get("/api/customers", authenticateToken, async (req, res) => {
    const { agency_id, role } = req.user;
    let query = 'SELECT * FROM customers';
    const params: any[] = [];
    
    console.log('GET /api/customers - user:', { agency_id, role });
    
    if (role !== 'superadmin' && agency_id) {
      query += ' WHERE agency_id = $1';
      params.push(agency_id);
    }
    
    const result = await pool.query(query, params);
    console.log('GET /api/customers - result count:', result.rows.length);
    res.json(result.rows);
  });

  app.post("/api/customers", authenticateToken, async (req, res) => {
    const customerData = req.body;
    // Use authenticated user's agency_id if not provided
    const agencyId = customerData.agency_id !== undefined && customerData.agency_id !== '' ? customerData.agency_id : req.user.agency_id;
    
    const result = await pool.query(
      `INSERT INTO customers (
        type, name, first_name, birth_date, birth_place, nationality, address,
        city, postal_code, phone, email, observation, id_type, id_number,
        id_issued_date, id_issued_place, id_expiry_date, license_number,
        license_issued_date, license_issued_place, license_expiry_date, agency_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *`,
      [
        customerData.type, customerData.name, customerData.first_name,
        customerData.birth_date, customerData.birth_place, customerData.nationality,
        customerData.address, customerData.city, customerData.postal_code,
        customerData.phone, customerData.email, customerData.observation,
        customerData.id_type, customerData.id_number, customerData.id_issued_date,
        customerData.id_issued_place, customerData.id_expiry_date,
        customerData.license_number, customerData.license_issued_date,
        customerData.license_issued_place, customerData.license_expiry_date,
        agencyId
      ]
    );
    
    res.json(result.rows[0]);
  });

  app.put("/api/customers/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const customerData = req.body;
    // Use authenticated user's agency_id if not provided
    const agencyId = customerData.agency_id !== undefined && customerData.agency_id !== '' ? customerData.agency_id : req.user.agency_id;
    
    const result = await pool.query(
      `UPDATE customers SET
        type = $1, name = $2, first_name = $3, birth_date = $4, birth_place = $5,
        nationality = $6, address = $7, city = $8, postal_code = $9, phone = $10,
        email = $11, observation = $12, id_type = $13, id_number = $14,
        id_issued_date = $15, id_issued_place = $16, id_expiry_date = $17,
        license_number = $18, license_issued_date = $19, license_issued_place = $20,
        license_expiry_date = $21, agency_id = $22
      WHERE id = $23 RETURNING *`,
      [
        customerData.type, customerData.name, customerData.first_name,
        customerData.birth_date, customerData.birth_place, customerData.nationality,
        customerData.address, customerData.city, customerData.postal_code,
        customerData.phone, customerData.email, customerData.observation,
        customerData.id_type, customerData.id_number, customerData.id_issued_date,
        customerData.id_issued_place, customerData.id_expiry_date,
        customerData.license_number, customerData.license_issued_date,
        customerData.license_issued_place, customerData.license_expiry_date,
        agencyId, id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client non trouvé" });
    }
    
    res.json(result.rows[0]);
  });

  app.delete("/api/customers/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Client non trouvé" });
    }
    
    res.json({ message: "Client supprimé" });
  });

  // Rentals CRUD
  app.get("/api/rentals", authenticateToken, async (req, res) => {
    try {
      const { agency_id, role } = req.user;
      let query = RENTAL_SELECT;
      const params: any[] = [];

      console.log('GET /api/rentals - user:', { agency_id, role });

      if (role !== 'admin' && role !== 'superadmin' && agency_id) {
        query += ' WHERE c.agency_id = $1';
        params.push(agency_id);
      }

      query += ' ORDER BY r.id DESC';
      const result = await pool.query(query, params);
      console.log('GET /api/rentals - result count:', result.rows.length);
      res.json(result.rows);
    } catch (error: any) {
      console.error('GET /api/rentals error:', error);
      res.status(500).json({ message: error.message || 'Erreur lors de la récupération des locations' });
    }
  });

  app.get("/api/rentals/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(`${RENTAL_SELECT} WHERE r.id = $1`, [id]);
      const rental = result.rows[0];
      if (!rental) return res.status(404).json({ message: 'Location non trouvée' });

      if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        const carResult = await pool.query('SELECT agency_id FROM cars WHERE id = $1', [rental.car_id]);
        if (carResult.rows[0]?.agency_id !== req.user.agency_id) {
          return res.status(403).json({ message: 'Accès refusé' });
        }
      }

      res.json(rental);
    } catch (error: any) {
      console.error('GET /api/rentals/:id error:', error);
      res.status(500).json({ message: error.message || 'Erreur lors de la récupération de la location' });
    }
  });

  app.post("/api/rentals", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      const fields = { ...req.body };
      if (!fields.car_id) {
        return res.status(400).json({ message: 'ID de véhicule manquant.' });
      }

      const carResult = await client.query('SELECT * FROM cars WHERE id = $1', [fields.car_id]);
      if (!carResult.rows[0]) {
        return res.status(400).json({ message: 'Véhicule non trouvé' });
      }

      await client.query('BEGIN');

      const contractInfo = await generateContractInfo(client, fields);
      fields.contract_number = contractInfo.contract_number;
      fields.lease_group_number = contractInfo.lease_group_number;
      fields.lease_suffix = contractInfo.lease_suffix;

      const branchId = fields.branch_id !== undefined && fields.branch_id !== ''
        ? fields.branch_id
        : req.user.branch_id;
      const status = fields.status || 'active';
      const skipKeys = new Set(['id', 'agent_id', 'created_by_id', 'status', 'create_lease_group']);

      const dataToInsert: Record<string, any> = {};
      for (const key of RENTAL_INSERT_COLUMNS) {
        if (skipKeys.has(key)) continue;
        if (fields[key] !== undefined) {
          dataToInsert[key] = normalizeRentalValue(fields[key]);
        }
      }
      if (branchId !== undefined && branchId !== null && branchId !== '') {
        dataToInsert.branch_id = branchId;
      }
      dataToInsert.contract_number = contractInfo.contract_number;
      if (contractInfo.lease_group_number) dataToInsert.lease_group_number = contractInfo.lease_group_number;
      if (contractInfo.lease_suffix) dataToInsert.lease_suffix = contractInfo.lease_suffix;

      const columns = Object.keys(dataToInsert);
      const values = Object.values(dataToInsert);
      const placeholders = columns.map((_, index) => `$${index + 1}`);
      const insertQuery = `
        INSERT INTO rentals (${columns.join(', ')}, agent_id, created_by_id, status)
        VALUES (${placeholders.join(', ')}, $${columns.length + 1}, $${columns.length + 2}, $${columns.length + 3})
        RETURNING id, contract_number
      `;

      const result = await client.query(insertQuery, [...values, req.user.id, req.user.id, status]);

      if (status === 'active') {
        await client.query("UPDATE cars SET status = 'rented' WHERE id = $1", [fields.car_id]);
      }

      await client.query('COMMIT');
      res.json(result.rows[0]);
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('POST /api/rentals error:', error);
      res.status(500).json({ message: error.message || 'Erreur lors de la création de la location' });
    } finally {
      client.release();
    }
  });

  app.put("/api/rentals/:id", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const fields = req.body;

      const existing = await client.query('SELECT * FROM rentals WHERE id = $1', [id]);
      const rental = existing.rows[0];
      if (!rental) return res.status(404).json({ message: 'Location non trouvée' });

      await client.query('BEGIN');
      await syncCarStatusForRental(client, rental, {
        car_id: fields.car_id,
        status: fields.status,
      });

      const branchId = fields.branch_id !== undefined && fields.branch_id !== ''
        ? fields.branch_id
        : req.user.branch_id;
      const agentId = fields.agent_id !== undefined && fields.agent_id !== ''
        ? fields.agent_id
        : req.user.id;

      const updatable = { ...fields, branch_id: branchId, agent_id: agentId };
      delete updatable.id;
      delete updatable.create_lease_group;

      const sets: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      for (const [key, rawValue] of Object.entries(updatable)) {
        if (!RENTAL_INSERT_COLUMNS.includes(key) && key !== 'agent_id' && key !== 'status') continue;
        if (key === 'contract_number') continue;
        if (key === 'status') continue; // Skip status here, handle separately
        sets.push(`${key} = $${paramIndex++}`);
        values.push(normalizeRentalValue(rawValue));
      }
      if (fields.status !== undefined) {
        sets.push(`status = $${paramIndex++}`);
        values.push(fields.status);
      }

      if (sets.length > 0) {
        values.push(id);
        await client.query(`UPDATE rentals SET ${sets.join(', ')} WHERE id = $${paramIndex}`, values);
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('PUT /api/rentals/:id error:', error);
      res.status(500).json({ message: error.message || 'Erreur lors de la mise à jour de la location' });
    } finally {
      client.release();
    }
  });

  app.post("/api/rentals/:id/return", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const {
        return_date, return_mileage, return_photos, km_retour, km_parcouru, km_factures,
        excess_amount, is_damaged, damage_deduction, fuel_return_bars,
      } = req.body;

      const rentalResult = await client.query('SELECT * FROM rentals WHERE id = $1', [id]);
      const rental = rentalResult.rows[0];
      if (!rental) return res.status(404).json({ message: 'Location non trouvée' });

      const extraCharges = (excess_amount || 0) + (damage_deduction || 0);
      const returnPhotos = return_photos
        ? (typeof return_photos === 'string' ? return_photos : JSON.stringify(return_photos))
        : null;

      await client.query('BEGIN');
      await client.query(`
        UPDATE rentals SET
          return_date = $1,
          return_mileage = $2,
          return_photos = $3,
          km_retour = $4,
          km_parcouru = $5,
          km_factures = $6,
          other_charges = COALESCE(other_charges, 0) + $7,
          is_damaged = $8,
          deposit_deduction = $9,
          fuel_return_bars = $10,
          status = 'completed',
          total_price = COALESCE(total_price, 0) + $11,
          amount_paid = COALESCE(total_price, 0) + $11,
          amount_remaining = 0
        WHERE id = $12
      `, [
        return_date,
        return_mileage,
        returnPhotos,
        km_retour,
        km_parcouru,
        km_factures,
        excess_amount || 0,
        is_damaged ? 1 : 0,
        damage_deduction || 0,
        fuel_return_bars || null,
        extraCharges,
        id,
      ]);

      await client.query(
        "UPDATE cars SET status = 'available', mileage = $1, fuel_current_bars = COALESCE($2, fuel_current_bars) WHERE id = $3",
        [return_mileage, fuel_return_bars || null, rental.car_id]
      );
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('POST /api/rentals/:id/return error:', error);
      res.status(500).json({ message: error.message || 'Erreur lors du retour du véhicule' });
    } finally {
      client.release();
    }
  });

  app.post("/api/rentals/:id/swap-car", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
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
        payment_mode,
      } = req.body;

      const rentalResult = await client.query('SELECT * FROM rentals WHERE id = $1', [id]);
      const rental = rentalResult.rows[0];
      if (!rental) return res.status(404).json({ message: 'Location non trouvée' });

      const oldCarResult = await client.query('SELECT * FROM cars WHERE id = $1', [rental.car_id]);
      const newCarResult = await client.query('SELECT * FROM cars WHERE id = $1', [new_car_id]);
      const oldCar = oldCarResult.rows[0];
      const newCar = newCarResult.rows[0];
      if (!newCar) return res.status(400).json({ message: 'Nouveau véhicule non trouvé' });

      const currentSwaps = rental.swaps ? JSON.parse(rental.swaps) : [];
      currentSwaps.push({
        date: swap_date || new Date().toISOString(),
        reason: swap_reason || '',
        old_car: {
          id: oldCar.id,
          brand: oldCar.brand,
          model: oldCar.model,
          registration: oldCar.registration,
          return_mileage: old_car_return_mileage,
          return_fuel: old_car_return_fuel,
          fuel_total_bars: oldCar.fuel_total_bars || 8,
          daily_price: rental.daily_price,
        },
        new_car: {
          id: newCar.id,
          brand: newCar.brand,
          model: newCar.model,
          registration: newCar.registration,
          start_mileage: new_car_start_mileage,
          start_fuel: new_car_start_fuel,
          fuel_total_bars: newCar.fuel_total_bars || 8,
          daily_price: daily_price !== undefined ? parseFloat(daily_price) : newCar.daily_price,
        },
      });

      await client.query('BEGIN');
      await client.query(`
        UPDATE rentals SET
          car_id = $1,
          swaps = $2,
          current_mileage = $3,
          fuel_total_bars = $4,
          fuel_depart_bars = $5,
          daily_price = $6,
          total_price = $7,
          amount_remaining = $8,
          amount_paid = $9,
          payment_mode = $10
        WHERE id = $11
      `, [
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
        id,
      ]);

      await client.query(
        "UPDATE cars SET status = 'available', mileage = $1, fuel_current_bars = $2 WHERE id = $3",
        [old_car_return_mileage, old_car_return_fuel, oldCar.id]
      );
      await client.query(
        "UPDATE cars SET status = 'rented', mileage = $1, fuel_current_bars = $2 WHERE id = $3",
        [new_car_start_mileage, new_car_start_fuel, newCar.id]
      );
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('POST /api/rentals/:id/swap-car error:', error);
      res.status(500).json({ message: error.message || 'Erreur lors du changement de véhicule' });
    } finally {
      client.release();
    }
  });

  app.delete("/api/rentals/:id", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const rentalResult = await client.query('SELECT * FROM rentals WHERE id = $1', [id]);
      const rental = rentalResult.rows[0];
      if (!rental) return res.status(404).json({ message: 'Location non trouvée' });

      await client.query('BEGIN');
      if (rental.status === 'active') {
        await client.query("UPDATE cars SET status = 'available' WHERE id = $1", [rental.car_id]);
      }
      await client.query('DELETE FROM rentals WHERE id = $1', [id]);
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error: any) {
      await client.query('ROLLBACK');
      console.error('DELETE /api/rentals/:id error:', error);
      res.status(500).json({ message: error.message || 'Erreur lors de la suppression de la location' });
    } finally {
      client.release();
    }
  });

  app.post("/api/rentals/group", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      const { rentalIds } = req.body;
      if (!rentalIds || !Array.isArray(rentalIds) || rentalIds.length === 0) {
        return res.status(400).json({ message: 'Locations invalides' });
      }

      await client.query('BEGIN');
      const rentalsResult = await client.query(
        `SELECT * FROM rentals WHERE id = ANY($1::int[])`,
        [rentalIds]
      );
      const rentals = rentalsResult.rows;
      if (rentals.length === 0) {
        throw new Error('Aucune location correspondante trouvée.');
      }

      const currentYear = new Date().getFullYear();
      const groups = await client.query(
        'SELECT lease_group_number FROM rentals WHERE lease_group_number IS NOT NULL'
      );
      let maxBase = 0;
      for (const row of groups.rows) {
        const base = parseInt(row.lease_group_number, 10);
        if (!Number.isNaN(base) && base > maxBase) maxBase = base;
      }

      const yearRentals = await client.query(
        "SELECT contract_number FROM rentals WHERE contract_number LIKE $1",
        [`%/${currentYear}`]
      );
      let maxNumericNum = 0;
      for (const row of yearRentals.rows) {
        const match = row.contract_number?.match(/^(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!Number.isNaN(num) && num > maxNumericNum) maxNumericNum = num;
        }
      }

      const nextBaseNum = Math.max(maxNumericNum + 1, maxBase + 1);
      const groupStr = nextBaseNum.toString().padStart(3, '0');
      rentals.sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      for (let i = 0; i < rentals.length; i++) {
        const rental = rentals[i];
        const suffix = alphabet[i % alphabet.length];
        const contract_number = `${groupStr}${suffix}/${currentYear}`;
        await client.query(
          'UPDATE rentals SET lease_group_number = $1, lease_suffix = $2, contract_number = $3 WHERE id = $4',
          [groupStr, suffix, contract_number, rental.id]
        );
      }

      await client.query('COMMIT');
      res.json({ success: true, lease_group_number: groupStr });
    } catch (error: any) {
      await client.query('ROLLBACK');
      res.status(500).json({ message: error.message || 'Erreur lors du regroupement des locations' });
    } finally {
      client.release();
    }
  });

  app.post("/api/rentals/group/add", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      const { groupNumber, rentalIds } = req.body;
      if (!groupNumber || !rentalIds || !Array.isArray(rentalIds) || rentalIds.length === 0) {
        return res.status(400).json({ message: 'Requête invalide' });
      }

      await client.query('BEGIN');
      const existing = await client.query(
        'SELECT lease_suffix FROM rentals WHERE lease_group_number = $1 ORDER BY lease_suffix ASC',
        [groupNumber]
      );
      let nextLetterCode = 65;
      if (existing.rows.length > 0) {
        const lastSuffix = existing.rows[existing.rows.length - 1].lease_suffix || 'A';
        nextLetterCode = lastSuffix.charCodeAt(0) + 1;
      }

      const currentYear = new Date().getFullYear();
      for (const rentalId of rentalIds) {
        const suffix = String.fromCharCode(nextLetterCode);
        const contract_number = `${groupNumber}${suffix}/${currentYear}`;
        await client.query(
          'UPDATE rentals SET lease_group_number = $1, lease_suffix = $2, contract_number = $3 WHERE id = $4',
          [groupNumber, suffix, contract_number, rentalId]
        );
        nextLetterCode++;
      }

      await client.query('COMMIT');
      res.json({ success: true });
    } catch (error: any) {
      await client.query('ROLLBACK');
      res.status(500).json({ message: error.message || 'Erreur lors de l\'ajout au groupe' });
    } finally {
      client.release();
    }
  });

  app.post("/api/rentals/group/remove", authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
      const { rentalId } = req.body;
      if (!rentalId) return res.status(400).json({ message: 'ID de location manquant' });

      const rentalResult = await client.query('SELECT * FROM rentals WHERE id = $1', [rentalId]);
      const rental = rentalResult.rows[0];
      if (!rental) throw new Error('Location non trouvée.');

      const currentYear = new Date().getFullYear();
      const cleanContractNumber = `${rental.lease_group_number || rental.id}/${currentYear}`;

      await client.query(
        'UPDATE rentals SET lease_group_number = NULL, lease_suffix = NULL, contract_number = $1 WHERE id = $2',
        [cleanContractNumber, rentalId]
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Erreur lors du retrait du groupe' });
    } finally {
      client.release();
    }
  });

  // Repairs CRUD
  app.get("/api/repairs", authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM repairs ORDER BY id DESC');
    res.json(result.rows);
  });

  app.post("/api/repairs", authenticateToken, async (req, res) => {
    const { car_id, date, description, amount, mileage } = req.body;
    
    const result = await pool.query(
      'INSERT INTO repairs (car_id, date, description, amount, mileage) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [car_id, date, description, amount, mileage]
    );
    
    res.json(result.rows[0]);
  });

  app.put("/api/repairs/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { car_id, date, description, amount, mileage } = req.body;
    
    const result = await pool.query(
      'UPDATE repairs SET car_id = $1, date = $2, description = $3, amount = $4, mileage = $5 WHERE id = $6 RETURNING *',
      [car_id, date, description, amount, mileage, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Réparation non trouvée" });
    }
    
    res.json(result.rows[0]);
  });

  app.delete("/api/repairs/:id", authenticateToken, async (req, res) => {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM repairs WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Réparation non trouvée" });
    }
    
    res.json({ message: "Réparation supprimée" });
  });

  // Settings CRUD
  app.get("/api/settings", authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM settings WHERE id = 1');
    res.json(result.rows[0] || {});
  });

  app.put("/api/settings", authenticateToken, async (req, res) => {
    const settingsData = req.body;
    
    const result = await pool.query(
      `UPDATE settings SET
        company_name = $1, company_address = $2, company_phone = $3,
        company_whatsapp = $4, company_mf = $5, company_email = $6,
        company_logo = $7, km_allowance = $8, excess_km_price = $9,
        terms_fr = $10, terms_ar = $11, vehicle_condition_image = $12
      WHERE id = 1 RETURNING *`,
      [
        settingsData.company_name, settingsData.company_address, settingsData.company_phone,
        settingsData.company_whatsapp, settingsData.company_mf, settingsData.company_email,
        settingsData.company_logo, settingsData.km_allowance, settingsData.excess_km_price,
        settingsData.terms_fr, settingsData.terms_ar, settingsData.vehicle_condition_image
      ]
    );
    
    res.json(result.rows[0]);
  });

  // Brands and Colors
  app.get("/api/brands", authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM brands ORDER BY name');
    res.json(result.rows);
  });

  app.post("/api/brands", authenticateToken, async (req, res) => {
    const { name } = req.body;
    const agencyId = req.body.agency_id || req.user.agency_id;
    
    const result = await pool.query(
      'INSERT INTO brands (name, agency_id) VALUES ($1, $2) RETURNING *',
      [name, agencyId]
    );
    
    res.json(result.rows[0]);
  });

  app.get("/api/colors", authenticateToken, async (req, res) => {
    const result = await pool.query('SELECT * FROM colors ORDER BY name');
    res.json(result.rows);
  });

  app.post("/api/colors", authenticateToken, async (req, res) => {
    const { name } = req.body;
    const agencyId = req.body.agency_id || req.user.agency_id;
    
    const result = await pool.query(
      'INSERT INTO colors (name, agency_id) VALUES ($1, $2) RETURNING *',
      [name, agencyId]
    );
    
    res.json(result.rows[0]);
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    try {
      const { agency_id, branch_id, role } = req.user;
      
      const isSuperAdmin = role === 'superadmin';
      
      const [carsResult, rentalsResult, customersResult, repairsResult] = await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM cars ${!isSuperAdmin && agency_id ? 'WHERE agency_id = $1' : ''}`, !isSuperAdmin && agency_id ? [agency_id] : []),
        pool.query(`SELECT COUNT(*) as count FROM rentals ${!isSuperAdmin && branch_id ? 'WHERE branch_id = $1' : ''}`, !isSuperAdmin && branch_id ? [branch_id] : []),
        pool.query(`SELECT COUNT(*) as count FROM customers ${!isSuperAdmin && agency_id ? 'WHERE agency_id = $1' : ''}`, !isSuperAdmin && agency_id ? [agency_id] : []),
        pool.query(`SELECT COUNT(*) as count FROM repairs`)
      ]);
      
      const activeRentalsResult = await pool.query(
        `SELECT COUNT(*) as count FROM rentals WHERE status = 'active' ${!isSuperAdmin && branch_id ? 'AND branch_id = $1' : ''}`,
        !isSuperAdmin && branch_id ? [branch_id] : []
      );
      
      const availableCarsResult = await pool.query(
        `SELECT COUNT(*) as count FROM cars WHERE status = 'available' ${!isSuperAdmin && agency_id ? 'AND agency_id = $1' : ''}`,
        !isSuperAdmin && agency_id ? [agency_id] : []
      );
      
      const totalRevenueResult = await pool.query(
        `SELECT COALESCE(SUM(total_price), 0) as total FROM rentals ${!isSuperAdmin && branch_id ? 'WHERE branch_id = $1' : ''}`,
        !isSuperAdmin && branch_id ? [branch_id] : []
      );
      
      const amountPaidResult = await pool.query(
        `SELECT COALESCE(SUM(amount_paid), 0) as total FROM rentals ${!isSuperAdmin && branch_id ? 'WHERE branch_id = $1' : ''}`,
        !isSuperAdmin && branch_id ? [branch_id] : []
      );
      
      const amountRemainingResult = await pool.query(
        `SELECT COALESCE(SUM(amount_remaining), 0) as total FROM rentals ${!isSuperAdmin && branch_id ? 'WHERE branch_id = $1' : ''}`,
        !isSuperAdmin && branch_id ? [branch_id] : []
      );
      
      const upcomingReturnsResult = await pool.query(
        `SELECT r.*, c.brand, c.model, c.registration FROM rentals r 
         JOIN cars c ON r.car_id = c.id 
         WHERE r.status = 'active' 
         ${!isSuperAdmin && branch_id ? 'AND r.branch_id = $1' : ''}
         ORDER BY r.end_date ASC LIMIT 10`,
        !isSuperAdmin && branch_id ? [branch_id] : []
      );
      
      res.json({
        totalCars: carsResult.rows[0].count,
        totalRentals: rentalsResult.rows[0].count,
        totalCustomers: customersResult.rows[0].count,
        totalRepairs: repairsResult.rows[0].count,
        activeRentals: activeRentalsResult.rows[0].count,
        availableCars: availableCarsResult.rows[0].count,
        totalRevenue: totalRevenueResult.rows[0].total,
        totalClients: customersResult.rows[0].count,
        financeSummary: {
          totalContracts: totalRevenueResult.rows[0].total,
          totalReceived: amountPaidResult.rows[0].total,
          totalRemaining: amountRemainingResult.rows[0].total
        },
        upcomingReturns: upcomingReturnsResult.rows
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ 
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message 
      });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
