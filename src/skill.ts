import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function installSkill(): Promise<void> {
  const skillDir = join(homedir(), '.claude', 'skills');
  mkdirSync(skillDir, { recursive: true });

  // Try to read SKILL.md from package root (one level up from src/ or dist/)
  let skillContent: string;
  try {
    skillContent = readFileSync(join(__dirname, '..', 'SKILL.md'), 'utf-8');
  } catch {
    skillContent = readFileSync(join(__dirname, '..', '..', 'SKILL.md'), 'utf-8');
  }

  const destPath = join(skillDir, 'mathem-cli.md');
  writeFileSync(destPath, skillContent, 'utf-8');
  console.log(`Skill installed to ${destPath}`);
}
