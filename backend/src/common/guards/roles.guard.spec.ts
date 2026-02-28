import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockContext = (role: UserRole, requiredRoles?: UserRole[]) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role } }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access when user has required role', () => {
    const ctx = mockContext(UserRole.ADMIN, [UserRole.ADMIN]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny access when user has wrong role', () => {
    const ctx = mockContext(UserRole.WAREHOUSE, [UserRole.ADMIN]);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should allow access when no role restriction is defined', () => {
    const ctx = mockContext(UserRole.WAREHOUSE, undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
