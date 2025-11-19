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
    const turnProtocol = process.env.TURN_PROTOCOL || 'udp'; // udp, tcp, tls

    const iceServers: RTCIceServer[] = this.STUN_SERVERS.map((url) => ({
      urls: url,
    }));

    // Agregar servidor TURN si está configurado
    if (turnUrl && turnUsername && turnPassword) {
      // Soportar múltiples URLs de TURN separadas por coma
      const turnUrls = turnUrl.split(',').map((url) => {
        let formattedUrl = url.trim();
        // Asegurar que tenga el protocolo correcto
        if (
          !formattedUrl.startsWith('turn:') &&
          !formattedUrl.startsWith('turns:')
        ) {
          const protocol = turnProtocol === 'tls' ? 'turns' : 'turn';
          formattedUrl = `${protocol}:${formattedUrl}`;
        }
        return formattedUrl;
      });

      iceServers.push({
        urls: turnUrls,
        username: turnUsername,
        credential: turnPassword,
        credentialType: 'password',
      });

      this.logger.log(
        `✅ TURN server configurado: ${turnUrls.join(', ')} (${turnProtocol.toUpperCase()})`,
      );
    } else {
      this.logger.warn(
        '⚠️  TURN no configurado. Usarán solo servidores STUN públicos (limitado detrás de firewalls)',
      );
    }

    this.cachedIceServers = {
      iceServers,
      timestamp: Date.now(),
    };

    this.logger.debug(
      `🧊 ICE Servers inicializados: ${iceServers.length} servidores (${this.getServerTypes(iceServers).join(', ')})`,
    );
  }

  private getServerTypes(servers: RTCIceServer[]): string[] {
    const types = new Set<string>();
    for (const server of servers) {
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      for (const url of urls) {
        if (url.startsWith('turn')) types.add('TURN');
        if (url.startsWith('stun')) types.add('STUN');
      }
    }
    return Array.from(types);
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
