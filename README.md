# Restaurant Seat Booking Application

A full-stack **role-based seat booking** application with **Owner**, **Admin**, and **User** roles. Built with Node.js, Express, MySQL (Sequelize ORM), JWT auth, and React. Supports real-time seat availability, overbooking prevention, and RBAC.

# End-to-End Architecture
![End-to-End Architecture](https://github.com/Devakesavan/restaurant-reservation-system/blob/main/End-to-End-Architecture.png?raw=true)

## Tech Stack

| Layer   | Technologies                          |
|---------|---------------------------------------|
| Backend | Node.js, Express.js, MySQL, Sequelize, JWT, bcrypt, express-validator, morgan, dotenv |
| Frontend| React, Axios, React Router, minimal UI |

## Roles & Capabilities

| Role   | Capabilities |
|--------|--------------|
| **Owner** | Add/manage own restaurants, set total seats, view booking status, see seat reduction when users book, prevent overbooking |
| **Admin** | Monitor app (users count, restaurants count, booking stats daily/weekly/monthly, total seats booked), read-only activity logs |
| **User**  | Register/login, browse restaurants, select date & time slot, check real-time availability, book seats, view confirmation; booking blocked when seats insufficient |

## Project Structure

```
restaurant-reservation-system/
├── docker-compose.yaml
├── Jenkinsfile
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── migrations/
│   │   ├── add-owner-role.sql
│   │   ├── remove-reservations-slot-unique.js
│   │   └── remove-reservations-slot-unique.sql
│   ├── scripts/
│   │   ├── add-restaurant-owner-id.js
│   │   ├── fix-role-enum.js
│   │   ├── sync-restaurants-table.js
│   │   └── test-api.js
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   └── database.js
│       ├── controllers/
│       │   ├── adminController.js
│       │   ├── authController.js
│       │   ├── reservationController.js
│       │   └── restaurantController.js
│       ├── middlewares/
│       │   ├── authMiddleware.js
│       │   ├── errorMiddleware.js
│       │   └── roleMiddleware.js
│       ├── models/
│       │   ├── ActivityLog.js
│       │   ├── index.js
│       │   ├── Reservation.js
│       │   ├── Restaurant.js
│       │   └── User.js
│       ├── routes/
│       │   ├── adminRoutes.js
│       │   ├── authRoutes.js
│       │   ├── reservationRoutes.js
│       │   └── restaurantRoutes.js
│       └── utils/
│           ├── activityLogger.js
│           └── generateToken.js
└── frontend/
    ├── Dockerfile
    ├── index.html
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── components/
        │   └── AppNav.jsx
        ├── pages/
        │   ├── AdminDashboard.jsx
        │   ├── BookReservation.jsx
        │   ├── Login.jsx
        │   ├── OwnerDashboard.jsx
        │   ├── Register.jsx
        │   └── Restaurants.jsx
        └── services/
            └── api.js
```

## Backend Setup

1. **Clone and enter backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   - Copy `.env.example` to `.env`
   - Fill in MySQL credentials and JWT secret (see [.env configuration](#env-configuration) below)

4. **Create MySQL database:**
   - Create a database (e.g. `reservation_db`) in MySQL
   - Ensure `DB_NAME` in `.env` matches

5. **Start server:**
   ```bash
   npm start
   ```
   Server runs on `http://localhost:5001` (or `PORT` from `.env`). Sequelize will create/sync tables on first run.

   **If upgrading from an older schema:** run once with `alter: true` in `server.js` (change `sequelize.sync({ alter: false })` to `sequelize.sync({ alter: true })`) to add `owner_id` on `restaurants`, create `activity_logs`, and add `owner` to the `users.role` ENUM. Then switch back to `alter: false`.

   **If you see "Data truncated for column 'role'" when registering as Owner:** the `users.role` column still has the old ENUM. Run the migration: `mysql -u YOUR_USER -p YOUR_DB < backend/migrations/add-owner-role.sql` (or run the SQL in that file manually).

## Frontend Setup

1. **Enter frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000` and proxies `/api` to the backend.

## .env Configuration

Create `backend/.env` from `backend/.env.example`. **Do not hardcode credentials.**

Required variables:

| Variable     | Description                    | Example        |
|-------------|--------------------------------|----------------|
| `PORT`      | Backend port                   | `5001`         |
| `NODE_ENV`  | Environment                    | `development`  |
| `JWT_SECRET`| Secret for signing JWT         | (strong random string) |
| `DB_HOST`   | MySQL host                     | `localhost`    |
| `DB_PORT`   | MySQL port                     | `3306`         |
| `DB_NAME`   | Database name                  | `reservation_db` |
| `DB_USER`   | MySQL user                     | `root`         |
| `DB_PASSWORD` | MySQL password               | (your password) |

Optional: `JWT_EXPIRE` (default `7d`) for token expiry.

## Database Schema Overview

### users

| Column     | Type         | Notes              |
|------------|--------------|--------------------|
| id         | INT (PK)     | Auto-increment     |
| name       | VARCHAR(255) |                    |
| email      | VARCHAR(255) | Unique             |
| password   | VARCHAR(255) | Hashed (bcrypt)    |
| role       | ENUM         | `user`, `admin`, `owner` |
| created_at | DATETIME     |                    |
| updated_at | DATETIME     |                    |

### restaurants

| Column      | Type         | Notes        |
|-------------|--------------|-------------|
| id          | INT (PK)     | Auto-increment |
| name        | VARCHAR(255) |              |
| cuisine     | VARCHAR(255) |              |
| location    | VARCHAR(255) |              |
| rating      | DECIMAL(3,2) | Optional    |
| total_seats | INT          | Required (capacity) |
| owner_id    | INT (FK)     | → users.id (nullable) |
| created_at  | DATETIME     |              |
| updated_at  | DATETIME     |              |

### activity_logs

| Column     | Type         | Notes        |
|------------|--------------|-------------|
| id         | INT (PK)     | Auto-increment |
| action     | VARCHAR(50)  | e.g. register, login, create |
| entity     | VARCHAR(50)  | e.g. user, reservation |
| entity_id  | INT          | Optional    |
| user_id    | INT (FK)     | → users.id, optional |
| metadata   | JSON         | Optional    |
| created_at | DATETIME     |              |

### reservations

| Column         | Type         | Notes                    |
|----------------|--------------|--------------------------|
| id             | INT (PK)     | Auto-increment           |
| user_id        | INT (FK)     | → users.id               |
| restaurant_id  | INT (FK)     | → restaurants.id         |
| date           | DATE         |                          |
| time           | VARCHAR(10)  |                          |
| guests         | INT          |                          |
| contact_number | VARCHAR(20)  |                          |
| created_at     | DATETIME     |                          |
| updated_at     | DATETIME     |                          |

**Seat capacity:** Multiple reservations can share the same restaurant + date + time; total `guests` for that slot must not exceed the restaurant’s `total_seats`.

## API Documentation

Base URL: `http://localhost:5001/api` (or your `PORT`).

### Auth (public)

| Method | Endpoint              | Body / Params | Description     |
|--------|------------------------|---------------|-----------------|
| POST   | `/auth/register`       | `name`, `email`, `password`, `role?` (`user` \| `owner` \| `admin`) | Register user |
| POST   | `/auth/login`          | `email`, `password` | Login, returns JWT |

Responses include `token`; send it as `Authorization: Bearer <token>` for protected routes.

### Restaurants

| Method | Endpoint                | Access   | Description              |
|--------|--------------------------|----------|--------------------------|
| GET    | `/restaurants`           | Public   | List all restaurants     |
| GET    | `/restaurants/search?q=` | Public   | Search by name/cuisine/location |
| GET    | `/restaurants/:id/availability?date=&time=` | Public | Real-time seats for slot (`totalSeats`, `booked`, `available`) |
| GET    | `/restaurants/my`        | Owner    | List restaurants owned by current user |
| GET    | `/restaurants/:id/bookings` | Owner | Booking status for own restaurant |
| POST   | `/restaurants`           | Owner    | Add restaurant (`totalSeats` required); sets `ownerId` |
| PUT    | `/restaurants/:id`       | Owner    | Update own restaurant (e.g. total seats) |
| DELETE | `/restaurants/:id`       | Owner    | Delete own restaurant        |

### Reservations (protected)

| Method | Endpoint           | Access  | Description                |
|--------|---------------------|---------|----------------------------|
| POST   | `/reservations`     | User    | Create reservation (transaction + lock to prevent overbooking) |
| GET    | `/reservations/my`  | User    | Get current user's reservations |

**Create reservation body:** `restaurantId`, `date` (YYYY-MM-DD), `time` (24h `HH:mm`), `guests`, `contactNumber`.

If `guests` would exceed available seats for that restaurant + date + time, returns **409 Conflict**. Booked seats are deducted in real time; slot is disabled when available = 0.

### Admin (read-only)

| Method | Endpoint                | Access | Description              |
|--------|--------------------------|--------|--------------------------|
| GET    | `/admin/stats`           | Admin  | Users count, restaurants count, bookings (daily/weekly/monthly), total seats booked |
| GET    | `/admin/activity-logs`  | Admin  | System activity logs (limit, offset) |

## Core Features

- **RBAC:** Owner (manage own restaurants & seats), Admin (monitor only), User (book seats).
- **Real-time seat availability:** Availability computed from `totalSeats` minus sum of `guests` per (restaurant, date, time); updates on every booking.
- **Overbooking prevention:** Reservation creation runs in a transaction with row lock; insufficient seats return 409.
- **Activity logging:** Register, login, and reservation create are logged for Admin dashboard.
- **Security:** JWT, role middleware, express-validator, centralized error handling.

## Running the App

1. Start MySQL and ensure the database exists.
2. In `backend`: set `.env` (including MySQL credentials), then `npm start`.
3. In `frontend`: `npm run dev`.
4. Open `http://localhost:3000` — register as **User**, **Owner**, or **Admin**. Owners get "My Restaurants" and can add/manage restaurants; Admins get "Admin Dashboard" (stats + activity logs); Users browse and book seats. Booking is blocked when the slot is fully booked.

## Docker 📦 🔧

This project includes Dockerfiles for both the **backend** and **frontend**, plus a `docker-compose.yaml` to run the full stack locally (MySQL + backend + frontend).

### Prerequisites

- Docker (Engine) and Docker Compose installed on your machine.

### What the Compose file does

- mysql — runs a MySQL 8.0 instance with a persistent volume `mysql_data`.
  - By default the MySQL service is internal to the Docker network (no host port is published).
- backend — builds from `./backend` (`backend/Dockerfile`) and exposes port `5001`.
- frontend — builds from `./frontend` (`frontend/Dockerfile`) and serves the production build via nginx on port `80` (mapped to host `3000`).

### Quick start (recommended)

1. From the repository root, build and start the stack:
   ```bash
   docker compose up --build -d
   ```
2. Check running services:
   ```bash
   docker compose ps
   ```
3. Tail backend logs while testing:
   ```bash
   docker compose logs -f backend
   ```
4. To stop and remove containers and networks (remove volumes with `-v`):
   ```bash
   docker compose down -v
   ```

### Useful commands

- Run a backend migration / script (example):
  ```bash
  docker compose exec backend npm run migrate:fix-reservations-unique
  ```
- Open a shell in the backend container:
  ```bash
  docker compose exec backend sh
  ```
- Connect to the MySQL container from the host (if you expose the port or use a client inside the container):
  ```bash
  docker exec -it mysql_db mysql -u root -p
  # Default root password in compose: root
  ```

### Ports & persistence

- Frontend: http://localhost:3000 → served by nginx (container port 80)
- Backend: http://localhost:5001 → container port 5001
- MySQL: not published to host by default (internal only). To expose it to the host, modify `docker-compose.yaml` and add:
  ```yaml
  services:
    mysql:
      ports:
        - "3306:3306"
  ```
- The MySQL data is stored in a named volume `mysql_data` so data persists across restarts.

### Environment & secrets

The `docker-compose.yaml` includes inline environment variables (including `JWT_SECRET` and DB credentials). **Do not use these defaults in production.**

Recommended approach for development:

- Create a `.env` file at the repository root and add secrets / overrides there (Docker Compose will automatically load it):
  ```env
  JWT_SECRET=super_secure_jwt_secret_here
  DB_NAME=reservation_db
  DB_USER=appuser
  DB_PASSWORD=strong_password_here
  ```
- Alternatively switch `docker-compose.yaml` to reference variables (e.g. `JWT_SECRET: ${JWT_SECRET}`) so secrets are not checked into source control.

### Migrations & database initialization

- On startup the backend runs `sequelize.sync({ alter: false })` (see `backend/src/server.js`), which will create tables if missing. If you need to run SQL migration files, run them manually or via the MySQL client.
- To apply the `add-owner-role.sql` migration manually:
  ```bash
  # Example using the mysql client inside the MySQL container
  docker exec -i mysql_db mysql -u root -proot reservation_db < backend/migrations/add-owner-role.sql
  ```

### Troubleshooting & tips

- If the backend cannot connect to MySQL immediately on startup, check `docker compose logs mysql` for readiness. Consider adding a small wait/retry in the backend startup or run migrations after confirming the DB is ready.
- To rebuild a single service after code changes:
  ```bash
  docker compose up --build backend
  ```
  # 🚀 DevOps, CI/CD & AWS Cloud Deployment Guide

This project demonstrates a production-style **DevOps pipeline** for deploying a containerized full-stack application on AWS using:

- Docker & Docker Compose
- Jenkins CI/CD pipelines
- Docker Hub image registry
- AWS EC2
- Prometheus + Node Exporter + Grafana monitoring stack
- Secure credentials & secrets handling

This guide explains:

✔️ Where the application runs in AWS  
✔️ How CI/CD works  
✔️ How infrastructure is prepared  
✔️ How monitoring is configured  
✔️ How to reproduce the setup  

---

## ☁️ Live AWS Deployment

### 🌍 Public Endpoints

| Service | URL |
|--------|-----|
| Frontend Web App | http://13.233.216.11:3000 |
| Backend API | http://13.233.216.11:5001 |
| Node Exporter | http://13.233.216.11:9100 |
| Prometheus | http://13.233.216.11:9090 |
| Grafana Dashboard | http://13.233.216.11:3001 |

---

## 🏗️ Cloud Architecture Summary

Developer → GitHub → Jenkins CI/CD → Docker Hub → AWS EC2

AWS EC2 runs:
├─ Frontend container
├─ Backend container
├─ MySQL container
├─ Prometheus
├─ Node Exporter
└─ Grafana


---

## 🔁 CI/CD Pipeline Flow

1. Developer pushes code to GitHub
2. GitHub Webhook triggers Jenkins
3. Jenkins builds Docker images
4. Jenkins pushes images to Docker Hub
5. Jenkins connects to EC2 via SSH
6. Docker Compose pulls latest images
7. Containers restart
8. Monitoring stack continues scraping metrics

---

# 🛠️ Infrastructure Setup (AWS + DevOps)

---

## 1️⃣ EC2 Instance Preparation

Launch an Ubuntu EC2 instance (`t2.small` or higher).

Open the following inbound ports in the **Security Group**:

22 → SSH
3000 → Frontend
5001 → Backend
9090 → Prometheus
9100 → Node Exporter
3001 → Grafana
8080 → Jenkins (if hosted here)


---

## 2️⃣ Install Docker & Docker Compose

```bash
sudo apt update

curl -fsSL https://get.docker.com | sudo sh

sudo usermod -aG docker ubuntu
newgrp docker

docker --version
docker compose version
3️⃣ Jenkins Installation (CI/CD Server)
sudo apt update
sudo apt install -y openjdk-17-jre

curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key \
  | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ \
  | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update
sudo apt install -y jenkins

sudo systemctl enable jenkins
sudo systemctl start jenkins
Access Jenkins:

http://<EC2-IP>:8080
4️⃣ Jenkins Configuration
Install plugins:

Docker Pipeline

GitHub Integration

SSH Agent

Blue Ocean

Configure:

Docker Hub credentials

EC2 SSH private key

GitHub webhook token

5️⃣ Docker Hub Registry
Jenkins pushes built images to Docker Hub:

Backend image

Frontend image

Images are pulled automatically during deployment on EC2.

📊 Monitoring & Observability Stack
A complete monitoring stack is deployed on the EC2 instance.

Components
Tool	Purpose
Node Exporter	OS-level metrics
Prometheus	Scrapes metrics
Grafana	Visualization dashboards
6️⃣ Install Node Exporter
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-*.linux-amd64.tar.gz
tar -xvf node_exporter-*.tar.gz
sudo mv node_exporter-*/node_exporter /usr/local/bin/

sudo useradd --no-create-home --shell /bin/false node_exporter

sudo nano /etc/systemd/system/node_exporter.service
Start service:

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter
Verify:

http://<EC2-IP>:9100
7️⃣ Install Prometheus
cd /tmp
wget https://github.com/prometheus/prometheus/releases/latest/download/prometheus-*.linux-amd64.tar.gz

tar -xvf prometheus-*.tar.gz
sudo mv prometheus-*/prometheus /usr/local/bin/
sudo mv prometheus-*/promtool /usr/local/bin/
Start Prometheus and configure Node Exporter target.

Verify:

http://<EC2-IP>:9090
8️⃣ Install Grafana
sudo apt install -y apt-transport-https software-properties-common

wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"

sudo apt update
sudo apt install grafana

sudo systemctl enable grafana-server
sudo systemctl start grafana-server
Access:

http://<EC2-IP>:3001
Default login:

admin / admin
📈 Dashboards Used
Node Exporter Full

Docker host metrics

Disk usage

CPU load

Memory utilization

Network traffic

🔐 Security Best Practices
SSH key authentication

Jenkins credential store

Docker Hub secrets in Jenkins

Security groups limited to required ports

IAM roles for AWS services

Environment variables for secrets

📈 Scalability & Future Enhancements
Auto Scaling Groups

Application Load Balancer

Blue-Green deployments

Canary releases

Kubernetes (EKS)

HTTPS with ACM

Centralized logging via CloudWatch / ELK

Terraform IaC

✅ Summary
This project implements a complete enterprise-style DevOps lifecycle:

✔ Automated CI/CD pipelines
✔ Containerized deployments
✔ Cloud-hosted infrastructure
✔ Real-time monitoring
✔ Secure secret management
✔ Production-ready AWS architecture

  
