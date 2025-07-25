const router = require('express').Router()
const path = require('path')

router.use('/user', require(path.join(__dirname, 'api', 'user')))
router.use('/auth', require(path.join(__dirname, 'api', 'auth')))

module.exports = router