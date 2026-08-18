import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@water-business/shared-types';

@Injectable()
export class AuthService {
  constructor(
    private dbService: DatabaseService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const rawUser = await this.dbService.queryOne<any>(
      'SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND is_active = 1',
      [username.trim()]
    );

    if (!rawUser) {
      throw new UnauthorizedException('Invalid credentials or account inactive.');
    }

    let isMatch = false;
    const cleanPass = pass.trim();

    if (rawUser.password_hash) {
      try {
        isMatch = await bcrypt.compare(cleanPass, rawUser.password_hash);
      } catch (e) {
        isMatch = false;
      }
      if (!isMatch && rawUser.password_hash === cleanPass) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return {
      id: rawUser.id,
      username: rawUser.username,
      fullName: rawUser.full_name,
      role: rawUser.role as UserRole,
      branchId: rawUser.branch_id,
      storeId: rawUser.store_id,
      isActive: Boolean(rawUser.is_active),
      createdAt: rawUser.created_at,
      updatedAt: rawUser.created_at,
    };
  }

  async login(username: string, pass: string) {
    const user = await this.validateUser(username, pass);
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      branchId: user.branchId,
      storeId: user.storeId,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '12h' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user,
    };
  }
}
