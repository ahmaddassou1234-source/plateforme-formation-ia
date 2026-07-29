const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cle-secrete-education-nationale-2026';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: "Token d'authentification requis" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token invalide ou expiré' });
        }
        req.user = user;
        next();
    });
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentification requise' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Accès refusé - Privilèges insuffisants' });
        }
        next();
    };
};

module.exports = { authenticateToken, requireRole, JWT_SECRET };
