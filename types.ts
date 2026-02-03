export enum Language {
  AUTO = 'Auto Detect',
  ENGLISH = 'English',
  CHINESE = 'Chinese (Simplified)',
}

export interface TranslationState {
  sourceLang: Language;
  targetLang: Language;
  inputText: string;
  outputText: string;
  isTranslating: boolean;
  error: string | null;
}