# Network Marketing Company Management System

A DBMS mini-project: a web application to manage a network-marketing (direct
selling / MLM) company's distributors, product sales, downline network, and
commission payouts.

**Stack:** React (frontend) · Node.js + Express (backend) · MySQL (database)
— same stack as the reference Vehicle Rental Management System synopsis.

## Folder structure
```
mlm_project/
├── database/
│   └── schema.sql          # tables, keys, constraints, trigger, procedure, view, seed data
├── backend/                # Express REST API
│   ├── server.js
│   ├── db.js
│   ├── routes/
│   └── .env.example
├── frontend/                # React (Vite) member portal
│   └── src/
├── diagrams/                # ER diagram & relational schema diagram (PNG)
└── Network_Marketing_DBMS_Report.docx
```

## Setup

### 1. Database
```bash
mysql -u root -p < database/schema.sql
```
This creates `network_marketing_db` with all 8 tables, the
`trg_generate_sponsor_commission` trigger, the `sp_get_downline` stored
procedure, the `vw_member_sales_summary` view, and sample seed data.

### 2. Backend
```bash
cd backend
cp .env.example .env      # edit DB_PASSWORD / JWT_SECRET as needed
npm install
npm run dev                # starts on http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```
Vite proxies `/api/*` calls to the backend automatically (see `vite.config.js`).

## Demo login
Seed data creates one member with a known password only if you re-hash it —
by default, register a fresh account at `/register`, or set a bcrypt hash for
`anita@nmc.com` / `ravi@nmc.com` / `sara@nmc.com` yourself since the seed rows
use placeholder password strings.

## Core DBMS concepts demonstrated
- Relational modelling with 8 entities, primary/foreign keys, `CHECK`,
  `UNIQUE`, `ENUM`, `ON DELETE CASCADE`/`SET NULL` constraints
- A **self-referencing foreign key** (`MEMBER.sponsor_id → MEMBER.member_id`)
  to model the distributor downline tree
- **Trigger** (`trg_generate_sponsor_commission`) — auto-generates a
  commission row when an order is marked completed
- **Stored procedure** (`sp_get_downline`) — recursive CTE that walks the
  entire downline of a member
- **View** (`vw_member_sales_summary`) — aggregated sales/commission report
- Multi-table joins across MEMBER, ORDERS, ORDER_ITEM, PRODUCT, COMMISSION

## Module overview (website)
| Page | Purpose |
|---|---|
| Register / Login | Create a member account under a sponsor, authenticate |
| Dashboard | Rank, commission rate, sales & earnings summary (from the view) |
| My Downline | Recursive tree of everyone in the member's network |
| Products | Browse catalogue, place an order |
| Orders | Track order status; marking "completed" fires the commission trigger |
| Commissions | View earned commissions, trigger payout (logs a PAYMENT row) |
