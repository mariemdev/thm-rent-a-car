import Database from "better-sqlite3";
const db = new Database("database.sqlite");

console.log("--- FOREIGN KEY STATUS ---");
const fkList = db.prepare("PRAGMA foreign_key_list(rentals)").all();
console.log("Rentals Foreign Keys:", JSON.stringify(fkList, null, 2));

console.log("--- CHECKS ---");
const users = db.prepare("SELECT id, name, role FROM users").all();
console.log("Users:", users);

const branches = db.prepare("SELECT id, name FROM branches").all();
console.log("Branches:", branches);

const cars = db.prepare("SELECT id, brand, model, registration FROM cars").all();
console.log("Cars:", cars);

const customers = db.prepare("SELECT id, type, name, first_name FROM customers").all();
console.log("Customers:", customers);

const rentalsCount = db.prepare("SELECT COUNT(*) as count FROM rentals").get() as any;
console.log("Rentals count:", rentalsCount.count);

if (rentalsCount.count > 0) {
  const lastRental = db.prepare("SELECT * FROM rentals ORDER BY id DESC LIMIT 1").get();
  console.log("Last Rental:", lastRental);
}
