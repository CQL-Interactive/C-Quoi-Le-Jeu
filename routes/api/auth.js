const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('users.db')
const bcrypt = require('bcrypt')

router.post('/register', (req, res) => {
    const { username, password } = req.body;
    const erreurs = [];

    if (typeof username !== 'string' || username.trim() === '') {
        erreurs.push("Le nom d'utilisateur est obligatoire.");
    }
    if (typeof password !== 'string') {
        erreurs.push("Le mot de passe est obligatoire.");
    }
    if (erreurs.length > 0) {
        return res.status(400).json({ message: erreurs.join('<br>') });
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
        erreurs.push("Le nom d'utilisateur doit contenir entre 3 et 20 caractères.");
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedUsername)) {
        erreurs.push("Le nom d'utilisateur doit commencer par une lettre et ne contenir que des lettres, chiffres ou underscores (_).");
    }
    if (password.length < 8) erreurs.push("Le mot de passe doit contenir au moins 8 caractères.");
    if (!/[A-Z]/.test(password)) erreurs.push("Il faut au moins une majuscule.");
    if (!/[a-z]/.test(password)) erreurs.push("Il faut au moins une minuscule.");
    if (!/[0-9]/.test(password)) erreurs.push("Il faut au moins un chiffre.");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) erreurs.push("Il faut au moins un caractère spécial.");
    if (/\s/.test(password)) erreurs.push("Les espaces ne sont pas autorisés.");

    if (erreurs.length > 0) {
        return res.status(400).json({ message: erreurs.join('<br>') });
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [trimmedUsername], (err, existingUser) => {
        if (err) return res.status(500).json({ ok: false, message: "Erreur interne" });
        if (existingUser) {
            return res.status(409).json({
                ok: false,
                message: "Ce nom d'utilisateur est déjà utilisé"
            });
        }

        const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync());
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`,
            [trimmedUsername, hashedPassword],
            function (insertErr) {
                if (insertErr) return res.status(500).json({ ok: false, message: "Erreur lors de l'inscription." });


                db.get(`SELECT * FROM users WHERE id = ?`, [this.lastID], (selectErr, user) => {
                    if (selectErr) return res.status(500).json({ ok: false, message: "Erreur lors de la récupération des données." });


                    req.session.user = {
                        id: user.id,
                        username: user.username,
                    };

                    req.session.save(() => {
                        res.status(200).json({
                            ok: true,
                            message: "Inscription réussie.",
                            user: req.session.user
                        });
                    });
                });
            });
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy()

    res.redirect('/login?notif=Déconnexection réussie%info')
})

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ message: "Nom d'utilisateur et mot de passe requis." });
    }

    const trimmedUsername = username.trim();

    db.get(`SELECT * FROM users WHERE username = ?`, [trimmedUsername], (err, user) => {
        if (err) return res.status(500).json({ message: "Erreur interne." });
        if (!user) {
            return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
        }

        const validPassword = bcrypt.compareSync(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ message: "Nom d'utilisateur ou mot de passe incorrect." });
        }

        req.session.user = {
            id : user.id,
            username : user.username
        }

        res.status(200).json({ ok: true, message: "Connexion réussie." });
    });
})

module.exports = router