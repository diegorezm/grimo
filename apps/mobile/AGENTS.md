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
pnpm --filter @grimo/mobile exec expo-doctor
```

## Rules

- Routes live in `src/app/` (Expo Router). Route files are thin: they compose `src/features/*`.
- Auth gate is in `src/app/_layout.tsx` (`Stack.Protected`). Don't add redirects elsewhere.
- Data comes from `@grimo/client` hooks. Never call `fetch` directly in screens.
- Styling: `StyleSheet` + tokens from `@/constants/theme` (re-exported from `@grimo/tokens`). No hard-coded colors.
- `ios/` and `android/` are generated (CNG). Never edit by hand — use `app.json` + config plugins.
- Native modules need a development build (`expo run:android|ios` or EAS); Expo Go only has bundled modules.
- The server is chosen by the user (self-hosting!): `src/lib/server.ts` stores it, `src/lib/clients.ts`
  builds auth/API clients per server. Use `useAuthClient()` — never create clients in screens.
  `EXPO_PUBLIC_API_URL` is only the default server.
