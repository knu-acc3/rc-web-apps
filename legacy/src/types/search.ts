export type RouteCategoryType = 
  | 'tool' 
  | 'time-now' 
  | 'actual-size' 
  | 'emoji' 
  | 'symbol' 
  | 'timer' 
  | 'diagnostic' 
  | 'catalog';

export interface GlobalSearchIndexItem {
  readonly id: string;
  readonly slug: string;
  readonly titleRu: string;
  readonly titleEn: string;
  readonly descriptionRu: string;
  readonly descriptionEn: string;
  readonly category: RouteCategoryType;
  readonly urlRu: string;
  readonly urlEn: string;
  readonly keywords: readonly string[];
  readonly iconName: string;
  readonly isPopular?: boolean;
}

export interface NavigationLinkItem {
  readonly labelRu: string;
  readonly labelEn: string;
  readonly href: string;
  readonly icon: string;
  readonly badge?: string;
  readonly children?: readonly NavigationLinkItem[];
}
