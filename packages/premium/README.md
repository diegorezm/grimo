# @grimo/premium

The seam between the public app and the **paid content** (shelf models, materials, spine
finishes, objects, lights, share card layouts and palettes).

- **Public (this folder, FSL):** the contract (`src/types.ts`), empty stubs (`src/empty`) and the
  link script. The keys and names of every paid choice are public too: `SHELF_PREMIUM` and
  `CARD_PREMIUM_TEMPLATES` in `@grimo/core`.
- **Private (`private/`, a git submodule of `diegorezm/grimo-premium`, proprietary):** the art.
  Never copy it into this repository.

`scripts/link.mjs` (root `postinstall`, or `pnpm premium:link`) writes `src/content/*.ts`
(gitignored), which re-export the private content when `private/` is checked out and the empty
stubs when it is not. Without it the apps build and run with the free choices only: paid options
are not offered, and a shelf saved with one is drawn with the default look.

With access to the private repository:

```bash
git submodule update --init packages/premium/private
pnpm premium:link
```

New paid item: its key and label go in `@grimo/core`, its art in the private repository
(`tokens.ts` for what both platforms share, `web.tsx` and `mobile.tsx` for the rest).
