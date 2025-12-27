import { ImageSourcePropType } from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";

export type AssetKey = "breathing-orb" | "chime";

type AssetSource = number | { uri: string };

const localAssets: Record<AssetKey, AssetSource> = {
  "breathing-orb": require("./assets/breathing-orb.png"),
  "chime": require("./assets/chime.mp3"),
};

async function resolveUri(source: AssetSource): Promise<string | null> {
  if (typeof source === "number") {
    try {
      const asset = Asset.fromModule(source);
      await asset.downloadAsync();
      return asset.localUri || asset.uri;
    } catch (error) {
      console.warn("Failed to resolve asset URI:", error);
      return null;
    }
  }
  return source.uri;
}

export const assets = {
  getImageSource(key: AssetKey): ImageSourcePropType | null {
    const source = localAssets[key];
    if (!source) {
      console.warn(`[assets] Image not found: "${key}". Available keys: ${Object.keys(localAssets).join(", ")}`);
      return null;
    }
    if (typeof source === "number") {
      return source as ImageSourcePropType;
    }
    return { uri: source.uri };
  },

  getAudioSource(key: AssetKey): AssetSource | null {
    const source = localAssets[key];
    if (!source) {
      console.warn(`[assets] Audio not found: "${key}". Available keys: ${Object.keys(localAssets).join(", ")}`);
      return null;
    }
    return source;
  },

  async getAudioUri(key: AssetKey): Promise<string | null> {
    const source = localAssets[key];
    if (!source) {
      console.warn(`[assets] Audio not found: "${key}". Available keys: ${Object.keys(localAssets).join(", ")}`);
      return null;
    }
    return resolveUri(source);
  },

  async getVideoSource(key: AssetKey): Promise<{ uri: string } | null> {
    const source = localAssets[key];
    if (!source) {
      console.warn(`[assets] Video not found: "${key}". Available keys: ${Object.keys(localAssets).join(", ")}`);
      return null;
    }
    const uri = await resolveUri(source);
    return uri ? { uri } : null;
  },

  getLottieSource(key: AssetKey): object | null {
    const source = localAssets[key];
    if (!source) {
      console.warn(`[assets] Lottie not found: "${key}". Available keys: ${Object.keys(localAssets).join(", ")}`);
      return null;
    }
    if (typeof source === "number") {
      return source as unknown as object;
    }
    return null;
  },

  getData<T = unknown>(key: AssetKey): T | null {
    const source = localAssets[key];
    if (!source) {
      console.warn(`[assets] Data not found: "${key}". Available keys: ${Object.keys(localAssets).join(", ")}`);
      return null;
    }
    if (typeof source === "number") {
      return source as unknown as T;
    }
    return null;
  },

  async getUri(key: AssetKey): Promise<string | null> {
    const source = localAssets[key];
    if (!source) {
      console.warn(`[assets] Asset not found: "${key}". Available keys: ${Object.keys(localAssets).join(", ")}`);
      return null;
    }
    return resolveUri(source);
  },

  has(key: AssetKey): boolean {
    return key in localAssets;
  },

  keys(): AssetKey[] {
    return Object.keys(localAssets) as AssetKey[];
  },
};
