export type ComponentType = 
  | 'HEADER_MISSION' 
  | 'TEXT_BLOCK' 
  | 'BUTTON' 
  | 'CARD_PRODUCT' 
  | 'NAV_BAR_BOTTOM'
  | 'TOP_NAV_SOCIAL'
  | 'POST_CARD'
  | 'SEARCH_BAR' 
  | 'FORM_INPUT';

export type AppTemplate = 'PORTFOLIO' | 'DELIVERY' | 'ECOMMERCE' | 'BANKING' | 'Red Social';

export interface UIComponent {
  id: string;
  type: ComponentType;
  label: string;
  props: {
    intent?: 'primary' | 'secondary' | 'danger' | 'success';
    hierarchy?: 'high' | 'medium' | 'low';
    icon?: string;
    price?: string;
    isTarget?: boolean;                     // ¡CRÍTICO! Indica si pulsar este elemento completa la misión
    placeholder?: string;
    // Social network post props
    content?: string;                       // Texto del post
    likes?: number;
    comments?: number;
    avatar?: string;                        // FontAwesome icon name for avatar
    avatarSrc?: string;                     // Path to real avatar image file
    time?: string;                          // e.g. "hace 2 min"
    hasImage?: boolean;                     // Whether the post has a fake image block
    imageSrc?: string;                      // Path to real post image file
    version?: number;                       // Custom landing page version (1, 2, or 3)
    userComments?: string[];                // User-posted comments on this card
  };
}

export interface ProceduralScreen {
  screenId: string;
  appTemplate: AppTemplate;
  complexityLevel: number; // 1 a 6
  layoutStructure: 'LIST' | 'GRID' | 'DENSE';
  themeColors: {
    primaryBg: string;
    surfaceBg: string;
    textMain: string;
    accentColor: string;
  };
  missionText: string;
  components: UIComponent[];
}
