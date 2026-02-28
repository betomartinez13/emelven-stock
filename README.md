# EMELVEN Stock — Sistema Web de Control de Inventario

Web system for automated stock control and warehouse management of electrical transformers for **EMELVEN** (Empresa Eléctrica de Venezuela).

> Authors: Alberto José Martinez Sarcos & Renny Alejandro Zambrano Pirela | 2025

---

## The Problem

EMELVEN manages all warehouse operations with pen and paper — raw material entries, exits, and sales. This causes errors, delays, and no real-time visibility of stock levels.

## The Solution

A centralized web platform that replaces manual processes with:
- Real-time stock control
- Automated reports and visual dashboards
- Low-stock alerts
- Full traceability per work order

---

## Features

- **Raw Material Entries & Exits** — register all warehouse movements
- **Stock Control** — real-time inventory levels per item
- **Supplier Management** — editable supplier list linked to each material
- **Work Orders** — track material consumption per project/assembly
- **Configurable Alerts** — custom min/max thresholds per item
- **Visual Reports** — monthly consumption, consumption per project, KPIs
- **PDF Export** — one-click export for all reports
- **Audit Log** — every action logged with user and timestamp
- **Role-Based Access** — Admin, Manager, and Warehouse Staff roles
- **Mobile Responsive** — works on phones and tablets

---

## Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React + TypeScript | UI framework |
| Tailwind CSS | Styling and responsive design |
| React Hook Form | Form management |
| TanStack Query | API calls and caching |
| Zustand | Global state management |
| Recharts | Charts and graphs |

### Backend
| Technology | Purpose |
|-----------|---------|
| NestJS + TypeScript | REST API and business logic |
| TypeORM | Database ORM |
| MySQL | Relational database |
| JWT | Authentication |
| class-validator | Input validation |
| Swagger | Auto-generated API documentation |
| pdfmake | PDF report generation |

### DevOps & Testing
| Technology | Purpose |
|-----------|---------|
| Docker + docker-compose | Local MySQL + phpMyAdmin |
| Jest | Unit tests |
| Jest + Supertest | Integration tests |
| React Testing Library | Frontend component tests |
| k6 | Stress and load testing |

---

## Project Structure

```
emelven-stock/
├── frontend/         # React + TypeScript app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
├── backend/          # NestJS + TypeScript API
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── materials/
│   │   ├── suppliers/
│   │   ├── movements/
│   │   ├── work-orders/
│   │   ├── alerts/
│   │   ├── reports/
│   │   └── audit/
│   └── package.json
│
├── docker-compose.yml        # MySQL + phpMyAdmin
├── docker-compose.test.yml   # Test database
└── README.md
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) + Docker Compose
- [Git](https://git-scm.com/)

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/emelven-stock.git
cd emelven-stock
```

### 2. Start the database
```bash
docker-compose up -d
```
- MySQL running on `localhost:3306`
- phpMyAdmin available at `http://localhost:8080`

### 3. Start the backend
```bash
cd backend
cp .env.example .env   # fill in your environment variables
npm install
npm run start:dev
```
- API running on `http://localhost:3000`
- Swagger docs at `http://localhost:3000/api/docs`

### 4. Start the frontend
```bash
cd frontend
npm install
npm run dev
```
- App running on `http://localhost:5173`

---

## Environment Variables

Create a `.env` file inside `/backend` based on `.env.example`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_NAME=emelven_db
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

---

## Running Tests

### Unit tests
```bash
cd backend
npm run test
```

### Integration tests
```bash
cd backend
npm run test:e2e
```

### Frontend tests
```bash
cd frontend
npm run test
```

### Stress tests
```bash
k6 run tests/stress/stock.js
```

---

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access — user management, all modules, configuration |
| **Manager** | Reports, dashboards, alerts, work orders |
| **Warehouse Staff** | Register entries, exits, movements, work orders |

---

## Authors

- **Alberto José Martinez Sarcos**
- **Renny Alejandro Zambrano Pirela**
