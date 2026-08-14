const router = require('express').Router()
const path = require('path')
const fs = require('fs');
const prisma = require(path.join(process.cwd(), 'db.js'))
const { ok } = require('assert');
function ordone(n) {
  const liste = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[liste[i], liste[j]] = [liste[j], liste[i]]
  }
  return liste
}

router.post('/settings', async (req, res) => {
    if (!req.session.user) return;

    const settings = req.body
    /*
    {
        nbGames : ..,
        lives : ..,
    }
    */


    if (!settings || !settings.nbGames || !settings.lives ) {
        res.status(400).json({
            message : "Données manquentes"
        })
        return;
    }

    if (typeof settings.nbGames != 'number' || typeof settings.lives != 'number') {
        res.status(400).json({
            message : "Il faut des valeurs numériques"
        })
        return;
    }

    if (settings.nbGames <= 0) {
        res.status(400).json({
            message : "Le nombre de jeux doit être positif"
        })
        return;
    }

    if (settings.lives <= 0) {
        res.status(400).json({
            message : "Le nombre de vies doit être positif"
        })
        return;
    }

    const jeux = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))

    if (settings.nbGames > jeux.length) {
        res.status(400).json({
            message : `Il ne peut pas y avoir plus de ${jeux.length} jeux dans une partie.`
        })

        return;
    }

    if (settings.lives > 10) {
        res.status(400).json({
            message : `Vous ne pouvez pas avoir plus de 10 vies`
        })
        return;
    }

    if (settings.lives > settings.nbGames) {
        res.status(400).json({
            message : `Vous ne pouvez pas avoir plus de vie que de questions.`
        })
        return;
    }

    req.session.user.settings = settings
    if (!req.session.user.play) req.session.user.play = {}
    if (!req.session.user.play.current) req.session.user.play.current = {}
    req.session.user.play.score = 0
    req.session.user.play.current.question = 1
    req.session.user.play.current.lives = settings.lives
    req.session.user.stats = [{
        settings,
        dateDebut : Date.now()
    }]
    req.session.user.stats[0].fin = {}

    req.session.user.play.ordre = ordone(jeux.length)

    res.status(200).json({
        ok : true
    })
})

router.get('/current', (req, res) => {
    if (!req.session.user || !req.session.user.play || !req.session.user.play.current) {
        res.json({
            continue : false
        })
        return;
    }
    res.json({
        continue : true,
        question : req.session.user.play.current.question,
        score  : req.session.user.play.score,
        lives : req.session.user.play.current.lives
    })
})

router.get('/settings', (req, res) => {
    if (!req.session.user) return;

    if (!req.session.user.settings) {
        res.status(400).json({
            message : "Données manquantes"
        })
        return;
    }

    res.status(200).json({
        ok : true,
        data : req.session.user.settings,
    })
})

router.get('/loadImgs', async (req, res) => {
    if (!req.session.user || !req.session.user.play) return;
    /*if(req.session.user.play.current.question >= req.session.user.settings.nbGames) {
        return;
    }
    const jeux = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))*/
    const img = req.session.user.play.ordre[req.session.user.play.current.question - 1]
    res.sendFile(path.join(__dirname, '..', '..', 'static', 'games', `IMG_${img}.webp`))
})

router.get('/fin', (req, res) => {
    if (!req.session.user) return;
    if (!req.session.user.play || !req.session.user.settings) {
        return;
    }
    delete req.session.user.play
    delete req.session.user.settings
    delete req.session.user.stats

    res.redirect('/')
})

router.get('/searchGames', async (req, res) => {
    if (!req.query.query) return;
    const listeJeux = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))
    const query = req.query.query.toLowerCase();

    const resultatsNom = listeJeux.filter(jeu =>
        jeu.name.toLowerCase().includes(query)
    );

    if (resultatsNom.length > 0) {
        res.json(resultatsNom)
        return;
    }

    const resultatsAnswers = listeJeux.filter(jeu =>
        jeu.answers.some(ans => ans.toLowerCase().includes(query))
    );

    res.json(resultatsAnswers)
})

/*
    -- req.session.user.play.current.stats --
    req.session.user.stats[num] = Stat d'une question
    
    ex : [
        {
            jeuxIndex : 1,
            win : true or false,
            rep : [reponse]
        }
    ]

    req.session.user.stats[0] = {
        heure de la partie: 
        paramètres : 
        utilisateur : 
    } 
*/ 

function saveGame(req, stats) {
    // Check if stats is valid and not already saved
    if (!stats || !stats[0]) {
        return Promise.reject("Stats invalides")
    }

    // Prevent duplicate saves by checking a flag on the request object
    if (req.gameSaved) {
        return Promise.reject("Partie déjà sauvegardée")
    }

    const infos = stats[0]

    // Vérifier que les données obligatoires sont présentes
    if (!infos.fin || typeof infos.fin.score !== 'number' || typeof infos.fin.vie !== 'number') {
        console.error('Données invalides pour la sauvegarde:', infos)
        return Promise.reject("Données invalides")
    }

    // Marquer comme sauvegardé pour éviter les doublons
    req.gameSaved = true

    return prisma.games_history.create({
        data: {
            user_id: req.session.user.id,
            score: infos.fin.score,
            end_date: BigInt(infos.fin.date),
            end_lives: infos.fin.vie,
            begin_lives: infos.settings.lives,
            nbgames: infos.settings.nbGames
        }
    }).catch(err => {
        console.error('Erreur lors de la sauvegarde de la partie:', err);
        throw err;
    });
}

router.post('/verif', async (req, res) => {
    const { rep, pass } = req.body;

    if (!req.session.user)  {
        res.json({
            ok : false,
            deco : true,
            message : "Vous avez été déconnecté."
        })
        return;
    } 

    if (!req.session.user.play)  {
        res.json({
            ok : false,
            deco : true,
            message : "Vous avez été déconnecté."
        })
        return;
    } 

    if (pass) {
        req.session.user.play.score = req.session.user.play.score - 50
        req.session.user.play.current.question ++
        res.json({
            ok : true,
            succes : true,
            message : "Vous avez passé la question ! Vous perdez 50 pts."
        })
        return;
    }

    if (!rep) return;

    const jeux = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))
    const currentQuestionIndex = req.session.user.play.ordre[req.session.user.play.current.question - 1 ] - 1;
    const currentQuestion = jeux[currentQuestionIndex];

    if(req.session.user.play.current.question >= req.session.user.settings.nbGames) {
        if (currentQuestion.answers.some(ans => ans.toLowerCase() === rep.toLowerCase())) {
            req.session.user.play.score += 100;
            req.session.user.play.current.question ++;

            req.session.user.stats.push({
                jeu : {
                    name : jeux[currentQuestionIndex].name,
                    link : jeux[currentQuestionIndex].link
                },
                win : true,
                rep : rep
            })
        } else {
            req.session.user.play.current.lives --
            req.session.user.play.current.question ++
            req.session.user.stats.push({
                jeu : {
                    name : jeux[currentQuestionIndex].name,
                    link : jeux[currentQuestionIndex].link
                },
                win : false,
                rep : rep
            })
        }
        req.session.user.stats[0].fin.score = req.session.user.play.score
        req.session.user.stats[0].fin.vie = req.session.user.play.current.lives
        req.session.user.stats[0].fin.date = Date.now()
        req.session.user.stats[0].fin.win = true
        delete req.session.user.play
        delete req.session.user.settings
        try {
            await saveGame(req, req.session.user.stats)
        } catch (err) {
            console.error('Erreur lors de la sauvegarde:', err)
        }
        res.json({
            ok : true,
            win : false,
            perdu : true,
            message : "Fin de la partie. Vous avez perdu ! ",
            stats : req.session.user.stats
        })
        return;
    }

    if (currentQuestion.answers.some(ans => ans.toLowerCase() === rep.toLowerCase())) {
        req.session.user.play.score += 100;
        req.session.user.play.current.question++;

        req.session.user.stats.push({
            jeu : {
                name : jeux[currentQuestionIndex].name,
                link : jeux[currentQuestionIndex].link
            },
            win : true,
            rep : rep
        })

        res.json({
            ok: true,
            succes: true,
            message: `${currentQuestion.name} est la bonne réponse.<br>Vous recevez 100 pts.`
        });

        return;
    } else {
        req.session.user.play.current.lives --
        const correctAnswer = jeux[currentQuestionIndex].name;
        req.session.user.stats.push({
            jeu : {
                name : jeux[currentQuestionIndex].name,
                link : jeux[currentQuestionIndex].link
            },
            win : false,
            rep : rep
        })
        if (req.session.user.play.current.lives === 0) {
            req.session.user.stats[0].fin.score = req.session.user.play.score
            const msg = `${correctAnswer} était la bonne réponse.<br>Vous perdez une vie.`
            delete req.session.user.play
            delete req.session.user.settings
            req.session.user.stats[0].fin.vie = 0,
            req.session.user.stats[0].fin.date = Date.now()
            try {
                await saveGame(req, req.session.user.stats)
            } catch (err) {
                console.error('Erreur lors de la sauvegarde:', err)
            }
            res.json({
                ok : true,
                message : msg,
                perdu : true,
                notif : "Fin de la partie. Vous avez perdu.",
                stats : req.session.user.stats
            })
            return;
        }
        req.session.user.play.current.question ++
        res.json({
            ok : true,
            message : `${correctAnswer} était la bonne réponse.<br>Vous perdez une vie.`
        })
        return;
    }
})

router.get('/stats', (req, res) => {
    if (!req.session.user) return;
    if (!req.session.user.stats) {
        res.json({
            ok : false,
            message : "Les statistiques de la dernière partie ont été supprimées."
        })
        return;
    }

    if (!req.session.user.stats) {
        res.json({
            ok : false,
            message : "Les statistiques de la dernière partie ont été supprimées."
        })
        return;
    }

    if (req.session.user.play) {
        res.json({
            part : true,
            message : "Les statistiques ne sont pas disponibles pendant une partie."
        })
        return;
    }

    const stats = req.session.user.stats
    
    res.json({
        ok : true,
        data : stats
    })
})

router.delete('/stats', (req, res) => {
    if (!req.session.user) return;
    if (!req.session.user.stats) {
        res.json({
            message : "Les statistiques ont déjà été supprimées."
        })
        return;
    }

    if (req.session.user.play) {
        res.json({
            part : true,
            message : "Vous ne pouvez pas supprimer les stats pendant une partie"
        })
        return;
    }

    delete req.session.user.stats;

    res.json({
        ok : true,
        message : "Statistiques supprimées avec succès."
    })

})

module.exports = router