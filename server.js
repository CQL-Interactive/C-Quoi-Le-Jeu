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
const PORT = process.env.PORT
const HOST = process.env.HOST
dotenv.config()
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
    if (req.session.id) {
        next()
    } else {
        res.status(401).send('Non autorisé')
    }
}

app.use('/css/', express.static(path.join(__dirname, 'static', 'css')))                 // Css
app.use('/img/', requireAuth , express.static(path.join(__dirname, 'static', 'images')))   // Img
app.use('/js/', express.static(path.join(__dirname, 'static', 'js')))                   // Js
app.use('/videos/', express.static(path.join(__dirname, 'static', 'videos')))           // Videos


app.get('/', (req, res) => {
    if (req.session.userId) {
        res.sendFile(path.join(__dirname, 'pages', 'index.html'))
    } else {
        res.sendFile(path.join(__dirname, 'pages', 'login.html'))
    }
})

app.get('/api/register', (req, res) => {
    const { username, password } = req.body

    
})

// Serveur
app.listen(PORT, () => {
    console.log(`✅ Serveur en ligne sur : ${HOST}:${PORT}`)
})

