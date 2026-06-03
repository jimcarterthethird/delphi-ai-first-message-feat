/** Parsed values from the page URL */
export interface DelphiParams {
    /** Decoded first message from ?fm, or null if the param is absent */
    firstMessage: string | null;
    /** Uppercased starting page from ?page, or null if absent */
    startPage: string | null;
}

/** Delphi window.delphi.page config shape (as required by embed.delphi.ai/loader.js) */
export interface DelphiPageConfig {
    /** Your Delphi embed config ID */
    config: string;
    overrides?: {
        landingPage?: 'CHAT' | 'VOICE' | 'OVERVIEW';
    };
    container?: {
        selector?: string;
        width?: string;
        height?: string;
    };
}

/** Shape of the window.delphi global set before the loader runs */
export interface DelphiGlobal {
    page?: DelphiPageConfig;
}
