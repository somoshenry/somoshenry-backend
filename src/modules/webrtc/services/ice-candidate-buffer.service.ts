import { Injectable, Logger } from '@nestjs/common';

export interface BufferedIceCandidate {
  candidate: RTCIceCandidateInit;
  sequenceNumber: number;
  receivedAt: number;
  applied: boolean;
}

@Injectable()
export class IceCandidateBufferService {
  private readonly logger = new Logger(IceCandidateBufferService.name);
  private readonly buffers = new Map<string, BufferedIceCandidate[]>();
  private readonly BUFFER_TIMEOUT_MS = 120000;
  private sequenceCounter = 0;

  getBufferKey(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): string {
    return `${roomId}:${localUserId}:${remoteUserId}`;
  }

  bufferCandidate(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    candidate: RTCIceCandidateInit,
  ): number {
    const key = this.getBufferKey(roomId, localUserId, remoteUserId);
    const sequence = ++this.sequenceCounter;

    if (!this.buffers.has(key)) {
      this.buffers.set(key, []);
    }

    const buffered: BufferedIceCandidate = {
      candidate,
      sequenceNumber: sequence,
      receivedAt: Date.now(),
      applied: false,
    };

    const buffer = this.buffers.get(key)!;
    buffer.push(buffered);

    return sequence;
  }

  getBufferedCandidates(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): RTCIceCandidateInit[] {
    const key = this.getBufferKey(roomId, localUserId, remoteUserId);
    const buffer = this.buffers.get(key) || [];

    return buffer
      .filter((b) => !b.applied)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .map((b) => b.candidate);
  }

  markAsApplied(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    sequenceNumbers: number[],
  ): void {
    const key = this.getBufferKey(roomId, localUserId, remoteUserId);
    const buffer = this.buffers.get(key) || [];

    sequenceNumbers.forEach((seq) => {
      const buffered = buffer.find((b) => b.sequenceNumber === seq);
      if (buffered) {
        buffered.applied = true;
      }
    });
  }

  hasDuplicate(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    candidate: RTCIceCandidateInit,
  ): boolean {
    const key = this.getBufferKey(roomId, localUserId, remoteUserId);
    const buffer = this.buffers.get(key) || [];

    return buffer.some((b) => this.areCandidatesEqual(b.candidate, candidate));
  }

  private areCandidatesEqual(
    a: RTCIceCandidateInit,
    b: RTCIceCandidateInit,
  ): boolean {
    return (
      a.candidate === b.candidate &&
      a.sdpMLineIndex === b.sdpMLineIndex &&
      a.sdpMid === b.sdpMid
    );
  }

  clearBuffer(roomId: string, localUserId: string, remoteUserId: string): void {
    const key = this.getBufferKey(roomId, localUserId, remoteUserId);
    this.buffers.delete(key);
  }

  clearRoom(roomId: string): void {
    const keysToDelete = Array.from(this.buffers.keys()).filter((key) =>
      key.startsWith(`${roomId}:`),
    );
    keysToDelete.forEach((key) => this.buffers.delete(key));
    this.logger.debug(
      `Cleared ICE candidate buffers for room ${roomId} (${keysToDelete.length} buffers)`,
    );
  }

  cleanupStaleBuffers(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, buffer] of this.buffers.entries()) {
      if (buffer.length === 0) {
        keysToDelete.push(key);
        continue;
      }

      const allExpired = buffer.every(
        (b) => now - b.receivedAt > this.BUFFER_TIMEOUT_MS,
      );

      if (allExpired) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.buffers.delete(key);
      this.logger.debug(`Cleaned up stale ICE candidate buffer: ${key}`);
    });
  }

  getStats(): { totalBuffers: number; totalCandidates: number } {
    let totalCandidates = 0;

    for (const buffer of this.buffers.values()) {
      totalCandidates += buffer.length;
    }

    return {
      totalBuffers: this.buffers.size,
      totalCandidates,
    };
  }
}
