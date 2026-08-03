import { sign } from 'https://esm.sh/jsonwebtoken@9.0.2';

interface DiscordUser {
  id: string;
  username: string;
}

interface AuthRequest {
  discordAccessToken: string;
  instanceId: string;
  userId: string;
  guildId?: string;
  channelId?: string;
}

interface RelayMessage {
  instanceId: string;
  userId: string;
  displayName: string;
  type: 'state' | 'presence';
  payload?: Record<string, unknown>;
  metadata?: { userId: string; displayName: string; isPrivate: boolean };
  timestamp: number;
}

const JWT_TTL_SECONDS = 3600;
const PEER_TTL_MS = 10_000;

const relayStore = new Map<
  string,
  Map<string, { payload: Record<string, unknown>; timestamp: number }>
>();

function getInstanceStore(instanceId: string): Map<string, { payload: Record<string, unknown>; timestamp: number }> {
  let store = relayStore.get(instanceId);
  if (!store) {
    store = new Map();
    relayStore.set(instanceId, store);
  }
  return store;
}

function pruneInstanceStore(instanceId: string): void {
  const store = relayStore.get(instanceId);
  if (!store) return;
  const now = Date.now();
  for (const [userId, entry] of store) {
    if (now - entry.timestamp > PEER_TTL_MS) {
      store.delete(userId);
    }
  }
  if (store.size === 0) {
    relayStore.delete(instanceId);
  }
}

Deno.serve(async (req: Request) => {
  try {
    const url = new URL(req.url);
    const isAuth =
      url.pathname.endsWith('/authorize-activity') ||
      url.pathname === '/functions/v1/authorize-activity';

    if (!isAuth) {
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
    }

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => null)) as
        | (AuthRequest & { type?: string })
        | RelayMessage
        | null;

      if (!body) {
        return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400 });
      }

      if ('discordAccessToken' in body && body.discordAccessToken) {
        const authBody = body as AuthRequest;
        const discordRes = await fetch('https://discord.com/api/users/@me', {
          headers: { Authorization: `Bearer ${authBody.discordAccessToken}` },
        });
        if (!discordRes.ok) {
          return new Response(JSON.stringify({ error: 'discord auth failed' }), { status: 401 });
        }
        const discordUser = (await discordRes.json()) as DiscordUser;

        const serviceRole = Deno.env.get('SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        if (!serviceRole || !supabaseUrl) {
          return new Response(JSON.stringify({ error: 'server config missing' }), { status: 500 });
        }

        const now = Math.floor(Date.now() / 1000);
        const jwt = await sign(
          {
            sub: discordUser.id,
            instance_id: authBody.instanceId,
            guild_id: authBody.guildId,
            channel_id: authBody.channelId,
            role: 'authenticated',
          },
          serviceRole,
          {
            algorithm: 'HS256',
            issuer: supabaseUrl.replace('https://', ''),
            expiresIn: JWT_TTL_SECONDS,
          },
        );

        const expiresAt = Math.floor((now + JWT_TTL_SECONDS) * 1000);
        return new Response(
          JSON.stringify({ accessToken: jwt, displayName: discordUser.username, expiresAt }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if ('type' in body && (body.type === 'state' || body.type === 'presence')) {
        const relayMsg = body as RelayMessage;
        const store = getInstanceStore(relayMsg.instanceId);
        store.set(relayMsg.userId, {
          payload: relayMsg.payload ?? relayMsg.metadata ?? {},
          timestamp: relayMsg.timestamp ?? Date.now(),
        });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }

      return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400 });
    }

    if (req.method === 'GET') {
      const instanceId = url.searchParams.get('instanceId');
      const userId = url.searchParams.get('userId');

      if (!instanceId || !userId) {
        return new Response(JSON.stringify({ error: 'missing instanceId or userId' }), { status: 400 });
      }

      pruneInstanceStore(instanceId);
      const store = getInstanceStore(instanceId);
      const peers: Array<{ userId: string; displayName: string; isPrivate: boolean; payload: Record<string, unknown>; timestamp: number }> = [];
      const now = Date.now();

      for (const [peerId, entry] of store) {
        if (peerId === userId) continue;
        if (now - entry.timestamp > PEER_TTL_MS) continue;
        const payload = entry.payload;
        const displayName =
          typeof payload === 'object' && payload !== null && 'displayName' in payload
            ? String(payload.displayName)
            : peerId;
        const isPrivate =
          typeof payload === 'object' && payload !== null && 'isPrivate' in payload
            ? Boolean(payload.isPrivate)
            : false;
        peers.push({
          userId: peerId,
          displayName,
          isPrivate,
          payload,
          timestamp: entry.timestamp,
        });
      }

      return new Response(
        JSON.stringify({ peers }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 });
  }
});