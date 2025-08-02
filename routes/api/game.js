const router = require('express').Router()
const path = require('path')
const fs = require('fs')
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

    const jeux = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))

    if (settings.nbGames > jeux.length) {
        res.status(400).json({
            message : `Il ne peut pas y avoir plus de ${jeux.length} jeux dans une partie`
        })

        return;
    }

    if (settings.lives > 10) {
        res.status(400).json({
            message : `Vous ne pouvez pas aavoir plus de 10 vies`
        })
        return;
    }

    req.session.user.settings = settings
    if (!req.session.user.play) req.session.user.play = {}
    if (!req.session.user.play.current) req.session.user.play.current = {}
    req.session.user.play.score = 0
    req.session.user.play.current.question = 1
    req.session.user.play.current.lives = settings.lives

    req.session.user.play.ordre = ordone(jeux.length)

    res.status(200).json({
        ok : true
    })
})

router.get('/current', (req, res) => {
    if (!req.session.user) return;
    if (!req.session.user.play || !req.session.user.play.current) {
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
            message : "Données manquentes"
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
    if(req.session.user.play.current.question > req.session.user.settings.nbGames) {
        return;
    }
    const jeux = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))
    const img = req.session.user.play.ordre[req.session.user.play.current.question]
    res.sendFile(path.join(__dirname, '..', '..', 'static', 'games', `IMG_${img}.webp`))
})

router.get('/fin', (req, res) => {
    if (!req.session.user) return;
    if (!req.session.user.play || !req.session.user.settings) {
        return;
    }
    delete req.session.user.play
    delete req.session.user.settings

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

router.post('/verif', async (req, res) => {
    const { rep, pass } = req.body;

    if (!rep) return;

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

    if(req.session.user.play.current.question >= req.session.user.settings.nbGames) {
        delete req.session.user.play
        delete req.session.user.settings
        res.json({
            ok : true,
            win : true,
            message : "Fin de la partie."
        })
        return;
    }

    if (pass) {
        req.session.user.play.score = req.session.user.play.score - 50
        req.session.user.play.current.question ++
        res.json({
            ok : true,
            succes : true,
            message : "Vous avez passez la question ! Vous perdez 50 pts"
        })
    }

    const jeux = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))

    const currentQuestionIndex = req.session.user.play.ordre[req.session.user.play.current.question] - 1;
    const currentQuestion = jeux[currentQuestionIndex];

    if (currentQuestion.answers.some(ans => ans.toLowerCase() === rep.toLowerCase())) {
        req.session.user.play.score += 100;
        req.session.user.play.current.question++;

        res.json({
            ok: true,
            succes: true,
            message: `${currentQuestion.answers[0]} est la bonne réponse.<br>Vous recevez 100 pts.`
        });

        return;
    } else {
        req.session.user.play.current.lives --
        req.session.user.play.current.question ++
        if (req.session.user.play.current.lives === 0) {
            const msg = `${jeux[req.session.user.play.ordre[req.session.user.play.current.question - 1] - 1].answers[0]} était la bonne réponse.<br>Vous perdez une vie.`
            delete req.session.user.play
            delete req.session.user.settings
            res.json({
                ok : true,
                message : msg,
                notif : "Fin de la partie. Vous avez perdu.",
                perdu : true
            })
            return;
        }
        res.json({
            ok : true,
            message : `${jeux[req.session.user.play.ordre[req.session.user.play.current.question - 1] - 1].answers[0]} était la bonne réponse.<br>Vous perdez une vie.`
        })
        return;
    }
})

module.exports = router