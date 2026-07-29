const fs = require('fs');
const path = require('path');
const db = require('../db');

const schemaPath = path.join(__dirname, '../../database/schema.sql');
const seedPath = path.join(__dirname, '../../database/seed.sql');

function execAsync(sql) {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => (err ? reject(err) : resolve()));
    });
}

// Réutilisable depuis server.js (initialisation auto au démarrage) et en CLI (npm run init-db)
async function initDb() {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const seed = fs.readFileSync(seedPath, 'utf8');

    await execAsync(schema);
    console.log('✅ Schéma appliqué');

    await execAsync(seed);
    console.log('✅ Données initiales insérées');
    console.log('🎓 Base de données prête !');
}

if (require.main === module) {
    initDb()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('❌ Erreur:', err.message);
            process.exit(1);
        });
}

module.exports = { initDb };
