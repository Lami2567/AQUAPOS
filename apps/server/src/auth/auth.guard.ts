import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from './roles.decorator.js';
import { UserRole } from '@water-business/shared-types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header.');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token, { secret: 'WATER_POS_SECRET_KEY_2026' });
      request.user = payload;

      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      const hasRole = requiredRoles.includes(payload.role as UserRole) || payload.role === UserRole.SUPER_ADMIN;
      if (!hasRole) {
        throw new ForbiddenException(`Insufficient permissions for role: ${payload.role}`);
      }

      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }
  }
}
