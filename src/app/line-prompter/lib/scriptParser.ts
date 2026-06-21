import type { ParsedScript, ScriptLine } from '../types/script';

const CHARACTER_NAME = '([A-Z][A-Z0-9\\s.\'\\-()]+?)(?:\\s*\\([^)]*\\))?';

/** ALL CAPS name, optional parenthetical, colon before dialogue */
const CHARACTER_LINE = new RegExp(`^${CHARACTER_NAME}\\s*:\\s*(.+)$`);

/** ALL CAPS name followed by period (screenplay style: "GINETTE. Hello.") */
const CHARACTER_PERIOD_LINE = new RegExp(`^${CHARACTER_NAME}\\s*\\.\\s*(.+)$`);

/** Standalone character name on its own line (dialogue follows on next line) */
const CHARACTER_ONLY = new RegExp(`^${CHARACTER_NAME}\\s*$`);

const STAGE_DIRECTION = /^\s*[\[(].*[\])]\s*$/;
const SCENE_HEADER = /^\s*(ACT\s+|SCENE\s+|INT\.|EXT\.)/i;

function normalizeCharacterName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*\([^)]*\)\s*$/, '')
    .trim();
}

function isLikelyCharacterName(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 40) return false;
  if (STAGE_DIRECTION.test(trimmed) || SCENE_HEADER.test(trimmed)) return false;
  if (/[.!?]$/.test(trimmed) && trimmed.split(/\s+/).length > 3) return false;
  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 2) return false;
  const upperRatio = letters.replace(/[^A-Z]/g, '').length / letters.length;
  return upperRatio >= 0.7;
}

function collectCharacters(lines: ScriptLine[]): string[] {
  const seen = new Set<string>();
  const order: string[] = [];
  for (const line of lines) {
    const key = line.character.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      order.push(line.character);
    }
  }
  return order;
}

/**
 * Parse a plain-text play script into ordered dialogue lines.
 * Supports:
 *   CHARACTER: dialogue
 *   CHARACTER. dialogue
 *   CHARACTER (parenthetical)
 *   dialogue on following lines
 */
function parseInlineCharacterLine(
  match: RegExpExecArray
): { character: string; text: string } | null {
  const character = normalizeCharacterName(match[1]);
  if (!isLikelyCharacterName(character)) return null;
  const text = match[2].trim();
  return text ? { character, text } : null;
}

export function parseScript(raw: string): ParsedScript {
  const inputLines = raw.replace(/\r\n/g, '\n').split('\n');
  const parsed: ScriptLine[] = [];
  let pendingCharacter: string | null = null;
  let title: string | undefined;

  for (let i = 0; i < inputLines.length; i++) {
    const line = inputLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      pendingCharacter = null;
      continue;
    }

    if (STAGE_DIRECTION.test(trimmed)) continue;

    if (!title && SCENE_HEADER.test(trimmed)) {
      title = trimmed;
      continue;
    }

    const inline =
      CHARACTER_LINE.exec(trimmed) ?? CHARACTER_PERIOD_LINE.exec(trimmed);
    if (inline) {
      const parsedLine = parseInlineCharacterLine(inline);
      if (parsedLine) {
        parsed.push({
          index: parsed.length,
          character: parsedLine.character,
          text: parsedLine.text,
        });
        pendingCharacter = parsedLine.character;
        continue;
      }
    }

    if (isLikelyCharacterName(trimmed) && CHARACTER_ONLY.test(trimmed)) {
      pendingCharacter = normalizeCharacterName(trimmed);
      continue;
    }

    if (pendingCharacter) {
      parsed.push({
        index: parsed.length,
        character: pendingCharacter,
        text: trimmed,
      });
      continue;
    }

    if (!title && parsed.length === 0 && trimmed.length < 80) {
      title = trimmed;
    }
  }

  return {
    lines: parsed,
    characters: collectCharacters(parsed),
    title,
  };
}

export function characterMatches(a: string, b: string): boolean {
  return normalizeCharacterName(a).toLowerCase() === normalizeCharacterName(b).toLowerCase();
}
