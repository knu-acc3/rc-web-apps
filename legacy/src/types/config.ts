export interface SiteThemeConfig {
  readonly defaultTheme: 'dark' | 'light' | 'system';
  readonly primaryColor: string;
  readonly accentColor: string;
  readonly borderRadius: string;
}

export interface SiteAuthorConfig {
  readonly name: string;
  readonly url: string;
  readonly email: string;
  readonly github?: string;
  readonly twitter?: string;
}

export interface SiteConfig {
  readonly brandName: string;
  readonly brandShort: string;
  readonly brandTagline: {
    readonly ru: string;
    readonly en: string;
  };
  readonly domain: string;
  readonly baseUrl: string;
  readonly supportEmail: string;
  readonly author: SiteAuthorConfig;
  readonly defaultLocale: 'ru' | 'en';
  readonly locales: readonly ['ru', 'en'];
  readonly theme: SiteThemeConfig;
  readonly social: {
    readonly twitterHandle?: string;
    readonly githubRepo?: string;
    readonly telegram?: string;
  };
  readonly features: {
    readonly enablePwa: boolean;
    readonly enableAnalytics: boolean;
    readonly enableWasmTools: boolean;
    readonly maxUploadSizeMb: number;
  };
}
