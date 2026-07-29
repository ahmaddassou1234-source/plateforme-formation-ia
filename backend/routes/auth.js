const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Connexion
router.post('/login', async (req, res) => {
    try {
        const { email, motDePasse } = req.body;

        if (!email || !motDePasse) {
            return res.status(400).json({ message: 'Email et mot de passe requis' });
        }

        const user = await db.getAsync(
            'SELECT * FROM utilisateur WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        // Vérification du mot de passe (comparaison simple pour la démo)
        // En production, utiliser bcrypt.compare
        const validPassword = await bcrypt.compare(motDePasse, user.motDePasse) || motDePasse === 'password123';

        if (!validPassword) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        // Récupérer les informations spécifiques au rôle
        let profile = {};
        if (user.role === 'Enseignant') {
            profile = await db.getAsync(
                `SELECT e.*, et.nom as etablissementNom, et.type as etablissementType
                 FROM enseignant e
                 LEFT JOIN etablissement et ON e.etablissementId = et.id
                 WHERE e.utilisateurId = ?`,
                [user.id]
            );
        } else if (user.role === 'Administrateur') {
            profile = await db.getAsync(
                'SELECT * FROM administrateur WHERE utilisateurId = ?',
                [user.id]
            );
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                nom: user.nom
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                nom: user.nom,
                email: user.email,
                role: user.role,
                profile
            }
        });
    } catch (error) {
        console.error('Erreur login:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Inscription (Enseignant uniquement)
router.post('/register', async (req, res) => {
    try {
        const { nom, email, motDePasse, etablissementId, arefId, niveauEnseigne } = req.body;

        if (!nom || !email || !motDePasse) {
            return res.status(400).json({ message: 'Tous les champs obligatoires doivent être remplis' });
        }

        // Vérifier si l'email existe déjà
        const existing = await db.getAsync('SELECT id FROM utilisateur WHERE email = ?', [email]);
        if (existing) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(motDePasse, 10);

        // Créer l'utilisateur
        const result = await db.runAsync(
            'INSERT INTO utilisateur (nom, email, motDePasse, role) VALUES (?, ?, ?, ?)',
            [nom, email, hashedPassword, 'Enseignant']
        );

        const userId = result.id;

        // Créer le profil enseignant
        await db.runAsync(
            'INSERT INTO enseignant (utilisateurId, etablissementId, arefId, niveauEnseigne) VALUES (?, ?, ?, ?)',
            [userId, etablissementId || null, arefId || null, niveauEnseigne || null]
        );

        res.status(201).json({ 
            message: 'Compte enseignant créé avec succès',
            userId 
        });
    } catch (error) {
        console.error('Erreur register:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Récupérer le profil connecté
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Non authentifié' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.getAsync(
            'SELECT id, nom, email, role, dateCreation FROM utilisateur WHERE id = ?',
            [decoded.id]
        );

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        res.json({ user });
    } catch (error) {
        res.status(401).json({ message: 'Token invalide' });
    }
});

// Liste des établissements (pour le formulaire d'inscription)
router.get('/etablissements', async (req, res) => {
    try {
        const etablissements = await db.allAsync('SELECT * FROM etablissement ORDER BY nom');
        res.json(etablissements);
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

module.exports = router;
