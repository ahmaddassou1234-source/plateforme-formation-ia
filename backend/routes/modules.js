const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Récupérer tous les modules (catalogue)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { theme, niveau, search, mesCreations } = req.query;
        let sql = `
            SELECT m.*, u.nom as createurNom,
                   (SELECT COUNT(*) FROM contenu WHERE moduleId = m.id) as nbContenus,
                   (SELECT COUNT(*) FROM quiz WHERE moduleId = m.id) as nbQuiz
            FROM moduleFormation m
            LEFT JOIN utilisateur u ON m.creePar = u.id
            WHERE 1=1
        `;
        const params = [];

        if (theme) {
            sql += ' AND m.theme = ?';
            params.push(theme);
        }
        if (niveau) {
            sql += ' AND m.niveau = ?';
            params.push(niveau);
        }
        if (search) {
            sql += ' AND (m.titre LIKE ? OR m.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        if (mesCreations) {
            sql += ' AND m.estMiniFormation = 1 AND m.creePar = ?';
            params.push(req.user.id);
        }

        sql += ' ORDER BY m.dateCreation DESC';

        const modules = await db.allAsync(sql, params);

        // Ajouter la progression de l'utilisateur connecté si c'est un enseignant
        if (req.user.role === 'Enseignant') {
            const enseignant = await db.getAsync(
                'SELECT utilisateurId FROM enseignant WHERE utilisateurId = ?',
                [req.user.id]
            );
            if (enseignant) {
                for (let mod of modules) {
                    const prog = await db.getAsync(
                        'SELECT statut, pourcentageAvancement, score FROM progression WHERE enseignantId = ? AND moduleId = ?',
                        [req.user.id, mod.id]
                    );
                    mod.progression = prog || { statut: 'Non commencé', pourcentageAvancement: 0, score: 0 };
                }
            }
        }

        res.json(modules);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Récupérer un module par ID avec ses contenus
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const moduleId = req.params.id;

        const module = await db.getAsync(
            `SELECT m.*, u.nom as createurNom 
             FROM moduleFormation m 
             LEFT JOIN utilisateur u ON m.creePar = u.id 
             WHERE m.id = ?`,
            [moduleId]
        );

        if (!module) {
            return res.status(404).json({ message: 'Module non trouvé' });
        }

        // Contenus du module
        const contenus = await db.allAsync(
            'SELECT * FROM contenu WHERE moduleId = ? ORDER BY ordre',
            [moduleId]
        );

        // Quiz du module
        const quiz = await db.getAsync(
            'SELECT * FROM quiz WHERE moduleId = ?',
            [moduleId]
        );

        // Ressources liées
        const ressources = await db.allAsync(
            'SELECT * FROM ressource WHERE moduleId = ?',
            [moduleId]
        );

        // Progression de l'enseignant
        let progression = null;
        if (req.user.role === 'Enseignant') {
            progression = await db.getAsync(
                'SELECT * FROM progression WHERE enseignantId = ? AND moduleId = ?',
                [req.user.id, moduleId]
            );
        }

        res.json({
            ...module,
            contenus,
            quiz,
            ressources,
            progression: progression || { statut: 'Non commencé', pourcentageAvancement: 0 }
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Créer un module officiel (Admin uniquement)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Administrateur') {
            return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
        }

        const { titre, theme, niveau, duree, roleCible, description } = req.body;

        const result = await db.runAsync(
            `INSERT INTO moduleFormation (titre, theme, niveau, duree, roleCible, description, creePar, estMiniFormation)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
            [titre, theme, niveau, duree, roleCible, description, req.user.id]
        );

        res.status(201).json({
            message: 'Module créé avec succès',
            moduleId: result.id
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Créer une mini-formation (Enseignant uniquement) — Enseignant.creerMiniFormation()
router.post('/mini-formation', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Enseignant') {
            return res.status(403).json({ message: 'Seuls les enseignants peuvent créer une mini-formation' });
        }

        const { titre, theme, description, contenuTexte } = req.body;
        if (!titre || !theme || !description) {
            return res.status(400).json({ message: 'Titre, thème et description sont obligatoires' });
        }

        const result = await db.runAsync(
            `INSERT INTO moduleFormation (titre, theme, niveau, duree, roleCible, description, creePar, estMiniFormation)
             VALUES (?, ?, 'Débutant', 30, 'Enseignant', ?, ?, 1)`,
            [titre, theme, description, req.user.id]
        );

        if (contenuTexte) {
            await db.runAsync(
                `INSERT INTO contenu (moduleId, type, titre, ordre, texteContenu) VALUES (?, 'Texte', 'Contenu', 1, ?)`,
                [result.id, contenuTexte]
            );
        }

        res.status(201).json({ message: 'Mini-formation créée avec succès', moduleId: result.id });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Mettre à jour un module (Admin, ou l'enseignant créateur pour sa mini-formation)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const module = await db.getAsync('SELECT * FROM moduleFormation WHERE id = ?', [req.params.id]);
        if (!module) return res.status(404).json({ message: 'Module non trouvé' });

        const estProprietaire = module.estMiniFormation === 1 && module.creePar === req.user.id;
        if (req.user.role !== 'Administrateur' && !estProprietaire) {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        const { titre, theme, niveau, duree, roleCible, description } = req.body;

        await db.runAsync(
            `UPDATE moduleFormation
             SET titre = ?, theme = ?, niveau = ?, duree = ?, roleCible = ?, description = ?
             WHERE id = ?`,
            [titre ?? module.titre, theme ?? module.theme, niveau ?? module.niveau,
             duree ?? module.duree, roleCible ?? module.roleCible, description ?? module.description,
             req.params.id]
        );

        res.json({ message: 'Module mis à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Supprimer un module (Admin, ou l'enseignant créateur pour sa mini-formation)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const module = await db.getAsync('SELECT * FROM moduleFormation WHERE id = ?', [req.params.id]);
        if (!module) return res.status(404).json({ message: 'Module non trouvé' });

        const estProprietaire = module.estMiniFormation === 1 && module.creePar === req.user.id;
        if (req.user.role !== 'Administrateur' && !estProprietaire) {
            return res.status(403).json({ message: 'Accès refusé' });
        }

        await db.runAsync('DELETE FROM moduleFormation WHERE id = ?', [req.params.id]);
        res.json({ message: 'Module supprimé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Récupérer les thèmes disponibles
router.get('/themes/list', authenticateToken, async (req, res) => {
    try {
        const themes = await db.allAsync(
            'SELECT DISTINCT theme FROM moduleFormation ORDER BY theme'
        );
        res.json(themes.map(t => t.theme));
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
