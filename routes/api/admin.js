const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const pool = require(path.join(process.cwd(), 'db.js'))
const bcrypt = require('bcrypt')
const logs = require(path.join(process.cwd(), 'utils', 'logs.js'))

router.use('/js', express.static(path.join(__dirname, '..', '..', 'static', 'admin', 'js')))

router.get('/css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'static', 'admin', 'style.css'))
})

router.use('/img/', express.static(path.join(process.cwd(), 'static', 'games')))

router.get('/stats', async (req, res) => {
 const usersResult = await pool.query("SELECT COUNT(*) FROM users");
    const usersCount = parseInt(usersResult.rows[0].count);

    const gamesListPath = path.join(__dirname, "..", "..", "games_list.json");
    const gamesList = JSON.parse(fs.readFileSync(gamesListPath));
    const gamesCount = gamesList.length;

    const historyResult = await pool.query("SELECT COUNT(*) FROM games_history");
    const historyCount = parseInt(historyResult.rows[0].count);

    res.json({
      data: {
        users: { count: usersCount },
        games: { count: gamesCount },
        party: { count: historyCount },
        ok: true
      }
    });
})

router.get('/users', (req, res) => {
    pool.query(`SELECT * FROM users`, (err, result) => {
        if (err) {
            console.error(err)
            res.json({
                msg: "Erreur serveur."
            })
            return;
        }

        const players = result.rows

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

router.get('/parties', async (req, res) => {
  const query = `
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
  `;

  try {

    const result = await pool.query(query);

    res.json({
      ok: true,
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.json({
      msg: "Erreur serveur."
    });
  }
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

router.post('/delete/user', (req, res) => {
    setTimeout(() => {
        const { id } = req.body

        if (!id) {
            return res.json({
                msg : "Camps manquants"
            })
        }

        if (id == req.session.user.id) {
            return res.json({
                msg : "Vous ne pouvez pas supprimer votre propre compte."
            })
        }
        pool.query(`DELETE FROM users WHERE id = $1`, [id], (err, result) => {
            if (err) {
                console.error(err)
                return res.json({
                    msg : "Erreur interne"
                })
            }

            res.json({
                ok : true
            })
        })
    }, 1500)
})

/*router.post('/notif', (req, res) => {
    const { id, infos } = req.body

    if (!id) {
        return res.json({
            msg : "Camps manquants"
        })
    }

    logs(infos)
})*/

module.exports = router