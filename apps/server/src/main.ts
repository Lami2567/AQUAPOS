import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger, ValidationPipe } from '@nestjs/common';
import express from 'express';
import * as path from 'node:path';
import * as fs from 'node:fs';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Headers Middleware
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  // Input Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    })
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,OPTIONS',
    credentials: true,
  });

  // Serve compiled production Desktop UI if available
  const candidateDistPaths = [
    path.join(process.cwd(), 'apps', 'desktop', 'dist'),
    path.join(process.cwd(), '..', 'desktop', 'dist'),
    path.join(__dirname, '..', '..', 'desktop', 'dist'),
  ];
  const desktopDistPath = candidateDistPaths.find((p) => fs.existsSync(p));
  if (desktopDistPath) {
    app.use(express.static(desktopDistPath));
    app.use((req: any, res: any, next: any) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        const indexPath = path.join(desktopDistPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      next();
    });
    logger.log(`Serving static Desktop POS UI from: ${desktopDistPath}`);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`Water Business POS Local Server running on http://0.0.0.0:${port}/api/v1`);
}

bootstrap();
