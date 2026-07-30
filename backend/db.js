const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

// Sans identifiants Turso : fichier SQLite local (comportement inchangé en dev).
// Avec TURSO_DATABASE_URL + TURSO_AUTH_TOKEN : base distante persistante (production).
const localDbPath = process.env.DB_PATH || path.join(__dirname, '../database/plateforme_ia.db');
const localDbDir = path.dirname(localDbPath);
if (!fs.existsSync(localDbDir)) {
    fs.mkdirSync(localDbDir, { recursive: true });
}

const usingTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);

const client = usingTurso
    ? createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
    : createClient({ url: `file:${localDbPath}` });

console.log(usingTurso
    ? '✅ Connexion à la base de données Turso établie'
    : `✅ Connexion à la base de données SQLite locale établie (${localDbPath})`);

// Normalise les lignes en objets simples (nécessaire pour le spread { ...row } utilisé par les routes)
function toPlainRows(resultSet) {
    return resultSet.rows.map((row) => {
        const obj = {};
        resultSet.columns.forEach((col) => { obj[col] = row[col]; });
        return obj;
    });
}

const db = {
    async runAsync(sql, params = []) {
        const rs = await client.execute({ sql, args: params });
        return { id: Number(rs.lastInsertRowid ?? 0), changes: rs.rowsAffected };
    },
    async getAsync(sql, params = []) {
        const rs = await client.execute({ sql, args: params });
        return toPlainRows(rs)[0];
    },
    async allAsync(sql, params = []) {
        const rs = await client.execute({ sql, args: params });
        return toPlainRows(rs);
    },
    // Exécute un script SQL contenant plusieurs instructions séparées par ';' (schema.sql, seed.sql)
    async execAsync(sql) {
        await client.executeMultiple(sql);
    }
};

db.runAsync('PRAGMA foreign_keys = ON').catch(() => {});

module.exports = db;
