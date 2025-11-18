import { Injectable, Logger } from '@nestjs/common';

export interface PeerConnectionState {
  roomId: string;
  localUserId: string;
  remoteUserId: string;
  socketId: string;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  iceGatheringState: RTCIceGatheringState;
  createdAt: number;
  lastActivityAt: number;
  failureCount: number;
  lastRestartAt?: number;
  isRestarting: boolean;
}

export type RTCPeerConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed';

export type RTCIceConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed';

export type RTCIceGatheringState = 'new' | 'gathering' | 'complete';

@Injectable()
export class PeerConnectionTrackerService {
  private readonly logger = new Logger(PeerConnectionTrackerService.name);
  private readonly connections = new Map<string, PeerConnectionState>();
  private readonly STALE_THRESHOLD_MS = 60000;
  private readonly RESTART_COOLDOWN_MS = 5000;
  private readonly MAX_RESTARTS = 2;

  getConnectionKey(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): string {
    return `${roomId}:${localUserId}:${remoteUserId}`;
  }

  trackConnection(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    socketId: string,
  ): void {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);

    const state: PeerConnectionState = {
      roomId,
      localUserId,
      remoteUserId,
      socketId,
      connectionState: 'new',
      iceConnectionState: 'new',
      iceGatheringState: 'new',
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      failureCount: 0,
      isRestarting: false,
    };

    this.connections.set(key, state);
    this.logger.debug(
      `Tracking connection: ${localUserId} <-> ${remoteUserId} in room ${roomId}`,
    );
  }

  updateConnectionState(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    connectionState: RTCPeerConnectionState,
  ): void {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    const state = this.connections.get(key);

    if (state) {
      state.connectionState = connectionState;
      state.lastActivityAt = Date.now();

      if (connectionState === 'connected') {
        state.failureCount = 0;
      }
    }
  }

  updateIceConnectionState(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    iceConnectionState: RTCIceConnectionState,
  ): void {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    const state = this.connections.get(key);

    if (state) {
      state.iceConnectionState = iceConnectionState;
      state.lastActivityAt = Date.now();

      if (
        iceConnectionState === 'connected' ||
        iceConnectionState === 'completed'
      ) {
        state.failureCount = 0;
      }
    }
  }

  updateIceGatheringState(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    iceGatheringState: RTCIceGatheringState,
  ): void {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    const state = this.connections.get(key);

    if (state) {
      state.iceGatheringState = iceGatheringState;
      state.lastActivityAt = Date.now();
    }
  }

  recordFailure(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): void {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    const state = this.connections.get(key);

    if (state) {
      state.failureCount++;
      state.lastActivityAt = Date.now();
      state.connectionState = 'failed';
    }
  }

  canRestart(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): boolean {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    const state = this.connections.get(key);

    if (!state) return false;

    const timeSinceLastRestart = state.lastRestartAt
      ? Date.now() - state.lastRestartAt
      : this.RESTART_COOLDOWN_MS;

    return (
      state.failureCount < this.MAX_RESTARTS &&
      timeSinceLastRestart >= this.RESTART_COOLDOWN_MS
    );
  }

  recordRestart(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): void {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    const state = this.connections.get(key);

    if (state) {
      state.isRestarting = true;
      state.lastRestartAt = Date.now();
      state.lastActivityAt = Date.now();
      this.logger.log(
        `ICE restart initiated: ${localUserId} <-> ${remoteUserId} (attempt ${state.failureCount + 1})`,
      );
    }
  }

  recordRestartComplete(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): void {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    const state = this.connections.get(key);

    if (state) {
      state.isRestarting = false;
      state.lastActivityAt = Date.now();
    }
  }

  getConnection(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): PeerConnectionState | null {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    return this.connections.get(key) || null;
  }

  getStaleConnections(): PeerConnectionState[] {
    const now = Date.now();
    return Array.from(this.connections.values()).filter((state) =>
      this.isStale(state, now),
    );
  }

  getFailedConnections(): PeerConnectionState[] {
    return Array.from(this.connections.values()).filter(
      (state) => state.connectionState === 'failed',
    );
  }

  isStale(state: PeerConnectionState, now: number = Date.now()): boolean {
    return now - state.lastActivityAt > this.STALE_THRESHOLD_MS;
  }

  cleanup(roomId: string, localUserId: string, remoteUserId: string): void {
    const key = this.getConnectionKey(roomId, localUserId, remoteUserId);
    this.connections.delete(key);
  }

  cleanupRoom(roomId: string): void {
    const keysToDelete = Array.from(this.connections.keys()).filter((key) =>
      key.startsWith(`${roomId}:`),
    );
    keysToDelete.forEach((key) => this.connections.delete(key));
    this.logger.debug(
      `Cleaned up ${keysToDelete.length} peer connection states for room ${roomId}`,
    );
  }

  cleanupStaleConnections(): PeerConnectionState[] {
    const stale = this.getStaleConnections();
    stale.forEach((state) => {
      const key = this.getConnectionKey(
        state.roomId,
        state.localUserId,
        state.remoteUserId,
      );
      this.connections.delete(key);
      this.logger.debug(
        `Cleaned up stale connection: ${state.localUserId} <-> ${state.remoteUserId}`,
      );
    });
    return stale;
  }
}
