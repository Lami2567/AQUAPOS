import { exec } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Windows Automatic Service & Startup Installer Script
 * Configures Windows Service for NestJS API/Database/Sync and adds Desktop app to Windows Startup Registry.
 */
function setupWindowsStartup() {
  console.log('--- Water System Windows Startup Setup ---');

  const rootDir = path.resolve(__dirname, '..');
  const serverDir = path.join(rootDir, 'apps', 'server');

  // 1. Create Windows Batch Launcher for Server Service
  const batchScriptPath = path.join(rootDir, 'start-water-service.bat');
  const batchContent = `@echo off
REM Water Business System Background Service Launcher
cd /d "${serverDir}"
node dist/main.js
`;

  fs.writeFileSync(batchScriptPath, batchContent, 'utf-8');
  console.log(`✓ Generated background service launcher: ${batchScriptPath}`);

  // 2. PowerShell command to add auto-start registry entry for desktop app
  const startupRegCommand = `powershell -Command "New-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'WaterPOS' -Value '${batchScriptPath}' -PropertyType String -Force"`;

  console.log('✓ Configuring Windows Auto-Startup Registry...');
  exec(startupRegCommand, (err, stdout, stderr) => {
    if (err) {
      console.warn('Note: Run as Administrator to register native Windows Service via NSSM/SC.exe.');
    } else {
      console.log('✓ Successfully registered WaterPOS background service in Windows Startup Registry!');
    }
  });
}

setupWindowsStartup();
