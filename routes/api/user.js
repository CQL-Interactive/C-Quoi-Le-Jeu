const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const session = require('express-session')

const admin = ["Test2"]

router.get('/', (req, res) => {
    if (admin.includes(req.session.user.username)) {
        req.session.user.admin = true
    }
    res.json(req.session.user)
})

module.exports = router