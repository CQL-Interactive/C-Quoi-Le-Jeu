const path = require('path')
const fs = require('fs')

// In-memory state for rooms
const rooms = new Map()

function ordone(n) {
  const liste = Array.from({ length: n }, (_, i) => i + 1)
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[liste[i], liste[j]] = [liste[j], liste[i]]
  }
  return liste
}

function makeRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

function publicRoomsSnapshot() {
  return Array.from(rooms.values())
    .filter(r => r.public && !r.started)
    .map(r => ({ code: r.code, players: r.players.size, maxPlayers: r.maxPlayers, nbRounds: r.nbRounds, timePerRound: r.timePerRound, hardcore: r.hardcore }))
}

module.exports = (io, app) => {
  // Static HTTP route to serve current image for a room
  app.get('/multi/img/:code', async (req, res) => {
    const code = req.params.code.toUpperCase()
    const room = rooms.get(code)
    if (!room) return res.status(404).end()
    const { ordre, roundIndex } = room
    const imgId = ordre[roundIndex]
    if (!imgId) return res.status(404).end()
    res.sendFile(path.join(__dirname, '..', '..', 'static', 'games', `IMG_${imgId}.webp`))
  })

  // Helpers for round timing
  function clearRoundTimers(room) {
    if (!room) return
    if (room.tick) { clearInterval(room.tick); room.tick = null }
    if (room.roundTimeout) { clearTimeout(room.roundTimeout); room.roundTimeout = null }
    room.endAt = null
  }

  function startRound(code) {
    const room = rooms.get(code)
    if (!room) return
    clearRoundTimers(room)
    if (room.roundIndex > room.nbRounds) {
      const ranking = serializeScores(room)
      io.to(code).emit('multi:gameover', { ranking })
      return
    }
    const total = room.timePerRound
    room.endAt = Date.now() + total * 1000

    // Initialiser le mode hardcore pour cette manche
    if (room.hardcore) {
      room.hardcoreStartTime = Date.now()
      room.hardcoreRevealLevel = 0
    }

    io.to(code).emit('multi:round', { round: room.roundIndex, total, hardcore: room.hardcore })
    io.to(code).emit('multi:update', serializeRoom(code))

    // Tick every second
    room.tick = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((room.endAt - Date.now()) / 1000))

      // Calculer le niveau de révélation hardcore
      let hardcoreRevealLevel = 0
      if (room.hardcore && room.hardcoreStartTime) {
        const elapsed = (Date.now() - room.hardcoreStartTime) / 1000
        if (elapsed > total * 0.2) hardcoreRevealLevel = 1
        if (elapsed > total * 0.4) hardcoreRevealLevel = 2
        if (elapsed > total * 0.6) hardcoreRevealLevel = 3
        if (elapsed > total * 0.8) hardcoreRevealLevel = 4
        room.hardcoreRevealLevel = hardcoreRevealLevel
      }

      io.to(code).emit('multi:tick', { remaining, total, hardcoreRevealLevel })
    }, 1000)

    // Expire round
    room.roundTimeout = setTimeout(() => {
      try {
        const games = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))
        const currentIdx = room.ordre[room.roundIndex] - 1
        const current = games[currentIdx]
        io.to(code).emit('multi:timeout', { round: room.roundIndex, answer: current?.name })
      } catch {}
      room.roundIndex += 1
      startRound(code)
    }, total * 1000)
  }

  io.on('connection', (socket) => {
    // Send public rooms snapshot to new connections
    socket.emit('multi:public', publicRoomsSnapshot())

    // Create room
    socket.on('multi:create', async ({ nbRounds = 10, name, maxPlayers = 4, timePerRound = 30, isPublic = false, isHardcore = false }) => {
      const games = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))
      const ordre = ordone(games.length)
      const maxRounds = games.length
      const code = makeRoomCode()
      rooms.set(code, {
        code,
        ordre,
        nbRounds: Math.max(1, Math.min(Number(nbRounds) || 10, maxRounds)),
        roundIndex: 1, // 1-based like solo
        started: false,
        players: new Map(), // socket.id -> { name, score, ready }
        host: socket.id,
        guesses: new Set(),
        timer: null,
        chat: [],
        maxPlayers: Math.max(2, Math.min(12, Number(maxPlayers) || 4)),
        timePerRound: Math.max(5, Math.min(120, Number(timePerRound) || 30)),
        public: !!isPublic,
        hardcore: !!isHardcore,
        hardcoreStartTime: null,
        hardcoreRevealLevel: 0
      })
      socket.join(code)
      rooms.get(code).players.set(socket.id, { name: name || `Joueur-${code}`, score: 0, ready: false })
      socket.emit('multi:created', { code })
      io.to(code).emit('multi:update', serializeRoom(code))
      io.emit('multi:public', publicRoomsSnapshot())
    })

    // Join room
    socket.on('multi:join', ({ code, name }) => {
      code = (code || '').toUpperCase()
      const room = rooms.get(code)
      if (!room) return socket.emit('multi:error', { message: 'Salle introuvable' })
      if (room.players.size >= room.maxPlayers) return socket.emit('multi:error', { message: 'Salle pleine' })
      if (room.started) return socket.emit('multi:error', { message: 'Partie déjà commencée' })
      socket.join(code)
      room.players.set(socket.id, { name: name || `Joueur-${code}`, score: 0, ready: false })
      io.to(code).emit('multi:update', serializeRoom(code))
      socket.emit('multi:joined', { code })
      io.emit('multi:public', publicRoomsSnapshot())
    })

    // Toggle readiness in lobby
    socket.on('multi:ready', ({ code }) => {
      code = (code || '').toUpperCase()
      const room = rooms.get(code)
      const player = room?.players.get(socket.id)
      if (!player || room.started) return
      player.ready = !player.ready
      io.to(code).emit('multi:update', serializeRoom(code))
    })

    // Start game (host) only if all ready
    socket.on('multi:start', ({ code }) => {
      code = (code || '').toUpperCase()
      const room = rooms.get(code)
      if (!room) return
      if (room.host !== socket.id) return
      const allReady = Array.from(room.players.values()).every(p => p.ready)
      if (!allReady) return io.to(code).emit('multi:error', { message: 'Tous les joueurs doivent être prêts' })
      room.started = true
      room.roundIndex = 1
      startRound(code)
      io.emit('multi:public', publicRoomsSnapshot())
    })

    // Receive guess
    socket.on('multi:guess', async ({ code, guess }) => {
      code = (code || '').toUpperCase()
      const room = rooms.get(code)
      if (!room || !room.started) return
      const games = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'games_list.json')))
      const currentIdx = room.ordre[room.roundIndex] - 1
      const current = games[currentIdx]
      if (!current) return
      if (current.answers.some(a => a.toLowerCase() === String(guess || '').toLowerCase())) {
        const player = room.players.get(socket.id)
        if (!player) return
        // bonus basé sur le temps restant (0..100 * remaining/total)
        const total = room.timePerRound
        const remaining = Math.max(0, Math.ceil((room.endAt - Date.now()) / 1000))
        const bonus = Math.round(100 * (remaining / total))
        player.score += 100 + bonus
        io.to(code).emit('multi:correct', { winner: player.name, answer: current.name, round: room.roundIndex, scores: serializeScores(room), bonus })
        clearRoundTimers(room)
        if (room.roundIndex >= room.nbRounds) {
          const ranking = serializeScores(room)
          io.to(code).emit('multi:gameover', { ranking })
          return
        }
        room.roundIndex += 1
        startRound(code)
      } else {
        socket.emit('multi:feedback', { ok: false })
      }
    })

    // Provide public rooms list on demand
    socket.on('multi:list-public', () => {
      socket.emit('multi:public', publicRoomsSnapshot())
    })

    // Chat (optional)
    socket.on('multi:chat', ({ code, msg }) => {
      code = (code || '').toUpperCase()
      const room = rooms.get(code)
      if (!room) return
      const player = room.players.get(socket.id)
      const entry = { from: player?.name || 'Anonyme', msg: String(msg || '').slice(0, 300) }
      room.chat.push(entry)
      io.to(code).emit('multi:chat', entry)
    })

    socket.on('disconnect', () => {
      for (const [code, room] of rooms) {
        if (room.players.has(socket.id)) {
          room.players.delete(socket.id)
          io.to(code).emit('multi:update', serializeRoom(code))
          if (room.players.size === 0) rooms.delete(code)
        }
      }
      io.emit('multi:public', publicRoomsSnapshot())
    })
  })
}

function serializeRoom(code) {
  const room = rooms.get(code)
  if (!room) return null
  return {
    code: room.code,
    started: room.started,
    round: room.roundIndex,
    nbRounds: room.nbRounds,
    maxPlayers: room.maxPlayers,
    timePerRound: room.timePerRound,
    public: room.public,
    hardcore: room.hardcore,
    hardcoreRevealLevel: room.hardcoreRevealLevel || 0,
    players: Array.from(room.players.values()).map(p => ({ name: p.name, score: p.score, ready: !!p.ready }))
  }
}

function serializeScores(room) {
  return Array.from(room.players.values())
    .map(p => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score)
}

