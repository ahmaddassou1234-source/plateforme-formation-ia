-- ============================================================
-- DONNÉES INITIALES (jeu de test minimal) — MENPS (Royaume du Maroc)
-- ============================================================

-- Établissement
INSERT INTO etablissement (nom, type, zone, arefId) VALUES
('Lycée Ibn Khaldoun', 'Lycée', 'AREF Rabat-Salé-Kénitra', 'AREF-RSK-001');

-- Utilisateurs (mot de passe hashé : bcrypt de 'password123')
--
-- COMPTES DE DÉMONSTRATION (mot de passe identique : password123)
--   Administrateur (DRPN) : admin.drpn@men.gov.ma
--   Enseignant(e)         : a.dassou@men.gov.ma
--
INSERT INTO utilisateur (nom, email, motDePasse, role) VALUES
('Responsable DRPN', 'admin.drpn@men.gov.ma', '$2b$10$bG3n0GIqtVANEaqDF3QO5u9wBPDVWVbM.G5Qa.cNlJx.TjXkGHWei', 'Administrateur'),
('Ahmed Dassou', 'a.dassou@men.gov.ma', '$2b$10$bG3n0GIqtVANEaqDF3QO5u9wBPDVWVbM.G5Qa.cNlJx.TjXkGHWei', 'Enseignant');

-- Profil Enseignant
INSERT INTO enseignant (utilisateurId, etablissementId, arefId, niveauEnseigne, matricule) VALUES
(2, 1, 'AREF-RSK-001', 'Lycée', '10000001');

-- Profil Administrateur (DRPN)
INSERT INTO administrateur (utilisateurId) VALUES
(1);

-- Module de formation IA (le seul de ce jeu de test)
INSERT INTO moduleFormation (titre, theme, niveau, duree, roleCible, description, creePar) VALUES
('Introduction à l''IA Générative', 'Culture IA', 'Débutant', 120, 'Tous', 'Découvrez les fondamentaux de l''IA générative et ses applications pédagogiques.', 1);

-- Contenus pédagogiques du module
INSERT INTO contenu (moduleId, type, titre, fichier, ordre, texteContenu) VALUES
(1, 'Vidéo', 'Qu''est-ce que l''IA Générative ?', 'videos/intro-ia.mp4', 1, 'Présentation des concepts fondamentaux de l''intelligence artificielle générative.'),
(1, 'Texte', 'Histoire et évolution de l''IA', NULL, 2, 'Depuis les premiers algorithmes des années 50 jusqu''aux grands modèles de langage actuels...'),
(1, 'PDF', 'Guide pratique - Premiers pas', 'docs/guide-ia-debutant.pdf', 3, NULL);

-- Quiz du module
INSERT INTO quiz (moduleId, titre, description, seuilReussite) VALUES
(1, 'Quiz - Introduction à l''IA Générative', 'Vérifiez vos connaissances sur les bases de l''IA.', 70);

-- Questions et réponses
INSERT INTO question (quizId, texte, type, points, ordre) VALUES
(1, 'Quelle est la principale caractéristique de l''IA générative ?', 'QCM', 2, 1),
(1, 'Un assistant IA conversationnel est un modèle de type...', 'QCM', 2, 2),
(1, 'L''IA générative peut créer du texte, des images et de l''audio.', 'Vrai/Faux', 1, 3);

INSERT INTO reponse (questionId, texte, estCorrecte) VALUES
(1, 'Elle peut créer du contenu nouveau et original', 1),
(1, 'Elle ne fait que classer des données existantes', 0),
(1, 'Elle fonctionne uniquement avec des règles prédéfinies', 0),
(1, 'Elle nécessite une supervision humaine constante', 0),
(2, 'Grand Modèle de Langage (LLM)', 1),
(2, 'Réseau de neurones convolutif', 0),
(2, 'Algorithme de tri', 0),
(2, 'Base de données relationnelle', 0),
(3, 'Vrai', 1),
(3, 'Faux', 0);
