import { copyFileSync, lstatSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public');

// Only these site directories can be published. Repository metadata, build
// scripts, configuration, dependency manifests and dotfiles stay outside public.
const siteDirectories = [
  'about', 'after-hours-playbook', 'ai-receptionist-cost', 'contractors',
  'electricians', 'five-prompts', 'follow-up-pack', 'general-contractors',
  'hvac', 'img', 'landscapers', 'london', 'missed-call-calculator',
  'mortgage-brokers', 'plumbers', 'posts', 'pricing', 'proof', 'roofers',
  'systems', 'teams', 'vendor-questions', 'workshop',
];
const publicExtensions = new Set([
  '.html', '.css', '.js', '.jpg', '.jpeg', '.png', '.svg', '.webp', '.gif',
  '.ico', '.woff', '.woff2',
]);
const files = ['index.html', 'robots.txt', 'sitemap.xml'];

function collect(relativeDirectory) {
  for (const name of readdirSync(join(root, relativeDirectory))) {
    if (name.startsWith('.')) continue;
    const relative = join(relativeDirectory, name);
    const stat = lstatSync(join(root, relative));
    if (stat.isSymbolicLink()) throw new Error(`Refusing to publish symlink: ${relative}`);
    if (stat.isDirectory()) collect(relative);
    else if (stat.isFile() && publicExtensions.has(extname(name).toLowerCase())) files.push(relative);
  }
}

for (const directory of siteDirectories) {
  if (!lstatSync(join(root, directory)).isDirectory()) {
    throw new Error(`Expected a site directory: ${directory}`);
  }
  collect(directory);
}
for (const file of files) {
  if (!lstatSync(join(root, file)).isFile()) throw new Error(`Expected a site file: ${file}`);
}

rmSync(output, { recursive: true, force: true });
mkdirSync(output);
for (const file of files) {
  const destination = join(output, file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(root, file), destination);
}
console.log(`Published ${files.length} site files to public/.`);
