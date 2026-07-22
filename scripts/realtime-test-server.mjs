import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
const host = '127.0.0.1'
const appPort = 3101
const realtimePort = 3102
const sockets = new Set()

function phoenixReply(socket, joinRef, ref, topic, response = {}) {
  socket.send(JSON.stringify([
    joinRef,
    ref,
    topic,
    'phx_reply',
    { status: 'ok', response },
  ]))
}

function relayBroadcast(sender, topic, event, payload) {
  const frame = JSON.stringify([
    null,
    null,
    topic,
    'broadcast',
    { type: 'broadcast', event, payload },
  ])

  for (const socket of sockets) {
    const subscription = socket.topics.get(topic)
    if (!subscription || (socket === sender && !subscription.self)) continue
    socket.send(frame)
  }
}

function decodeBroadcastFrame(data) {
  const bytes = new Uint8Array(data)
  if (bytes[0] !== 3 || bytes.length < 7) return null

  const joinRefLength = bytes[1]
  const refLength = bytes[2]
  const topicLength = bytes[3]
  const eventLength = bytes[4]
  const metadataLength = bytes[5]
  const encoding = bytes[6]
  const decoder = new TextDecoder()
  let offset = 7

  const readText = length => {
    const value = decoder.decode(bytes.slice(offset, offset + length))
    offset += length
    return value
  }

  const joinRef = readText(joinRefLength)
  const ref = readText(refLength)
  const topic = readText(topicLength)
  const event = readText(eventLength)
  readText(metadataLength)

  const rawPayload = bytes.slice(offset)
  const payload = encoding === 1
    ? JSON.parse(decoder.decode(rawPayload))
    : rawPayload.buffer

  return { joinRef, ref, topic, event, payload }
}

function handleSocketMessage(socket, data, isBinary) {
  if (isBinary) {
    const message = decodeBroadcastFrame(data)
    if (!message) return
    relayBroadcast(socket, message.topic, message.event, message.payload)
    phoenixReply(socket, message.joinRef, message.ref, message.topic)
    return
  }

  const [joinRef, ref, topic, event, payload] = JSON.parse(data.toString())
  if (event === 'phx_join') {
    socket.topics.set(topic, { self: payload?.config?.broadcast?.self === true })
    phoenixReply(socket, joinRef, ref, topic, { postgres_changes: [] })
    return
  }

  if (event === 'phx_leave') {
    socket.topics.delete(topic)
    phoenixReply(socket, joinRef, ref, topic)
    return
  }

  if (event === 'heartbeat') {
    phoenixReply(socket, joinRef, ref, topic)
    return
  }

  if (event === 'broadcast' && payload?.event) {
    relayBroadcast(socket, topic, payload.event, payload.payload)
    phoenixReply(socket, joinRef, ref, topic)
  }
}

const server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Headers', 'apikey, authorization, content-type')

  if (request.method === 'OPTIONS') {
    response.writeHead(204).end()
    return
  }

  if (request.method !== 'POST' || request.url?.split('?')[0] !== '/realtime/v1/api/broadcast') {
    response.writeHead(404).end()
    return
  }

  let body = ''
  request.setEncoding('utf8')
  request.on('data', chunk => { body += chunk })
  request.on('end', () => {
    try {
      const parsed = JSON.parse(body)
      for (const message of parsed.messages ?? []) {
        const topic = String(message.topic).startsWith('realtime:')
          ? String(message.topic)
          : `realtime:${message.topic}`
        relayBroadcast(null, topic, message.event, message.payload)
      }
      response.writeHead(202).end()
    } catch {
      response.writeHead(400).end()
    }
  })
})

const websocketServer = new WebSocketServer({ noServer: true })
server.on('upgrade', (request, socket, head) => {
  if (request.url?.split('?')[0] !== '/realtime/v1/websocket') {
    socket.destroy()
    return
  }

  websocketServer.handleUpgrade(request, socket, head, websocket => {
    websocketServer.emit('connection', websocket, request)
  })
})

websocketServer.on('connection', socket => {
  socket.topics = new Map()
  sockets.add(socket)
  socket.on('message', (data, isBinary) => handleSocketMessage(socket, data, isBinary))
  socket.on('close', () => sockets.delete(socket))
})

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(realtimePort, host, resolve)
})

const nextProcess = spawn(
  './node_modules/.bin/next',
  ['start', '--hostname', host, '--port', String(appPort)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: `http://${host}:${realtimePort}`,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-browser-test-key',
      NEXT_PUBLIC_SITE_URL: `http://${host}:${appPort}`,
    },
    stdio: 'inherit',
  },
)

function shutdown(signal) {
  nextProcess.kill(signal)
  websocketServer.close()
  server.close(() => process.exit(0))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
nextProcess.on('exit', code => {
  websocketServer.close()
  server.close(() => process.exit(code ?? 1))
})
