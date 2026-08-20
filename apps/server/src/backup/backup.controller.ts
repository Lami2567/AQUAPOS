import { Controller, Get, Post, Body, Req, UseGuards, Res } from '@nestjs/common';
import { BackupService, BackupDataPackage } from './backup.service.js';
import type { Response } from 'express';

@Controller('api/v1/backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export')
  async exportBackup(@Req() req: any) {
    const userId = req.user?.id || 'u-admin-ismael';
    const username = req.user?.username || 'ismael';
    return await this.backupService.generateFullBackup(userId, username);
  }

  @Get('download')
  async downloadBackupFile(@Req() req: any, @Res() res: Response) {
    const userId = req.user?.id || 'u-admin-ismael';
    const username = req.user?.username || 'ismael';
    const pkg = await this.backupService.generateFullBackup(userId, username);

    const filename = `aquapos-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(pkg, null, 2));
  }

  @Post('restore')
  async restoreBackup(@Body() backupPackage: BackupDataPackage, @Req() req: any) {
    const userId = req.user?.id || 'u-admin-ismael';
    const username = req.user?.username || 'ismael';
    return await this.backupService.restoreBackup(backupPackage, userId, username);
  }
}
