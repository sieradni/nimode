import { useEffect, useRef, useState } from 'react';
import type { IEngineCore } from '../engine/interfaces/IEngineCore';
import type { SpectatorPayload } from '../engine/types/instance';
import type { ConnectedParticipant } from '../discord/types';
import type { InstanceConfigStore } from './InstanceConfigStore';
import type { PresenceTransport, PresenceTransportOptions } from './transport';
import type { PeerMetadata } from './types';
import { createRelayTransport } from './relayTransportFactory';
import { HostBroadcaster } from './HostBroadcaster';
import { SpectatorBuffer } from './SpectatorBuffer';
import { PresenceRoster } from './PresenceRoster';
import { ViewStateController } from './ViewStateController';
import type { ActiveView } from './ViewStateController';
import { clearRelayAuthCache } from './relayAuth';

export interface UsePeerSessionOptions {
  instanceId: string | null;
  userId: string;
  displayName: string;
  engine: IEngineCore;
  configStore: InstanceConfigStore;
  /**
   * The Discord OAuth `access_token` used to authorize with the relay Edge
   * Function. When null (standalone/dev), the hook runs in local-single-player
   * mode with no transport.
   */
  discordAccessToken: string | null;
  /** Optional override for tests to inject a fake transport. */
  createTransport?: () => PresenceTransport;
}

export interface PeerSession {
  peerManager: PresenceTransport | null;
  spectatorBuffer: SpectatorBuffer | null;
  view: ActiveView;
  selectTarget: (userId: string) => boolean;
  returnToLocal: () => void;
  connectionError: string | null;
  participants: ConnectedParticipant[];
}

export function usePeerSession(options: UsePeerSessionOptions): PeerSession {
  const { instanceId, userId, displayName, engine, configStore, discordAccessToken } = options;
  const createTransportOverride = options.createTransport;
  const [peerManager, setPeerManager] = useState<PresenceTransport | null>(null);
  const [spectatorBuffer, setSpectatorBuffer] = useState<SpectatorBuffer | null>(null);
  const [view, setView] = useState<ActiveView>('LOCAL_ACTIVE');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ConnectedParticipant[]>([]);
  const controllerRef = useRef<ViewStateController | null>(null);
  const managerRef = useRef<PresenceTransport | null>(null);

  useEffect(() => {
    clearRelayAuthCache();
    if (!instanceId || !discordAccessToken) {
      return;
    }

    const createTransport =
      createTransportOverride ??
      (() =>
        createRelayTransport({
          instanceId,
          userId,
          discordAccessToken,
        }));

    const transport = createTransport();
    const buffer = new SpectatorBuffer();
    const roster = new PresenceRoster(transport);
    const controller = new ViewStateController({
      roster,
      buffer,
      connectToTarget: (targetUserId: string) => {
        transport.connectToPeer?.(targetUserId);
      },
    });
    controllerRef.current = controller;
    managerRef.current = transport;
    controller.onViewChange(setView);
    roster.start();
    let broadcaster: HostBroadcaster | null = null;

    const toParticipant = (userIdArg: string, displayNameArg: string): ConnectedParticipant => ({
      id: userIdArg,
      username: displayNameArg,
      displayName: displayNameArg,
    });

    const onPeerJoined = (metadata: PeerMetadata) => {
      if (metadata.userId === userId) return;
      setParticipants((prev) =>
        prev.some((p) => p.id === metadata.userId) ? prev : [...prev, toParticipant(metadata.userId, metadata.displayName)],
      );
    };
    const onPeerLeft = (leftUserId: string) => {
      if (leftUserId === userId) return;
      setParticipants((prev) => prev.filter((p) => p.id !== leftUserId));
    };
    const onPresence = (metadata: PeerMetadata) => {
      if (metadata.userId === userId) return;
      setParticipants((prev) => {
        const existing = prev.find((p) => p.id === metadata.userId);
        if (existing && existing.displayName === metadata.displayName) return prev;
        if (existing) {
          return prev.map((p) =>
            p.id === metadata.userId ? toParticipant(metadata.userId, metadata.displayName) : p,
          );
        }
        return [...prev, toParticipant(metadata.userId, metadata.displayName)];
      });
    };
    const onData = (payload: SpectatorPayload) => {
      buffer.push(payload, performance.now());
    };
    const onOpen = () => {
      setConnectionError(null);
      broadcaster = new HostBroadcaster({
        engine,
        peerManager: transport,
        configStore,
        userId,
      });
      broadcaster.start();
      transport.sendPresence();
    };
    const onError = (error: Error) => {
      setConnectionError(error.message);
    };
    const onClosed = () => {
      broadcaster?.stop();
      managerRef.current = null;
    };

    transport.on('peerJoined', onPeerJoined);
    transport.on('peerLeft', onPeerLeft);
    transport.on('presence', onPresence);
    transport.on('data', onData);
    transport.on('open', onOpen);
    transport.on('error', onError);
    transport.on('closed', onClosed);

    const opts: PresenceTransportOptions = {
      instanceId,
      userId,
      displayName,
      isPrivate: configStore.getConfig().isPrivate,
    };

    void Promise.resolve().then(() => {
      setPeerManager(transport);
      setSpectatorBuffer(buffer);
      setParticipants([]);
    });

    void transport.openTransport(opts);

    const handleConfigChange = () => {
      transport.sendPresence();
    };
    configStore.subscribe(handleConfigChange);

    return () => {
      broadcaster?.stop();
      configStore.unsubscribe(handleConfigChange);
      transport.off('peerJoined', onPeerJoined);
      transport.off('peerLeft', onPeerLeft);
      transport.off('presence', onPresence);
      transport.off('data', onData);
      transport.off('open', onOpen);
      transport.off('error', onError);
      transport.off('closed', onClosed);
      transport.close();
      roster.stop();
      controllerRef.current = null;
      managerRef.current = null;
    };
  }, [instanceId, userId, displayName, engine, configStore, discordAccessToken, createTransportOverride]);

  return {
    peerManager,
    spectatorBuffer,
    view,
    selectTarget: (id: string) => controllerRef.current?.selectTarget(id) ?? false,
    returnToLocal: () => {
      controllerRef.current?.returnToLocal();
    },
    connectionError,
    participants,
  };
}
