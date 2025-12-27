/**
 * Asset Resolver for Practa
 * 
 * This file provides a unified interface for loading assets.
 * 
 * IMPORTANT FOR AI AGENTS:
 * - ALWAYS use assets.getImageSource(), assets.getAudioUri(), etc.
 * - NEVER use require() directly in component code
 * - Register all assets in the localAssets object below
 * 
 * The component code stays the same across all phases:
 * - Local development: assets loaded via require()
 * - After publish: assets loaded from CDN URLs
 * - In Stellarin: assets resolved from build manifest
 */

import { ImageSourcePropType } from "react-native";
import { Asset } from "expo-asset";

type AssetSource = number | { uri: string } | object;

const localAssets: Record<string, AssetSource> = {
  "zen-circle": require("./assets/zen-circle.png"),
};

export interface AssetResolver {
  getImageSource: (key: string) => ImageSourcePropType | null;
  getAudioUri: (key: string) => Promise<string | null>;
  getVideoSource: (key: string) => Promise<{ uri: string } | null>;
  getData: <T = unknown>(key: string) => T | null;
  getUri: (key: string) => Promise<string | null>;
  has: (key: string) => boolean;
  keys: () => string[];
}

export const assets: AssetResolver = {
  getImageSource: (key: string): ImageSourcePropType | null => {
    const asset = localAssets[key];
    if (asset === undefined) return null;
    return asset as ImageSourcePropType;
  },

  getAudioUri: async (key: string): Promise<string | null> => {
    const asset = localAssets[key];
    if (asset === undefined) return null;
    if (typeof asset === "object" && "uri" in asset) {
      return (asset as { uri: string }).uri;
    }
    if (typeof asset === "number") {
      const resolved = Asset.fromModule(asset);
      await resolved.downloadAsync();
      return resolved.localUri || resolved.uri;
    }
    return null;
  },

  getVideoSource: async (key: string): Promise<{ uri: string } | null> => {
    const uri = await assets.getAudioUri(key);
    return uri ? { uri } : null;
  },

  getData: <T = unknown>(key: string): T | null => {
    const asset = localAssets[key];
    if (asset === undefined) return null;
    return asset as T;
  },

  getUri: async (key: string): Promise<string | null> => {
    const asset = localAssets[key];
    if (asset === undefined) return null;
    if (typeof asset === "object" && "uri" in asset) {
      return (asset as { uri: string }).uri;
    }
    if (typeof asset === "number") {
      const resolved = Asset.fromModule(asset);
      await resolved.downloadAsync();
      return resolved.localUri || resolved.uri;
    }
    return null;
  },

  has: (key: string): boolean => {
    return key in localAssets;
  },

  keys: (): string[] => {
    return Object.keys(localAssets);
  },
};
