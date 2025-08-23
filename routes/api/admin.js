const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('users.db')
const bcrypt = require('bcrypt')

router.use('/js', express.static(path.join(__dirname, '..', '..', 'static', 'admin', 'js')))

router.get('/css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'static', 'admin', 'style.css'))
})

router.get('/stats', (req, res) => {
    db.get(/*SQL*/ `SELECT COUNT(*) FROM users`, (err, result) => {
        if(err) {
            console.error(err)
            return res.json({
                msg : "Erreur serveur"
            })
        }

        res.json({
            data : {
                users : {
                    count : result["COUNT(*)"]
                },
                ok: true
            }
        })
    })
})

router.get('/users', (req, res) => {
    db.all(`SELECT * FROM users`, (err, players) => {
        if (err) {
            console.error(err)
            res.json({
                msg: "Erreur serveur."
            })
            return;
        }

        const PlayersList = players.map(player => {
            if (player.id === req.session.user.id) {
                return {
                    id : player.id,
                    username : player.username,
                    me : true
                }                
            }
            return {
                id : player.id,
                username : player.username 
            }
        })

        res.json({
            ok : true,
            data : PlayersList
        })
    })
})

module.exports = router