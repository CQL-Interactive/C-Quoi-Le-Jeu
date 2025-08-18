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

    // Validation des paramètres hardcore
    if (settings.hardcore && (!settings.hardcoreTimeout || ![30, 60].includes(settings.hardcoreTimeout))) {
        res.status(400).json({
            message : "Le timeout hardcore doit être de 30 ou 60 secondes"
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

    // Initialiser les paramètres hardcore
    if (settings.hardcore) {
        req.session.user.play.hardcore = {
            enabled: true,
            timeout: settings.hardcoreTimeout,
            startTime: null,
            revealLevel: 0
        }
    }

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

    // Démarrer le timer hardcore si activé
    if (req.session.user.play.hardcore && req.session.user.play.hardcore.enabled) {
        req.session.user.play.hardcore.startTime = Date.now()
        req.session.user.play.hardcore.revealLevel = 0
    }

    res.sendFile(path.join(__dirname, '..', '..', 'static', 'games', `IMG_${img}.webp`))
})

// Nouvelle route pour obtenir le niveau de révélation hardcore
router.get('/hardcore-status', (req, res) => {
    if (!req.session.user || !req.session.user.play || !req.session.user.play.hardcore) {
        return res.json({ enabled: false })
    }

    const hardcore = req.session.user.play.hardcore
    if (!hardcore.enabled || !hardcore.startTime) {
        return res.json({ enabled: false })
    }

    const elapsed = (Date.now() - hardcore.startTime) / 1000
    const timeout = hardcore.timeout
    const remaining = Math.max(0, timeout - elapsed)

    // Calculer le niveau de révélation (0-4, 4 étant complètement révélé)
    let revealLevel = 0
    if (elapsed > timeout * 0.2) revealLevel = 1  // 20% du temps
    if (elapsed > timeout * 0.4) revealLevel = 2  // 40% du temps
    if (elapsed > timeout * 0.6) revealLevel = 3  // 60% du temps
    if (elapsed > timeout * 0.8) revealLevel = 4  // 80% du temps

    // Timeout atteint
    if (remaining <= 0) {
        // Passer automatiquement à la question suivante
        req.session.user.play.score -= 50
        req.session.user.play.current.question++

        return res.json({
            enabled: true,
            timeout: true,
            remaining: 0,
            revealLevel: 4,
            message: "Temps écoulé ! Vous perdez 50 pts"
        })
    }

    res.json({
        enabled: true,
        timeout: false,
        remaining: Math.ceil(remaining),
        revealLevel: revealLevel,
        totalTime: timeout
    })
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
            message: `${currentQuestion.name} est la bonne réponse.<br>Vous recevez 100 pts.`
        });

        return;
    } else {
        req.session.user.play.current.lives --
        req.session.user.play.current.question ++
        if (req.session.user.play.current.lives === 0) {
            const msg = `${jeux[req.session.user.play.ordre[req.session.user.play.current.question - 1] - 1].name} était la bonne réponse.<br>Vous perdez une vie.`
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
            message : `${jeux[req.session.user.play.ordre[req.session.user.play.current.question - 1] - 1].name} était la bonne réponse.<br>Vous perdez une vie.`
        })
        return;
    }
})

module.exports = router