/** Parsed values from the host page URL */
export interface DelphiParams {
    /** Decoded first message from ?q, or null if the param is absent */
    readonly firstMessage: string | null;
    /** Uppercased starting page from ?page, or null if absent */
    readonly startPage: string | null;
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
