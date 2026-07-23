# CoLife — Frontend

Interface web de l'application CoLife (gestion d'activités et covoiturage en entreprise).

## Stack technique

| Couche | Technologie |
|---|---|
| Langage | TypeScript |
| Framework | React 19 |
| Build | Vite |
| Style | Tailwind CSS 4 |
| Authentification | OIDC (Keycloak via oidc-client-ts) |
| Tests | Vitest, React Testing Library, MSW |
| Couverture | V8 / LCOV |
| Qualité | SonarQube |
| Conteneurisation | Docker, Nginx |

---

## Manuel de déploiement

### Prérequis

- Node.js 20+ et npm
- Infrastructure backend démarrée (`docker compose up -d` dans le dépôt `API_CoLife`)

### 1. Variables d'environnement

```bash
cp .env.exemple .env
```

| Variable | Rôle |
|---|---|
| `VITE_API_BASE_URL` | URL de l'API backend |
| `VITE_KEYCLOAK_AUTHORITY` | URL du realm Keycloak |
| `VITE_KEYCLOAK_CLIENT_ID` | Identifiant du client OIDC SPA |

### 2. Lancer en développement

```bash
npm install && npm run dev
```

L'application est disponible sur `http://localhost:5173`.

### 3. Build de production (Docker)

```bash
docker build -t colife-front .
docker run -p 80:80 colife-front
```

L'application est servie par Nginx sur le port 80.

---

## Manuel de test et qualité

### Exécuter les tests

```bash
npm run test
```

### Exécuter les tests avec couverture

```bash
npm run test -- --coverage
```

Génère le rapport HTML dans `coverage/index.html`.

### Analyse SonarQube

```bash
npm run sonar
```

Résultats disponibles sur `http://localhost:9000`.

---

## Structure du projet

```
src/
├── components/        # Composants React réutilisables
│   ├── admin/         # Composants spécifiques à l'administration
│   ├── activity/      # Composants liés aux activités
│   ├── home/          # Composants de la page d'accueil
│   ├── layout/        # Mise en page (navigation, sidebar)
│   └── ui/            # Composants génériques (modales, badges)
├── pages/             # Pages de l'application
│   ├── admin/         # Pages administration
│   └── *.tsx          # Pages collaborateur
├── services/          # Appels API
├── utils/             # Utilitaires (formatters, helpers)
└── __tests__/         # Tests unitaires et de composants
```