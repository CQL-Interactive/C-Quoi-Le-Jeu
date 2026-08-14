const router = require('express').Router()
const path = require('path')
const prisma = require(path.join(process.cwd(), 'db.js'))
const fs = require('fs')
const session = require('express-session')
const bcrypt = require('bcrypt')
const { marked } = require('marked')
const DOMPurify = require('isomorphic-dompurify')

router.get('/', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user)
    } else {
        res.status(401).json('Il faut être connecté')
    }
})

router.patch('/change/username', async (req, res) => {
    if(!req.session.user) {
        res.status(401).json({
            message : 'Il faut être connecté !'
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

    try {
        const existingUser = await prisma.users.findUnique({
            where: { username: trimmedUsername }
        });
        
        if (existingUser) {
            return res.status(409).json({
                ok: false,
                message: "Ce nom d'utilisateur est déjà utilisé"
            });
        }
        
        await prisma.users.update({
            where: { id: req.session.user.id },
            data: { username: trimmedUsername }
        });

        req.session.user.username = trimmedUsername

        res.status(200).json({
            ok : true,
            before: nameBefore
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message : "Erreur interne"
        })
    }
})

router.patch('/change/password', async (req,res) => {
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
    
    try {
        await prisma.users.update({
            where: { id: req.session.user.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({
            ok : true
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            message : "Erreur interne"
        })
    }
})

router.delete('/', async (req, res) => {
    if (!req.session.user || !req.body.password) {
        return res.status(401).json({ message: "Impossible de supprimer le compte pour le moment, rechargez la page et réessayez." })
    }

    const { password } = req.body

    try {
        const user = await prisma.users.findUnique({
            where: { id: req.session.user.id }
        });
        
        if (!user) {
            return res.status(401).json({ message: "Impossible de supprimer le compte pour le moment, rechargez la page et réessayez." });
        }
    
        const validPassword = bcrypt.compareSync(password, user.password);
    
        if (!validPassword) {
            return res.status(401).json({ message: "Mot de passe incorrect." });
        }
    
        await prisma.users.delete({
            where: { id: req.session.user.id }
        });

        req.session.destroy()

        res.status(200).json({ ok: true, message: "Suppression réussie. Vous allez être redirigé." });
    } catch (err) {
        return res.status(500).json({ message: "Erreur interne." });
    }
})

router.get('/games', async (req, res) => {
    try {
        const games = await prisma.games_history.findMany({
            where: { user_id: req.session.user.id },
            orderBy: { id: 'desc' }
        });
        
        // Serialize bigints to string/numbers so it can be sent via JSON
        const data = games.map(g => ({
            ...g,
            end_date: g.end_date ? Number(g.end_date) : null
        }));

        res.json({
            ok : true,
            data : data
        })
    } catch (err) {
        console.error(err)
        res.json({
            msg : "Erreur serveur",
            error : err
        })
    }
})

router.get('/patch', async (req, res) => {
    if (!req.session.user) {
        res.json(false)
        return;
    }
    if (req.session.user.patch === 1) {
        res.json(false)
    } else {
        try {
            const user = await prisma.users.findUnique({
                where: { id: req.session.user.id }
            });
            
            if (Number(user.patch) === 0) {
                await prisma.users.update({
                    where: { id: req.session.user.id },
                    data: { patch: 1 }
                });
                res.json(true)
            } else {
                res.json(false)
            }
        } catch (err) {
            console.log(err)
            res.json(false)
        }
    }
})

router.patch('/patch', async (req, res) => {
    if (!req.session.user) {
        res.json(false)
        return;
    }
    
    try {
        await prisma.users.update({
            where: { id: req.session.user.id },
            data: { patch: 1 }
        });
        
        req.session.user.patch = 1
        res.json({ ok: true })
    } catch (err) {
        console.error(err)
        res.json({ ok: false })
    }
})

router.patch('/bio', async (req, res) => {
    const { bio } = req.body;

    if (!req.session.user) {
        res.json({
            msg : "Connectez-vous"
        })
        return;
    }

    if (typeof bio !== 'string' || bio.trim() === '') {
        return res.status(400).json({
            msg: "La bio est manquante"
        });
    }

    const bioTrimmed = bio.trim();

    if (bioTrimmed.length > 140) {
        return res.status(400).json({
            msg: "La bio doit contenir maximum 140 caractères"
        });
    }

    try {
        await prisma.users.update({
            where: { id: req.session.user.id },
            data: { bio: bioTrimmed }
        });

        req.session.user.bio = bioTrimmed
        res.json({
            ok : true,
            msg:  "Bio modifiée"
        })
    } catch (err) {
        console.error(err);
        res.json({
            msg : "Erreur serveur"
        })
    }
})

router.post('/bio/markdown', (req, res) => {
    const { bio } = req.body;

    if (typeof bio !== 'string') {
        return res.status(400).json({
            html: ""
        });
    }

    try {
        const htmlContent = marked(bio);
        const cleanHTML = DOMPurify.sanitize(htmlContent);
        res.json({
            html: cleanHTML
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            html: bio
        });
    }
})

router.get('/notifs/', async (req, res) => {

    if (!req.session.user) {
        res.json({
            msg : "Connectez vous"
        })
        return;
    }

    const userId = req.session.user.id

    try {
        const data = await prisma.logs.findMany({
            where: { user_id: userId, public: true },
            orderBy: { id: 'desc' }
        });

        res.json({
            ok : true,
            data : data
        })
    } catch (err) {
        return res.status(500).json({ error: 'Erreur serveur.' })
    }
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
        const result = await prisma.logs.updateMany({
            where: { id: parseInt(notifId), user_id: userId },
            data: { public: false }
        });

        if (result.count === 0) {
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

    try {
        const aggr = await prisma.games_history.aggregate({
            where: { user_id: req.session.user.id },
            _count: { _all: true },
            _max: { score: true }
        });

        const playedGames = aggr._count._all
        const greatScore = aggr._max.score ?? 0

        res.json({
            ok : true,
            data : { playedGames, greatScore }
        })
    } catch (err) {
        res.json({ msg: "Erreur serveur" })
    }
})

module.exports = router