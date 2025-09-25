export type Lang = 'he'; // עברית בלבד

export function sanitizeLang(_raw?: string): Lang {
  return 'he';
}

// משאירים רק he.json
import he from '../locales/he.json';
const dict = { he } as const;

export function t(_lang: Lang, path: string): string {
  const parts = path.split('.');
  // @ts-ignore
  let cur: any = dict.he;
  for (const p of parts) cur = cur?.[p];
  return (typeof cur === 'string' ? cur : '') || '';
}
