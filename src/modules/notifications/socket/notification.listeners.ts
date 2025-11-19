import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';

import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../../user/entities/user.entity';
import { Post } from '../../post/entities/post.entity';
import { Comment } from '../../comment/entities/comment.entity';
import type { DomainEventPayload } from './types/domain-event.payload';

@Injectable()
export class NotificationListeners {
  private readonly logger = new Logger(NotificationListeners.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
  ) {}

  // ========== helpers ==========
  private async safeUser(id?: string | null) {
    if (!id) return null;
    return this.userRepo.findOne({ where: { id } });
  }

  private pick<T = any>(...candidates: Array<T | undefined>): T | undefined {
    return candidates.find((x) => x !== undefined);
  }

  private cutoffDate48h() {
    const d = new Date();
    d.setHours(d.getHours() - 48);
    return d;
    // si preferís exacto cada 48h por cron, igual usamos este cutoff
  }

  // ========== comment.created ==========
  @OnEvent('comment.created')
  async onCommentCreated(payload: DomainEventPayload) {
    try {
      // posibles orígenes del id de comment y post
      const commentId = this.pick(
        payload.result?.id,
        payload.body?.id,
        payload.body?.commentId,
      );
      const postId = this.pick(
        payload.result?.postId,
        payload.body?.postId,
        payload.params?.postId,
      );

      if (!commentId) {
        this.logger.warn('[comment.created] commentId no identificado');
        return;
      }

      // cargamos el comment completo (incluye postId, authorId, parentId)
      const comment = await this.commentRepo.findOne({
        where: { id: commentId },
      });
      if (!comment) return;

      // el autor del comentario es el sender
      const sender = await this.safeUser(payload.userId ?? comment.authorId);

      // el receptor:
      // - si es respuesta: dueño del parent comment
      // - si es comentario directo: dueño del post
      let receiverId: string | null = null;

      if (comment.parentId) {
        const parent = await this.commentRepo.findOne({
          where: { id: comment.parentId },
        });
        receiverId = parent?.authorId ?? null;
      } else {
        const post = postId
          ? await this.postRepo.findOne({ where: { id: postId } })
          : null;
        receiverId = post?.userId ?? null;
      }

      if (!sender?.id || !receiverId || sender.id === receiverId) return;

      const type = comment.parentId
        ? NotificationType.REPLY_COMMENT
        : NotificationType.COMMENT_POST;

      await this.notificationRepo.save(
        this.notificationRepo.create({
          receiverId,
          senderId: sender.id,
          type,
          metadata: {
            commentId: comment.id,
            postId: postId ?? comment.postId,
            preview: (comment.content || '').slice(0, 80),
          },
        }),
      );

      this.logger.debug(`[notification] ${type}`);
    } catch (e) {
      this.logger.error('[comment.created] error', e);
    }
  }

  // ========== comment.liked ==========
  @OnEvent('comment.liked')
  async onCommentLiked(payload: DomainEventPayload) {
    try {
      const commentId = this.pick(
        payload.params?.commentId,
        payload.body?.commentId,
        payload.result?.commentId,
        payload.params?.id,
      );
      if (!commentId) return;

      const comment = await this.commentRepo.findOne({
        where: { id: commentId },
      });
      if (!comment) return;

      const sender = await this.safeUser(payload.userId);
      const receiverId = comment.authorId;

      if (!sender?.id || !receiverId || sender.id === receiverId) return;

      await this.notificationRepo.save(
        this.notificationRepo.create({
          receiverId,
          senderId: sender.id,
          type: NotificationType.LIKE_COMMENT,
          metadata: {
            commentId,
          },
        }),
      );
    } catch (e) {
      this.logger.error('[comment.liked] error', e);
    }
  }

  // ========== post.liked ==========
  @OnEvent('post.liked')
  async onPostLiked(payload: DomainEventPayload) {
    try {
      const postId = this.pick(
        payload.params?.postId,
        payload.body?.postId,
        payload.result?.postId,
        payload.params?.id,
      );
      if (!postId) return;

      const post = await this.postRepo.findOne({ where: { id: postId } });
      if (!post) return;

      const sender = await this.safeUser(payload.userId);
      const receiverId = post.userId;

      if (!sender?.id || !receiverId || sender.id === receiverId) return;

      await this.notificationRepo.save(
        this.notificationRepo.create({
          receiverId,
          senderId: sender.id,
          type: NotificationType.LIKE_POST,
          metadata: { postId },
        }),
      );
    } catch (e) {
      this.logger.error('[post.liked] error', e);
    }
  }

  // ========== user.followed ==========
  @OnEvent('user.followed')
  async onUserFollowed(payload: DomainEventPayload) {
    try {
      // normalmente receiver viene en body.followedUserId o params.userId
      const receiverId = this.pick(
        payload.body?.followedUserId,
        payload.params?.userId,
        payload.result?.followedUserId,
        payload.params?.idSeguido, // 👈 tu ruta usa :idSeguido
      );

      const sender = await this.safeUser(payload.userId);

      if (!sender?.id || !receiverId || sender.id === receiverId) return;

      await this.notificationRepo.save(
        this.notificationRepo.create({
          receiverId,
          senderId: sender.id,
          type: NotificationType.NEW_FOLLOWER,
        }),
      );
    } catch (e) {
      this.logger.error('[user.followed] error', e);
    }
  }

  // ========== message.created ==========
  @OnEvent('message.created')
  async onMessageCreated(payload: DomainEventPayload) {
    try {
      const message = payload.result;
      if (!message) return;

      // obtenemos el id del sender (emisor)
      const senderId = message.sender?.id || payload.userId;

      // buscamos al receptor dentro de los participantes de la conversación
      const receiver = message.conversation?.participants?.find(
        (u: any) => u.id !== senderId,
      );
      const receiverId = receiver?.id;

      if (!senderId || !receiverId || senderId === receiverId) return;

      await this.notificationRepo.save(
        this.notificationRepo.create({
          receiverId,
          senderId,
          type: NotificationType.NEW_MESSAGE,
          metadata: {
            messageId: message.id,
            conversationId: message.conversation.id,
            contentPreview: (message.content || '').slice(0, 80),
          },
        }),
      );
    } catch (e) {
      this.logger.error('[message.created] error', e);
    }
  }

  // ========== GC: borrar >48h ==========
  // ejecuta todos los días a las 03:00; borra lo más viejo de 48h
  @Cron('0 3 * * *')
  async purgeOldNotifications() {
    const cutoff = this.cutoffDate48h();
    const toDelete = await this.notificationRepo.find({
      where: { createdAt: LessThan(cutoff) },
      select: ['id'],
      take: 1000, // barridos por lotes
    });

    if (toDelete.length === 0) return;
    await this.notificationRepo.delete(toDelete.map((n) => n.id));
    this.logger.log(`[GC] borradas ${toDelete.length} notificaciones >48h`);
  }
}
