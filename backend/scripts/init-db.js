const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../../database/plateforme_ia.db');
const schemaPath = path.join(__dirname, '../../database/schema.sql');
const seedPath = path.join(__dirname, '../../database/seed.sql');

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur:', err.message);
        process.exit(1);
    }
    console.log('✅ Base de données connectée');
});

const schema = fs.readFileSync(schemaPath, 'utf8');
const seed = fs.readFileSync(seedPath, 'utf8');

db.exec(schema, (err) => {
    if (err) {
        console.error('❌ Erreur schéma:', err);
        return;
    }
    console.log('✅ Schéma appliqué');

    db.exec(seed, (err) => {
        if (err) {
            console.error('❌ Erreur seed:', err);
            return;
        }
        console.log('✅ Données initiales insérées');
        console.log('🎓 Base de données prête !');
        db.close();
    });
});
