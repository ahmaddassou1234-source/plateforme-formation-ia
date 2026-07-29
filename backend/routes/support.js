const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Envoyer un message de support
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { sujet, contenu } = req.body;
        const expediteurId = req.user.id;

        if (!sujet || !contenu) {
            return res.status(400).json({ message: 'Sujet et contenu requis' });
        }

        const result = await db.runAsync(
            `INSERT INTO messageSupport (expediteurId, sujet, contenu)
             VALUES (?, ?, ?)`,
            [expediteurId, sujet, contenu]
        );

        res.status(201).json({ message: 'Message envoyé au support', ticketId: result.id });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Récupérer les messages (Admin uniquement)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Administrateur') {
            return res.status(403).json({ message: 'Accès réservé' });
        }

        const messages = await db.allAsync(
            `SELECT m.*, u.nom as expediteurNom, u.email as expediteurEmail
             FROM messageSupport m
             JOIN utilisateur u ON m.expediteurId = u.id
             ORDER BY m.dateEnvoi DESC`
        );
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Mettre à jour le statut d'un ticket (Admin uniquement)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Administrateur') {
            return res.status(403).json({ message: 'Accès réservé' });
        }
        const { statut } = req.body;
        await db.runAsync('UPDATE messageSupport SET statut = ? WHERE id = ?', [statut, req.params.id]);
        res.json({ message: 'Statut mis à jour' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
