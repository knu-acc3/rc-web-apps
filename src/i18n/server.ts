import 'server-only';
import { type Locale, loadMessages, localizedHref, getMsg } from './index';

export async function getServerLanguage(locale: Locale) {
  const messages = await loadMessages(locale);
  return {
    locale,
    messages,
    t: (key: string, vars?: Record<string, string | number>) => getMsg(messages, key, vars),
    lHref: (path: string) => localizedHref(path, locale),
  };
}
