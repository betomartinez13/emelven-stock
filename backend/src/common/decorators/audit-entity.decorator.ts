import { SetMetadata } from '@nestjs/common';

export const AuditEntity = (name: string) => SetMetadata('audit:entity', name);
