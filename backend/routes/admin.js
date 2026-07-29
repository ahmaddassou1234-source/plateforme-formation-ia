const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------
// Configuration de l'upload de fichiers (PDF, vidéos, docs)
// Les fichiers sont enregistrés localement dans /uploads
// ---------------------------------------------------------
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${unique}${ext}`);
    }
});

const ALLOWED_EXT = ['.pdf', '.mp4', '.png', '.jpg', '.jpeg', '.pptx', '.docx', '.xlsx'];
const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 Mo
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXT.includes(ext)) {
            return cb(new Error(`Type de fichier non autorisé : ${ext}`));
        }
        cb(null, true);
    }
});

// Middleware : vérifier que c'est un administrateur
router.use(authenticateToken);
router.use(requireRole('Administrateur'));

// Tableau de bord admin - Statistiques globales
router.get('/dashboard', async (req, res) => {
    try {
        const stats = await db.getAsync(`
            SELECT
                (SELECT COUNT(*) FROM utilisateur) as totalUtilisateurs,
                (SELECT COUNT(*) FROM utilisateur WHERE role = 'Enseignant') as totalEnseignants,
                (SELECT COUNT(*) FROM moduleFormation WHERE estMiniFormation = 0) as totalModules,
                (SELECT COUNT(*) FROM moduleFormation WHERE estMiniFormation = 1) as totalMiniFormations,
                (SELECT COUNT(*) FROM progression WHERE statut = 'Terminé') as totalCompletions,
                (SELECT COUNT(*) FROM badge) as totalBadges,
                (SELECT COUNT(*) FROM messageSupport WHERE statut = 'Ouvert') as ticketsOuverts
        `);

        // Modules les plus suivis
        const topModules = await db.allAsync(`
            SELECT m.titre, COUNT(p.id) as nbInscriptions,
                   AVG(p.score) as moyenneScore
            FROM moduleFormation m
            LEFT JOIN progression p ON m.id = p.moduleId
            GROUP BY m.id
            ORDER BY nbInscriptions DESC
            LIMIT 5
        `);

        // Derniers inscrits
        const derniersInscrits = await db.allAsync(`
            SELECT nom, email, role, dateCreation
            FROM utilisateur
            ORDER BY dateCreation DESC
            LIMIT 5
        `);

        res.json({
            stats,
            topModules,
            derniersInscrits
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Liste de tous les utilisateurs
router.get('/utilisateurs', async (req, res) => {
    try {
        const utilisateurs = await db.allAsync(`
            SELECT u.id, u.nom, u.email, u.role, u.dateCreation,
                   e.arefId, et.nom as etablissementNom
            FROM utilisateur u
            LEFT JOIN enseignant e ON u.id = e.utilisateurId
            LEFT JOIN etablissement et ON e.etablissementId = et.id
            ORDER BY u.dateCreation DESC
        `);
        res.json(utilisateurs);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Supprimer un compte utilisateur
router.delete('/utilisateur/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (id === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
        }
        const result = await db.runAsync('DELETE FROM utilisateur WHERE id = ?', [id]);
        if (result.changes === 0) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }
        res.json({ message: 'Utilisateur supprimé' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Suivi du pilote national — statistiques agrégées par AREF (suivrePiloteNational)
router.get('/pilote-national', async (req, res) => {
    try {
        const parAref = await db.allAsync(`
            SELECT et.arefId,
                   COUNT(DISTINCT e.utilisateurId) as nbEnseignants,
                   COUNT(DISTINCT et.id) as nbEtablissements,
                   COUNT(p.id) as nbProgressions,
                   SUM(CASE WHEN p.statut = 'Terminé' THEN 1 ELSE 0 END) as nbCompletions,
                   ROUND(AVG(CASE WHEN p.statut = 'Terminé' THEN p.score END), 1) as moyenneScore
            FROM etablissement et
            LEFT JOIN enseignant e ON e.etablissementId = et.id
            LEFT JOIN progression p ON p.enseignantId = e.utilisateurId
            GROUP BY et.arefId
            ORDER BY et.arefId
        `);

        const parZone = await db.allAsync(`
            SELECT et.zone,
                   COUNT(DISTINCT e.utilisateurId) as nbEnseignants,
                   SUM(CASE WHEN p.statut = 'Terminé' THEN 1 ELSE 0 END) as nbCompletions
            FROM etablissement et
            LEFT JOIN enseignant e ON e.etablissementId = et.id
            LEFT JOIN progression p ON p.enseignantId = e.utilisateurId
            GROUP BY et.zone
            ORDER BY et.zone
        `);

        res.json({ parAref, parZone });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Liste des contenus (gestion admin)
router.get('/contenus', async (req, res) => {
    try {
        const contenus = await db.allAsync(`
            SELECT c.*, m.titre as moduleTitre
            FROM contenu c
            JOIN moduleFormation m ON c.moduleId = m.id
            ORDER BY c.moduleId, c.ordre
        `);
        res.json(contenus);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Supprimer un contenu
router.delete('/contenu/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM contenu WHERE id = ?', [req.params.id]);
        res.json({ message: 'Contenu supprimé' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Liste des quiz (gestion admin)
router.get('/quiz', async (req, res) => {
    try {
        const quizzes = await db.allAsync(`
            SELECT q.*, m.titre as moduleTitre,
                   (SELECT COUNT(*) FROM question WHERE quizId = q.id) as nbQuestions
            FROM quiz q
            JOIN moduleFormation m ON q.moduleId = m.id
            ORDER BY q.moduleId
        `);
        res.json(quizzes);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Supprimer un quiz
router.delete('/quiz/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM quiz WHERE id = ?', [req.params.id]);
        res.json({ message: 'Quiz supprimé' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Créer un contenu pour un module (avec dépôt de fichier réel : PDF, vidéo...)
router.post('/contenu', upload.single('fichier'), async (req, res) => {
    try {
        const { moduleId, type, titre, ordre, texteContenu } = req.body;
        // Si un fichier a été envoyé, on stocke son chemin relatif ; sinon on garde
        // la valeur texte fournie (rétro-compatibilité avec un contenu sans fichier).
        const cheminFichier = req.file ? `uploads/${req.file.filename}` : (req.body.fichier || null);

        const result = await db.runAsync(
            `INSERT INTO contenu (moduleId, type, titre, fichier, ordre, texteContenu)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [moduleId, type, titre, cheminFichier, ordre || 0, texteContenu || null]
        );

        res.status(201).json({
            message: 'Contenu ajouté',
            contenuId: result.id,
            fichier: cheminFichier,
            nomOriginal: req.file ? req.file.originalname : null,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Liste des questions d'un quiz (avec leurs réponses)
router.get('/questions', async (req, res) => {
    try {
        const { quizId } = req.query;
        if (!quizId) return res.status(400).json({ message: 'quizId requis' });

        const questions = await db.allAsync(
            'SELECT * FROM question WHERE quizId = ? ORDER BY ordre',
            [quizId]
        );
        for (const q of questions) {
            q.reponses = await db.allAsync('SELECT * FROM reponse WHERE questionId = ?', [q.id]);
        }
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Supprimer une question (et ses réponses, via cascade)
router.delete('/question/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM question WHERE id = ?', [req.params.id]);
        res.json({ message: 'Question supprimée' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Créer une question pour un quiz
router.post('/question', async (req, res) => {
    try {
        const { quizId, texte, type, points, ordre, reponses } = req.body;

        const result = await db.runAsync(
            `INSERT INTO question (quizId, texte, type, points, ordre)
             VALUES (?, ?, ?, ?, ?)`,
            [quizId, texte, type, points, ordre]
        );

        const questionId = result.id;

        // Ajouter les réponses
        if (reponses && reponses.length > 0) {
            for (const rep of reponses) {
                await db.runAsync(
                    `INSERT INTO reponse (questionId, texte, estCorrecte)
                     VALUES (?, ?, ?)`,
                    [questionId, rep.texte, rep.estCorrecte ? 1 : 0]
                );
            }
        }

        res.status(201).json({ message: 'Question ajoutée', questionId });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Créer un quiz
router.post('/quiz', async (req, res) => {
    try {
        const { moduleId, titre, description, seuilReussite } = req.body;

        const result = await db.runAsync(
            `INSERT INTO quiz (moduleId, titre, description, seuilReussite)
             VALUES (?, ?, ?, ?)`,
            [moduleId, titre, description, seuilReussite || 70]
        );

        res.status(201).json({ message: 'Quiz créé', quizId: result.id });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Ajouter une ressource (dépôt réel de fichier PDF/document)
router.post('/ressource', upload.single('fichier'), async (req, res) => {
    try {
        const { titre, typeDoc, moduleId } = req.body;
        if (!titre) {
            return res.status(400).json({ message: 'Le titre de la ressource est obligatoire.' });
        }
        const cheminFichier = req.file ? `uploads/${req.file.filename}` : (req.body.fichier || null);

        const result = await db.runAsync(
            `INSERT INTO ressource (titre, typeDoc, fichier, moduleId)
             VALUES (?, ?, ?, ?)`,
            [titre, typeDoc || 'PDF', cheminFichier, moduleId || null]
        );

        res.status(201).json({
            message: 'Ressource ajoutée',
            ressourceId: result.id,
            fichier: cheminFichier,
            nomOriginal: req.file ? req.file.originalname : null,
        });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Gestion centralisée des erreurs Multer (fichier trop lourd, type refusé...)
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ message: 'Erreur de dépôt de fichier', error: err.message });
    }
    next();
});

module.exports = router;
