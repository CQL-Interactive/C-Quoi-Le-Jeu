const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const session = require('express-session')



router.get('/', (req, res) => {
    if (req.session.user) {
        res.json(req.session.user)
    } else {
        res.status(401).json('Il faut être connecté')
    }
})

module.exports = router