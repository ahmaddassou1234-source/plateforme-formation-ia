const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Récupérer toutes les ressources
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { moduleId } = req.query;
        let sql = `
            SELECT r.*, m.titre as moduleTitre 
            FROM ressource r
            LEFT JOIN moduleFormation m ON r.moduleId = m.id
            WHERE 1=1
        `;
        const params = [];

        if (moduleId) {
            sql += ' AND r.moduleId = ?';
            params.push(moduleId);
        }

        sql += ' ORDER BY r.dateAjout DESC';

        const ressources = await db.allAsync(sql, params);
        res.json(ressources);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Télécharger une ressource (simulation)
router.get('/:id/download', authenticateToken, async (req, res) => {
    try {
        const ressource = await db.getAsync(
            'SELECT * FROM ressource WHERE id = ?',
            [req.params.id]
        );

        if (!ressource) {
            return res.status(404).json({ message: 'Ressource non trouvée' });
        }

        // Simuler un téléchargement
        res.json({
            message: 'Téléchargement initié',
            ressource: {
                id: ressource.id,
                titre: ressource.titre,
                typeDoc: ressource.typeDoc,
                fichier: ressource.fichier
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
