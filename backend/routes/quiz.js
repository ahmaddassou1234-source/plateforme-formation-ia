const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Récupérer un quiz avec ses questions
router.get('/:quizId', authenticateToken, async (req, res) => {
    try {
        const quiz = await db.getAsync(
            `SELECT q.*, m.titre as moduleTitre 
             FROM quiz q 
             JOIN moduleFormation m ON q.moduleId = m.id 
             WHERE q.id = ?`,
            [req.params.quizId]
        );

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz non trouvé' });
        }

        const questions = await db.allAsync(
            `SELECT * FROM question WHERE quizId = ? ORDER BY ordre`,
            [req.params.quizId]
        );

        for (let question of questions) {
            const reponses = await db.allAsync(
                `SELECT id, texte FROM reponse WHERE questionId = ?`,
                [question.id]
            );
            question.reponses = reponses;
        }

        res.json({ ...quiz, questions });
    } catch (error) {
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Soumettre les réponses d'un quiz
router.post('/:quizId/submit', authenticateToken, async (req, res) => {
    try {
        const { reponses } = req.body; // { questionId: reponseId, ... }
        const quizId = req.params.quizId;
        const enseignantId = req.user.id;

        // Vérifier que c'est un enseignant
        const enseignant = await db.getAsync(
            'SELECT utilisateurId FROM enseignant WHERE utilisateurId = ?',
            [enseignantId]
        );

        if (!enseignant) {
            return res.status(403).json({ message: 'Seuls les enseignants peuvent passer les quiz' });
        }

        // Récupérer les questions et réponses correctes
        const questions = await db.allAsync(
            'SELECT * FROM question WHERE quizId = ?',
            [quizId]
        );

        let scoreTotal = 0;
        let pointsObtenus = 0;
        let pointsPossibles = 0;
        const details = [];

        for (const question of questions) {
            pointsPossibles += question.points;
            const reponseId = reponses[question.id];

            if (reponseId) {
                const reponse = await db.getAsync(
                    'SELECT * FROM reponse WHERE id = ? AND questionId = ?',
                    [reponseId, question.id]
                );

                if (reponse) {
                    const estCorrecte = reponse.estCorrecte === 1;
                    if (estCorrecte) {
                        pointsObtenus += question.points;
                    }

                    // Enregistrer la réponse soumise
                    await db.runAsync(
                        `INSERT INTO reponseSoumise (enseignantId, questionId, reponseDonnee, estCorrecte)
                         VALUES (?, ?, ?, ?)`,
                        [enseignantId, question.id, reponse.texte, estCorrecte ? 1 : 0]
                    );

                    details.push({
                        questionId: question.id,
                        texte: question.texte,
                        correct: estCorrecte,
                        points: estCorrecte ? question.points : 0
                    });
                }
            }
        }

        // Calculer le score en pourcentage
        const scorePourcentage = pointsPossibles > 0 
            ? Math.round((pointsObtenus / pointsPossibles) * 100) 
            : 0;

        // Récupérer le quiz pour le seuil
        const quiz = await db.getAsync('SELECT * FROM quiz WHERE id = ?', [quizId]);
        const reussi = scorePourcentage >= quiz.seuilReussite;

        // Mettre à jour la progression
        const moduleId = quiz.moduleId;
        const existingProgression = await db.getAsync(
            'SELECT * FROM progression WHERE enseignantId = ? AND moduleId = ?',
            [enseignantId, moduleId]
        );

        if (existingProgression) {
            await db.runAsync(
                `UPDATE progression 
                 SET statut = ?, score = ?, pourcentageAvancement = ?, dateCompletion = ?
                 WHERE enseignantId = ? AND moduleId = ?`,
                [reussi ? 'Terminé' : 'En cours', scorePourcentage, reussi ? 100 : 80, 
                 reussi ? new Date().toISOString() : null, enseignantId, moduleId]
            );
        } else {
            await db.runAsync(
                `INSERT INTO progression (enseignantId, moduleId, statut, score, pourcentageAvancement, dateCompletion)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [enseignantId, moduleId, reussi ? 'Terminé' : 'En cours', scorePourcentage, 
                 reussi ? 100 : 80, reussi ? new Date().toISOString() : null]
            );
        }

        // Vérifier l'attribution de badges (uniquement si le module est validé)
        const badgesObtenus = reussi ? await verifierBadges(enseignantId, moduleId, scorePourcentage) : [];

        res.json({
            message: reussi ? 'Quiz réussi !' : 'Quiz terminé',
            score: scorePourcentage,
            seuil: quiz.seuilReussite,
            reussi,
            details,
            badgesObtenus
        });
    } catch (error) {
        console.error('Erreur submit quiz:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
});

// Fonction pour vérifier et attribuer les badges après validation d'un module
async function verifierBadges(enseignantId, moduleId, score) {
    const badgesObtenus = [];

    const attribuer = async (badge) => {
        try {
            await db.runAsync(
                'INSERT INTO obtentionBadge (enseignantId, badgeId) VALUES (?, ?)',
                [enseignantId, badge.id]
            );
            badgesObtenus.push(badge.titre);
        } catch (e) { /* Badge déjà obtenu (contrainte UNIQUE) */ }
    };

    const modulesTermines = await db.getAsync(
        'SELECT COUNT(*) as count FROM progression WHERE enseignantId = ? AND statut = ?',
        [enseignantId, 'Terminé']
    );

    // Badge générique : premier module terminé
    if (modulesTermines.count >= 1) {
        const badge = await db.getAsync("SELECT * FROM badge WHERE titre = 'Pionnier IA'");
        if (badge) await attribuer(badge);
    }

    // Badge générique : 5 modules terminés
    if (modulesTermines.count >= 5) {
        const badge = await db.getAsync("SELECT * FROM badge WHERE titre = 'Marathonien'");
        if (badge) await attribuer(badge);
    }

    // Badges liés à un module précis (avec seuil de score optionnel)
    const badgesModule = await db.allAsync(
        'SELECT * FROM badge WHERE moduleId = ?',
        [moduleId]
    );
    for (const badge of badgesModule) {
        if (badge.scoreRequis === null || badge.scoreRequis === undefined || score >= badge.scoreRequis) {
            await attribuer(badge);
        }
    }

    // Badge ultime : obtenu quand tous les autres badges le sont
    const totalBadges = await db.getAsync('SELECT COUNT(*) as count FROM badge WHERE titre != ?', ['Ambassadeur IA']);
    const badgesObtenusCount = await db.getAsync(
        `SELECT COUNT(*) as count FROM obtentionBadge ob
         JOIN badge b ON ob.badgeId = b.id
         WHERE ob.enseignantId = ? AND b.titre != 'Ambassadeur IA'`,
        [enseignantId]
    );
    if (badgesObtenusCount.count >= totalBadges.count) {
        const badge = await db.getAsync("SELECT * FROM badge WHERE titre = 'Ambassadeur IA'");
        if (badge) await attribuer(badge);
    }

    return badgesObtenus;
}

module.exports = router;
