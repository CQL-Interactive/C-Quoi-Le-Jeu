const router = require('express').Router()
const path = require('path')
const fs = require('fs')

router.get('/', (req, res) => {
    const jeux = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))

    res.json(jeux)
})

module.exports = router