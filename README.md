# eXmart

A grocery ordering platform originally branded as Vivira Supermarket and later renamed to eXmart. This project includes a Node.js/Express backend and a React + Vite frontend for browsing products, managing a cart, placing orders, and using an admin dashboard.

## Project Overview

The application is structured as a workspace with two main parts:

- backend/: Express API with SQLite/PostgreSQL database support
- frontend/: React app built with Vite and Tailwind-inspired styling

## How it works

### Frontend

The frontend is a React application served by Vite during development. It includes:

- customer home page with product listings and search
- authentication flow for sign-in and registration
- cart management for guest and authenticated users
- checkout flow and order placement
- admin sign-in and admin dashboard for store operations

### Backend

The backend is an Express server that exposes REST APIs under /api, including:

- /api/auth for login, signup, and token validation
- /api/products for product listing and admin inventory management
- /api/cart for cart operations
- /api/orders for placing and tracking orders
- /api/admin/dashboard for admin summary and management endpoints

The server uses SQLite by default and can fall back to PostgreSQL when DATABASE_URL is provided.

### Database

The app initializes its database during startup by creating required tables and seeding default data, including:

- a default admin user
- a sample customer user
- starter grocery products

### Authentication

User sessions are handled with JWT tokens. Tokens are stored in browser localStorage and sent in the Authorization header for protected requests.

## Branding change

The application was renamed from Vivira Supermarket to eXmart across the project. This included:

- app title and footer text
- admin branding and placeholder emails
- localStorage keys and JWT secret naming
- package metadata and project description
- backend console branding

## Run locally

From the project root:

```bash
npm install --prefix backend
npm install --prefix frontend
npm start
```

This starts both the backend and frontend together.

## Production note

The backend includes optional static hosting for a built frontend when NODE_ENV=production is set.

## Repository status

The project was initialized as a git repository and pushed to GitHub under the repository:

https://github.com/gaganmd76/eXmart.git

## Notes

This README is intended as a concise overview of the app’s architecture, functionality, and the branding update to eXmart.
