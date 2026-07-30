-- ============================================================
-- PLATEFORME DE FORMATION IA — MENPS (Ministère de l'Éducation Nationale, du Préscolaire et des Sports, Royaume du Maroc)
-- Base de données SQLite
-- ============================================================

-- Table des établissements scolaires
CREATE TABLE IF NOT EXISTS etablissement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('École', 'Collège', 'Lycée', 'Université', 'Autre')),
    zone TEXT NOT NULL,
    arefId TEXT UNIQUE NOT NULL
);

-- Table des utilisateurs (classe mère)
CREATE TABLE IF NOT EXISTS utilisateur (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nom TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    motDePasse TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Enseignant', 'Administrateur')),
    dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des enseignants (hérite de utilisateur)
CREATE TABLE IF NOT EXISTS enseignant (
    utilisateurId INTEGER PRIMARY KEY,
    etablissementId INTEGER,
    arefId TEXT,
    niveauEnseigne TEXT,
    matricule TEXT UNIQUE, -- identifiant à 8 chiffres commençant par 1 (ex. 10000001)
    FOREIGN KEY (utilisateurId) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (etablissementId) REFERENCES etablissement(id)
);

-- Table des administrateurs (hérite de utilisateur) - Le fondateur
CREATE TABLE IF NOT EXISTS administrateur (
    utilisateurId INTEGER PRIMARY KEY,
    FOREIGN KEY (utilisateurId) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Table des modules de formation
CREATE TABLE IF NOT EXISTS moduleFormation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    theme TEXT NOT NULL,
    niveau TEXT NOT NULL CHECK(niveau IN ('Débutant', 'Intermédiaire', 'Avancé')),
    duree INTEGER NOT NULL, -- en minutes
    roleCible TEXT NOT NULL CHECK(roleCible IN ('Enseignant', 'Tous')),
    description TEXT,
    dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP,
    creePar INTEGER,
    estMiniFormation INTEGER NOT NULL DEFAULT 0, -- 1 = mini-formation créée par un enseignant pour ses pairs
    FOREIGN KEY (creePar) REFERENCES utilisateur(id)
);

-- Table des contenus pédagogiques
CREATE TABLE IF NOT EXISTS contenu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moduleId INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Vidéo', 'PDF', 'Texte', 'Audio', 'Infographie')),
    titre TEXT NOT NULL,
    fichier TEXT,
    ordre INTEGER DEFAULT 0,
    texteContenu TEXT,
    FOREIGN KEY (moduleId) REFERENCES moduleFormation(id) ON DELETE CASCADE
);

-- Table des quiz
CREATE TABLE IF NOT EXISTS quiz (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    moduleId INTEGER NOT NULL,
    titre TEXT NOT NULL,
    description TEXT,
    seuilReussite INTEGER DEFAULT 70, -- pourcentage minimum
    FOREIGN KEY (moduleId) REFERENCES moduleFormation(id) ON DELETE CASCADE
);

-- Table des questions
CREATE TABLE IF NOT EXISTS question (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quizId INTEGER NOT NULL,
    texte TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('QCM', 'Vrai/Faux', 'Ouverte')),
    points INTEGER DEFAULT 1,
    ordre INTEGER DEFAULT 0,
    FOREIGN KEY (quizId) REFERENCES quiz(id) ON DELETE CASCADE
);

-- Table des réponses possibles
CREATE TABLE IF NOT EXISTS reponse (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    questionId INTEGER NOT NULL,
    texte TEXT NOT NULL,
    estCorrecte INTEGER NOT NULL DEFAULT 0, -- 0 = faux, 1 = vrai
    FOREIGN KEY (questionId) REFERENCES question(id) ON DELETE CASCADE
);

-- Table des ressources téléchargeables
CREATE TABLE IF NOT EXISTS ressource (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    typeDoc TEXT NOT NULL,
    fichier TEXT NOT NULL,
    moduleId INTEGER,
    dateAjout DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (moduleId) REFERENCES moduleFormation(id) ON DELETE SET NULL
);

-- Table des badges
CREATE TABLE IF NOT EXISTS badge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titre TEXT NOT NULL,
    description TEXT,
    icone TEXT,
    conditionObtention TEXT,
    moduleId INTEGER, -- si renseigné, badge lié à la complétion d'un module précis
    scoreRequis INTEGER, -- si renseigné, score minimum (%) exigé sur ce module
    FOREIGN KEY (moduleId) REFERENCES moduleFormation(id) ON DELETE SET NULL
);

-- Table de progression des enseignants
CREATE TABLE IF NOT EXISTS progression (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enseignantId INTEGER NOT NULL,
    moduleId INTEGER NOT NULL,
    statut TEXT NOT NULL CHECK(statut IN ('Non commencé', 'En cours', 'Terminé')),
    score INTEGER DEFAULT 0,
    dateCompletion DATETIME,
    pourcentageAvancement INTEGER DEFAULT 0,
    UNIQUE(enseignantId, moduleId),
    FOREIGN KEY (enseignantId) REFERENCES enseignant(utilisateurId) ON DELETE CASCADE,
    FOREIGN KEY (moduleId) REFERENCES moduleFormation(id) ON DELETE CASCADE
);

-- Table d'attribution des badges
CREATE TABLE IF NOT EXISTS obtentionBadge (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enseignantId INTEGER NOT NULL,
    badgeId INTEGER NOT NULL,
    dateObtention DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(enseignantId, badgeId),
    FOREIGN KEY (enseignantId) REFERENCES enseignant(utilisateurId) ON DELETE CASCADE,
    FOREIGN KEY (badgeId) REFERENCES badge(id) ON DELETE CASCADE
);

-- Table des réponses soumises par les enseignants
CREATE TABLE IF NOT EXISTS reponseSoumise (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    enseignantId INTEGER NOT NULL,
    questionId INTEGER NOT NULL,
    reponseDonnee TEXT NOT NULL,
    estCorrecte INTEGER DEFAULT 0,
    dateSoumission DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (enseignantId) REFERENCES enseignant(utilisateurId) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES question(id) ON DELETE CASCADE
);

-- Table des messages de support
CREATE TABLE IF NOT EXISTS messageSupport (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expediteurId INTEGER NOT NULL,
    sujet TEXT NOT NULL,
    contenu TEXT NOT NULL,
    statut TEXT DEFAULT 'Ouvert' CHECK(statut IN ('Ouvert', 'En cours', 'Résolu', 'Fermé')),
    dateEnvoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediteurId) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_progression_enseignant ON progression(enseignantId);
CREATE INDEX IF NOT EXISTS idx_progression_module ON progression(moduleId);
CREATE INDEX IF NOT EXISTS idx_contenu_module ON contenu(moduleId);
CREATE INDEX IF NOT EXISTS idx_question_quiz ON question(quizId);
CREATE INDEX IF NOT EXISTS idx_reponse_question ON reponse(questionId);
