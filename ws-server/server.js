const { createServer } = require('http')
const { Server } = require('socket.io')
const Redis = require('ioredis')

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379'
const PORT = process.env.PORT || 3001

const httpServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', connections: io.engine.clientsCount }))
    return
  }
  res.writeHead(404)
  res.end()
})

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
})

const sub = new Redis(REDIS_URL)

sub.subscribe('game-events', (err) => {
  if (err) console.error('Redis subscribe error:', err)
  else console.log('Subscribed to game-events channel')
})

sub.on('message', (_channel, message) => {
  try {
    const event = JSON.parse(message)
    console.log('Broadcasting:', event.type)
    io.emit(event.type, event.data)
  } catch (e) {
    console.error('Failed to parse event:', e)
  }
})

let totalConnections = 0

io.on('connection', (socket) => {
  totalConnections++
  console.log(`Client connected: ${socket.id} (total: ${io.engine.clientsCount})`)

  socket.emit('welcome', {
    message: 'Connected to GameBacklog realtime',
    totalConnections,
  })

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id} (total: ${io.engine.clientsCount})`)
  })
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`WebSocket server running on port ${PORT}`)
  console.log(`Redis: ${REDIS_URL}`)
})
