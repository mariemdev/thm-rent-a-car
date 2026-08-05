# THM Rent A Car

Application de gestion de location de véhicules avec React, Express et PostgreSQL.

## Prérequis

- Node.js (v18 ou supérieur)
- PostgreSQL (v12 ou supérieur)

## Configuration de la base de données PostgreSQL

1. **Créer la base de données PostgreSQL**:

```bash
# Connectez-vous à PostgreSQL
psql -U postgres

# Créez la base de données
CREATE DATABASE thm_rent_a_car;

# Créez un utilisateur (optionnel)
CREATE USER thm_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE thm_rent_a_car TO thm_user;

# Quittez
\q
```

2. **Configurer les variables d'environnement**:

Créez un fichier `.env` basé sur `.env.example`:

```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos configurations PostgreSQL:

```env
# PostgreSQL Database Configuration
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=thm_rent_a_car
PG_USER=postgres
PG_PASSWORD=your_postgres_password

# SMTP configuration (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Application URL
APP_URL=http://localhost:3000
```

## Installation

1. **Installer les dépendances**:

```bash
npm install
```

## Migration depuis SQLite

Le projet a été migré de SQLite vers PostgreSQL. L'ancien fichier SQLite est sauvegardé sous `server-sqlite-backup.ts`.

### Schéma de la base de données

Le schéma PostgreSQL comprend les tables suivantes avec toutes les relations:

- **agencies** - Agences de location
- **branches** - Bureaux/agences secondaires
- **users** - Utilisateurs (admin, manager, agent)
- **customers** - Clients (particuliers et entreprises)
- **cars** - Véhicules disponibles
- **rentals** - Contrats de location
- **repairs** - Réparations et maintenance
- **settings** - Configuration de l'application
- **brands** - Marques de véhicules
- **colors** - Couleurs disponibles

### Relations entre les tables

- `branches.agency_id` → `agencies.id`
- `users.agency_id` → `agencies.id`
- `users.branch_id` → `branches.id`
- `users.created_by_id` → `users.id`
- `customers.agency_id` → `agencies.id`
- `cars.agency_id` → `agencies.id`
- `cars.branch_id` → `branches.id`
- `rentals.car_id` → `cars.id`
- `rentals.branch_id` → `branches.id`
- `rentals.agent_id` → `users.id`
- `rentals.driver_id` → `customers.id`
- `rentals.customer_id` → `customers.id`
- `rentals.second_driver_id` → `customers.id`
- `repairs.car_id` → `cars.id`
- `brands.agency_id` → `agencies.id`
- `colors.agency_id` → `agencies.id`

## Exécution

1. **Démarrer l'application**:

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

2. **Comptes par défaut**:

- **Super Admin**: `superadmin@automanager.com` / `superadmin123`
- **Admin**: `admin@automanager.com` / `admin123`

## Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Compiler pour la production
- `npm run preview` - Prévisualiser la version de production
- `npm run lint` - Vérifier le code TypeScript

## Structure du projet

```
thm-rent-a-car/
├── server.ts                 # Serveur Express avec PostgreSQL
├── server-sqlite-backup.ts   # Ancienne version SQLite (sauvegarde)
├── migrate-to-postgres.ts    # Script de migration PostgreSQL
├── package.json              # Dépendances du projet
├── .env.example              # Exemple de configuration
├── src/                      # Application React
│   ├── pages/               # Pages de l'application
│   ├── components/          # Composants React
│   └── lib/                 # Utilitaires et API
└── public/                   # Fichiers statiques
```

## Support

Pour toute question ou problème, veuillez contacter l'équipe de développement.
