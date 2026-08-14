const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const prisma = require(path.join(process.cwd(), 'db.js'))
const bcrypt = require('bcrypt')
const logs = require(path.join(process.cwd(), 'utils', 'logs.js'))

router.use('/js', express.static(path.join(__dirname, '..', '..', 'static', 'admin', 'js')))

router.get('/css', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'static', 'admin', 'style.css'))
})

router.use('/img/', express.static(path.join(process.cwd(), 'static', 'games')))

router.get('/stats', async (req, res) => {
    const usersCount = await prisma.users.count();

    const gamesListPath = path.join(__dirname, "..", "..", "games_list.json");
    const gamesList = JSON.parse(fs.readFileSync(gamesListPath));
    const gamesCount = gamesList.length;

    const historyCount = await prisma.games_history.count();

    res.json({
      data: {
        users: { count: usersCount },
        games: { count: gamesCount },
        party: { count: historyCount },
        ok: true
      }
    });
})

router.get('/users', async (req, res) => {
    try {
        const players = await prisma.users.findMany();

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
    } catch (err) {
        console.error(err)
        res.json({
            msg: "Erreur serveur."
        })
    }
})

router.get('/parties', async (req, res) => {
  try {
    const history = await prisma.games_history.findMany({
      include: {
        user: {
          select: { username: true, id: true }
        }
      },
      orderBy: { score: 'desc' }
    });

    const formattedData = history.map(h => ({
      id: h.id,
      user: h.user ? h.user.username : null,
      user_id: h.user_id,
      score: h.score,
      end_date: h.end_date ? Number(h.end_date) : null,
      end_lives: h.end_lives,
      begin_lives: h.begin_lives,
      nbGames: h.nbgames,
      played_at: h.played_at
    }));

    res.json({
      ok: true,
      data: formattedData
    });

  } catch (err) {
    console.error(err);
    res.json({
      msg: "Erreur serveur."
    });
  }
})

router.post('/annonce', async (req, res) => {
    const { patch, display } = req.body

    const chem = path.join(process.cwd(), 'annonce.json');

    if (!patch) {
        res.json({
            msg: "Erreur serveur"
        })
        return;
    }

    if (display) {
        try {
            await prisma.users.updateMany({
                data: { patch: 0 }
            });
        } catch (err) {
            console.error(err);
            res.json({
                msg: 'Erreur serveur'
            });
            return;
        }
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

            req.session.user.patch = 1
            req.session.save((err) => {
                if (err) {
                    console.error(err)
                }
                res.json({
                    ok : true,
                    msg: "Patch mit à jour !"
                })
            })
        });
    });
    
})

router.post('/delete/user', (req, res) => {
    setTimeout(async () => {
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
        
        try {
            await prisma.users.delete({ where: { id: parseInt(id) } });
            res.json({ ok : true });
        } catch (err) {
            console.error(err)
            return res.json({ msg : "Erreur interne" })
        }
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