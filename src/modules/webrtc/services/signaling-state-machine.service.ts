import { Injectable, Logger } from '@nestjs/common';

export enum SignalingState {
  IDLE = 'idle',
  OFFER_SENT = 'offer_sent',
  OFFER_RECEIVED = 'offer_received',
  ANSWER_SENT = 'answer_sent',
  ANSWER_RECEIVED = 'answer_received',
  CONNECTED = 'connected',
  FAILED = 'failed',
  RESTARTING = 'restarting',
}

export interface SignalingContext {
  roomId: string;
  localUserId: string;
  remoteUserId: string;
  state: SignalingState;
  offerSequence?: number;
  answerSequence?: number;
  lastOfferTimestamp?: number;
  lastAnswerTimestamp?: number;
  iceCandidateCount: number;
  failureCount: number;
  createdAt: number;
  lastUpdatedAt: number;
}

@Injectable()
export class SignalingStateMachineService {
  private readonly logger = new Logger(SignalingStateMachineService.name);
  private readonly contexts = new Map<string, SignalingContext>();
  private readonly SEQUENCE_TIMEOUT_MS = 30000;
  private readonly MAX_FAILURES = 3;

  getContextKey(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): string {
    return `${roomId}:${localUserId}:${remoteUserId}`;
  }

  getOrCreateContext(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): SignalingContext {
    const key = this.getContextKey(roomId, localUserId, remoteUserId);

    if (!this.contexts.has(key)) {
      const context: SignalingContext = {
        roomId,
        localUserId,
        remoteUserId,
        state: SignalingState.IDLE,
        iceCandidateCount: 0,
        failureCount: 0,
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
      this.contexts.set(key, context);
      this.logger.debug(
        `Created signaling context: ${localUserId} <-> ${remoteUserId} in room ${roomId}`,
      );
    }

    return this.contexts.get(key)!;
  }

  getContext(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): SignalingContext | null {
    const key = this.getContextKey(roomId, localUserId, remoteUserId);
    return this.contexts.get(key) || null;
  }

  recordOfferSent(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    sequence: number,
  ): void {
    const context = this.getOrCreateContext(roomId, localUserId, remoteUserId);
    context.state = SignalingState.OFFER_SENT;
    context.offerSequence = sequence;
    context.lastOfferTimestamp = Date.now();
    context.lastUpdatedAt = Date.now();
  }

  recordOfferReceived(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    sequence: number,
  ): boolean {
    const context = this.getOrCreateContext(roomId, localUserId, remoteUserId);

    const isDuplicate =
      context.offerSequence === sequence &&
      Date.now() - context.lastOfferTimestamp! < this.SEQUENCE_TIMEOUT_MS;

    if (isDuplicate) {
      const key = this.getContextKey(roomId, localUserId, remoteUserId);
      this.logger.debug(`Duplicate offer detected for context ${key}`);
      return false;
    }

    context.state = SignalingState.OFFER_RECEIVED;
    context.offerSequence = sequence;
    context.lastOfferTimestamp = Date.now();
    context.lastUpdatedAt = Date.now();
    context.failureCount = 0;

    return true;
  }

  recordAnswerSent(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    sequence: number,
  ): void {
    const context = this.getOrCreateContext(roomId, localUserId, remoteUserId);
    context.state = SignalingState.ANSWER_SENT;
    context.answerSequence = sequence;
    context.lastAnswerTimestamp = Date.now();
    context.lastUpdatedAt = Date.now();
  }

  recordAnswerReceived(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
    sequence: number,
  ): boolean {
    const context = this.getOrCreateContext(roomId, localUserId, remoteUserId);

    const isDuplicate2 =
      context.answerSequence === sequence &&
      Date.now() - context.lastAnswerTimestamp! < this.SEQUENCE_TIMEOUT_MS;

    if (isDuplicate2) {
      const key = this.getContextKey(roomId, localUserId, remoteUserId);
      this.logger.debug(`Duplicate answer detected for context ${key}`);
      return false;
    }

    context.state = SignalingState.ANSWER_RECEIVED;
    context.answerSequence = sequence;
    context.lastAnswerTimestamp = Date.now();
    context.lastUpdatedAt = Date.now();
    context.failureCount = 0;

    return true;
  }

  recordIceCandidate(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): void {
    const context = this.getOrCreateContext(roomId, localUserId, remoteUserId);
    context.iceCandidateCount++;
    context.lastUpdatedAt = Date.now();
  }

  recordIceRestart(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): void {
    const context = this.getOrCreateContext(roomId, localUserId, remoteUserId);
    context.state = SignalingState.RESTARTING;
    context.iceCandidateCount = 0;
    context.lastUpdatedAt = Date.now();
  }

  recordConnectionEstablished(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): void {
    const context = this.getOrCreateContext(roomId, localUserId, remoteUserId);
    context.state = SignalingState.CONNECTED;
    context.failureCount = 0;
    context.lastUpdatedAt = Date.now();
  }

  recordFailure(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): boolean {
    const context = this.getOrCreateContext(roomId, localUserId, remoteUserId);
    context.failureCount++;
    context.state = SignalingState.FAILED;
    context.lastUpdatedAt = Date.now();

    return context.failureCount < this.MAX_FAILURES;
  }

  canRetry(roomId: string, localUserId: string, remoteUserId: string): boolean {
    const context = this.getContext(roomId, localUserId, remoteUserId);
    if (!context) return true;
    return context.failureCount < this.MAX_FAILURES;
  }

  cleanup(roomId: string, localUserId: string, remoteUserId: string): void {
    const key = this.getContextKey(roomId, localUserId, remoteUserId);
    this.contexts.delete(key);
  }

  cleanupRoom(roomId: string): void {
    const keysToDelete = Array.from(this.contexts.keys()).filter((key) =>
      key.startsWith(`${roomId}:`),
    );
    keysToDelete.forEach((key) => this.contexts.delete(key));
    this.logger.debug(
      `Cleaned up ${keysToDelete.length} signaling contexts for room ${roomId}`,
    );
  }

  getContextStatus(
    roomId: string,
    localUserId: string,
    remoteUserId: string,
  ): SignalingState {
    const context = this.getContext(roomId, localUserId, remoteUserId);
    return context?.state || SignalingState.IDLE;
  }
}
