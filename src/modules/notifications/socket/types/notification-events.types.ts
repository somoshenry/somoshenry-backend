import { Comment } from '../../../comment/entities/comment.entity';
import { Post } from '../../../post/entities/post.entity';
import { User } from '../../../user/entities/user.entity';
import { NotificationType } from '../entities/notification.entity';

export interface BaseEventPayload {
  sender: User;
  receiver: User;
  metadata?: Record<string, any>;
}

export interface CommentCreatedEvent extends BaseEventPayload {
  type: NotificationType.COMMENT_POST | NotificationType.REPLY_COMMENT;
  comment: Comment;
  post: Post;
}

export interface CommentLikedEvent extends BaseEventPayload {
  type: NotificationType.LIKE_COMMENT;
  comment: Comment;
}

export interface PostLikedEvent extends BaseEventPayload {
  type: NotificationType.LIKE_POST;
  post: Post;
}

export interface NewFollowerEvent extends BaseEventPayload {
  type: NotificationType.NEW_FOLLOWER;
}

export interface NewMessageEvent extends BaseEventPayload {
  type: NotificationType.NEW_MESSAGE;
  message: {
    id: string;
    content: string;
    conversationId: string;
  };
}
