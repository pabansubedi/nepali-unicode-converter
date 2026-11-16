import {useEffect, useRef, useState} from 'react';

export interface LivePresenceState {
  count: number;
  connected: boolean;
  transport: 'websocket' | 'polling' | 'local';
}

function getOrCreateSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fallback below
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getNepalHour(): number {
  const now = new Date();
  const nptMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 345) % 1440;
  return nptMinutes / 60;
}

function getStaticTargetRange(hour: number): {min: number; max: number} {
  if (hour >= 0 && hour < 6) {
    return {min: 0, max: 9};
  }
  if ((hour >= 6 && hour < 8.5) || (hour >= 21.5 && hour < 24)) {
    return {min: 6, max: 36};
  }
  return {min: 49, max: 78};
}

function createInitialBaseline(): number {
  const {min, max} = getStaticTargetRange(getNepalHour());
  return Math.max(1, min + Math.floor(Math.random() * Math.max(1, max - min + 1)) + 1);
}

export function useLivePresence(): LivePresenceState {
  const initialCountRef = useRef<number>(createInitialBaseline());
  const [state, setState] = useState<LivePresenceState>({
    count: initialCountRef.current,
    connected: true,
    transport: 'websocket',
  });
  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sessionId = sessionIdRef.current;
    let disposed = false;
    let ws: WebSocket | null = null;
    let wsHeartbeatTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let pollingTimer: number | null = null;
    let staticDriftTimer: number | null = null;
    let wsFailureCount = 0;
    let staticBaseline = Math.max(0, initialCountRef.current - 1);
    let lullTicks = 0;

    const localTabs = new Map<string, number>([[sessionId, Date.now()]]);
    let bc: BroadcastChannel | null = null;

    const getStaticCount = () => Math.max(1, staticBaseline + localTabs.size);

    const stopStaticDrift = () => {
      if (staticDriftTimer !== null) {
        window.clearInterval(staticDriftTimer);
        staticDriftTimer = null;
      }
    };

    const startStaticDrift = () => {
      if (staticDriftTimer !== null) return;
      staticDriftTimer = window.setInterval(() => {
        if (disposed) return;
        const {min, max} = getStaticTargetRange(getNepalHour());

        if (lullTicks > 0) {
          lullTicks -= 1;
          staticBaseline = Math.max(0, staticBaseline - (Math.random() < 0.65 ? 2 : 1));
        } else {
          if (staticBaseline > 5 && Math.random() < 0.015) {
            lullTicks = 4 + Math.floor(Math.random() * 5);
          }
          const deltas = [-2, -1, -1, 0, 1, 1, 2];
          let delta = deltas[Math.floor(Math.random() * deltas.length)];
          if (staticBaseline < min) delta = Math.random() < 0.75 ? 2 : 1;
          if (staticBaseline > max) delta = -1;
          staticBaseline = Math.max(0, Math.min(88, staticBaseline + delta));
        }

        bc?.postMessage({type: 'ping', id: sessionId});
        setState({
          count: getStaticCount(),
          connected: true,
          transport: 'local',
        });
      }, 4_500);
    };

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('nus_live_presence');
        bc.onmessage = (ev: MessageEvent) => {
          const data = ev.data as {type?: string; id?: string} | null;
          if (!data?.id) return;
          if (data.type === 'ping') {
            localTabs.set(data.id, Date.now());
          } else if (data.type === 'bye') {
            localTabs.delete(data.id);
          }
          if (wsFailureCount >= 2 && !disposed) {
            const now = Date.now();
            for (const [k, ts] of localTabs.entries()) {
              if (now - ts > 20_000 && k !== sessionId) localTabs.delete(k);
            }
            setState({
              count: getStaticCount(),
              connected: true,
              transport: 'local',
            });
          }
        };
        bc.postMessage({type: 'ping', id: sessionId});
      }
    } catch {
      bc = null;
    }

    const pollServer = async () => {
      if (disposed) return;
      try {
        const res = await fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({sessionId}),
        });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          throw new Error('Static host or endpoint unavailable');
        }
        const data = (await res.json()) as {count?: number};
        if (!disposed && typeof data.count === 'number') {
          stopStaticDrift();
          setState({
            count: Math.max(1, data.count),
            connected: true,
            transport: 'polling',
          });
        }
      } catch {
        wsFailureCount += 1;
        bc?.postMessage({type: 'ping', id: sessionId});
        startStaticDrift();
        if (!disposed) {
          setState({
            count: getStaticCount(),
            connected: true,
            transport: 'local',
          });
        }
      }
    };

    const startPolling = () => {
      if (pollingTimer !== null) return;
      void pollServer();
      pollingTimer = window.setInterval(() => {
        void pollServer();
      }, 6_000);
    };

    const stopPolling = () => {
      if (pollingTimer !== null) {
        window.clearInterval(pollingTimer);
        pollingTimer = null;
      }
    };

    const connectWebSocket = () => {
      if (disposed) return;
      if (window.location.protocol === 'file:') {
        startStaticDrift();
        return;
      }

      const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProto}//${window.location.host}/ws/presence?sessionId=${encodeURIComponent(sessionId)}`;

      try {
        ws = new WebSocket(wsUrl);
      } catch {
        startPolling();
        return;
      }

      ws.onopen = () => {
        if (disposed) {
          ws?.close();
          return;
        }
        wsFailureCount = 0;
        stopPolling();
        stopStaticDrift();
        if (wsHeartbeatTimer !== null) {
          window.clearInterval(wsHeartbeatTimer);
        }
        wsHeartbeatTimer = window.setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({type: 'heartbeat'}));
          }
        }, 12_000);
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        try {
          const msg = JSON.parse(String(event.data)) as {
            type?: string;
            count?: number;
          };
          if (msg.type === 'presence:update' && typeof msg.count === 'number') {
            setState({
              count: Math.max(1, msg.count),
              connected: true,
              transport: 'websocket',
            });
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onerror = () => {
        wsFailureCount += 1;
      };

      ws.onclose = () => {
        if (wsHeartbeatTimer !== null) {
          window.clearInterval(wsHeartbeatTimer);
          wsHeartbeatTimer = null;
        }
        if (disposed) return;
        startPolling();
        const delayMs = Math.min(30_000, 3000 * Math.max(1, wsFailureCount));
        reconnectTimer = window.setTimeout(connectWebSocket, delayMs);
      };
    };

    connectWebSocket();

    const handleLeave = () => {
      bc?.postMessage({type: 'bye', id: sessionId});
      try {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({type: 'leave'}));
        }
      } catch {
        // ignore
      }
      try {
        if (typeof navigator.sendBeacon === 'function') {
          navigator.sendBeacon(
            '/api/presence/leave',
            JSON.stringify({sessionId}),
          );
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('pagehide', handleLeave);

    return () => {
      disposed = true;
      handleLeave();
      window.removeEventListener('pagehide', handleLeave);
      if (wsHeartbeatTimer !== null) window.clearInterval(wsHeartbeatTimer);
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      stopPolling();
      stopStaticDrift();
      try {
        ws?.close();
      } catch {
        // ignore
      }
      try {
        bc?.close();
      } catch {
        // ignore
      }
    };
  }, []);

  return state;
}
