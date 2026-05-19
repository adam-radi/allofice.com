# Bebliotique App

Private monorepo for a library, office supplies, and printing storefront built with a React frontend and a PHP/MySQL backend.

## Overview

The application combines a customer-facing catalog experience with order placement and a protected admin area for catalog and order operations. It is structured as a single repository to keep frontend, backend, and delivery workflows aligned.

## Tech Stack

- Frontend: React 19, React Router, Axios
- Backend: PHP, MySQLi, session-based authentication
- Database: MySQL
- Local runtime: XAMPP for Apache/MySQL, Node.js for the frontend

## Architecture

- `frontend/`: React application for storefront, checkout, authentication, and admin views
- `backend/api/`: PHP endpoints for auth, categories, products, offers, orders, and statistics
- `backend/config/`: database and app configuration
- `backend/helpers/`: reusable backend helpers
- `uploads/` and `backend/uploads/`: runtime storage, intentionally excluded from version control

## Core Features

- Customer browsing flows for office products, printing services, and offers
- Product detail pages and image handling
- Cart, buy-now checkout, and order submission
- Login, registration, guest checkout, and order history
- Admin dashboard for categories, products, offers, orders, and statistics

## Local Setup

### Prerequisites

- Node.js 18+
- npm
- PHP 8+
- MySQL
- XAMPP or equivalent Apache/PHP local stack

### Frontend

1. Go to `frontend/`
2. Copy `.env.example` to `.env` and adjust the API URL if needed
3. Install dependencies with `npm install`
4. Run `npm start`

### Backend

1. Copy `backend/config/db.example.php` to `backend/config/db.php` if you need a local config file variant
2. Review the default database values in `backend/config/db.php` or set environment variables
3. Serve the project through Apache/XAMPP so the PHP API is reachable from the frontend
4. Run `backend/setup_database.php` once to create the database schema and seed the admin account

### Database Defaults

- Database name: `library_printing_db`
- Default admin email: `admin@library.com`
- Default admin password: `admin123`

## Configuration

### Frontend

`frontend/.env.example`

```env
REACT_APP_API_URL=http://localhost/bebliotique%20app/backend/api
```

### Backend

The backend reads these environment variables when available:

- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `APP_ALLOWED_ORIGINS`

If variables are not present, it falls back to local development defaults.

## API Overview

- `auth.php`: login, registration, logout, session checks, profile updates, guest checkout
- `categories.php`: category CRUD
- `products.php`: product CRUD and listing
- `product_images.php`: product image upload and deletion
- `offers.php`: offer CRUD and listing
- `orders.php`: order creation, order listing, admin status updates
- `statistics.php`: dashboard metrics

## Development Workflow

- Protected branches: `main` for stable milestones, `dev` for integration work
- Day-to-day work: `feature/*` branches merged into `dev`
- Commit style: Conventional Commits such as `feat:`, `fix:`, `docs:`, and `chore:`
- Keep generated artifacts, uploads, and machine-specific files out of Git

## Recommended GitHub Backlog

- Replace remaining hardcoded frontend/backend URLs with centralized config
- Add validation consistency across API endpoints
- Add frontend test coverage for auth, cart, checkout, and admin flows
- Improve admin session hardening and authorization checks
- Document deployment for XAMPP and production hosting

## Known Limitations

- API configuration is still partly environment-driven and should be standardized further
- Runtime uploads are local-only and not managed by a dedicated storage abstraction
- No automated CI pipeline is included yet
