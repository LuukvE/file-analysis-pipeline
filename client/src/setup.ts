import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';

const scheme = 'fap';
const root = process.cwd();
const desktop = `${scheme}-dev.desktop`;
const apps = join(homedir(), '.local/share/applications');
const bin = join(root, 'node_modules/electron/dist/electron');

const config = `[Desktop Entry]
Name=${scheme} (Dev)
Exec=${bin} ${root} %U
Terminal=false
Type=Application
MimeType=x-scheme-handler/${scheme};`;

mkdirSync(apps, { recursive: true });
writeFileSync(join(apps, desktop), config);
execSync(`update-desktop-database "${apps}"`);
execSync(`xdg-mime default "${desktop}" "x-scheme-handler/${scheme}"`);
