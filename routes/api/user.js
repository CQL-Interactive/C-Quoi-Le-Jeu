const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const session = require('express-session')
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('users.db')
const bcrypt = require('bcrypt')



router.get('/', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user)
    } else {
        res.status(401).json('Il faut être connecté')
    }
})

router.patch('/change/username',async (req, res) => {
    if(!req.session.user) {
        res.status(401).json({
            message : 'Il faut êtes déconnecté !'
    })
        return;
    }
    const { username } = req.body

    const nameBefore = req.session.user.username

    const erreurs = []

    if (typeof username !== 'string' || username.trim() === '') {
        erreurs.push("Le nom d'utilisateur est manquant !");
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
        erreurs.push("Le nom d'utilisateur doit contenir entre 3 et 20 caractères.");
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmedUsername)) {
        erreurs.push("Le nom d'utilisateur doit commencer par une lettre et ne contenir que des lettres, chiffres ou underscores (_).");
    }

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
        db.run("UPDATE users SET username = ? WHERE id = ?",[trimmedUsername, req.session.user.id], (err) => {
            if (err) {
                console.log(err)
                res.status(500).json({
                    message : "Erreur interne"
                })
                return;
            }

            req.session.user.username = trimmedUsername

            res.status(200).json({
                ok : true,
                before: nameBefore
            })
        })
    })
})

router.patch('/change/password', (req,res) => {
    const { password } = req.body

    const erreurs = [];

    if (password.length < 8) erreurs.push("Le mot de passe doit contenir au moins 8 caractères.");
    if (!/[A-Z]/.test(password)) erreurs.push("Il faut au moins une majuscule.");
    if (!/[a-z]/.test(password)) erreurs.push("Il faut au moins une minuscule.");
    if (!/[0-9]/.test(password)) erreurs.push("Il faut au moins un chiffre.");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) erreurs.push("Il faut au moins un caractère spécial.");
    if (/\s/.test(password)) erreurs.push("Les espaces ne sont pas autorisés.");

    if (erreurs.length > 0) {
        return res.status(400).json({ message: erreurs.join('<br>') });
    }

    const hashedPassword = bcrypt.hashSync(password, bcrypt.genSaltSync());
    db.run("UPDATE users SET password = ? WHERE id = ?",[hashedPassword, req.session.user.id], (err) => {
            if (err) {
                console.log(err)
                res.status(500).json({
                    message : "Erreur interne"
                })
                return;
            }

            res.status(200).json({
                ok : true
            })
        })

})

router.delete('/', (req, res) => {
    if (!req.session.user || !req.body.password) {
        return res.status(401).json({ message: "Impossible de supprimer le compte pour le moment, rechargez la page et réessayez." })
    }

    const { password } = req.body

    db.get(`SELECT * FROM users WHERE id = ?`, [req.session.user.id], (err, user) => {
        if (err) return res.status(500).json({ message: "Erreur interne." });
        if (!user) {
            return res.status(401).json({ message: "Impossible de supprimer le compte pour le moment, rechargez la page et réessayez." });
        }
    
        const validPassword = bcrypt.compareSync(password, user.password);
    
        if (!validPassword) {
            return res.status(401).json({ message: "Mot de passe incorrect." });
        }
    
        db.run('DELETE FROM users WHERE id = ?', [req.session.user.id], (err) => {
            if (err) {
                 return res.status(500).json({ message: "Impossible de supprimer le compte pour le moment, rechargez la page et réessayez." });
            }
        })

        req.session.destroy()
    
        res.status(200).json({ ok: true, message: "Supréssion réussie réussie. Vous allez être redirigé." });
    });
})

router.get('/games', (req, res) => {
    db.all('SELECT * FROM games_history WHERE user_id = ? ORDER BY id DESC', [req.session.user.id], (err, games) => {
        if (err) {
            console.error(err)
            res.json({
                msg : "Erreur serveur",
                error : err
            })
            return;
        }

        res.json({
            ok : true,
            data : games
        })
    })
})

module.exports = router