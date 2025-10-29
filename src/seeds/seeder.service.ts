import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import { Usuario } from '../modules/user/entities/user.entity';
import { Post, PostType } from '../modules/post/entities/post.entity';

@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name);

  constructor(private readonly dataSource: DataSource) {}

  // util: detectar si ya es hash bcrypt
  private isBcryptHash(value?: string | null): boolean {
    if (!value) return false;
    return value.startsWith('$2a$') || value.startsWith('$2b$') || value.startsWith('$2y$');
  }

  async run(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn('❌ Seeder bloqueado en producción');
      return;
    }

    const usuarioRepo = this.dataSource.getRepository(Usuario);
    const postRepo = this.dataSource.getRepository(Post);

    const usersData: Partial<Usuario>[] = JSON.parse(
      fs.readFileSync('src/seeds/data/user.json', 'utf-8'),
    );
    const postsData: any[] = JSON.parse(
      fs.readFileSync('src/seeds/data/posts.json', 'utf-8'),
    );

    const SALT_ROUNDS = 12;

    // 🧍 Crear/actualizar usuarios (con hash)
    this.logger.log(`Creando ${usersData.length} usuarios...`);
    const usuarios: Usuario[] = [];

    for (const u of usersData) {
      // Traer con password pese a select:false
      let usuario = await usuarioRepo
        .createQueryBuilder('u')
        .addSelect('u.password')
        .where('u.email = :email', { email: u.email })
        .getOne();

      if (!usuario) {
        const nuevo = usuarioRepo.create(u);

        // hash si viene plano
        if (nuevo.password && !this.isBcryptHash(nuevo.password)) {
          nuevo.password = await bcrypt.hash(nuevo.password, SALT_ROUNDS);
        }

        usuario = await usuarioRepo.save(nuevo);
      } else {
        // backfill: si el JSON trae password y el usuario existente no tiene hash
        if (u.password && !this.isBcryptHash(usuario.password)) {
          usuario.password = await bcrypt.hash(u.password, SALT_ROUNDS);
          await usuarioRepo.save(usuario);
        }
      }

      usuarios.push(usuario);
    }

    // 📝 Posts asociados
    this.logger.log(`Creando ${postsData.length} posts...`);
    for (const p of postsData) {
      const usuario = usuarios.find((u) => u.email === p.userEmail);
      if (!usuario) continue;

      const nuevoPost = postRepo.create({
        content: p.content,
        type: PostType.TEXT,
        user: usuario,
      });
      await postRepo.save(nuevoPost);
    }

    this.logger.log('✅ Mockeo completado correctamente (con contraseñas hasheadas)');
  }
}
