# Transcendence: The Ultimate 42 Final Project 🌐🚀

[![42 School](https://img.shields.io/badge/42-School-blue)](https://42firenze.it/)
[![GitHub license](https://img.shields.io/github/license/Nazar963/42_ft_trascendence)](https://github.com/Nazar963/42_ft_trascendence/blob/main/LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-v10-red)](https://nestjs.com/)
[![Vue](https://img.shields.io/badge/Vue.js-v3-brightgreen)](https://vuejs.org/)

A full-stack web application featuring real-time multiplayer Pong, social features, and secure authentication, implementing 42's final project requirements with modern technologies.

![Transcendence Preview](https://raw.githubusercontent.com/Nazar963/42_ft_trascendence/main/images/demo.gif)

## Table of Contents 📖

-   [Project Overview](#project-overview)
-   [Key Features](#key-features)
-   [Tech Stack](#tech-stack)
-   [Architecture](#architecture)
-   [Installation](#installation)
-   [Usage](#usage)
-   [Development](#development)
-   [Contributing](#contributing)
-   [License](#license)

## Project Overview

Transcendence is the final project in the 42 School curriculum, challenging students to create a complete web application with:

-   Real-time multiplayer Pong game
-   User authentication and profile management
-   Social features (friends, chat, leaderboards)
-   RESTful API backend
-   Modern responsive frontend
-   Containerized deployment

This implementation meets all project requirements while showcasing industry best practices in full-stack development.

## Key Features

### 🎮 Game System

-   **Real-time Pong** with Phaser.js physics engine
-   **Multiplayer matchmaking** with ELO ranking system

### 👥 Social Features

-   Friend system with request management
-   Direct and group messaging
-   User status indicators (online/offline/in-game)
-   Blocking system and moderation tools

### 🔒 Authentication & Security

-   42 OAuth2 integration
-   JWT authentication with refresh tokens
-   Two-factor authentication (2FA)
-   Rate limiting and request validation
-   Password strength enforcement

### 📊 Dashboard

-   Player statistics and match history
-   Leaderboard with global rankings
-   Notification system
-   User profile customization

## Tech Stack

### Backend

| Technology  | Purpose                 | Version |
| ----------- | ----------------------- | ------- |
| NestJS      | Framework               | v10     |
| TypeScript  | Language                | 5.0+    |
| PostgreSQL  | Database                | 15+     |
| Prisma      | ORM                     | 5.0+    |
| Passport.js | Authentication          | v0.6    |
| Socket.IO   | Real-time communication | v4.7+   |
| Redis       | Caching & Pub/Sub       | 7.0+    |

### Frontend

| Technology       | Purpose          | Version |
| ---------------- | ---------------- | ------- |
| Vue.js 3         | Framework        | 3.3+    |
| Vite             | Build Tool       | 4.0+    |
| Pinia            | State Management | 2.1+    |
| Vue Router       | Routing          | 4.2+    |
| Tailwind CSS     | Styling          | 3.3+    |
| Bulma            | UI Components    | 0.9+    |
| Phaser.js        | Game Engine      | 3.60+   |
| Vee-Validate     | Form Handling    | 4.10+   |
| Socket.IO Client | Real-time        | v4.7+   |

### Infrastructure

| Technology     | Purpose          |
| -------------- | ---------------- |
| Docker         | Containerization |
| Docker Compose | Orchestration    |

## Architecture

```mermaid
graph TD
    A[Frontend - Vue.js] -->|HTTP| B[NestJS API]
    A -->|WebSocket| C[Socket.IO]
    B --> D[Prisma ORM]
    D --> E[PostgreSQL]
    C -->|Pub/Sub| F[Redis]
    G[Phaser Game] --> C
    H[Auth Service] -->|OAuth2| I[42 API]
    B -->|Logs| J[Prometheus]
    J --> K[Grafana]

    style A fill:#42b883,stroke:#333
    style B fill:#e0234e,stroke:#333
    style C fill:#010101,stroke:#333
    style G fill:#e3aa4a,stroke:#333
```

## Installation

### Prerequisites

-   Docker 20.10+
-   Docker Compose 2.0+
-   Node.js 18+

### Quick Start with Docker

```bash
# Clone repository
git clone https://github.com/Nizar963/42_ft_trascendence.git
cd 42_ft_trascendence

# Copy environment template
cp .env.example .env
cp .env backend/.env

# Build and start containers
docker compose up -d --build

# Apply database migrations
docker compose exec api npx prisma migrate dev

# Visit application
open http://localhost:3000
```

### Manual Installation

```bash
# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev

# Frontend setup
cd ../frontend
npm install
npm run dev
```

## Usage

### Application Access

-   Frontend: `http://localhost:3000`
-   backend: `http://localhost:3001`

### First-Time Setup

1. Login with 42 OAuth credentials
2. Complete profile setup
3. Enable two-factor authentication (recommended)
4. Customize profile avatar and settings
5. Add friends using search feature
6. Challenge friends to a Pong match

### Game Controls

| Control   | Action              |
| --------- | ------------------- |
| **W/S**   | Move paddle up/down |
| **ESC**   | Pause menu          |


## Development

### Project Structure

```
transcendence/
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── auth/         # Authentication module
│   │   ├── game/         # Game logic and matchmaking
│   │   ├── users/        # User management
│   │   ├── chat/         # Chat functionality
│   │   └── prisma/       # Database schema
├── frontend/             # Vue.js application
│   ├── src/
│   │   ├── assets/       # Static assets
│   │   ├── components/   # Vue components
│   │   ├── game/         # Phaser game implementation
│   │   ├── router/       # Vue router config
│   │   └── stores/       # Pinia state management
├── .env/                 # Env variables
├── .github/              # CI/CD workflows
└── docker-compose.yml    # Service orchestration
```

### Workflow Commands

```bash
# Generate Prisma client
docker exec -it dmnlg_backend npx prisma studio --port 5555 --hostname 0.0.0.0

# Monitor application logs
docker compose logs -f
```

### Environment Variables

```env
# Database
DB_CONNECTION=postgres
DB_HOST=database
DB_PORT=5432
DB_DATABASE=transcendence_db
DB_USERNAME=coolguy
DB_PASSWORD=123456
DATABASE_URL=postgresql://coolguy:123456@database:5432/transcendence_db
# JWT + Session
AT_SECRET=910a7560e81c54ea053e73c8cd5c78b5796344b9fafc82ec04c351006143a6ffa1b8eee82a29d0facfb2177481bc6379d28200b7c26b8ef2a4f6628ee0aa71d3
RT_SECRET=8922e4a6736f140ad75d73a241e73f4f6db70cf75ebc4797a7fc14bcbc8b411370037eeb757b082324794235585d2336e7d84a60077c285d3eb5f289051cde08
JWT_SECRET=MY_COOL_SECRET
SESSION_SECRET=MY_SESSION_SECRET
# 42 oAuth
FORTYTWO_CLIENT_ID= from the 42 intra
FORTYTWO_SECRET=from the 42 intra
FORTYTWO_CALLBACK=http://localhost:8080/api/auth/42
#Mail
MAIL_EMAIL=you gmail email
MAIL_PASSWORD=your app password
EMAIL_VERIFICATION_ENABLED=true
```

## Contributing

Feel free to submit issues or pull requests if you have suggestions for improving the application or adding more features cases.

### Coding Standards

-   Follow NestJS best practices
-   Adhere to Vue composition API style
-   Use TypeScript strict mode

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact
For questions or feedback, please open an issue in the repository.


## ⭐ Star this repository if you found it helpful!
[![GitHub stars](https://img.shields.io/github/stars/Nazar963/42_ft_trascendence?style=social)](https://github.com/Nazar963/42_ft_trascendence/stargazers)

---

🚀 **Transcend the Ordinary!**  
[![42 School](https://img.shields.io/badge/42-profile-blue)](https://profile-v3.intra.42.fr/users/naal-jen)
[![GitHub Profile](https://img.shields.io/badge/GitHub-Nazar963-lightgrey)](https://github.com/Nazar963)
[![GitHub Follow](https://img.shields.io/github/followers/Nazar963?style=social)](https://github.com/Nazar963)

---

Good luck with your ft_trascendence project at 42! 🚀

---



#Team
[**ggiannit**](https://github.com/skyheis)
[**ocastell**](https://github.com/TheJocker94)
[**mgirardi**](https://github.com/mik989)
[**lpincoli**](https://github.com/lpincoli)
