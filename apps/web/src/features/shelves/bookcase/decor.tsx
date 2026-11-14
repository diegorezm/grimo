import { SHELF_DECOR_LABELS, type ShelfDecor } from "@grimo/core";
import { shelfBrass as B, shelfDecorColors as C } from "@grimo/tokens";
import { premiumTokens } from "@/lib/premium";
import { ArtSvg } from "./art";

/**
 * Little things on the planks. `still` drops the motion (swaying leaves, flame, steam), for
 * the thumbnails in the customize panel.
 */
export function ShelfDecorArt({ decor, still }: { decor: ShelfDecor; still?: boolean }) {
  const label = still ? undefined : SHELF_DECOR_LABELS[decor];
  const hidden = still || undefined;
  const motion = (name: string) => (still ? undefined : name);
  switch (decor) {
    case "plant":
      return (
        <svg
          width="46"
          height="78"
          viewBox="0 0 46 78"
          role="img"
          aria-label={label}
          aria-hidden={hidden}
        >
          <g className={motion("shelf-sway")} style={{ transformOrigin: "22px 46px" }}>
            <path d="M23 48C21 34 12 26 4 24c2 10 9 20 19 24z" fill={C.leaf} />
            <path d="M23 48c2-14 11-22 19-24-2 10-9 20-19 24z" fill={C.leafLight} />
            <path d="M23 48C22 30 24 14 30 4c4 12 1 30-7 44z" fill={C.leafDark} />
          </g>
          <path d="M9 50h28l-3 26H12z" fill={C.pot} />
          <path d="M7 46h32v6H7z" fill={C.potRim} />
        </svg>
      );
    case "candle":
      return (
        <svg
          width="28"
          height="62"
          viewBox="0 0 28 62"
          role="img"
          aria-label={label}
          aria-hidden={hidden}
        >
          <circle
            className={motion("shelf-halo")}
            cx="14"
            cy="13"
            r="12"
            fill={C.glow}
            opacity=".55"
          />
          <path
            className={motion("shelf-flicker")}
            style={{ transformOrigin: "13px 14px" }}
            d="M14 4c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z"
            fill={C.flame}
          />
          <path d="M14 18v4" stroke={C.ink} strokeWidth="1.4" />
          <rect x="7" y="22" width="14" height="36" rx="2" fill={C.wax} stroke={C.waxDrip} />
          <rect x="4" y="57" width="20" height="5" rx="2" fill={B.base} />
        </svg>
      );
    case "frame":
      return (
        <svg
          width="48"
          height="60"
          viewBox="0 0 48 60"
          role="img"
          aria-label={label}
          aria-hidden={hidden}
          style={{ transform: "rotate(-4deg)", transformOrigin: "bottom center" }}
        >
          <rect x="2" y="2" width="44" height="56" rx="3" fill={B.base} />
          <rect x="7" y="7" width="34" height="46" rx="1" fill={C.mist} />
          <circle cx="31" cy="18" r="5" fill={C.blush} />
          <path d="M7 45l10-12 8 8 6-6 10 10v8H7z" fill={C.lilac} />
          <path d="M7 49l12-9 10 6 12-7v14H7z" fill={C.pot} />
        </svg>
      );
    case "mug":
      return (
        <svg
          width="38"
          height="50"
          viewBox="0 0 38 50"
          role="img"
          aria-label={label}
          aria-hidden={hidden}
        >
          {!still && (
            <g className="shelf-steam">
              <path
                d="M12 14c-3-3 3-5 0-9M19 14c-3-3 3-5 0-9"
                fill="none"
                stroke={C.steam}
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </g>
          )}
          <path d="M27 24h3a6 6 0 0 1 0 12h-3" fill="none" stroke={C.lilac} strokeWidth="3" />
          <path d="M4 18h24v24a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill={C.lilac} />
          <path d="M12 32l4-4 4 4-4 4z" fill={C.blush} />
        </svg>
      );
    case "star":
      return (
        <svg
          width="32"
          height="40"
          viewBox="0 0 32 40"
          role="img"
          aria-label={label}
          aria-hidden={hidden}
        >
          <g className={motion("shelf-twinkle")} style={{ transformOrigin: "15px 17px" }}>
            <path d="M15 2l3.2 8.6L27 14l-8.8 3.2L15 26l-3.2-8.8L3 14l8.8-3.4z" fill={B.base} />
          </g>
          <rect x="6" y="32" width="20" height="8" rx="2" fill={C.ink} opacity=".85" />
          <path d="M15 26v6" stroke={C.ink} strokeWidth="1.6" />
        </svg>
      );
    case "globe":
      return (
        <svg
          width="44"
          height="62"
          viewBox="0 0 44 62"
          role="img"
          aria-label={label}
          aria-hidden={hidden}
        >
          <circle cx="22" cy="24" r="17" fill={C.sea} />
          <path
            d="M12 14c6 2 8 8 4 12s2 8 6 10M28 10c-2 6 4 8 8 6M30 30c-4 2-4 6 0 8"
            fill="none"
            stroke={C.leafDark}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M4 24a18 18 0 0 0 36 0" fill="none" stroke={B.base} strokeWidth="2.5" />
          <path d="M22 42v10M12 56h20" stroke={B.base} strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    default: {
      // A paid object: its drawing comes with the content (nothing without it).
      const art = premiumTokens.decor[decor];
      return art ? <ArtSvg art={art} label={label} /> : null;
    }
  }
}

/** Ivy over the arch ("Arco"). */
export function ArchIvy() {
  return (
    <svg
      viewBox="0 0 390 120"
      aria-hidden="true"
      className="shelf-ivy pointer-events-none absolute inset-x-0 top-6 mx-auto w-full max-w-[420px]"
    >
      <path
        d="M60 10c40 30 90 40 135 40s95-10 135-40"
        fill="none"
        stroke={C.leafDark}
        strokeWidth="2"
      />
      <path
        d="M84 26c-6 8-4 16 2 22M120 40c-4 9 0 18 6 22M160 48c-2 10 2 18 8 20M230 48c2 10-2 18-8 20M270 40c4 9 0 18-6 22M306 26c6 8 4 16-2 22"
        fill="none"
        stroke={C.leafDark}
        strokeWidth="1.6"
      />
      <circle cx="86" cy="48" r="5" fill={C.leafLight} />
      <circle cx="126" cy="62" r="5" fill={C.leaf} />
      <circle cx="168" cy="68" r="4.5" fill={C.leafLight} />
      <circle cx="222" cy="68" r="4.5" fill={C.leaf} />
      <circle cx="264" cy="62" r="5" fill={C.leafLight} />
      <circle cx="304" cy="48" r="5" fill={C.leaf} />
      <circle cx="195" cy="50" r="4" fill={C.pot} />
      <circle cx="140" cy="45" r="3" fill={C.blossom} />
      <circle cx="250" cy="45" r="3" fill={C.blossom} />
    </svg>
  );
}

/** Brass lamp hanging from the crown ("Biblioteca"). */
export function LibraryLamp() {
  return (
    <svg
      width="120"
      height="40"
      viewBox="0 0 120 40"
      aria-hidden="true"
      className="absolute -bottom-[22px] left-1/2 z-[3] -translate-x-1/2"
    >
      <ellipse cx="60" cy="34" rx="58" ry="10" fill={C.glow} opacity=".35" className="shelf-halo" />
      <rect x="14" y="14" width="92" height="12" rx="6" fill={B.base} />
      <rect x="14" y="14" width="92" height="4" rx="2" fill={B.light} />
      <path d="M60 0v14" stroke={B.base} strokeWidth="4" />
    </svg>
  );
}

/** Rolling ladder leaning on the bookcase ("Biblioteca"). */
export function LibraryLadder() {
  return (
    <svg
      width="70"
      height="560"
      viewBox="0 0 70 560"
      aria-hidden="true"
      className="pointer-events-none absolute top-2.5 -right-1.5 z-[2] origin-top rotate-[5deg] drop-shadow-[-4px_6px_6px_rgba(0,0,0,0.3)]"
    >
      <rect x="6" y="0" width="7" height="560" rx="3" fill={B.deep} />
      <rect x="54" y="0" width="7" height="560" rx="3" fill={B.deep} />
      <g fill={C.rung}>
        {[40, 110, 180, 250, 320, 390, 460, 530].map((y) => (
          <rect key={y} x="10" y={y} width="48" height="6" rx="2" />
        ))}
      </g>
      <circle cx="9" cy="6" r="6" fill={B.base} />
      <circle cx="58" cy="6" r="6" fill={B.base} />
    </svg>
  );
}

/** Bracket under a floating plank. */
export function PlankBracket({ color, side }: { color: string; side: "left" | "right" }) {
  return (
    <svg
      width="14"
      height="16"
      viewBox="0 0 14 16"
      aria-hidden="true"
      className="absolute -bottom-3.5"
      style={side === "left" ? { left: 44 } : { right: 44, transform: "scaleX(-1)" }}
    >
      <path d="M1 0h12v3H5v13H1z" fill={color} />
    </svg>
  );
}
