
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
  PROFILE = 'PROFILE'
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
