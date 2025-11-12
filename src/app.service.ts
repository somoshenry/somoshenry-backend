import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager'; // 👈 import type

@Injectable()
export class AppService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async getHello(): Promise<string> {
    await this.cacheManager.set('prueba', 'Funciona Redis!', 10);
    const value =
      (await this.cacheManager.get<string>('prueba')) || 'sin valor';
    console.log('🧠 Valor guardado en Redis:', value);
    return `Redis está funcionando: ${value}`;
  }
}
