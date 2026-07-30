const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');
const { initDb } = require('./scripts/init-db');

const app = express();
const PORT = process.env.PORT || 3000;

// Origines autorisées à appeler l'API (le frontend hébergé sur GitHub Pages + le dev local)
const ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://ahmaddassou1234-source.github.io'
];

// Middleware
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/quiz', require('./routes/quiz'));
app.use('/api/progression', require('./routes/progression'));
app.use('/api/badges', require('./routes/badges'));
app.use('/api/ressources', require('./routes/ressources'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/support', require('./routes/support'));

// Route racine
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ message: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Erreur serveur interne', error: err.message });
});

// Migration légère pour les bases créées avant l'ajout du matricule enseignant
// (SQLite ne permet pas d'ajouter une contrainte UNIQUE via ALTER TABLE, d'où
// l'unicité assurée uniquement par la génération séquentielle ici).
async function ensureMatriculeColumn() {
    const columns = await db.allAsync('PRAGMA table_info(enseignant)');
    if (columns.some((c) => c.name === 'matricule')) return;

    console.log('🔧 Migration : ajout du matricule enseignant...');
    await db.runAsync('ALTER TABLE enseignant ADD COLUMN matricule TEXT');

    const enseignants = await db.allAsync('SELECT utilisateurId FROM enseignant ORDER BY utilisateurId');
    let next = 10000001;
    for (const e of enseignants) {
        await db.runAsync('UPDATE enseignant SET matricule = ? WHERE utilisateurId = ?', [String(next), e.utilisateurId]);
        next++;
    }
    console.log(`✅ Migration terminée (${enseignants.length} matricule(s) attribué(s))`);
}

// Migration légère : les premières versions du schéma imposaient arefId UNIQUE sur
// etablissement, limitant à un seul établissement par région. On reconstruit la table
// sans cette contrainte (ALTER TABLE ne permet pas de retirer une contrainte en SQLite).
async function ensureEtablissementArefNotUnique() {
    const table = await db.getAsync("SELECT sql FROM sqlite_master WHERE type='table' AND name='etablissement'");
    if (!table || !table.sql.includes('arefId TEXT UNIQUE')) return;

    console.log('🔧 Migration : suppression de la contrainte UNIQUE sur etablissement.arefId...');
    await db.runAsync('PRAGMA foreign_keys = OFF');
    await db.execAsync(`
        CREATE TABLE etablissement_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nom TEXT NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('École', 'Collège', 'Lycée', 'Université', 'Autre')),
            zone TEXT NOT NULL,
            arefId TEXT NOT NULL
        );
        INSERT INTO etablissement_new (id, nom, type, zone, arefId) SELECT id, nom, type, zone, arefId FROM etablissement;
        DROP TABLE etablissement;
        ALTER TABLE etablissement_new RENAME TO etablissement;
    `);
    await db.runAsync('PRAGMA foreign_keys = ON');
    console.log('✅ Migration terminée');
}

// Démarrage : sur un disque éphémère (ex. Render), la base SQLite n'existe pas
// encore au premier déploiement — on (re)crée alors le schéma et les données de test.
async function start() {
    const table = await db.getAsync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='utilisateur'"
    );
    if (!table) {
        console.log('🗄️  Base de données vide — initialisation automatique du schéma et des données de test...');
        await initDb();
    } else {
        await ensureMatriculeColumn();
        await ensureEtablissementArefNotUnique();
    }

    app.listen(PORT, () => {
        console.log(`🎓 Plateforme Formation IA - Serveur démarré sur le port ${PORT}`);
        console.log(`📚 Accès : http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error('❌ Échec du démarrage du serveur:', err.message);
    process.exit(1);
});

module.exports = app;
