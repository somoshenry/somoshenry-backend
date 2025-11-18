import { Injectable, Logger } from '@nestjs/common';

export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface IceServersConfig {
  iceServers: RTCIceServer[];
  timestamp: number;
}

@Injectable()
export class IceServerManagerService {
  private readonly logger = new Logger(IceServerManagerService.name);
  private cachedIceServers: IceServersConfig | null = null;
  private readonly STUN_SERVERS = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302',
  ];

  constructor() {
    this.initializeIceServers();
  }

  private initializeIceServers(): void {
    const turnUrl = process.env.TURN_URL;
    const turnUsername = process.env.TURN_USERNAME;
    const turnPassword = process.env.TURN_PASSWORD;

    const iceServers: RTCIceServer[] = this.STUN_SERVERS.map((url) => ({
      urls: url,
    }));

    if (turnUrl && turnUsername && turnPassword) {
      iceServers.push({
        urls: turnUrl,
        username: turnUsername,
        credential: turnPassword,
        credentialType: 'password',
      });
      this.logger.log(`TURN server configured: ${turnUrl}`);
    } else {
      this.logger.warn('TURN server not configured. Fallback to STUN only.');
    }

    this.cachedIceServers = {
      iceServers,
      timestamp: Date.now(),
    };
  }

  getIceServers(): RTCIceServer[] {
    if (!this.cachedIceServers) {
      this.initializeIceServers();
    }

    return this.cachedIceServers!.iceServers;
  }

  getIceServersConfig(): IceServersConfig {
    if (!this.cachedIceServers) {
      this.initializeIceServers();
    }

    return this.cachedIceServers!;
  }

  hasTurn(): boolean {
    return this.getIceServers().some((server) => {
      if (Array.isArray(server.urls)) {
        const hasTurnUrl = server.urls.some(
          (url: string) => url.startsWith('turn:') || url.startsWith('turns:'),
        );
        return hasTurnUrl;
      }

      const urlStr = server.urls;
      const isTurn = urlStr.startsWith('turn:') || urlStr.startsWith('turns:');
      return isTurn;
    });
  }

  refreshIceServers(): void {
    this.logger.log('Refreshing ICE servers configuration');
    this.initializeIceServers();
  }
}
