// fonts.d.ts
declare module '*.ttf'
declare module '*.otf'
declare module '*.svg'
declare module '*.json'

// webpack 의 require.context (이모티콘 폴더 자동 등록에 사용)
interface NodeRequire {
  context(
    directory: string,
    useSubdirectories: boolean,
    regExp: RegExp,
  ): { keys(): string[]; (key: string): unknown }
}
