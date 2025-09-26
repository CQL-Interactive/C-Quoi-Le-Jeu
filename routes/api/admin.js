const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('users.db')
const bcrypt = require('bcrypt')
const { count } = require('console')

router.use('/js', express.static(path.join(__dirname, '..', '..', 'static', 'admin', 'js')))

router.get('/css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'static', 'admin', 'style.css'))
})

router.use('/img/', express.static(path.join(process.cwd(), 'static', 'games')))

router.get('/stats', (req, res) => {
    db.get(/*SQL*/ `SELECT COUNT(*) FROM users`, async (err, result) => {
        if(err) {
            console.error(err)
            return res.json({
                msg : "Erreur serveur"
            })
        }

        const gamesCount = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json'))).length
        db.get(/*SQL*/ `SELECT COUNT(*) FROM games_history`, async (err2, histoCount) => {
            if (err2) {
               console.error(err2)
               res.json({
                  msg: 'Erreur serveur'
               })
               return;
            }
            
            res.json({
                data : {
                    users : {
                        count : result["COUNT(*)"]
                    },
                    games : {
                        count : gamesCount
                    },
                    party : {
                        count : histoCount["COUNT(*)"]
                    },
                    ok: true
                }
            })
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

router.get('/parties', (req, res) => {
    const  query = `
        SELECT 
        games_history.id,
        users.username AS user,
        users.id AS user_id,
        games_history.score,
        games_history.end_date,
        games_history.end_lives,
        games_history.begin_lives,
        games_history.nbGames,
        games_history.played_at
        FROM games_history
        JOIN users ON games_history.user_id = users.id
        ORDER BY games_history.score DESC;
    `
    db.all(query, (err, games) => {
        if (err) {
            console.error(err)
            res.json({
                msg: "Erreur serveur."
            })
            return;
        }

        res.json({
            ok : true,
            data : games
        })
    })
})

router.post('/annonce', (req, res) => {
    const { patch, display } = req.body

    const chem = path.join(process.cwd(), 'annonce.json', );

    if (!patch) {
        res.json({
            msg: "Erreur serveur"
        })
        return;
    }

    if (display) {
        db.run(/*SQL */ `
            UPDATE users
            SET patch = 0;
        `, err => {
            if (err) {
               console.error(err)
               res.json({
                  msg: 'Erreur serveur'
               })
               return;
            }
        })
    }

    fs.readFile(chem, 'utf8', (err, data) => {
        if (err) {
            console.error(err)
            res.json({
                msg: "Erreur serveur"
            })
            return;
        }

        const json = JSON.parse(data);
        json.patch = patch; 

        fs.writeFile(chem, JSON.stringify(json, null, 2), 'utf8', (err) => {
            if (err) {
                console.error(err)
                res.json({
                    msg: "Erreur serveur"
                })
                return;
            }

            req.session.user.patch = true

            res.json({
                ok : true,
                msg: "Patch mit à jour !"
            })
        });
    });
    
})

module.exports = router