const router = require('express').Router()
const path = require('path')
const fs = require('fs')


module.exports = (requireAuth) => {
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
        if (req.session.user) {
            res.redirect('/?notif=Vous ête déjà connecté !%warn');
            return;
        }
        res.sendFile(path.join(__dirname, '..', 'pages', 'login.html'))
    })

    router.get('/register', (req, res) => {
        if (req.session.user) {
            res.redirect('/?notif=Vous ête déjà connecté !%warn');
            return;
        }
        res.sendFile(path.join(__dirname, '..', 'pages', 'register.html'))
    })

    router.get('/privacy-notice-FR', requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'politique.html'))
    })

    router.get('/game-list', requireAuth, (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'pages', 'politique.html'))
    })

    router.get('/version', (req, res) => {
        const version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config.json'))).version
        res.json(version)
    })

    return router
}
