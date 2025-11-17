export interface Participant {
  userId: string;
  socketId: string;
  audio: boolean;
  video: boolean;
  screen: boolean;
  joinedAt: Date;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  participants: Map<string, Participant>;
  maxParticipants: number;
  createdAt: Date;
  isActive: boolean;
}

export class RoomEntity implements Room {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  participants: Map<string, Participant>;
  maxParticipants: number;
  createdAt: Date;
  isActive: boolean;

  constructor(partial: Partial<Room>) {
    this.id = partial.id || '';
    this.name = partial.name || '';
    this.description = partial.description;
    this.createdBy = partial.createdBy || '';
    this.participants = partial.participants || new Map();
    this.maxParticipants = partial.maxParticipants || 10;
    this.createdAt = partial.createdAt || new Date();
    this.isActive = partial.isActive ?? true;
  }

  addParticipant(participant: Participant): boolean {
    if (this.participants.size >= this.maxParticipants) {
      return false;
    }
    this.participants.set(participant.userId, participant);
    return true;
  }

  removeParticipant(userId: string): void {
    this.participants.delete(userId);
  }

  getParticipant(userId: string): Participant | undefined {
    return this.participants.get(userId);
  }

  hasParticipant(userId: string): boolean {
    return this.participants.has(userId);
  }

  isFull(): boolean {
    return this.participants.size >= this.maxParticipants;
  }

  isEmpty(): boolean {
    return this.participants.size === 0;
  }

  getParticipantsList(): Participant[] {
    return Array.from(this.participants.values());
  }
}
