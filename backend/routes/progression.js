const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Récupérer la progression de l'enseignant connecté
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const enseignantId = req.user.id;

        const progressions = await db.allAsync(
            `SELECT p.*, m.titre, m.theme, m.niveau, m.duree
             FROM progression p
             JOIN moduleFormation m ON p.moduleId = m.id
             WHERE p.enseignantId = ?
             ORDER BY p.dateCompletion DESC`,
            [enseignantId]
        );

        // Statistiques
        const stats = await db.getAsync(
            `SELECT 
                COUNT(*) as totalModules,
                SUM(CASE WHEN statut = 'Terminé' THEN 1 ELSE 0 END) as modulesTermines,
                SUM(CASE WHEN statut = 'En cours' THEN 1 ELSE 0 END) as modulesEnCours,
                AVG(score) as moyenneScore,
                SUM(CASE WHEN statut = 'Terminé' THEN m.duree ELSE 0 END) as minutesFormees
             FROM progression p
             JOIN moduleFormation m ON p.moduleId = m.id
             WHERE p.enseignantId = ?`,
            [enseignantId]
        );

        res.json({
            progressions,
            stats: {
                ...stats,
                moyenneScore: stats.moyenneScore ? Math.round(stats.moyenneScore) : 0,
                heuresFormees: stats.minutesFormees ? Math.round(stats.minutesFormees / 60 * 10) / 10 : 0
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Démarrer un module (créer une progression)
router.post('/start/:moduleId', authenticateToken, async (req, res) => {
    try {
        const enseignantId = req.user.id;
        const moduleId = req.params.moduleId;

        const existing = await db.getAsync(
            'SELECT * FROM progression WHERE enseignantId = ? AND moduleId = ?',
            [enseignantId, moduleId]
        );

        if (existing) {
            return res.json({ message: 'Module déjà démarré', progression: existing });
        }

        const result = await db.runAsync(
            `INSERT INTO progression (enseignantId, moduleId, statut, pourcentageAvancement)
             VALUES (?, ?, 'En cours', 10)`,
            [enseignantId, moduleId]
        );

        res.status(201).json({ message: 'Module démarré', progressionId: result.id });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Mettre à jour l'avancement
router.put('/update/:moduleId', authenticateToken, async (req, res) => {
    try {
        const { pourcentage } = req.body;
        const enseignantId = req.user.id;
        const moduleId = req.params.moduleId;

        await db.runAsync(
            `UPDATE progression SET pourcentageAvancement = ? WHERE enseignantId = ? AND moduleId = ?`,
            [pourcentage, enseignantId, moduleId]
        );

        res.json({ message: 'Progression mise à jour' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
