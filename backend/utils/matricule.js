const db = require('../db');

// Génère le prochain matricule enseignant : 8 chiffres, commence toujours par 1 (10000001, 10000002, ...)
async function genererMatricule() {
    const row = await db.getAsync(
        "SELECT MAX(CAST(matricule AS INTEGER)) as maxMatricule FROM enseignant WHERE matricule LIKE '1_______'"
    );
    const next = (row && row.maxMatricule ? row.maxMatricule : 10000000) + 1;
    return String(next);
}

module.exports = { genererMatricule };
