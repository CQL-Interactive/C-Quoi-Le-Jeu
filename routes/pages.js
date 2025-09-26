const router = require('express').Router()
const path = require('path')
const fs = require('fs')


module.exports = (requireAuth) => {

    router.use('/admin/', (req, res, next) => {
        if (req.session.user && req.session.user.isAdmin) {
            if (req.session.user.play) {
                res.redirect('/solo/game?notif=Panel admin interdit pendant une partie !')
                return;
            }
            next()
        } else {
            res.sendFile(path.join(process.cwd(), 'pages', 'error.html'))
            return;
        }
    })

    router.get('/contact', requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'contact.html'))
    })
    router.get('/histo', requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'my_games.html'))
    })
    router.get('/settings', requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'settings.html'))
    })
    router.get('/login', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'login.html'))
    })

    router.get('/register', (req, res) => {
        if (req.session.user) {
            res.redirect('/?notif=Vous êtes déjà connecté !%warn');
            return;
        }
        res.sendFile(path.join(__dirname, '..', 'pages', 'register.html'))
    })

    router.get('/privacy-notice-FR', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'politique.html'))
    })

    router.get('/games', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'list.html'))
    })

    router.get('/version', async (req, res) => {
        const config = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json')))
        const annonce = await JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'annonce.json')))
        res.json({
            version : config.version, 
            patch : annonce.patch
        })
    })

    router.get('/admin', requireAuth, (req, res) => {
        if(req.session.user.isAdmin) {
            res.sendFile(path.join(__dirname, '..', 'pages', 'admin', 'panel.html'))
        } else {
            res.send("Vous n'avez pas accès à cette page.")
        }
    })

    router.get('/solo/game', requireAuth, (req, res) => {
        if (!req.session.user.settings) {
            res.redirect('/')
            return;
        }
        res.sendFile(path.join(__dirname, '..', 'pages', 'play.html'))
    })

    router.get('/solo/game/stats', requireAuth, (req, res) => {
        if (!req.session.user.stats) {
            res.redirect('/?notif=Les statistiques de la dernière partie ne sont pas disponibles.')
            return;
        }
        res.sendFile(path.join(__dirname, '..', 'pages', 'stats.html'))
    })

    router.get('/admin/users', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'admin', 'users.html'))
    })

    router.get('/admin/games', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'admin', 'games.html'))
    })

    router.get('/admin/infos', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'admin', 'infos.html'))
    })

    router.get('/admin/games/:index', (req, res) => {
        const index = req.params.index;

        const indexImg = Number(index) + 1

        if (!indexImg) {
            res.sendFile(path.join(process.cwd(), 'pages', 'error.html'))
            return;
        }
        
        const jeux = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'games_list.json')))

        if (!jeux[index]) {
            res.sendFile(path.join(process.cwd(), 'pages', 'error.html'))
            return;
        }

        res.render('admin/game', { jeu : jeux[index], index : indexImg })
    })

    router.get('/admin/parties', requireAuth, (req, res) => {
        res.sendFile(path.join(process.cwd(), 'pages', 'admin', 'parties.html'))
    })

    // En cours de dev :
    router.get('/games/new', /*requireAuth,*/ (req, res) => {
        //res.sendFile(path.join(__dirname, '..', 'pages', 'newGame.html'))
        res.sendFile(path.join(__dirname, '..', 'pages', 'dev.html'))
    })

    return router
}
