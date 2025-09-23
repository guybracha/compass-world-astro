export type Lang = 'en' | 'he';

export function sanitizeLang(raw?: string): Lang {
  return raw === 'he' ? 'he' : 'en';
}

// קריאת JSON סטטית בזמן בנייה
import en from '../locales/en.json';
import he from '../locales/he.json';
const dict = { en, he } as const;

export function t(lang: Lang, path: string): string {
  const parts = path.split('.');
  // @ts-ignore
  let cur: any = dict[lang];
  for (const p of parts) cur = cur?.[p];
  return (typeof cur === 'string' ? cur : '') || '';
}
