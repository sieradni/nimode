import { sign } from 'https://esm.sh/jsonwebtoken@9.0.2';

interface DiscordUser {
  id: string;
}

interface AuthRequest {
  discordAccessToken: string;
  instanceId: string;
  userId: string;
  guildId?: string;
  channelId?: string;
}

const JWT_TTL_SECONDS = 3600;

Deno.serve(async (req: Request) => {
  try {
    const body = (await req.json().catch(() => null)) as AuthRequest | null;

    if (
      !body?.discordAccessToken ||
      !body.userId ||
      !body.instanceId
    ) {
      return new Response(JSON.stringify({ error: 'invalid payload' }), { status: 400 });
    }

    const discordRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${body.discordAccessToken}` },
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
        instance_id: body.instanceId,
        guild_id: body.guildId,
        channel_id: body.channelId,
        role: 'authenticated',
      },
      serviceRole,
      {
        algorithm: 'HS256',
        issuer: supabaseUrl.replace('https://', ''),
        subject: discordUser.id,
        expiresIn: JWT_TTL_SECONDS,
        noTimestamp: false,
      },
    );

    const expiresAt = Math.floor((now + JWT_TTL_SECONDS) * 1000);
    return new Response(
      JSON.stringify({ accessToken: jwt, displayName: discordUser.id, expiresAt }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'internal error' }), { status: 500 });
  }
});
