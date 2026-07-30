# 🎓 Plateforme de Formation IA — MENPS (Royaume du Maroc)

Ministère de l'Éducation Nationale, du Préscolaire et des Sports — Direction des Ressources Pédagogiques et Numériques (DRPN).

Architecture MVC 4 couches (Vue → Contrôleur → Service → Modèle), conforme au diagramme UML du projet.
Deux rôles distincts : **Enseignant** (acteur principal) et **Administrateur (DRPN)**.

---

## 📁 Structure du dossier

```
plateforme-formation-ia/
├── database/
│   ├── schema.sql          # Schéma SQLite complet (14 tables)
│   └── seed.sql            # Données de démonstration (comptes, modules, AREF marocaines)
├── backend/
│   ├── server.js           # Point d'entrée Express
│   ├── db.js               # Connexion SQLite + promisify
│   ├── package.json
│   ├── .env
│   ├── middleware/
│   │   └── auth.js         # JWT + rôles (Enseignant/Formateur/Admin)
│   ├── routes/
│   │   ├── auth.js         # Connexion / Inscription
│   │   ├── modules.js      # CRUD modules + catalogue
│   │   ├── quiz.js         # Passage quiz + score + badges
│   │   ├── progression.js  # Suivi de progression
│   │   ├── badges.js       # Gestion des badges
│   │   ├── ressources.js   # Ressources téléchargeables (PDF, etc.)
│   │   ├── admin.js        # Espace admin DRPN (stats, création)
│   │   └── support.js      # Messages au support
│   └── scripts/
│       └── init-db.js      # Initialisation BDD
└── frontend/
    ├── index.html           # Page d'accueil
    ├── img/
    │   └── logo-menps.png   # Logo officiel du MENPS
    ├── css/
    │   └── style.css        # Identité visuelle MENPS (bleu marine / doré)
    ├── js/
    │   └── app.js           # Client API + auth
    └── pages/
        ├── login.html
        ├── dashboard.html
        ├── modules.html
        ├── module-detail.html
        ├── quiz.html
        ├── progression.html
        └── admin.html
```

---

## 🚀 Installation et lancement en local

```bash
cd backend
npm install
npm run init-db
npm start
```

Accédez à : **http://localhost:3000**

La base de données SQLite (`database/plateforme_ia.db`) et le dossier `uploads/` (fichiers PDF, vidéos déposés) sont créés automatiquement en local lors du premier lancement — aucune configuration externe n'est nécessaire pour tester.

---

## 🔑 Comptes de démonstration

Les deux rôles de la plateforme peuvent être testés immédiatement avec les comptes suivants (mot de passe identique : `password123`) :

| Rôle | Identifiant (email) | Mot de passe | Matricule |
|------|----------------------|---------------|-----------|
| **Administrateur (DRPN)** | `admin.drpn@men.gov.ma` | `password123` | — |
| **Enseignant(e)** | `a.dassou@men.gov.ma` | `password123` | `10000001` |
| Enseignant(e) (compte secondaire) | `y.amrani@men.gov.ma` | `password123` | `10000002` |
| Enseignant(e) (compte secondaire) | `k.bennani@men.gov.ma` | `password123` | `10000003` |

Ces comptes sont pré-remplis et cliquables directement sur la page de connexion (`login.html`).

---

## ✅ Fonctionnalités implémentées

- **Authentification JWT** — connexion, session, rôles
- **Catalogue de modules** — filtres par niveau, thème, recherche textuelle
- **Suivi de module** — progression en %, statut (Non commencé / En cours / Terminé)
- **Dépôt de contenus (PDF, vidéos, documents)** — associés à un module, stockés localement dans `uploads/`
- **Quiz interactifs** — QCM, Vrai/Faux, calcul de score, seuil de réussite
- **Système de badges** — attribution automatique liée à la complétion d'un module et au score (Pionnier IA, Expert Consignes, Marathonien...)
- **Contact du support** — formulaire accessible depuis toutes les pages, avec suivi des tickets côté admin
- **Espace administrateur (DRPN)** — gestion CRUD des modules/contenus/quiz, suivi du pilote national par AREF, gestion des utilisateurs et des tickets support
- **Base SQLite locale** — tables relationnelles conformes au diagramme de classes UML (rôles Enseignant / Administrateur uniquement)

---

## 🏛️ Identité visuelle

Identité du **Ministère de l'Éducation Nationale, du Préscolaire et des Sports (MENPS)** :
- Logo officiel du MENPS en en-tête de chaque page
- Palette : bleu marine institutionnel `#1B3A6B`, doré `#C9A227`, blanc
- Typographie sobre et lisible (Inter / Segoe UI en secours)

---

## 📐 Architecture MVC (4 couches)

| Couche | Fichiers | Rôle |
|--------|----------|------|
| **Vue** | `frontend/*.html` + `style.css` | Interface utilisateur |
| **Contrôleur** | `backend/routes/*.js` | Traitement des requêtes HTTP |
| **Service** | `backend/db.js` + logique métier | Accès données, règles métier |
| **Modèle** | `database/schema.sql` | Structure SQLite |

---

## ☁️ Étapes suivantes : passer du local au cloud

Cette version fonctionne entièrement **en local** (SQLite + fichiers stockés dans `uploads/`), ce qui permet de tester sans aucun coût ni configuration. Pour un déploiement en production :

1. **Nom de domaine** — réserver un domaine (ex. `.ma` auprès de l'ANRT, ou un domaine générique) et le pointer vers l'hébergeur choisi.
2. **Hébergement cloud** — migrer vers un service comme un VPS (OVH, AWS, Google Cloud, Azure) ou une plateforme managée (Render, Railway, Fly.io) pour héberger le backend Node.js.
3. **Base de données** — remplacer SQLite par une base gérée (PostgreSQL/MySQL managé) pour supporter davantage d'utilisateurs simultanés.
4. **Stockage des fichiers** — migrer le dossier `uploads/` vers un stockage objet cloud (S3-compatible) plutôt que le disque local du serveur.
5. **Nom de domaine + HTTPS** — configurer un certificat SSL (Let's Encrypt) pour sécuriser les échanges.
6. **Variables d'environnement** — déplacer les secrets (`JWT_SECRET`, identifiants base de données) vers un gestionnaire de secrets de l'hébergeur, jamais dans le code source.

---

*Projet pédagogique — MENPS × UNESCO — 2026*
