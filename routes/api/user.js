const router = require('express').Router()
const path = require('path')
const fs = require('fs')

router.get('/', (req, res) => {
    res.json(req.session.user)
})

module.exports = router