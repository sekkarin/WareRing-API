import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { roles: ['admin', 'user'] },
        }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;

    it('should throw ForbiddenException if required roles are not provided', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(undefined);
      expect(() => guard.canActivate(mockContext)).toThrowError(
        ForbiddenException,
      );
    });

    it('should return true if user has at least one of the required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(['user']);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should return false if user does not have any of the required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValueOnce(['role-invalid']);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });
});
