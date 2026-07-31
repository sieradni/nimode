import { useEffect, useState } from 'react';
import type { DiscordAuth, DiscordSdkWrapper } from './types';

export type DiscordAuthStatus =
  | { status: 'connecting' }
  | { status: 'authenticated'; auth: DiscordAuth }
  | { status: 'unavailable'; error: string };

export function useDiscordAuth(sdk: DiscordSdkWrapper): DiscordAuthStatus {
  const [status, setStatus] = useState<DiscordAuthStatus>({ status: 'connecting' });

  useEffect(() => {
    let cancelled = false;

    sdk
      .init()
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
