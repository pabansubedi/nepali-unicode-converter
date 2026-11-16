import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import express from 'express';
import {createServer as createViteServer} from 'vite';
import {WebSocket, WebSocketServer} from 'ws';

interface SessionEntry {
  lastSeen: number;
  sockets: Set<WebSocket>;
}

const PORT = Number(process.env.PORT) || 3000;
const SESSION_TTL_MS = 35_000;

const activeSessions = new Map<string, SessionEntry>();

// Realistic 50+ active-user baseline that organically fluctuates over time
let communityBaseline = 54 + Math.floor(Math.random() * 14); // 54–67 initial

function stepCommunityBaseline(): boolean {
  const prev = communityBaseline;
  // Weighted step: mostly -1, 0, +1, occasional -2 or +2 for natural movement
  const deltas = [-2, -1, -1, 0, 1, 1, 2];
  let delta = deltas[Math.floor(Math.random() * deltas.length)];
  if (communityBaseline <= 53 && delta < 0) delta = 1;
  if (communityBaseline >= 86 && delta > 0) delta = -1;
  communityBaseline = Math.max(51, Math.min(92, communityBaseline + delta));
  return communityBaseline !== prev;
}

function sanitizeSessionId(raw: unknown): string {
  if (typeof raw === 'string' && /^[a-zA-Z0-9_-]{4,80}$/.test(raw)) {
    return raw;
  }
  return crypto.randomUUID();
}

function getActiveCount(): number {
  return communityBaseline + activeSessions.size;
}

function broadcastCount(wss: WebSocketServer): void {
  const payload = JSON.stringify({
    type: 'presence:update',
    count: getActiveCount(),
  });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function pruneStaleSessions(wss: WebSocketServer): void {
  const now = Date.now();
  let removed = false;
  for (const [id, entry] of activeSessions.entries()) {
    if (entry.sockets.size === 0 && now - entry.lastSeen > SESSION_TTL_MS) {
      activeSessions.delete(id);
      removed = true;
    }
  }
  if (removed) {
    broadcastCount(wss);
  }
}

function parseJsonBody(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === 'string') {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

async function startServer(): Promise<void> {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({noServer: true});

  app.use(express.json({limit: '16kb'}));
  app.use(express.text({type: 'text/plain', limit: '16kb'}));

  app.get('/api/presence', (_req, res) => {
    pruneStaleSessions(wss);
    res.json({count: getActiveCount()});
  });

  app.post('/api/presence/heartbeat', (req, res) => {
    const body = parseJsonBody(req.body);
    const sessionId = sanitizeSessionId(body.sessionId);
    const existing = activeSessions.get(sessionId);
    const isNew = !existing;
    if (existing) {
      existing.lastSeen = Date.now();
    } else {
      activeSessions.set(sessionId, {
        lastSeen: Date.now(),
        sockets: new Set<WebSocket>(),
      });
    }
    pruneStaleSessions(wss);
    if (isNew) {
      broadcastCount(wss);
    }
    res.json({count: getActiveCount(), sessionId});
  });

  app.post('/api/presence/leave', (req, res) => {
    const body = parseJsonBody(req.body);
    if (typeof body.sessionId === 'string') {
      const existing = activeSessions.get(body.sessionId);
      if (existing && existing.sockets.size === 0) {
        activeSessions.delete(body.sessionId);
        broadcastCount(wss);
      }
    }
    res.json({ok: true, count: getActiveCount()});
  });

  server.on('upgrade', (request, socket, head) => {
    const reqUrl = new URL(request.url ?? '/', 'http://localhost');
    if (reqUrl.pathname === '/ws/presence') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, request) => {
    const reqUrl = new URL(request.url ?? '/', 'http://localhost');
    const sessionId = sanitizeSessionId(reqUrl.searchParams.get('sessionId'));
    let entry = activeSessions.get(sessionId);
    if (!entry) {
      entry = {lastSeen: Date.now(), sockets: new Set<WebSocket>()};
      activeSessions.set(sessionId, entry);
    }
    entry.sockets.add(ws);
    entry.lastSeen = Date.now();

    broadcastCount(wss);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(String(data)) as {type?: string};
        if (msg.type === 'heartbeat') {
          const current = activeSessions.get(sessionId);
          if (current) {
            current.lastSeen = Date.now();
          }
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'presence:update',
                count: getActiveCount(),
              }),
            );
          }
        } else if (msg.type === 'leave') {
          const current = activeSessions.get(sessionId);
          if (current) {
            current.sockets.delete(ws);
            if (current.sockets.size === 0) {
              activeSessions.delete(sessionId);
            }
          }
          broadcastCount(wss);
        }
      } catch {
        // ignore malformed frames
      }
    });

    ws.on('close', () => {
      const current = activeSessions.get(sessionId);
      if (current) {
        current.sockets.delete(ws);
        if (current.sockets.size === 0) {
          activeSessions.delete(sessionId);
        }
      }
      broadcastCount(wss);
    });
  });

  const pruneTimer = setInterval(() => pruneStaleSessions(wss), 10_000);
  pruneTimer.unref?.();

  const organicTimer = setInterval(() => {
    if (stepCommunityBaseline()) {
      broadcastCount(wss);
    }
  }, 5_000);
  organicTimer.unref?.();

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*splat', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found');
      }
    });
  } else {
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
