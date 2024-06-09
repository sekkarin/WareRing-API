import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '../auth.guard';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtModule, JsonWebTokenError } from '@nestjs/jwt';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { ExecutionContext } from '@nestjs/common/interfaces';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: JwtService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mySecretKey'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        JwtService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            authorization: 'Bearer myToken',
          },
        }),
      }),
    } as ExecutionContext;

    it('should throw UnauthorizedException if token is not provided', async () => {
      const mockRequest: Request = {
        headers: {},
      } as Request;
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(mockContext)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException if JWT verification fails', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockRejectedValueOnce(new Error());

      await expect(guard.canActivate(mockContext)).rejects.toThrowError(
        ForbiddenException,
      );
    });

    it('should return true if JWT verification succeeds', async () => {
      jest.spyOn(jwtService, 'verifyAsync').mockResolvedValueOnce({
        sub: 'userId',
        username: 'testUser',
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
    it('should throw ForbiddenException when JsonWebTokenError ', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValueOnce(
          new JsonWebTokenError('Invalid', new Error('Invalid')),
        );

      await expect(guard.canActivate(mockContext)).rejects.toThrowError(
        ForbiddenException,
      );

      // expect(result).toBe(true);
    });
  });
});
