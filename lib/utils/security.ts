import { createHash, randomBytes } from 'crypto';

export function hashString(str: string): string {
  return createHash('sha256').update(str).digest('hex');
}

export function generateRandomString(length: number): string {
  return randomBytes(length).toString('hex');
}

export function sanitizeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function validateInput(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

export function encodeState(data: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeState<T>(state: string): T | null {
  try {
    return JSON.parse(Buffer.from(state, 'base64').toString()) as T;
  } catch {
    return null;
  }
}