# apps/mobile — Expo app

Read the root [AGENTS.md](../../AGENTS.md) first. This file only adds Expo-specific rules.

## Expo changes fast — do not trust your training data

Before touching any Expo / React Native API:

1. Check the `expo` major version in `package.json` (currently SDK 58).
2. Read the matching docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. Index with LLM corrections: https://docs.expo.dev/llms.txt

## Commands (run from the repo root)

```bash
pnpm dev:mobile                                          # expo start
pnpm --filter @grimo/mobile exec expo install <package>  # ALWAYS use for new deps (SDK-compatible versions)
pnpm --filter @grimo/mobile typecheck
cd apps/mobile && npx expo-doctor
```

## Rules

- Routes live in `src/app/` (Expo Router). Route files are thin: they compose `src/features/*`.
- Auth gate is in `src/app/_layout.tsx` (`Stack.Protected`). Don't add redirects elsewhere.
- Data comes from `@grimo/client` hooks. Never call `fetch` directly in screens.
- Styling: `StyleSheet` + tokens from `@/constants/theme` (re-exported from `@grimo/tokens`). No hard-coded colors.
- `ios/` and `android/` are generated (CNG). Never edit by hand — use `app.json` + config plugins.
- Native modules need a development build (`expo run:android|ios` or EAS); Expo Go only has bundled modules.
- Data and auth come from Convex. `src/lib/server.ts` reads `EXPO_PUBLIC_CONVEX_URL` (fixed per
  build); `src/lib/clients.ts` builds the auth client (Better Auth + `expoClient`, cookie in
  SecureStore), the Convex client and the query client. Use `useAuthClient()` / `useClearCache()`
  — never create clients in screens.
- The query cache is persisted in MMKV (`src/lib/cache-storage.ts`) and restored before anything
  renders: the app must open offline on cached data. See "Cache" in the root AGENTS.md.
