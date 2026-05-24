export type ComponentType = 'HEADER_MISSION' | 'TEXT_BLOCK' | 'BUTTON' | 'CARD_PRODUCT' | 'NAV_BAR_BOTTOM' | 'TOP_NAV_SOCIAL' | 'POST_CARD' | 'SEARCH_BAR' | 'FORM_INPUT';
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
        isTarget?: boolean;
        placeholder?: string;
        content?: string;
        likes?: number;
        comments?: number;
        avatar?: string;
        avatarSrc?: string;
        time?: string;
        hasImage?: boolean;
        imageSrc?: string;
        version?: number;
        userComments?: string[];
        category?: string;
    };
}
export interface ProceduralScreen {
    screenId: string;
    appTemplate: AppTemplate;
    complexityLevel: number;
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
