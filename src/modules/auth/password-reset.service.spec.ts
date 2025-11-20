import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordResetService } from './password-reset.service';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { User, UserRole, UserStatus } from '../user/entities/user.entity';
import { GmailService } from '../gmail/gmail.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let resetTokenRepo: Repository<PasswordResetToken>;
  let userRepo: Repository<User>;
  let gmailService: GmailService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@ejemplo.com',
    password: 'hashedPassword',
    name: 'Test',
    lastName: 'User',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
    profilePicture: null,
    coverPicture: null,
    biography: null,
    location: null,
    website: null,
    username: 'testuser',
    joinDate: new Date(),
    deletedAt: null,
    following: [],
    followers: [],
    posts: [],
    comments: [],
    receivedNotifications: [],
    sentNotifications: [],
    subscription: null,
    subscriptionPlan: undefined,
    subscriptionExpiresAt: undefined,
    payments: [],
    cohorteMembers: [],
    cohorteMaterial: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: GmailService,
          useValue: {
            sendMessage: jest.fn().mockResolvedValue({ dataId: '123' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:3000';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    resetTokenRepo = module.get<Repository<PasswordResetToken>>(
      getRepositoryToken(PasswordResetToken),
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    gmailService = module.get<GmailService>(GmailService);
  });

  describe('createResetToken', () => {
    it('debería crear un token de recuperación y enviar email', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser);
      jest
        .spyOn(resetTokenRepo, 'delete')
        .mockResolvedValueOnce({ affected: 1 } as any);
      jest.spyOn(resetTokenRepo, 'create').mockReturnValueOnce({
        tokenHash: 'hashedToken',
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(),
        used: false,
      } as any);
      jest.spyOn(resetTokenRepo, 'save').mockResolvedValueOnce({} as any);
      jest
        .spyOn(gmailService, 'sendMessage')
        .mockResolvedValueOnce({ dataId: '123' } as any);

      const result = await service.createResetToken(mockUser.email);

      expect(result.success).toBe(true);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: mockUser.email },
      });
      expect(gmailService.sendMessage).toHaveBeenCalled();
    });

    it('debería devolver mensaje de seguridad si el email no existe', async () => {
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(null);

      const result = await service.createResetToken('noexiste@ejemplo.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Si el email existe');
    });
  });

  describe('validateToken', () => {
    it('debería lanzar error si el token ha expirado', async () => {
      const expiredToken = {
        ...mockUser,
        tokenHash: 'hashedToken',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() - 1000), // Expirado
        used: false,
      } as any;

      jest.spyOn(resetTokenRepo, 'find').mockResolvedValueOnce([expiredToken]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser);

      await expect(service.validateToken('plainToken')).rejects.toThrow(
        'El token ha expirado',
      );
    });

    it('debería lanzar error si el token es inválido', async () => {
      jest.spyOn(resetTokenRepo, 'find').mockResolvedValueOnce([]);

      await expect(service.validateToken('invalidToken')).rejects.toThrow(
        'Token de recuperación inválido',
      );
    });
  });

  describe('resetPassword', () => {
    it('debería resetear la contraseña correctamente', async () => {
      const futureDate = new Date(Date.now() + 1000);
      const resetToken = {
        tokenHash: 'hashedToken',
        userId: mockUser.id,
        expiresAt: futureDate,
        used: false,
      } as any;

      jest.spyOn(resetTokenRepo, 'find').mockResolvedValueOnce([resetToken]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser);
      jest.spyOn(userRepo, 'save').mockResolvedValueOnce(mockUser);
      jest.spyOn(resetTokenRepo, 'save').mockResolvedValueOnce(resetToken);

      // Mock bcrypt para que coincida el token
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
      jest.spyOn(bcrypt, 'hash').mockResolvedValueOnce('newHashedPassword');

      const result = await service.resetPassword(
        'plainToken',
        'NewPassword123',
      );

      expect(result.success).toBe(true);
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('debería lanzar error si el token ya fue usado', async () => {
      const futureDate = new Date(Date.now() + 1000);
      const usedToken = {
        tokenHash: 'hashedToken',
        userId: mockUser.id,
        expiresAt: futureDate,
        used: true, // Ya usado
      } as any;

      jest.spyOn(resetTokenRepo, 'find').mockResolvedValueOnce([usedToken]);
      jest.spyOn(userRepo, 'findOne').mockResolvedValueOnce(mockUser);

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      await expect(
        service.resetPassword('plainToken', 'NewPassword123'),
      ).rejects.toThrow('Este token ya ha sido utilizado');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('debería eliminar tokens expirados', async () => {
      jest
        .spyOn(resetTokenRepo, 'delete')
        .mockResolvedValueOnce({ affected: 5 } as any);

      const result = await service.cleanupExpiredTokens();

      expect(result.deletedCount).toBe(5);
    });
  });
});
