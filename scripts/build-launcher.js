import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildLauncher() {
  console.log('====================================================');
  console.log('🔨 BUILDING WINDOWS PRODUCTION LAUNCHER (POSLauncher.exe)');
  console.log('====================================================\n');

  const rootDir = path.resolve(__dirname, '..');
  const csFile = path.join(rootDir, 'launcher', 'POSLauncher.cs');
  const exeOutput = path.join(rootDir, 'POSLauncher.exe');

  if (!fs.existsSync(csFile)) {
    console.error(`Error: Source file not found: ${csFile}`);
    process.exit(1);
  }

  // Windows C# compiler path
  const cscPath = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';

  if (!fs.existsSync(cscPath)) {
    console.error(`Error: Windows .NET C# compiler not found at ${cscPath}`);
    process.exit(1);
  }

  console.log(`Compiling ${csFile} into native Windows GUI executable...`);

  // Target: winexe (Windows GUI Executable - ZERO console window)
  const compileCmd = `"${cscPath}" /target:winexe /r:System.Windows.Forms.dll /r:System.dll /out:"${exeOutput}" "${csFile}"`;

  try {
    execSync(compileCmd, { stdio: 'inherit' });
    console.log(`\n✔ SUCCESS! Built production launcher executable:`);
    console.log(`   --> ${exeOutput}\n`);

    // Create desktop shortcut helper script
    createShortcutScript(rootDir, exeOutput);
  } catch (err) {
    console.error('❌ Failed to compile POSLauncher.exe:', err.message);
    process.exit(1);
  }
}

function createShortcutScript(rootDir, exePath) {
  const setupScript = path.join(rootDir, 'scripts', 'create-desktop-shortcut.js');
  const shortcutContent = `import { execSync } from 'node:child_process';
import * as path from 'node:path';
import * as os from 'node:os';

const desktopDir = path.join(os.homedir(), 'Desktop');
const shortcutPath = path.join(desktopDir, 'POS System.lnk');
const exePath = ${JSON.stringify(exePath)};
const workingDir = ${JSON.stringify(rootDir)};

console.log('Creating Desktop Shortcut: ' + shortcutPath);
const psCommand = \`powershell -Command "$s = (New-Object -COM WScript.Shell).CreateShortcut('\${shortcutPath}'); $s.TargetPath = '\${exePath}'; $s.WorkingDirectory = '\${workingDir}'; $s.Description = 'Water Business POS System'; $s.Save()"\`;

try {
  execSync(psCommand, { stdio: 'inherit' });
  console.log('✔ Desktop shortcut created successfully!');
} catch (e) {
  console.error('Failed to create shortcut:', e.message);
}
`;
  fs.writeFileSync(setupScript, shortcutContent, 'utf-8');
  console.log(`✓ Created shortcut helper script: ${setupScript}`);

  // Automatically run the shortcut generator
  try {
    execSync(`node "${setupScript}"`, { stdio: 'inherit' });
  } catch (_) {}
}

buildLauncher();
