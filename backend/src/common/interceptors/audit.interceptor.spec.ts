import { AuditInterceptor } from './audit.interceptor';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';
import { AuditAction } from '../../modules/audit-log/entities/audit-log.entity';
import { Reflector } from '@nestjs/core';
import { of, throwError } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

const mockAuditLogService = () => ({
  log: jest.fn().mockResolvedValue(undefined),
});

const mockReflector = () => ({
  get: jest.fn().mockReturnValue('Material'),
});

const makeContext = (method: string, userId = 1): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ method, user: { id: userId } }) }),
    getClass: () => ({}),
  } as unknown as ExecutionContext);

const makeHandler = (data: any): CallHandler => ({
  handle: () => of(data),
});

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: ReturnType<typeof mockAuditLogService>;
  let reflector: ReturnType<typeof mockReflector>;

  beforeEach(() => {
    auditService = mockAuditLogService();
    reflector = mockReflector();
    interceptor = new AuditInterceptor(auditService as unknown as AuditLogService, reflector as unknown as Reflector);
  });

  it('intercepts POST and creates CREATE audit record', (done) => {
    const ctx = makeContext('POST');
    const handler = makeHandler({ id: 1, nombre: 'Cable' });

    interceptor.intercept(ctx, handler).subscribe({
      next: () => {},
      complete: () => {
        setTimeout(() => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({ accion: AuditAction.CREATE, entidad: 'Material' }),
          );
          done();
        }, 10);
      },
    });
  });

  it('intercepts PATCH and creates UPDATE audit record', (done) => {
    const ctx = makeContext('PATCH');
    const handler = makeHandler({ id: 2, nombre: 'Updated' });

    interceptor.intercept(ctx, handler).subscribe({
      next: () => {},
      complete: () => {
        setTimeout(() => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({ accion: AuditAction.UPDATE }),
          );
          done();
        }, 10);
      },
    });
  });

  it('intercepts DELETE and creates DELETE audit record', (done) => {
    const ctx = makeContext('DELETE');
    const handler = makeHandler({ message: 'deleted' });

    interceptor.intercept(ctx, handler).subscribe({
      next: () => {},
      complete: () => {
        setTimeout(() => {
          expect(auditService.log).toHaveBeenCalledWith(
            expect.objectContaining({ accion: AuditAction.DELETE }),
          );
          done();
        }, 10);
      },
    });
  });

  it('does NOT audit GET requests', (done) => {
    const ctx = makeContext('GET');
    const handler = makeHandler({ data: [] });

    interceptor.intercept(ctx, handler).subscribe({
      complete: () => {
        expect(auditService.log).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('does NOT create audit log if handler throws', (done) => {
    const ctx = makeContext('POST');
    const handler: CallHandler = { handle: () => throwError(() => new Error('fail')) };

    interceptor.intercept(ctx, handler).subscribe({
      error: () => {
        expect(auditService.log).not.toHaveBeenCalled();
        done();
      },
    });
  });
});
