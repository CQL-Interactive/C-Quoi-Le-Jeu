const router = require('express').Router()
const path = require('path')

router.use('/user', require(path.join(__dirname, 'api', 'user')))
router.use('/auth', require(path.join(__dirname, 'api', 'auth')))
router.use('/games', require(path.join(__dirname, 'api', 'games')))
router.use('/game', require(path.join(__dirname, 'api', 'game')))

router.use('/admin/', (req, res, next) => {
    if (!req.session.user) {
        res.redirect('/')
        return;
    }
    if (req.session.user.isAdmin) {
        next()
    } else {
        res.json({
            msg : "Erreur serveur"
        })
    }
})

router.use('/admin', require(path.join(__dirname, 'api', 'admin')))

module.exports = router