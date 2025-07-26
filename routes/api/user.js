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

    await db.run("UPDATE users SET username = ? WHERE id = ?",[trimmedUsername, req.session.user.id], (err) => {
        if (err) {
            console.log(err)
            res.status(500).json({
                message : "Erreur interne"
            })
        }
    })
    req.session.user.username = trimmedUsername

    res.status(200).json({
        ok : true,
        before: nameBefore
    })
})

module.exports = router