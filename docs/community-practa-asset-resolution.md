# Community Practa Asset Resolution

This document outlines how assets are handled across the three phases of community Practa development and publishing.

## Overview

Practa components use a unified pattern for loading assets through an `assets.ts` resolver:

```tsx
import { assets } from "./assets";

// Images (sync)
<Image source={assets.getImageSource("zen-circle") || undefined} />

// Audio with useAudioPlayer hook (sync)
const player = useAudioPlayer(assets.getAudioSource("chime"));

// Audio with expo-av (async)
const uri = await assets.getAudioUri("chime");

// Video (async)
const videoSource = await assets.getVideoSource("intro-video");

// Lottie animations (sync)
<LottieView source={assets.getLottieSource("loading")} autoPlay loop />

// JSON data (sync)
const config = assets.getData<ConfigType>("settings");
```

The `assets.ts` file is **different in each phase**, but the component code stays the same. This eliminates the need for any conditional logic or runtime branching.

---

## Asset Resolver Interface

The resolver provides a comprehensive API for all asset types:

```typescript
export interface AssetResolver {
  // Images - returns ImageSourcePropType for <Image source={...} />
  getImageSource: (key: AssetKey) => ImageSourcePropType | null;
  
  // Audio - sync version for useAudioPlayer hook
  getAudioSource: (key: AssetKey) => number | { uri: string } | null;
  
  // Audio - async version for expo-av Audio.Sound
  getAudioUri: (key: AssetKey) => Promise<string | null>;
  
  // Video - async, returns source object for expo-video
  getVideoSource: (key: AssetKey) => Promise<{ uri: string } | null>;
  
  // Lottie animations - sync, returns animation JSON object
  getLottieSource: (key: AssetKey) => object | null;
  
  // Generic JSON data - sync, typed
  getData: <T = unknown>(key: AssetKey) => T | null;
  
  // Generic URI access - async
  getUri: (key: AssetKey) => Promise<string | null>;
  
  // Utility methods
  has: (key: string) => boolean;
  keys: () => AssetKey[];
}
```

### Method Reference

| Method | Returns | Async | Use Case |
|--------|---------|-------|----------|
| `getImageSource(key)` | ImageSourcePropType \| null | No | `<Image source={...} />` |
| `getAudioSource(key)` | number \| { uri } \| null | No | useAudioPlayer hook |
| `getAudioUri(key)` | Promise<string \| null> | Yes | expo-av Audio.Sound |
| `getVideoSource(key)` | Promise<{ uri } \| null> | Yes | expo-video playback |
| `getLottieSource(key)` | object \| null | No | lottie-react-native |
| `getData<T>(key)` | T \| null | No | JSON config files |
| `getUri(key)` | Promise<string \| null> | Yes | Generic URI access |
| `has(key)` | boolean | No | Check if asset exists |
| `keys()` | AssetKey[] | No | List all assets |

---

## Phase 1: Template (Local Development)

### Developer Experience

Developers create Practa using the template. They place assets in an `./assets/` folder and register them in `assets.ts`.

### Template `assets.ts` Implementation

```typescript
// assets.ts - LOCAL DEVELOPMENT VERSION

import { ImageSourcePropType } from "react-native";
import { Asset } from "expo-asset";

type AssetSource = number | { uri: string } | object;

/**
 * Asset keys - add your asset keys here for type safety and autocomplete.
 * This prevents typos and helps AI agents discover available assets.
 */
export type AssetKey = "zen-circle" | "background" | "chime" | "intro-video" | "loading-animation";

/**
 * Register your assets here.
 * 
 * Supported asset types:
 * - Images: png, jpg, jpeg, gif, webp, svg
 * - Audio: mp3, wav, m4a, ogg
 * - Video: mp4, webm
 * - Data: json, txt
 * - Lottie: json (animation files)
 */
const localAssets: Record<AssetKey, AssetSource> = {
  "zen-circle": require("./assets/zen-circle.png"),
  "background": require("./assets/background.jpg"),
  "chime": require("./assets/chime.mp3"),
  "intro-video": require("./assets/intro.mp4"),
  "loading-animation": require("./assets/loading.json"),
};

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

  getAudioSource: (key: AssetKey): number | { uri: string } | null => {
    const asset = localAssets[key];
    if (asset === undefined) {
      warnMissingAsset(key, "getAudioSource");
      return null;
    }
    return asset as number | { uri: string };
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
```

### Developer Instructions

1. Place asset files in the `./assets/` folder
2. Add the key to the `AssetKey` type for autocomplete
3. Add an entry to `localAssets` with a kebab-case key
4. Use the appropriate resolver method in your component:
   - `assets.getImageSource("key")` for images
   - `assets.getAudioSource("key")` for audio with useAudioPlayer
   - `await assets.getAudioUri("key")` for audio with expo-av
   - `await assets.getVideoSource("key")` for video
   - `assets.getLottieSource("key")` for Lottie animations
   - `assets.getData<T>("key")` for JSON data
5. **Never use `require()` directly in component code**

---

## Phase 2: Practa Manager (Publishing)

### What Happens During Publish

When a developer submits their Practa to the Practa Manager:

1. **Upload Assets**: All files from `./assets/` are uploaded to CDN object storage
2. **Generate `build.json`**: Contains metadata and full CDN URLs for each asset
3. **Generate CDN `assets.ts`**: Replaces the local version with a CDN-based resolver
4. **Remove Local Assets**: The `./assets/` folder is not committed to the repo
5. **Commit**: Only the code files, `build.json`, and CDN `assets.ts` are committed

### `build.json` Format

```json
{
  "buildId": "abc123",
  "createdAt": "2025-01-15T10:30:00Z",
  "assets": {
    "zen-circle": "https://replit-objstore.example.com/public/practa/hello-world/abc123/zen-circle.png",
    "background": "https://replit-objstore.example.com/public/practa/hello-world/abc123/background.jpg",
    "chime": "https://replit-objstore.example.com/public/practa/hello-world/abc123/chime.mp3",
    "intro-video": "https://replit-objstore.example.com/public/practa/hello-world/abc123/intro.mp4",
    "loading-animation": "https://replit-objstore.example.com/public/practa/hello-world/abc123/loading.json"
  }
}
```

**Important**: The `assets` map contains **full CDN URLs**, not relative paths. The Stellarin app does not construct URLs - it uses them directly from this map.

### Generated CDN `assets.ts`

The Practa Manager generates this file to replace the local version:

```typescript
// assets.ts - CDN VERSION (auto-generated by Practa Manager)
// DO NOT EDIT - This file is regenerated on each publish

import { createAssetResolver } from "@stellarin/practa-runtime";

export type AssetKey = "zen-circle" | "background" | "chime" | "intro-video" | "loading-animation";

const assetUrls: Record<AssetKey, string> = {
  "zen-circle": "https://replit-objstore.example.com/public/practa/hello-world/abc123/zen-circle.png",
  "background": "https://replit-objstore.example.com/public/practa/hello-world/abc123/background.jpg",
  "chime": "https://replit-objstore.example.com/public/practa/hello-world/abc123/chime.mp3",
  "intro-video": "https://replit-objstore.example.com/public/practa/hello-world/abc123/intro.mp4",
  "loading-animation": "https://replit-objstore.example.com/public/practa/hello-world/abc123/loading.json",
};

export const assets = createAssetResolver(assetUrls);
```

### Practa Manager Implementation Notes

The publish pipeline should:

1. Parse the local `assets.ts` to extract the `AssetKey` type and `localAssets` entries
2. Upload each asset to CDN: `public/practa/{slug}/{buildId}/{filename}`
3. Generate `build.json` with full URLs in the `assets` map
4. Generate the CDN `assets.ts` preserving the `AssetKey` type
5. Validate that no `require()` statements remain in component code
6. Commit only: `index.tsx`, `assets.ts`, `build.json`, `metadata.json`

---

## Phase 3: Stellarin App (Import)

### What Happens at Build Time

The Stellarin fetch script (`scripts/fetch-community-practa.js`):

1. Clones/pulls the `stellarin-practa` GitHub repo
2. For each Practa, reads `build.json`
3. Generates `assets.ts` from the URLs in `build.json`
4. Validates that no `require()` statements exist in component code (fails build if found)

### Generated `assets.ts`

```typescript
// assets.ts - Generated by fetch-community-practa.js
// DO NOT EDIT MANUALLY

import { createAssetResolver } from "@stellarin/practa-runtime";

export type AssetKey = "zen-circle" | "background" | "chime" | "intro-video" | "loading-animation";

const assetUrls: Record<AssetKey, string> = {
  "zen-circle": "https://replit-objstore.example.com/public/practa/hello-world/abc123/zen-circle.png",
  "background": "https://replit-objstore.example.com/public/practa/hello-world/abc123/background.jpg",
  "chime": "https://replit-objstore.example.com/public/practa/hello-world/abc123/chime.mp3",
  "intro-video": "https://replit-objstore.example.com/public/practa/hello-world/abc123/intro.mp4",
  "loading-animation": "https://replit-objstore.example.com/public/practa/hello-world/abc123/loading.json",
};

export const assets = createAssetResolver(assetUrls);
```

### CDN Asset Resolver Implementation

```typescript
// @stellarin/practa-runtime/asset-resolver.ts

import { ImageSourcePropType } from "react-native";

export interface AssetResolver {
  getImageSource: (key: string) => ImageSourcePropType | null;
  getAudioSource: (key: string) => { uri: string } | null;
  getAudioUri: (key: string) => Promise<string | null>;
  getVideoSource: (key: string) => Promise<{ uri: string } | null>;
  getLottieSource: (key: string) => Promise<object | null>;
  getData: <T = unknown>(key: string) => Promise<T | null>;
  getUri: (key: string) => Promise<string | null>;
  has: (key: string) => boolean;
  keys: () => string[];
}

export function createAssetResolver(urls: Record<string, string>): AssetResolver {
  return {
    getImageSource: (key: string): ImageSourcePropType | null => {
      const url = urls[key];
      return url ? { uri: url } : null;
    },

    getAudioSource: (key: string): { uri: string } | null => {
      const url = urls[key];
      return url ? { uri: url } : null;
    },

    getAudioUri: async (key: string): Promise<string | null> => {
      return urls[key] || null;
    },

    getVideoSource: async (key: string): Promise<{ uri: string } | null> => {
      const url = urls[key];
      return url ? { uri: url } : null;
    },

    getLottieSource: async (key: string): Promise<object | null> => {
      const url = urls[key];
      if (!url) return null;
      try {
        const response = await fetch(url);
        return await response.json();
      } catch {
        console.warn(`[Practa Assets] Failed to load Lottie animation "${key}"`);
        return null;
      }
    },

    getData: async <T = unknown>(key: string): Promise<T | null> => {
      const url = urls[key];
      if (!url) return null;
      try {
        const response = await fetch(url);
        return await response.json();
      } catch {
        console.warn(`[Practa Assets] Failed to load data "${key}"`);
        return null;
      }
    },

    getUri: async (key: string): Promise<string | null> => {
      return urls[key] || null;
    },

    has: (key: string): boolean => {
      return key in urls;
    },

    keys: (): string[] => {
      return Object.keys(urls);
    },
  };
}
```

**Note**: In the CDN version, `getLottieSource` and `getData` become async because they need to fetch JSON from the CDN. Component code should handle this with `useEffect` or similar patterns.

---

## Summary of Changes Needed

| App | Required Changes |
|-----|------------------|
| **Template** | Ship with local `assets.ts` that uses `require()`. Include `AssetKey` type for autocomplete. Document all resolver methods. |
| **Practa Manager** | Generate CDN `assets.ts` during publish. Preserve `AssetKey` type. Store full URLs in `build.json`. Strip `./assets/` folder before commit. Validate no `require()` in component code. |
| **Stellarin** | Fetch script generates `assets.ts` from `build.json`. Provide `createAssetResolver` in runtime. Add validation to fail if `require()` is detected. |

---

## Key Design Decisions

1. **Full URLs in `build.json`**: The Stellarin app does not construct CDN URLs. The `assets` map contains complete URLs, making the system simpler and more flexible (CDN can change without app updates).

2. **No `buildId` in URL construction**: Since URLs are stored in full, the `buildId` is only metadata. The app just reads URLs directly from the map.

3. **`assets.ts` is the boundary**: This single file is the only thing that changes between phases. Component code is identical everywhere.

4. **Validation at boundaries**: Both the Practa Manager (on publish) and Stellarin (on fetch) validate that no `require()` statements exist in component code.

5. **TypeScript-first with `AssetKey`**: The typed `AssetKey` union provides autocomplete and prevents typos. It's preserved across all phases.

6. **Comprehensive resolver API**: The resolver supports all common asset types (images, audio, video, Lottie, JSON data) with both sync and async methods as appropriate.

7. **Console warnings for debugging**: Missing assets log helpful warnings with the available keys, making it easier to debug typos or missing registrations.

---

## Asset Limits

- **Per-file limit**: 5MB maximum per asset
- **Total package limit**: 25MB maximum for entire Practa
- **Supported formats**: 
  - Images: png, jpg, jpeg, gif, webp, svg
  - Audio: mp3, wav, m4a, ogg
  - Video: mp4, webm
  - Data: json, txt
