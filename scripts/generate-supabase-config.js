import { writeFile } from 'node:fs/promises';
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

const configPath = fileURLToPath(new URL('../js/model/supabaseConfig.js', import.meta.url));
const config = [
  `export const SUPABASE_URL = ${JSON.stringify(supabaseUrl)};`,
  `export const SUPABASE_PUBLISHABLE_KEY = ${JSON.stringify(publishableKey)};`,
  '',
].join('\n');

await writeFile(configPath, config, { encoding: 'utf8', mode: 0o600 });
