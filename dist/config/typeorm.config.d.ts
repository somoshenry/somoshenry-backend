import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare const typeOrmConfig: (config: ConfigService) => TypeOrmModuleOptions;
