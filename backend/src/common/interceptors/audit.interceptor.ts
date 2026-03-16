import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';
import { AuditAction } from '../../modules/audit-log/entities/audit-log.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditLogService: AuditLogService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, user } = request;

    if (!['POST', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseData) => {
        const entityName =
          this.reflector.get<string>('audit:entity', context.getClass()) ?? 'Unknown';

        const accion =
          method === 'POST' ? AuditAction.CREATE
          : method === 'PATCH' ? AuditAction.UPDATE
          : AuditAction.DELETE;

        await this.auditLogService.log({
          userId: user?.id ?? null,
          entidad: entityName,
          entidadId: responseData?.id ?? null,
          accion,
          datosDespues: responseData ?? null,
        });
      }),
    );
  }
}
