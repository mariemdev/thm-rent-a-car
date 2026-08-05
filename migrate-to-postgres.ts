import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT) || 5432,
  database: process.env.PG_DATABASE || 'thm_rent_a_car',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
});

async function migrateToPostgres() {
  try {
    console.log('Starting PostgreSQL migration...');
    
    // Drop existing tables in reverse order of dependencies
    await pool.query('DROP TABLE IF EXISTS repairs CASCADE');
    await pool.query('DROP TABLE IF EXISTS rentals CASCADE');
    await pool.query('DROP TABLE IF EXISTS cars CASCADE');
    await pool.query('DROP TABLE IF EXISTS customers CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    await pool.query('DROP TABLE IF EXISTS branches CASCADE');
    await pool.query('DROP TABLE IF EXISTS brands CASCADE');
    await pool.query('DROP TABLE IF EXISTS colors CASCADE');
    await pool.query('DROP TABLE IF EXISTS agencies CASCADE');
    await pool.query('DROP TABLE IF EXISTS settings CASCADE');
    
    console.log('Dropped existing tables');

    // Create agencies table
    await pool.query(`
      CREATE TABLE agencies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT
      );
    `);
    console.log('Created agencies table');

    // Create brands table
    await pool.query(`
      CREATE TABLE brands (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        agency_id INTEGER,
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      );
    `);
    console.log('Created brands table');

    // Create colors table
    await pool.query(`
      CREATE TABLE colors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        agency_id INTEGER,
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      );
    `);
    console.log('Created colors table');

    // Create branches table
    await pool.query(`
      CREATE TABLE branches (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        agency_id INTEGER NOT NULL,
        FOREIGN KEY (agency_id) REFERENCES agencies(id)
      );
    `);
    console.log('Created branches table');

    // Create users table
    await pool.query(`
      CREATE TABLE users (
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
    console.log('Created users table');

    // Create customers table
    await pool.query(`
      CREATE TABLE customers (
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
    console.log('Created customers table');

    // Create cars table
    await pool.query(`
      CREATE TABLE cars (
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
        agency_id INTEGER NOT NULL,
        branch_id INTEGER,
        FOREIGN KEY (agency_id) REFERENCES agencies(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      );
    `);
    console.log('Created cars table');

    // Create rentals table
    await pool.query(`
      CREATE TABLE rentals (
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
        FOREIGN KEY (car_id) REFERENCES cars(id),
        FOREIGN KEY (branch_id) REFERENCES branches(id),
        FOREIGN KEY (agent_id) REFERENCES users(id),
        FOREIGN KEY (driver_id) REFERENCES customers(id),
        FOREIGN KEY (customer_id) REFERENCES customers(id),
        FOREIGN KEY (second_driver_id) REFERENCES customers(id)
      );
    `);
    console.log('Created rentals table');

    // Create repairs table
    await pool.query(`
      CREATE TABLE repairs (
        id SERIAL PRIMARY KEY,
        car_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC DEFAULT 0,
        mileage INTEGER,
        FOREIGN KEY (car_id) REFERENCES cars(id)
      );
    `);
    console.log('Created repairs table');

    // Create settings table
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
    console.log('Created settings table');

    // Insert default settings
    await pool.query(`
      INSERT INTO settings (
        id, company_name, company_address, company_phone, company_whatsapp, 
        company_mf, company_email, km_allowance, excess_km_price, terms_fr, terms_ar
      ) VALUES (1, 'THM RENT A CAR', 'Tunis, Tunisie', '+216 71 000 000', '+216 71 000 000', 
      '1234567/A/P/000', 'contact@thm-rentacar.com', 280, 0.5, 
      'Le locataire soussigné accepte sans réserve les conditions générales de location figurant au verso dont il a pris connaissance et s''engage à restituer le véhicule à la date prévue ci-dessus.',
      'إطلعت علي المعلومات و الشروط الموجودة أعلاه و في الخلف و وافقت عليها')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('Inserted default settings');

    console.log('PostgreSQL migration completed successfully!');
    
  } catch (error) {
    console.error('Migration error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateToPostgres();
