"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmConfig = void 0;
const typeOrmConfig = (config) => ({
    type: 'postgres',
    url: config.get('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: true,
    logging: true,
});
exports.typeOrmConfig = typeOrmConfig;
//# sourceMappingURL=typeorm.config.js.map