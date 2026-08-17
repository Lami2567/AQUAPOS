import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as os from 'node:os';

const desktopDir = path.join(os.homedir(), 'Desktop');
const shortcutPath = path.join(desktopDir, 'POS System.lnk');
const exePath = "C:\\Users\\USER\\Desktop\\WATER SYSTEM\\POSLauncher.exe";
const workingDir = "C:\\Users\\USER\\Desktop\\WATER SYSTEM";

console.log('Creating Desktop Shortcut: ' + shortcutPath);
const psCommand = `powershell -Command "$s = (New-Object -COM WScript.Shell).CreateShortcut('${shortcutPath}'); $s.TargetPath = '${exePath}'; $s.WorkingDirectory = '${workingDir}'; $s.Description = 'Water Business POS System'; $s.Save()"`;

try {
  execSync(psCommand, { stdio: 'inherit' });
  console.log('✔ Desktop shortcut created successfully!');
} catch (e) {
  console.error('Failed to create shortcut:', e.message);
}
