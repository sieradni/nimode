import { createClient } from 'jsr:@supabase/supabase-js@2';
import { sign } from 'https://esm.sh/jsonwebtoken@9.0.2';
import { mapPeers } from './relayMapping.ts';
import { buildPresenceWriteValues, buildStateWriteValues } from './relayWrites.ts';

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

function getSupabase() {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceRole = Deno.env.get('SERVICE_ROLE_KEY');
  if (!url || !serviceRole) {
    throw new Error('Supabase environment variables missing');
  }
  return createClient(url, serviceRole);
}

async function pruneInstanceStore(supabase: ReturnType<typeof getSupabase>, instanceId: string): Promise<void> {
  const cutoff = new Date(Date.now() - PEER_TTL_MS).toISOString();
  const { error } = await supabase
    .from('relay_states')
    .delete()
    .eq('instance_id', instanceId)
    .lt('updated_at', cutoff);
  if (error) {
    console.error('prune error:', error.message);
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

    const supabase = getSupabase();

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
        const now = new Date(relayMsg.timestamp ?? Date.now()).toISOString();

        if (relayMsg.type === 'presence') {
          const { error } = await supabase
            .from('relay_states')
            .upsert(buildPresenceWriteValues(relayMsg, now), { onConflict: 'instance_id,user_id' });
          if (error) {
            console.error('presence upsert error:', error.message);
          }
          return new Response(JSON.stringify({ ok: true }), { status: 200 });
        }

        const { data: existing } = await supabase
          .from('relay_states')
          .select('display_name, is_private')
          .eq('instance_id', relayMsg.instanceId)
          .eq('user_id', relayMsg.userId)
          .single();

        const { error } = await supabase
          .from('relay_states')
          .upsert(
            buildStateWriteValues(relayMsg, existing as { display_name: string | null; is_private: boolean | null } | null, now),
            { onConflict: 'instance_id,user_id' },
          );
        if (error) {
          console.error('state upsert error:', error.message);
        }
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

      await pruneInstanceStore(supabase, instanceId);

      const cutoff = new Date(Date.now() - PEER_TTL_MS).toISOString();
      const { data, error } = await supabase
        .from('relay_states')
        .select('user_id, display_name, is_private, payload, updated_at')
        .eq('instance_id', instanceId)
        .neq('user_id', userId)
        .gte('updated_at', cutoff)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('select error:', error.message);
        return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 });
      }

      // Shape rows through a pure, tested helper so the GET never leaks a raw
      // user_id (Discord snowflake) as a display name.
      const peers = mapPeers(data ?? []);

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