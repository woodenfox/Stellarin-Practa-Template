/**
 * Asset Resolver for Practa
 * 
 * This file provides a unified interface for loading assets.
 * 
 * IMPORTANT FOR AI AGENTS:
 * - ALWAYS use assets.getImageSource(), assets.getAudioUri(), etc.
 * - NEVER use require() directly in component code
 * - Register all assets in the localAssets object below
 * - Add asset keys to the AssetKey type for autocomplete
 * 
 * The component code stays the same across all phases:
 * - Local development: assets loaded via require()
 * - After publish: assets loaded from CDN URLs
 * - In Stellarin: assets resolved from build manifest
 */

import { ImageSourcePropType } from "react-native";
import { Asset } from "expo-asset";

type AssetSource = number | { uri: string } | object;

/**
 * Asset keys - add your asset keys here for type safety and autocomplete.
 * This prevents typos and helps AI agents discover available assets.
 * 
 * Example:
 *   export type AssetKey = "hero-image" | "background-music" | "success-chime";
 */
export type AssetKey = string;

/**
 * Register your assets here.
 * 
 * Supported asset types:
 * - Images: png, jpg, jpeg, gif, webp, svg
 * - Audio: mp3, wav, m4a, ogg
 * - Video: mp4, webm
 * - Data: json, txt
 * - Lottie: json (animation files)
 * 
 * Example:
 *   const localAssets: Record<AssetKey, AssetSource> = {
 *     "hero-image": require("./assets/hero.png"),
 *     "background-music": require("./assets/music.mp3"),
 *     "success-chime": require("./assets/chime.mp3"),
 *   };
 */
const localAssets: Record<AssetKey, AssetSource> = {
  // Add your assets here
};

type AudioSource = number | { uri: string } | null;

export interface AssetResolver {
  getImageSource: (key: AssetKey) => ImageSourcePropType | null;
  getAudioSource: (key: AssetKey) => AudioSource;
  getAudioUri: (key: AssetKey) => Promise<string | null>;
  getVideoSource: (key: AssetKey) => Promise<{ uri: string } | null>;
  getLottieSource: (key: AssetKey) => object | null;
  getData: <T = unknown>(key: AssetKey) => T | null;
  getUri: (key: AssetKey) => Promise<string | null>;
  has: (key: string) => boolean;
  keys: () => AssetKey[];
}

function warnMissingAsset(key: string, method: string): void {
  console.warn(
    `[Practa Assets] Asset "${key}" not found. ` +
    `Called ${method}("${key}"). ` +
    `Available keys: ${Object.keys(localAssets).join(", ") || "(none)"}`
  );
}

export const assets: AssetResolver = {
  getImageSource: (key: AssetKey): ImageSourcePropType | null => {
    const asset = localAssets[key];
    if (asset === undefined) {
      warnMissingAsset(key, "getImageSource");
      return null;
    }
    return asset as ImageSourcePropType;
  },

  getAudioSource: (key: AssetKey): AudioSource => {
    const asset = localAssets[key];
    if (asset === undefined) {
      warnMissingAsset(key, "getAudioSource");
      return null;
    }
    return asset as AudioSource;
  },

  getAudioUri: async (key: AssetKey): Promise<string | null> => {
    const asset = localAssets[key];
    if (asset === undefined) {
      warnMissingAsset(key, "getAudioUri");
      return null;
    }
    if (typeof asset === "object" && "uri" in asset) {
      return (asset as { uri: string }).uri;
    }
    if (typeof asset === "number") {
      try {
        const resolved = Asset.fromModule(asset);
        await resolved.downloadAsync();
        return resolved.localUri || resolved.uri;
      } catch (error) {
        console.warn(`[Practa Assets] Failed to resolve audio "${key}":`, error);
        return null;
      }
    }
    return null;
  },

  getVideoSource: async (key: AssetKey): Promise<{ uri: string } | null> => {
    const uri = await assets.getAudioUri(key);
    return uri ? { uri } : null;
  },

  getLottieSource: (key: AssetKey): object | null => {
    const asset = localAssets[key];
    if (asset === undefined) {
      warnMissingAsset(key, "getLottieSource");
      return null;
    }
    if (typeof asset === "object" && !("uri" in asset)) {
      return asset;
    }
    console.warn(
      `[Practa Assets] "${key}" is not a Lottie animation. ` +
      `Lottie files should be JSON and registered with require("./assets/animation.json")`
    );
    return null;
  },

  getData: <T = unknown>(key: AssetKey): T | null => {
    const asset = localAssets[key];
    if (asset === undefined) {
      warnMissingAsset(key, "getData");
      return null;
    }
    return asset as T;
  },

  getUri: async (key: AssetKey): Promise<string | null> => {
    const asset = localAssets[key];
    if (asset === undefined) {
      warnMissingAsset(key, "getUri");
      return null;
    }
    if (typeof asset === "object" && "uri" in asset) {
      return (asset as { uri: string }).uri;
    }
    if (typeof asset === "number") {
      try {
        const resolved = Asset.fromModule(asset);
        await resolved.downloadAsync();
        return resolved.localUri || resolved.uri;
      } catch (error) {
        console.warn(`[Practa Assets] Failed to resolve URI for "${key}":`, error);
        return null;
      }
    }
    return null;
  },

  has: (key: string): boolean => {
    return key in localAssets;
  },

  keys: (): AssetKey[] => {
    return Object.keys(localAssets) as AssetKey[];
  },
};
