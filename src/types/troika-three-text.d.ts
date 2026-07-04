declare module 'troika-three-text' {
  export function configureTextBuilder(config: {
    defaultFontURL?: string;
    unicodeFontsURL?: string;
  }): void;
}
