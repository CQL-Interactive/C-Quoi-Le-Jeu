console.log(`⚙️  Chargement...`)
const express = require('express')
const session = require('express-session')
const path = require('path')
const pg = require('pg')
const fs = require('fs')
const dotenv = require('dotenv')
const bcrypt = require('bcrypt')
const sqlite3 = require('sqlite3').verbose()
const http = require('http')

const app = express()
dotenv.config({ path: './config.env' })
const PORT = process.env.PORT
const HOST = process.env.HOST

// HTTP server wrapper (needed for Socket.IO)
const server = http.createServer(app)

app.use(session({
    secret : process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000 * 60 * 60, // 1h
        secure: false, // HTTPS ?
        httpOnly: true,
    }
}))

app.use(express.json())
app.use('/css/', express.static(path.join(__dirname, 'static', 'css')))
app.use('/img/', express.static(path.join(__dirname, 'static', 'images')))
app.use('/js/', express.static(path.join(__dirname, 'static', 'js')))
app.use('/videos/', express.static(path.join(__dirname, 'static', 'videos')))

function requireAuth(req, res, next) {
    if (req.session.user) {
        next()
    } else {
        const redirectPath = req.originalUrl
        res.redirect(`/login?redir=${encodeURIComponent(redirectPath)}`)
    }
}

app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || ''

    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(userAgent)

    if (isMobile) {
        return res.sendFile(path.join(__dirname, 'pages', 'mobile.html'))
    }

    next()
})

app.use('/', require(path.join(__dirname, 'routes', 'pages'))(requireAuth))
app.use('/api/', require(path.join(__dirname, 'routes', 'index')))

app.get('/', (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, 'pages', 'index.html'))
    } else {
        const redirectPath = req.originalUrl
        res.redirect(`/login?redir=${encodeURIComponent(redirectPath)}`)
    }
})

// Initialize Socket.IO if available
try {
    const { Server } = require('socket.io')
    const io = new Server(server)
    // Initialize multiplayer engine
    require(path.join(__dirname, 'routes', 'multiplayer', 'engine'))(io, app)
    console.log('🎮 Mode multijoueur initialisé (Socket.IO)')
} catch (e) {
    console.warn('ℹ️ Socket.IO non disponible. Le mode multijoueur est désactivé.')
}

server.listen(PORT, () => {
    console.log(`✅ Serveur en ligne sur : http://${HOST}:${PORT}`)
})
