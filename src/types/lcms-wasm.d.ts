declare module 'lcms-wasm' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export function instantiate(opts?: { locateFile?: (name: string) => string }): Promise<any>;
  export const cmsInfoDescription: number;
  export const TYPE_RGBA_8: number;
  export const TYPE_CMYK_8: number;
  export const INTENT_RELATIVE_COLORIMETRIC: number;
  export const cmsFLAGS_SOFTPROOFING: number;
  export const cmsFLAGS_GAMUTCHECK: number;
  export const cmsFLAGS_BLACKPOINTCOMPENSATION: number;
}
