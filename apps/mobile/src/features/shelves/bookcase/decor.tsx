import type { ShelfDecor } from "@grimo/core";
import { SHELF_DECOR_LABELS } from "@grimo/core";
import { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { shelfBrass, shelfDecorColors } from "@/constants/theme";
import { premiumTokens } from "@/lib/premium";
import { ArtSvg } from "./art";

/**
 * The objects that stand between the books. Drawn here (they are the reader's things, in their
 * own colors), each with a small loop: the plant sways, the candle glows, the star twinkles.
 * `still` draws them without motion (thumbnails, the editor's tiles).
 */

const {
  leaf: LEAF,
  leafLight: LEAF_LIGHT,
  leafDark: LEAF_DARK,
  pot: POT,
  potRim: POT_RIM,
  blossom: BLOSSOM,
  wax: WAX,
  waxDrip: WAX_DRIP,
  glow: GLOW,
  flame: FLAME,
  flameCore: FLAME_CORE,
  lilac: LILAC,
  lilacLight: LILAC_LIGHT,
  blush: BLUSH,
  mist: MIST,
  steam: STEAM,
  ink: INK,
  sea: SEA,
  rung: RUNG,
} = shelfDecorColors;

/** A loop between 0 and 1 (back and forth), or nothing when motion is reduced or `still`. */
function useLoop(ms: number, still: boolean) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (still || reduce) return;
    t.value = withRepeat(
      withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [ms, still, reduce, t]);
  return t;
}

function Plant({ still }: { still: boolean }) {
  const t = useLoop(2300, still);
  const sway = useAnimatedStyle(() => ({
    transform: [{ translateY: 24 }, { rotate: `${-3 + t.value * 6}deg` }, { translateY: -24 }],
  }));
  return (
    <Animated.View style={{ width: 46, height: 78 }}>
      <Animated.View style={[{ position: "absolute", left: 0, top: 0 }, sway]}>
        <Svg width={46} height={50} viewBox="0 0 46 50">
          <Path d="M23 48C21 34 12 26 4 24c2 10 9 20 19 24z" fill={LEAF} />
          <Path d="M23 48c2-14 11-22 19-24-2 10-9 20-19 24z" fill={LEAF_LIGHT} />
          <Path d="M23 48C22 30 24 14 30 4c4 12 1 30-7 44z" fill={LEAF_DARK} />
        </Svg>
      </Animated.View>
      <Svg width={46} height={78} viewBox="0 0 46 78" style={{ position: "absolute" }}>
        <Path d="M9 50h28l-3 26H12z" fill={POT} />
        <Path d="M7 46h32v6H7z" fill={POT_RIM} />
      </Svg>
    </Animated.View>
  );
}

function Candle({ still }: { still: boolean }) {
  const t = useLoop(1200, still);
  const glow = useAnimatedStyle(() => ({ opacity: 0.45 + t.value * 0.45 }));
  const flame = useAnimatedStyle(() => ({
    transform: [{ scaleX: 1 - t.value * 0.12 }, { scaleY: 0.94 + t.value * 0.12 }],
  }));
  return (
    <Animated.View style={{ width: 28, height: 62 }}>
      <Animated.View style={[{ position: "absolute", left: 2, top: 1 }, glow]}>
        <Svg width={24} height={24}>
          <Circle cx={12} cy={12} r={12} fill={GLOW} />
        </Svg>
      </Animated.View>
      <Animated.View style={[{ position: "absolute", left: 9, top: 4 }, flame]}>
        <Svg width={10} height={15} viewBox="9 4 10 15">
          <Path d="M14 4c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z" fill={FLAME} />
          <Path d="M14 10c1.4 2 2 3.4 2 4.6a2 2 0 0 1-4 0c0-1.2.6-2.6 2-4.6z" fill={FLAME_CORE} />
        </Svg>
      </Animated.View>
      <Svg width={28} height={62} viewBox="0 0 28 62" style={{ position: "absolute" }}>
        <Path d="M14 18v4" stroke={INK} strokeWidth={1.4} />
        <Rect x={7} y={22} width={14} height={36} rx={2} fill={WAX} />
        <Path d="M7 26c3 2 5-1 7 1s4 3 7 0" fill="none" stroke={WAX_DRIP} strokeWidth={1.4} />
        <Rect x={4} y={57} width={20} height={5} rx={2} fill={shelfBrass.base} />
      </Svg>
    </Animated.View>
  );
}

function Frame() {
  return (
    <Svg width={48} height={60} viewBox="0 0 48 60" style={{ transform: [{ rotate: "-4deg" }] }}>
      <Rect x={2} y={2} width={44} height={56} rx={3} fill={shelfBrass.base} />
      <Rect x={7} y={7} width={34} height={46} rx={1} fill={MIST} />
      <Circle cx={31} cy={18} r={5} fill={BLUSH} />
      <Path d="M7 45l10-12 8 8 6-6 10 10v8H7z" fill={LILAC} />
      <Path d="M7 49l12-9 10 6 12-7v14H7z" fill={POT} />
    </Svg>
  );
}

function Mug({ still }: { still: boolean }) {
  const t = useLoop(1800, still);
  const steam = useAnimatedStyle(() => ({
    opacity: 0.3 + (1 - t.value) * 0.6,
    transform: [{ translateY: -t.value * 4 }],
  }));
  return (
    <Animated.View style={{ width: 38, height: 50 }}>
      <Animated.View style={[{ position: "absolute", left: 0, top: 0 }, steam]}>
        <Svg width={38} height={16} viewBox="0 0 38 16">
          <Path
            d="M12 14c-3-3 3-5 0-9M19 14c-3-3 3-5 0-9"
            fill="none"
            stroke={STEAM}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Svg width={38} height={50} viewBox="0 0 38 50" style={{ position: "absolute" }}>
        <Path d="M27 24h3a6 6 0 0 1 0 12h-3" fill="none" stroke={LILAC} strokeWidth={3} />
        <Path d="M4 18h24v24a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6z" fill={LILAC} />
        <Path d="M4 18h24v4H4z" fill={LILAC_LIGHT} />
        <Path d="M12 32l4-4 4 4-4 4z" fill={BLUSH} />
      </Svg>
    </Animated.View>
  );
}

function Star({ still }: { still: boolean }) {
  const t = useLoop(1300, still);
  const twinkle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - t.value * 0.22 }, { rotate: `${t.value * 45}deg` }],
  }));
  return (
    <Animated.View style={{ width: 32, height: 40 }}>
      <Animated.View style={[{ position: "absolute", left: 3, top: 2 }, twinkle]}>
        <Svg width={24} height={24} viewBox="3 2 24 24">
          <Path
            d="M15 2l3.2 8.6L27 14l-8.8 3.2L15 26l-3.2-8.8L3 14l8.8-3.4z"
            fill={shelfBrass.base}
          />
        </Svg>
      </Animated.View>
      <Svg width={32} height={40} viewBox="0 0 32 40" style={{ position: "absolute" }}>
        <Path d="M15 26v6" stroke={INK} strokeWidth={1.6} />
        <Rect x={6} y={32} width={20} height={8} rx={2} fill={INK} opacity={0.85} />
      </Svg>
    </Animated.View>
  );
}

function Globe() {
  return (
    <Svg width={44} height={62} viewBox="0 0 44 62">
      <Circle cx={22} cy={24} r={17} fill={SEA} />
      <G fill="none" stroke={LEAF} strokeWidth={4} strokeLinecap="round">
        <Path d="M12 14c6 2 8 8 4 12s2 8 6 10M28 10c-2 6 4 8 8 6M30 30c-4 2-4 6 0 8" />
      </G>
      <Path d="M4 24a18 18 0 0 0 36 0" fill="none" stroke={shelfBrass.base} strokeWidth={2.5} />
      <Path d="M22 42v10M12 56h20" stroke={shelfBrass.base} strokeWidth={3} strokeLinecap="round" />
    </Svg>
  );
}

export function DecorPiece({ decor, still = false }: { decor: ShelfDecor; still?: boolean }) {
  // A paid object: its drawing comes with the content (nothing without it).
  const art = premiumTokens.decor[decor];
  return (
    <Animated.View accessible accessibilityLabel={SHELF_DECOR_LABELS[decor]}>
      {decor === "plant" && <Plant still={still} />}
      {decor === "candle" && <Candle still={still} />}
      {decor === "frame" && <Frame />}
      {decor === "mug" && <Mug still={still} />}
      {decor === "star" && <Star still={still} />}
      {decor === "globe" && <Globe />}
      {art && <ArtSvg art={art} />}
    </Animated.View>
  );
}

/** The library's brass lamp, hanging over the first shelf. */
export function LibraryLamp() {
  return (
    <Svg width={120} height={40} viewBox="0 0 120 40">
      <Rect x={14} y={14} width={92} height={12} rx={6} fill={shelfBrass.base} />
      <Rect x={14} y={14} width={92} height={4} rx={2} fill={shelfBrass.light} />
      <Path d="M60 0v14" stroke={shelfBrass.base} strokeWidth={4} />
    </Svg>
  );
}

/** The library's ladder, leaning on the right of the shelves. */
export function LibraryLadder({ height }: { height: number }) {
  const rungs = Math.floor((height - 40) / 70);
  return (
    <Svg width={70} height={height} viewBox={`0 0 70 ${height}`}>
      <Rect x={6} y={0} width={7} height={height} rx={3} fill={shelfBrass.deep} />
      <Rect x={54} y={0} width={7} height={height} rx={3} fill={shelfBrass.deep} />
      {Array.from({ length: rungs }, (_, i) => (
        <Rect key={i} x={10} y={40 + i * 70} width={48} height={6} rx={2} fill={RUNG} />
      ))}
      <Circle cx={9} cy={6} r={6} fill={shelfBrass.base} />
      <Circle cx={58} cy={6} r={6} fill={shelfBrass.base} />
    </Svg>
  );
}

/** Ivy along the top of the arch. */
export function ArchIvy({ width }: { width: number }) {
  const s = width / 390;
  return (
    <Svg width={width} height={90 * s} viewBox="0 0 390 90">
      <Path
        d="M60 10c40 30 90 40 135 40s95-10 135-40"
        fill="none"
        stroke={LEAF_DARK}
        strokeWidth={2}
      />
      <Path
        d="M84 26c-6 8-4 16 2 22M120 40c-4 9 0 18 6 22M160 48c-2 10 2 18 8 20M230 48c2 10-2 18-8 20M270 40c4 9 0 18-6 22M306 26c6 8 4 16-2 22"
        fill="none"
        stroke={LEAF_DARK}
        strokeWidth={1.6}
      />
      {[
        [86, 48, LEAF_LIGHT],
        [126, 62, LEAF],
        [168, 68, LEAF_LIGHT],
        [222, 68, LEAF],
        [264, 62, LEAF_LIGHT],
        [304, 48, LEAF],
      ].map(([cx, cy, fill]) => (
        <Circle key={`${cx}`} cx={cx as number} cy={cy as number} r={5} fill={fill as string} />
      ))}
      <Circle cx={195} cy={50} r={4} fill={POT} />
      <Circle cx={140} cy={45} r={3} fill={BLOSSOM} />
      <Circle cx={250} cy={45} r={3} fill={BLOSSOM} />
    </Svg>
  );
}

/** The small bracket under a floating shelf. */
export function Bracket({ color, flip = false }: { color: string; flip?: boolean }) {
  return (
    <Svg
      width={14}
      height={16}
      viewBox="0 0 14 16"
      style={flip ? { transform: [{ scaleX: -1 }] } : undefined}
    >
      <Path d="M1 0h12v3H5v13H1z" fill={color} />
    </Svg>
  );
}
