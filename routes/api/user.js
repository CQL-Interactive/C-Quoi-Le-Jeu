const router = require('express').Router()
const path = require('path')
const pool = require(path.join(process.cwd(), 'db.js'))
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

    pool.query(`SELECT * FROM users WHERE username = $1`, [trimmedUsername], (err, existingUser) => {
        if (err) return res.status(500).json({ ok: false, message: "Erreur interne" });
        if (existingUser.rows[0]) {
            return res.status(409).json({
                ok: false,
                message: "Ce nom d'utilisateur est déjà utilisé"
            });
        }
        pool.query("UPDATE users SET username = $1 WHERE id = $2",[trimmedUsername, req.session.user.id], (err) => {
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
    pool.query("UPDATE users SET password = $1 WHERE id = $2",[hashedPassword, req.session.user.id], (err) => {
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

    pool.query(`SELECT * FROM users WHERE id = $1`, [req.session.user.id], (err, result) => {
        if (err) return res.status(500).json({ message: "Erreur interne." });
        const user = result.rows[0]
        if (!user) {
            return res.status(401).json({ message: "Impossible de supprimer le compte pour le moment, rechargez la page et réessayez." });
        }
    
        const validPassword = bcrypt.compareSync(password, user.password);
    
        if (!validPassword) {
            return res.status(401).json({ message: "Mot de passe incorrect." });
        }
    
        pool.query('DELETE FROM users WHERE id = $1', [req.session.user.id], (err) => {
            if (err) {
                 return res.status(500).json({ message: "Impossible de supprimer le compte pour le moment, rechargez la page et réessayez." });
            }

            req.session.destroy()

            res.status(200).json({ ok: true, message: "Supréssion réussie réussie. Vous allez être redirigé." });
        })
    });
})

router.get('/games', (req, res) => {
    pool.query('SELECT * FROM games_history WHERE user_id = $1 ORDER BY id DESC', [req.session.user.id], (err, games) => {
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
            data : games.rows
        })
    })
})

router.get('/patch', (req, res) => {
    if (!req.session.user) {
        res.json(false)
        return;
    }
    if (req.session.user.patch === 1) {
        res.json(false)
    } else {
        db.get(/* SQL */ `SELECT * FROM users WHERE id = $1`, [req.session.user.id], (err, result) => {
            if (err) {
                console.log(err)
                res.json(false)
                return;
            }

            const user = result.rows[0]
            
            if (Number(user.patch) === 0) {
                db.run(/* SQL */`UPDATE users SET patch=1 WHERE "id"=$1`, [req.session.user.id], (err) => {
                    if (err) {
                        console.error(err)
                        res.json(true)
                    } else {
                        res.json(true)
                    }
                })
                return;
            } else {
                res.json(false)
            }
        })
    }
})

router.patch('/patch', (req, res) => {
    if (!req.session.user) {
        res.json(false)
        return;
    }
})

router.patch('/bio', (req, res) => {
    const { bio } = req.body;

    if (!req.session.user) {
        res.json({
            msg : "Connectez vous"
        })
        return;
    }

    pool.query(`UPDATE users SET bio = $1 WHERE id=$2`, [bio, req.session.user.id], (err) => {
        if (err) {
            console.error(err);
            res.json({
                msg : "Erreur serveur"
            })
            return;
        }

        req.session.user.bio = bio
        setTimeout(() => {
            res.json({
                ok : true,
                msg:  "Bio modifiée"
            })
        }, 1000)

    })
})

router.get('/notifs/', (req, res) => {

    if (!req.session.user) {
        res.json({
            msg : "Connectez vous"
        })
        return;
    }

    const userId = req.session.user.id

    pool.query(
        `SELECT * FROM logs WHERE user_id = $1 AND public = TRUE ORDER BY id DESC`,
        [userId],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Erreur serveur.' })
            res.json({
                ok : true,
                data : result.rows
            })
        }
    )
})

router.patch('/notif/:notifId', async (req, res) => {
    if (!req.session.user) {
        res.json({
            msg : "Connectez vous"
        })
        return;
    }
    const notifId = req.params.notifId
    const userId = req.session.user.id

    try {
        const result = await pool.query(`
                UPDATE logs 
            SET public = $3 
            WHERE id = $1 AND user_id = $2 
            RETURNING *`,
            [notifId, userId, false]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ ok: false, message: "Notification introuvable." })
        }

        res.json({ ok: true, message: "Notification supprimée." })
    } catch (err) {
        console.error(err)
        res.status(500).json({ ok: false, message: "Erreur serveur." })
    }
})

router.get('/stats', async (req, res) => {
    if (!req.session.user) {
        res.json({
            msg : "Connectez vous"
        })
        return;
    }

    const result = await pool.query(`
        SELECT 
            COUNT(*) AS total_games,
            MAX(score) AS best_score
        FROM games_history
        WHERE user_id = $1
    `, [req.session.user.id])

    const playedGames = result.rows[0].total_games
    const greatScore = result.rows[0].best_score ?? 0

    res.json({
        ok : true,
        data : { playedGames, greatScore }
    })
})

/*router.post('/pins', async (req, res) => {
    if (!req.session.user) {
        return res.json({ msg: "Connectez-vous" });
    }

    const { pinId } = req.body;
    if (!pinId) {
        return res.json({ msg: "Champs manquants" });
    }

    try {
        await pool.query(`
            UPDATE users
            SET pins = 
                CASE
                    WHEN $2 = ANY(pins) THEN pins
                    ELSE array_append(pins, $2)
                END
            WHERE id = $1
        `, [req.session.user.id, pinId]);

        res.json({ msg: "Pin ajouté" });
    } catch (err) {
        console.error(err);
        res.json({ msg: "Erreur serveur" });
    }
});

router.get('/pins', (req, res) => {
    if (!req.session.user) {
        return res.json({ msg: "Connectez-vous" });
    }

    pool.query(`SELECT pins FROM users WHERE id = $1`, [req.session.user.id], (err, result) => {
        if (err) {
            console.log(err)
            return;
        }


    })
})*/

module.exports = router