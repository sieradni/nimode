import type { PeerMetadata } from './types';
import type { PeerJSManager } from './PeerJSManager';
import type { InstanceConfigStore } from './InstanceConfigStore';

export const STUN_SERVERS = ['stun:stun.l.google.com:19302'];

export function makeMetadata(
  userId: string,
  configStore: InstanceConfigStore,
): PeerMetadata {
  return {
    userId,
    displayName: userId,
    isPrivate: configStore.getConfig().isPrivate,
  };
}

export function buildConnectToTarget(options: {
  instanceId: string;
  userId: string;
  manager: PeerJSManager;
  configStore: InstanceConfigStore;
}): (userId: string) => void {
  return (targetUserId) => {
    if (options.manager.open) {
      options.manager.connectToPeer(
        `${options.instanceId}-${targetUserId}`,
        makeMetadata(options.userId, options.configStore),
      );
    }
  };
}
