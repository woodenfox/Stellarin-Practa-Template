/**
 * Asset Resolver for Practa
 * 
 * This file provides a unified interface for loading assets.
 * 
 * IMPORTANT FOR AI AGENTS:
 * - ALWAYS use assets("key") to get asset URLs
 * - NEVER use require() directly in component code
 * - Register all assets in the localAssets object below
 * 
 * The component code stays the same across all phases:
 * - Local development: assets loaded via require()
 * - After publish: assets loaded from CDN URLs
 * - In Stellarin: assets resolved from build manifest
 */

type AssetSource = number | { uri: string };

/**
 * Register your assets here.
 * 
 * Supported asset types:
 * - Images: png, jpg, jpeg, gif, webp, svg
 * - Audio: mp3, wav, m4a, ogg
 * - Video: mp4, webm
 * - Data: json, txt
 * 
 * Example:
 *   const localAssets = {
 *     "hero-image": require("./assets/hero.png"),
 *     "background-music": require("./assets/music.mp3"),
 *     "success-chime": require("./assets/chime.mp3"),
 *   } as const;
 */
const localAssets = {
  // Add your assets here
} as const;

export type AssetKey = keyof typeof localAssets;

/**
 * Get the URL for an asset.
 * 
 * Usage:
 * - Web: <img src={assets("icon")} />
 * - React Native: <Image source={{ uri: assets("icon") }} />
 * - Audio: new Audio(assets("sound"))
 */
export const assets = (key: AssetKey): string => {
  const asset = localAssets[key] as AssetSource | undefined;
  if (asset === undefined) {
    console.warn(
      `[Practa Assets] Asset "${String(key)}" not found. ` +
      `Available keys: ${Object.keys(localAssets).join(", ") || "(none)"}`
    );
    return "";
  }
  
  if (typeof asset === "object" && "uri" in asset) {
    return asset.uri;
  }
  
  // For bundled assets (require() returns a number in React Native)
  // We need to resolve the URI - this works in development
  if (typeof asset === "number") {
    // In React Native, require() returns a number that the Image component handles
    // For audio/video, we need the actual URI which isn't directly available
    // This pattern works best when Practa Manager transforms to URLs
    return String(asset);
  }
  
  return "";
};
