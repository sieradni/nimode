import { useEffect, useRef, useState } from 'react';
import type { IEngineCore } from '../engine/interfaces/IEngineCore';
import type { SpectatorPayload } from '../engine/types/instance';
import type { ConnectedParticipant } from '../discord/types';
import type { PeerFactory } from './types';
import type { InstanceConfigStore } from './InstanceConfigStore';
import { PeerJSManager } from './PeerJSManager';
import { HostBroadcaster } from './HostBroadcaster';
import { SpectatorBuffer } from './SpectatorBuffer';
import { PresenceRoster } from './PresenceRoster';
import { ViewStateController } from './ViewStateController';
import type { ActiveView } from './ViewStateController';
import { STUN_SERVERS, makeMetadata, buildConnectToTarget } from './peerSessionSetup';

export interface UsePeerSessionOptions {
  instanceId: string | null;
  userId: string;
  engine: IEngineCore;
  configStore: InstanceConfigStore;
  createPeer?: PeerFactory;
  fetchParticipants?: () => Promise<ConnectedParticipant[]>;
  onParticipantsUpdate?: (cb: (participants: ConnectedParticipant[]) => void) => () => void;
}

export interface PeerSession {
  peerManager: PeerJSManager | null;
  spectatorBuffer: SpectatorBuffer | null;
  view: ActiveView;
  selectTarget: (userId: string) => boolean;
  returnToLocal: () => void;
  connectionError: string | null;
  participants: ConnectedParticipant[];
}

const FATAL_PEER_ERROR_TYPES = new Set([
  'browser-incompatible',
  'invalid-id',
  'invalid-key',
  'unavailable-id',
  'network',
  'server-error',
  'socket-error',
  'socket-closed',
  'ssl-unavailable',
]);

function isFatalPeerError(error: Error): boolean {
  const type = (error as Error & { type?: unknown }).type;
  return typeof type !== 'string' || FATAL_PEER_ERROR_TYPES.has(type);
}

export function usePeerSession(options: UsePeerSessionOptions): PeerSession {
  const {
    instanceId,
    userId,
    engine,
    configStore,
    createPeer,
    fetchParticipants,
    onParticipantsUpdate,
  } = options;
  const [peerManager, setPeerManager] = useState<PeerJSManager | null>(null);
  const [spectatorBuffer, setSpectatorBuffer] = useState<SpectatorBuffer | null>(null);
  const [view, setView] = useState<ActiveView>('LOCAL_ACTIVE');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ConnectedParticipant[]>([]);
  const controllerRef = useRef<ViewStateController | null>(null);
  const managerRef = useRef<PeerJSManager | null>(null);

  useEffect(() => {
    if (!instanceId && !userId) return;

    const effectiveInstanceId = instanceId ?? `${userId}-fallback`;
    const peerId = `${effectiveInstanceId}-${userId}`;
    const manager = new PeerJSManager({
      instanceId: peerId,
      role: 'host',
      stunServers: STUN_SERVERS,
      createPeer,
      metadata: makeMetadata(userId, configStore),
    });
    const buffer = new SpectatorBuffer();
    const roster = new PresenceRoster(manager);
    const controller = new ViewStateController({
      roster,
      buffer,
      connectToTarget: buildConnectToTarget({ instanceId: effectiveInstanceId, userId, manager, configStore }),
    });
    controllerRef.current = controller;
    managerRef.current = manager;
    let broadcaster: HostBroadcaster | null = null;
    let unsubscribeParticipants: (() => void) | null = null;
    let participantVersion = 0;

    const applyParticipants = (discovered: ConnectedParticipant[]): void => {
      participantVersion += 1;
      setParticipants(discovered);
      roster.reconcile(discovered.map((p) => p.id));
      for (const p of discovered) {
        if (p.id === userId) continue;
        roster.seedEntry(
          {
            userId: p.id,
            displayName: p.displayName ?? p.username,
            isPrivate: false,
          },
          false,
        );
        manager.connectToPeer(
          `${effectiveInstanceId}-${p.id}`,
          makeMetadata(userId, configStore),
        );
      }
    };

    const syncDiscovered = applyParticipants;

    const handleData = (payload: SpectatorPayload) => {
      buffer.push(payload, performance.now());
    };
    const handleOpen = () => {
      setConnectionError(null);
      broadcaster = new HostBroadcaster({ engine, peerManager: manager, configStore, userId });
      broadcaster.start();
      manager.sendPresence();
      if (fetchParticipants) {
        const versionAtFetch = participantVersion;
        fetchParticipants()
          .then((discovered) => {
            if (participantVersion !== versionAtFetch) return;
            syncDiscovered(discovered);
          })
          .catch((error: unknown) => {
            setConnectionError(error instanceof Error ? error.message : String(error));
          });
      }
      if (onParticipantsUpdate) {
        unsubscribeParticipants = onParticipantsUpdate(syncDiscovered);
      }
    };
    const handleError = (error: Error) => {
      if (!isFatalPeerError(error)) return;
      setConnectionError(error.message);
    };
    const handleConfigChange = () => {
      manager.sendPresence(makeMetadata(userId, configStore));
    };

    manager.on('data', handleData);
    manager.on('open', handleOpen);
    manager.on('error', handleError);
    configStore.subscribe(handleConfigChange);
    controller.onViewChange(setView);
    roster.start();

    manager
      .init()
      .then(() => {
        setPeerManager(manager);
        setSpectatorBuffer(buffer);
      })
      .catch((err: unknown) => {
        setConnectionError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      broadcaster?.stop();
      unsubscribeParticipants?.();
      manager.off('data', handleData);
      manager.off('open', handleOpen);
      manager.off('error', handleError);
      configStore.unsubscribe(handleConfigChange);
      controller.offViewChange(setView);
      roster.stop();
      manager.close();
      controllerRef.current = null;
      managerRef.current = null;
    };
  }, [instanceId, userId, engine, configStore, createPeer, fetchParticipants, onParticipantsUpdate]);

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