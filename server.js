/*
    A faire :
    - Systeme login
*/
console.log(`⚙️  Chargement...`)
const express = require('express')
const session = require('express-session')
const path = require('path')
const pg = require('pg')
const fs = require('fs')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt')
const sqlite3 = require('sqlite3').verbose()


const app = express()
dotenv.config()
const PORT = process.env.PORT
const HOST = process.env.HOST
const db = new sqlite3.Database('users.db')


app.use(session({
    secret : process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1h
        secure: Boolean(process.env.SECURE), // HTTPS ?
        httpOnly: true,
    }
}))


function requireAuth(req, res, next) {
    if (req.session.user) {
        next()
    } else {
        const redirectPath = req.originalUrl
        res.redirect(`/login?redir=${encodeURIComponent(redirectPath)}`)
    }
}

app.use(express.json())
app.use('/css/', express.static(path.join(__dirname, 'static', 'css')))                 // Css
app.use('/img/', express.static(path.join(__dirname, 'static', 'images')))   // Img
app.use('/js/', express.static(path.join(__dirname, 'static', 'js')))                   // Js
app.use('/videos/', express.static(path.join(__dirname, 'static', 'videos')))           // Videos

app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || ''

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(userAgent)

    if (isMobile) {
        return res.sendFile(path.join(__dirname, 'pages', 'mobile.html'))
    }

    next()
})

app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'pages', 'index.html'))
    } else {
        const redirectPath = req.originalUrl
        res.redirect(`/login?redir=${encodeURIComponent(redirectPath)}`)
    }
})

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'register.html'))
})

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body

    db.all(`SELECT * FROM users WHERE username = ?`, [username], (err, rows) => {
        if (err) throw err
        if (rows.length > 0) {
            return res.json({
                ok : false,
                message : "Ce nom d'utilisateur est déjà utilisé"

            })
        }
    })

    db.run(
        `INSERT INTO users (username, password, registration_date) VALUES (?, ?, CURRENT_TIMESTAMP)`,
        [username, bcrypt.hashSync(password, bcrypt.genSaltSync())]
    );

    res.json({
        ok : true
    })
})

//app.get pour tester toute les pages plus facilement
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'contact.html'))
})
app.get('/histo', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'my_games.html'))
})
app.get('/settings', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'settings.html'))
})
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'login.html'))
})

app.get('/privacy-notice-FR', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'politique.html'))
})

app.get('/game-list', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'politique.html'))
})

app.get('/version', (req, res) => {
    const version = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'))).version

    res.json(version)
})

app.listen(PORT, () => {
    console.log(`✅ Serveur en ligne sur : http://${HOST}:${PORT}`)
})

