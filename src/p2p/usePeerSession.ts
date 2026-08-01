import { useEffect, useRef, useState } from 'react';
import type { IEngineCore } from '../engine/interfaces/IEngineCore';
import type { SpectatorPayload } from '../engine/types/game';
import type { ConnectedParticipant } from '../discord/types';
import type { PeerFactory } from './types';
import type { InstanceConfigStore } from './InstanceConfigStore';
import { PeerJSManager } from './PeerJSManager';
import { HostBroadcaster } from './HostBroadcaster';
import { SpectatorBuffer } from './SpectatorBuffer';
import { PresenceRoster } from './PresenceRoster';
import { ViewStateController } from './ViewStateController';
import type { ActiveView } from './ViewStateController';

export const STUN_SERVERS = ['stun:stun.l.google.com:19302'];

export interface UsePeerSessionOptions {
  instanceId: string | null;
  userId: string;
  engine: IEngineCore;
  configStore: InstanceConfigStore;
  createPeer?: PeerFactory;
  fetchParticipants?: () => Promise<ConnectedParticipant[]>;
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

export function usePeerSession(options: UsePeerSessionOptions): PeerSession {
  const { instanceId, userId, engine, configStore, createPeer, fetchParticipants } = options;
  const [peerManager, setPeerManager] = useState<PeerJSManager | null>(null);
  const [spectatorBuffer, setSpectatorBuffer] = useState<SpectatorBuffer | null>(null);
  const [view, setView] = useState<ActiveView>('LOCAL_ACTIVE');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ConnectedParticipant[]>([]);
  const controllerRef = useRef<ViewStateController | null>(null);

  useEffect(() => {
    if (!instanceId) return;

    const peerId = `${instanceId}-${userId}`;
    const manager = new PeerJSManager({
      instanceId: peerId,
      role: 'host',
      stunServers: STUN_SERVERS,
      createPeer,
    });
    const buffer = new SpectatorBuffer();
    const roster = new PresenceRoster(manager);
    const controller = new ViewStateController({
      roster,
      buffer,
      connectToTarget: (targetUserId) => {
        if (manager.open) {
          manager.connectToPeer(`${instanceId}-${targetUserId}`, {
            userId,
            displayName: userId,
            isPrivate: false,
          });
        }
      },
    });
    controllerRef.current = controller;
    let broadcaster: HostBroadcaster | null = null;

    const handleData = (payload: SpectatorPayload) => {
      buffer.push(payload, performance.now());
    };
    const handleOpen = () => {
      broadcaster = new HostBroadcaster({ engine, peerManager: manager, configStore, userId });
      broadcaster.start();
    };
    const handleError = (error: Error) => {
      setConnectionError(error.message);
    };

    manager.on('data', handleData);
    manager.on('open', handleOpen);
    manager.on('error', handleError);
    controller.onViewChange(setView);
    roster.start();

    manager
      .init()
      .then(() => {
        setPeerManager(manager);
        setSpectatorBuffer(buffer);
        if (fetchParticipants) {
          fetchParticipants()
            .then((discovered) => {
              setParticipants(discovered);
              for (const p of discovered) {
                if (p.id === userId) continue;
                roster.seedEntry(
                  { userId: p.id, displayName: p.displayName ?? p.username, isPrivate: false },
                  false,
                );
              }
            })
            .catch(() => {
              // Discovery is best-effort; the roster remains connection-driven.
            });
        }
      })
      .catch((err: unknown) => {
        setConnectionError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      broadcaster?.stop();
      manager.off('data', handleData);
      manager.off('open', handleOpen);
      manager.off('error', handleError);
      controller.offViewChange(setView);
      roster.stop();
      manager.close();
      controllerRef.current = null;
    };
  }, [instanceId, userId, engine, configStore, createPeer, fetchParticipants]);

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
