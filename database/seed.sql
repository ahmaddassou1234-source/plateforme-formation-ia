-- ============================================================
-- DONNÉES INITIALES — MENPS (Royaume du Maroc)
-- ============================================================

-- Établissements
INSERT INTO etablissement (nom, type, zone, arefId) VALUES
('Lycée Ibn Khaldoun', 'Lycée', 'AREF Rabat-Salé-Kénitra', 'AREF-RSK-001'),
('Collège Al Farabi', 'Collège', 'AREF Casablanca-Settat', 'AREF-CS-002'),
('École Al Massira', 'École', 'AREF Fès-Meknès', 'AREF-FM-003'),
('Université Mohammed V', 'Université', 'AREF Rabat-Salé-Kénitra', 'AREF-RSK-004');

-- Utilisateurs (mot de passe hashé : bcrypt de 'password123')
-- Administrateur = Responsable DRPN (Direction des Ressources Pédagogiques et Numériques)
--
-- COMPTES DE DÉMONSTRATION (mot de passe identique pour tous : password123)
--   Administrateur (DRPN) : admin.drpn@men.gov.ma
--   Enseignant(e)         : a.dassou@men.gov.ma
--   Enseignant(e)         : y.amrani@men.gov.ma
--
INSERT INTO utilisateur (nom, email, motDePasse, role) VALUES
('Responsable DRPN', 'admin.drpn@men.gov.ma', '$2b$10$bG3n0GIqtVANEaqDF3QO5u9wBPDVWVbM.G5Qa.cNlJx.TjXkGHWei', 'Administrateur'),
('Ahmed Dassou', 'a.dassou@men.gov.ma', '$2b$10$bG3n0GIqtVANEaqDF3QO5u9wBPDVWVbM.G5Qa.cNlJx.TjXkGHWei', 'Enseignant'),
('Youssef Amrani', 'y.amrani@men.gov.ma', '$2b$10$bG3n0GIqtVANEaqDF3QO5u9wBPDVWVbM.G5Qa.cNlJx.TjXkGHWei', 'Enseignant'),
('Khadija Bennani', 'k.bennani@men.gov.ma', '$2b$10$bG3n0GIqtVANEaqDF3QO5u9wBPDVWVbM.G5Qa.cNlJx.TjXkGHWei', 'Enseignant');

-- Profils Enseignants
INSERT INTO enseignant (utilisateurId, etablissementId, arefId, niveauEnseigne) VALUES
(2, 1, 'AREF-RSK-001', 'Lycée'),
(3, 2, 'AREF-CS-002', 'Collège'),
(4, 1, 'AREF-RSK-001', 'Lycée');

-- Profil Administrateur (DRPN)
INSERT INTO administrateur (utilisateurId) VALUES
(1);

-- Modules de formation IA
INSERT INTO moduleFormation (titre, theme, niveau, duree, roleCible, description, creePar) VALUES
('Introduction à l''IA Générative', 'Culture IA', 'Débutant', 120, 'Tous', 'Découvrez les fondamentaux de l''IA générative et ses applications pédagogiques.', 1),
('Les assistants IA en classe', 'Outils Numériques', 'Débutant', 90, 'Enseignant', 'Apprenez à utiliser un assistant IA pour préparer vos cours et accompagner vos élèves.', 1),
('Créer des supports visuels avec l''IA', 'Création Numérique', 'Intermédiaire', 60, 'Enseignant', 'Maîtrisez les outils de génération d''images pour enrichir vos supports pédagogiques.', 1),
('Éthique et IA dans l''Éducation', 'Éthique Numérique', 'Avancé', 150, 'Tous', 'Réflexion sur les enjeux éthiques de l''IA dans le milieu scolaire, à partir du cadre national MENPS.', 1),
('Automatisation des Tâches Administratives', 'Productivité', 'Intermédiaire', 45, 'Enseignant', 'Utilisez l''IA pour réduire votre charge administrative quotidienne.', 1),
('IA et Différenciation Pédagogique', 'Pédagogie', 'Avancé', 180, 'Enseignant', 'Stratégies avancées pour personnaliser l''apprentissage grâce à l''IA.', 1);

-- Exemple de mini-formation créée par un enseignant, pour ses pairs
INSERT INTO moduleFormation (titre, theme, niveau, duree, roleCible, description, creePar, estMiniFormation) VALUES
('Partager mes astuces IA en salle des profs', 'Retour d''expérience', 'Débutant', 30, 'Enseignant', 'Mini-formation conçue par un enseignant pour transmettre ses bonnes pratiques d''usage de l''IA à ses collègues.', 2, 1);

-- Contenus pédagogiques
INSERT INTO contenu (moduleId, type, titre, fichier, ordre, texteContenu) VALUES
(1, 'Vidéo', 'Qu''est-ce que l''IA Générative ?', 'videos/intro-ia.mp4', 1, 'Présentation des concepts fondamentaux de l''intelligence artificielle générative.'),
(1, 'Texte', 'Histoire et évolution de l''IA', NULL, 2, 'Depuis les premiers algorithmes des années 50 jusqu''aux grands modèles de langage actuels...'),
(1, 'PDF', 'Guide pratique - Premiers pas', 'docs/guide-ia-debutant.pdf', 3, NULL),
(2, 'Vidéo', 'Tour d''horizon d''un assistant IA', 'videos/assistant-ia-overview.mp4', 1, 'Découverte de l''interface et des fonctionnalités principales.'),
(2, 'Texte', 'Rédiger des consignes efficaces (prompt engineering)', NULL, 2, 'Apprenez à rédiger des requêtes claires pour obtenir des réponses pertinentes.'),
(3, 'Vidéo', 'Générateurs d''images en 30 minutes', 'videos/ia-images.mp4', 1, 'Comparatif des principaux outils de génération d''images.'),
(4, 'Texte', 'Protection des données et IA', NULL, 1, 'Analyse des implications de la protection des données personnelles sur l''utilisation de l''IA en milieu scolaire.'),
(5, 'PDF', 'Modèles de documents automatisés', 'docs/templates-auto.pdf', 1, NULL),
(7, 'Texte', 'Trois astuces à tester dès demain', NULL, 1, 'Retour d''expérience concret d''un enseignant sur l''intégration de l''IA dans la préparation de cours.');

-- Quiz
INSERT INTO quiz (moduleId, titre, description, seuilReussite) VALUES
(1, 'Quiz - Introduction à l''IA Générative', 'Vérifiez vos connaissances sur les bases de l''IA.', 70),
(2, 'Quiz - Maîtrise d''un assistant IA', 'Testez votre capacité à utiliser un assistant IA efficacement.', 60),
(3, 'Quiz - Création de supports visuels IA', 'Évaluez vos compétences en génération d''images.', 70),
(4, 'Quiz - Éthique et IA', 'Réflexion sur les enjeux éthiques.', 80);

-- Questions et réponses
INSERT INTO question (quizId, texte, type, points, ordre) VALUES
(1, 'Quelle est la principale caractéristique de l''IA générative ?', 'QCM', 2, 1),
(1, 'Un assistant IA conversationnel est un modèle de type...', 'QCM', 2, 2),
(1, 'L''IA générative peut créer du texte, des images et de l''audio.', 'Vrai/Faux', 1, 3),
(2, 'Quel élément est essentiel pour obtenir une bonne réponse d''un assistant IA ?', 'QCM', 2, 1),
(2, 'Un assistant IA peut remplacer totalement l''enseignant.', 'Vrai/Faux', 1, 2);

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
(3, 'Faux', 0),
(4, 'Une consigne claire et détaillée', 1),
(4, 'Une connexion internet rapide', 0),
(4, 'Un abonnement payant', 0),
(4, 'Un ordinateur très puissant', 0),
(5, 'Vrai', 0),
(5, 'Faux', 1);

-- Ressources
INSERT INTO ressource (titre, typeDoc, fichier, moduleId) VALUES
('Référentiel UNESCO — compétences IA des enseignants', 'PDF', 'ressources/unesco-referentiel-enseignants.pdf', 1),
('Consignes types pour l''éducation', 'PDF', 'ressources/prompts-education.pdf', 2),
('Cadre national d''usage de l''IA — MENPS', 'PDF', 'ressources/cadre-national-ia-menps.pdf', 4),
('Modèle de fiche de suivi', 'XLSX', 'ressources/suivi-eleves.xlsx', 5);

-- Badges (moduleId/scoreRequis = condition d'attribution automatique lors de la validation d'un quiz)
INSERT INTO badge (titre, description, icone, conditionObtention, moduleId, scoreRequis) VALUES
('Pionnier IA', 'Avez terminé votre premier module sur l''IA.', 'badge-pionnier.svg', 'Terminer 1 module', NULL, NULL),
('Expert Consignes', 'Avez obtenu 100% au quiz sur les assistants IA.', 'badge-expert.svg', 'Score parfait quiz assistant IA', 2, 100),
('Créatif Numérique', 'Avez complété le module sur la création de supports visuels.', 'badge-creatif.svg', 'Terminer module Images IA', 3, NULL),
('Éthique Engagé', 'Avez validé le module sur l''éthique de l''IA.', 'badge-ethique.svg', 'Terminer module Éthique', 4, NULL),
('Marathonien', 'Avez complété 5 modules de formation.', 'badge-marathon.svg', 'Terminer 5 modules', NULL, NULL),
('Ambassadeur IA', 'Avez obtenu tous les autres badges de la plateforme.', 'badge-ambassadeur.svg', 'Obtenir tous les autres badges', NULL, NULL);

-- Progressions (exemples)
INSERT INTO progression (enseignantId, moduleId, statut, score, dateCompletion, pourcentageAvancement) VALUES
(2, 1, 'Terminé', 85, '2026-07-20 14:30:00', 100),
(2, 2, 'En cours', 0, NULL, 45),
(3, 1, 'Terminé', 70, '2026-07-18 10:15:00', 100),
(4, 1, 'Non commencé', 0, NULL, 0);

-- Obtention de badges
INSERT INTO obtentionBadge (enseignantId, badgeId, dateObtention) VALUES
(2, 1, '2026-07-20 14:30:00'),
(3, 1, '2026-07-18 10:15:00');

-- Messages de support
INSERT INTO messageSupport (expediteurId, sujet, contenu, statut) VALUES
(2, 'Problème de connexion', 'Je n''arrive pas à accéder au module 3.', 'Résolu'),
(3, 'Demande de badge', 'Pensez-vous qu''on puisse ajouter un badge spécifique pour les mathématiques ?', 'Ouvert');
