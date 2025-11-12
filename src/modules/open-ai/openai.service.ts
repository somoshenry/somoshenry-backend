/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export type ClasificacionContenido = 'inapropiado' | 'apropiado';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('Faltan variables de entorno: OPENAI_API_KEY');
    }

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  private async clasificarTexto(
    texto: string,
  ): Promise<ClasificacionContenido> {
    try {
      const moderacion = await this.openai.moderations.create({
        model: 'omni-moderation-latest',
        input: texto,
      });
      const esFlagged = moderacion.results[0].flagged;
      return esFlagged ? 'inapropiado' : 'apropiado';
    } catch (error) {
      console.error('❌ Error al clasificar texto:', error);
      throw error;
    }
  }

  async isInappropriate(texto: string): Promise<boolean> {
    try {
      const clasificacion = await this.clasificarTexto(texto);
      return clasificacion === 'inapropiado';
    } catch (error) {
      console.error('❌ Error al procesar texto (isInappropriate):', error);
      throw error;
    }
  }
}
