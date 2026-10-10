import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const supabaseUrl = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the deployment environment.');
}

const parsedUrl = new URL(supabaseUrl);
if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname.endsWith('.supabase.co')) {
  throw new Error('SUPABASE_URL must be an HTTPS Supabase project URL.');
}

const outputPath = fileURLToPath(new URL('../public/', import.meta.url));
await mkdir(outputPath, { recursive: true });

for (const page of ['index.html', 'timetable.html', 'history.html', 'login.html']) {
  await cp(new URL(`../${page}`, import.meta.url), path.join(outputPath, page));
}
await cp(new URL('../css/', import.meta.url), path.join(outputPath, 'css'), { recursive: true });
await cp(new URL('../js/', import.meta.url), path.join(outputPath, 'js'), {
  recursive: true,
  filter: (source) => path.basename(source) !== 'supabaseConfig.js',
});

const configPath = path.join(outputPath, 'js', 'model', 'supabaseConfig.js');
await mkdir(path.dirname(configPath), { recursive: true });
const config = [
  `export const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};`,
  `export const SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(publishableKey)};`,
  '',
].join('\n');

await writeFile(configPath, config, { encoding: 'utf8', mode: 0o600 });
