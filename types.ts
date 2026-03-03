
export enum Language {
  UZBEK = 'Uzbek',
  KAZAKH = 'Kazakh',
  TAJIK = 'Tajik',
  KYRGYZ = 'Kyrgyz',
  RUSSIAN = 'Russian',
  TURKMEN = 'Turkmen'
}

export interface MnemonicResponse {
  word: string;
  transcription: string;
  meaning: string;
  morphology: string;
  imagination: string;
  phoneticLink: string;
  connectorSentence: string;
  examples: string[];
  synonyms: string[];
  imagePrompt: string;
  level: string;
  audioUrl?: string;
  isHard?: boolean;
}

export interface SavedMnemonic {
  id: string;
  word: string;
  data: MnemonicResponse;
  imageUrl: string;
  timestamp: number;
  language: Language;
  isHard?: boolean;
  isMastered?: boolean;
}

export enum AppState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  RESULTS = 'RESULTS',
  VOICE_MODE = 'VOICE_MODE',
  ERROR = 'ERROR'
}

export enum AppView {
  HOME = 'HOME',
  SEARCH = 'SEARCH',
  DASHBOARD = 'DASHBOARD',
  FLASHCARDS = 'FLASHCARDS',
  PROFILE = 'PROFILE',
  POSTS = 'POSTS',
  MY_POSTS = 'MY_POSTS',
  CREATE_POST = 'CREATE_POST'
}

export interface Post {
  id: string;
  post_metadata: {
    username: string;
    timestamp: number;
    user_id: string;
  };
  mnemonic_data: {
    english_word: string;
    native_keyword: string;
    story: string;
  };
  visuals: {
    user_uploaded_image: string | null;
    ui_style: 'light' | 'dark';
  };
  language: Language;
  engagement: {
    likes: number;
    dislikes: number;
    impression_emojis: { emoji: string; count: number }[];
    user_liked?: boolean;
    user_disliked?: boolean;
    user_emoji?: string;
  };
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
