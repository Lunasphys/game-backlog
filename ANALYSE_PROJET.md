# Analyse complète du projet — Game Backlog Tracker

## Architecture globale

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  Frontend    │────>│  Backend API │────>│ PostgreSQL  │
│  React/Vite  │     │  Next.js 16  │     │ (Prisma)    │
│  Nginx       │     │              │──┐  └─────────────┘
└─────────────┘     └──────────────┘  │
       │                               │  ┌─────────────┐
       │            ┌──────────────┐   └─>│   Redis     │
       └───────────>│  WS Server   │<─────│  Pub/Sub    │
                    │  Socket.io   │      └─────────────┘
                    └──────────────┘
         Tout orchestre via Kubernetes + Traefik Gateway
```

## Stack technique

| Couche | Techno | Version |
|--------|--------|---------|
| **Frontend** | React + Vite + TypeScript | 19 + 8 + 6 |
| **State management** | Zustand | 5 |
| **Styling** | Tailwind CSS | 4.3 |
| **Charts** | Recharts | 3.9 |
| **Backend** | Next.js (App Router) | 16.2 |
| **ORM** | Prisma | 6.19 |
| **Auth** | JWT + bcrypt | - |
| **Validation** | Zod | 4.4 |
| **WebSocket** | Socket.io + Redis Pub/Sub | 4.8 |
| **BDD** | PostgreSQL | 15 |
| **Cache/Events** | Redis | 7 |
| **Orchestration** | Kubernetes + Traefik Gateway API | - |
| **DNS** | nip.io (wildcard DNS) | - |
| **Conteneurs** | Docker (multi-stage builds) | - |

## Fonctionnalites principales

### 1. Authentification JWT
- Inscription / connexion avec email + mot de passe
- Tokens JWT valides 7 jours
- Hash bcrypt des mots de passe
- Protection des routes via middleware `requireAuth`
- Auto-logout sur reponse 401

### 2. CRUD Jeux
- Ajout manuel avec formulaire complet (titre, plateforme, genre, statut, priorite, notes, rating)
- 5 statuts : Wishlist, Backlog, En cours, Termine, Abandonne
- Modification inline du statut depuis la carte du jeu
- Suppression avec confirmation
- Recherche et filtrage par statut/titre

### 3. Integration Steam
- **Recherche Steam** : recherche de jeux via l'API Steam Store (resultats avec titre, prix, cover)
- **Details Steam** : fiche complete d'un jeu (description, genres, plateformes, score Metacritic, screenshots)
- **Import bibliotheque** : connexion avec Steam ID (17 chiffres), recuperation des jeux possedes, import selectif en batch
- Auto-assignation du statut : `playing` si >600 min de jeu, sinon `backlog`

### 4. Temps reel (WebSocket + Redis Pub/Sub)
- Le backend publie des evenements sur Redis (`game:added`, `game:updated`, `game:deleted`)
- Le serveur WebSocket (Socket.io) souscrit au channel Redis et relaie aux clients connectes
- Le dashboard stats se met a jour en direct sans rechargement
- Fil d'activite en temps reel avec timestamp et badge de type

### 5. Dashboard Statistiques
- Nombre total de jeux, heures jouees, taux de completion
- Pie chart : repartition par statut
- Pie chart : repartition par plateforme
- Bar chart : temps de jeu par genre
- Top 5 des jeux les plus joues
- 10 derniers jeux modifies
- Indicateur de connexion WebSocket (vert/rouge)

### 6. Multi-tenant
- Chaque utilisateur a un `tenantId` unique genere a l'inscription
- Toutes les requetes filtrent par `tenantId` (isole dans le JWT)
- Un utilisateur ne peut voir/modifier que ses propres jeux
- Index compose `(tenantId, userId)` pour les performances

## API Backend — 14 endpoints

### Authentification
| Methode | Route | Description |
|---------|-------|-------------|
| POST | `/api/auth` | Connexion (email + password) |
| POST | `/api/auth/register` | Inscription |
| GET | `/api/auth/me` | Utilisateur courant |
| PATCH | `/api/auth/me` | Mise a jour du Steam ID |

### Jeux (CRUD)
| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/games` | Liste des jeux (filtrable par status, platform, search) |
| POST | `/api/games` | Creer un jeu |
| PATCH | `/api/games/[id]` | Modifier un jeu |
| DELETE | `/api/games/[id]` | Supprimer un jeu |

### Steam
| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/games/search?q=` | Recherche sur le Steam Store |
| GET | `/api/games/search?appid=` | Details d'un jeu Steam |
| GET | `/api/steam/library` | Recuperer la bibliotheque Steam |
| POST | `/api/steam/import` | Importer des jeux selectionnes |

### Monitoring
| Methode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Liveness probe |
| GET | `/api/ready` | Readiness probe (teste PostgreSQL) |

## Schema de base de donnees (Prisma)

### User
- `id` (UUID, PK)
- `email` (unique)
- `password` (hash bcrypt)
- `tenantId` (index)
- `steamId` (optionnel, 17 chiffres)
- `createdAt`

### Game
- `id` (UUID, PK)
- `title`, `platform`, `genre`
- `status` (enum: wishlist, backlog, playing, completed, abandoned)
- `priority` (1-5)
- `rating` (1-10, optionnel)
- `coverUrl`, `notes`
- `steamAppId`, `playtimeMinutes`
- `userId` (FK → User), `tenantId`
- `createdAt`, `updatedAt`
- Index compose : `(tenantId, userId)`, `status`
- Contrainte unique : `(steamAppId, userId)`

## Infrastructure Kubernetes

### Deployments (5 pods)
| Service | Image | Replicas | Port |
|---------|-------|----------|------|
| **Backend** | `game-backlog-api:latest` | 2 | 3000 |
| **Frontend** | `game-backlog-frontend:latest` (Nginx) | 1 | 80 |
| **WebSocket** | `game-backlog-ws:latest` | 1 | 3001 |
| **PostgreSQL** | `postgres:15-alpine` | 1 | 5432 |
| **Redis** | `redis:7-alpine` | 1 | 6379 |

### Routage (Traefik Gateway API)
- **Gateway** : Traefik avec entrypoint `web` (port 8000)
- **DNS** : nip.io (resout `*.192.168.49.2.nip.io` vers l'IP minikube)
- 3 HTTPRoutes :
  - `web.192.168.49.2.nip.io` → Frontend
  - `api.192.168.49.2.nip.io` → Backend
  - `ws.192.168.49.2.nip.io` → WebSocket

### Health Checks
- Backend : liveness (`/api/health` toutes les 10s) + readiness (`/api/ready` toutes les 5s)
- WebSocket : liveness (`/health` toutes les 10s)

### Docker
- **Backend** : build multi-stage (deps → builder avec Prisma generate + Next.js build → runner standalone)
- **Frontend** : build multi-stage (Vite build → Nginx serving static files)
- **WebSocket** : single-stage (Node.js alpine, production deps only)

## Structure des fichiers cles

```
gameBacklog/
├── backend-nextjs/
│   ├── app/api/
│   │   ├── auth/route.ts          # Login
│   │   ├── auth/register/route.ts # Register
│   │   ├── auth/me/route.ts       # User profile + Steam ID
│   │   ├── games/route.ts         # List + Create games
│   │   ├── games/[id]/route.ts    # Update + Delete game
│   │   ├── games/search/route.ts  # Steam search
│   │   ├── stats/route.ts         # Analytics
│   │   ├── steam/library/route.ts # Steam library
│   │   ├── steam/import/route.ts  # Steam import
│   │   ├── health/route.ts        # Liveness
│   │   └── ready/route.ts         # Readiness
│   ├── lib/
│   │   ├── auth.ts                # JWT sign/verify/middleware
│   │   ├── config.ts              # Zod env validation
│   │   ├── prisma.ts              # Prisma client singleton
│   │   └── redis.ts               # Redis pub/sub
│   ├── prisma/schema.prisma       # Schema BDD
│   └── Dockerfile                 # Multi-stage build
├── frontend-react/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx      # Connexion
│   │   │   ├── RegisterPage.tsx   # Inscription
│   │   │   ├── DashboardPage.tsx  # Collection de jeux
│   │   │   └── StatsPage.tsx      # Statistiques + temps reel
│   │   ├── components/
│   │   │   ├── GameCard.tsx       # Carte de jeu
│   │   │   ├── GameModal.tsx      # Formulaire ajout/edit
│   │   │   ├── SteamSearchModal.tsx   # Recherche Steam
│   │   │   ├── SteamImportModal.tsx   # Import bibliotheque
│   │   │   ├── Navbar.tsx         # Navigation
│   │   │   └── ProtectedRoute.tsx # Guard auth
│   │   ├── stores/
│   │   │   ├── authStore.ts       # State auth (Zustand)
│   │   │   └── gameStore.ts       # State jeux (Zustand)
│   │   ├── lib/api.ts             # Client Axios + interceptors
│   │   └── types.ts               # Types TypeScript
│   ├── nginx.conf                 # Config Nginx
│   └── Dockerfile                 # Multi-stage build
├── ws-server/
│   ├── server.js                  # Serveur WebSocket complet
│   └── Dockerfile
└── k8s/
    ├── 00-namespace.yaml
    ├── 01-gateway.yaml            # Traefik Gateway
    ├── backend/                   # Deployment + Service + HTTPRoute
    ├── frontend/                  # Deployment + Service + HTTPRoute
    ├── websocket/                 # Deployment + Service + HTTPRoute
    ├── postgres/                  # Deployment + Service
    └── redis/                     # Deployment + Service
```
