const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Récupérer tous les badges
router.get('/', authenticateToken, async (req, res) => {
    try {
        const badges = await db.allAsync('SELECT * FROM badge ORDER BY id');

        // Si enseignant, indiquer lesquels sont obtenus
        if (req.user.role === 'Enseignant') {
            const obtenus = await db.allAsync(
                'SELECT badgeId FROM obtentionBadge WHERE enseignantId = ?',
                [req.user.id]
            );
            const obtenusIds = obtenus.map(o => o.badgeId);
            badges.forEach(b => {
                b.obtenu = obtenusIds.includes(b.id);
            });
        }

        res.json(badges);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Récupérer les badges de l'enseignant connecté
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const badges = await db.allAsync(
            `SELECT b.*, ob.dateObtention 
             FROM badge b
             JOIN obtentionBadge ob ON b.id = ob.badgeId
             WHERE ob.enseignantId = ?
             ORDER BY ob.dateObtention DESC`,
            [req.user.id]
        );
        res.json(badges);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
