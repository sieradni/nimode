import { useEffect, useState } from 'react';
import type { DiscordAuth, DiscordSdkWrapper } from './types';

const AUTH_TIMEOUT_MS = 10000;

export type DiscordAuthStatus =
  | { status: 'connecting' }
  | { status: 'authenticated'; auth: DiscordAuth }
  | { status: 'unavailable'; error: string };

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Discord SDK initialization timed out')), ms)
    ),
  ]);
}

export function useDiscordAuth(sdk: DiscordSdkWrapper): DiscordAuthStatus {
  const [status, setStatus] = useState<DiscordAuthStatus>({ status: 'connecting' });

  useEffect(() => {
    let cancelled = false;

    withTimeout(sdk.init(), AUTH_TIMEOUT_MS)
      .then((auth) => {
        if (!cancelled) setStatus({ status: 'authenticated', auth });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : String(error);
        setStatus({ status: 'unavailable', error: message });
      });

    return () => {
      cancelled = true;
    };
  }, [sdk]);

  return status;
}