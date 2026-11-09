import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { FadeInDown, Keyframe, ReduceMotion } from "react-native-reanimated";

/**
 * Entrance motion: each screen animates the first time it opens in a session (coming back
 * doesn't replay it) and never when the system asks to reduce motion. Nothing here delays a
 * tap: the content is there from the first frame, only fading in.
 */
const seen = new Set<string>();

/** True the first time a screen with this key mounts in this session (`null`: never). */
export function useFirstVisit(key: string | null) {
  const [first] = useState(() => {
    if (key === null) return false;
    const isFirst = !seen.has(key);
    seen.add(key);
    return isFirst;
  });
  return first;
}

const STEP = 60;
/** After this many blocks the rest come in together (long lists don't trickle). */
const MAX_STEPS = 8;
const delayOf = (index: number) => Math.min(index, MAX_STEPS) * STEP;

/** A: rises 12 pt while fading in, one block after the other. */
export const riseAt = (index: number) =>
  FadeInDown.duration(320)
    .delay(delayOf(index))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })
    .reduceMotion(ReduceMotion.System);

/** B: a cover drops onto its plank and settles. */
export const landAt = (index: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ translateY: -18 }, { rotate: "-3deg" }] },
    70: { opacity: 1, transform: [{ translateY: 2 }, { rotate: "0.5deg" }] },
    100: { opacity: 1, transform: [{ translateY: 0 }, { rotate: "0deg" }] },
  })
    .duration(420)
    .delay(120 + delayOf(index))
    .reduceMotion(ReduceMotion.System);

/** B: a plank draws itself before its covers land. */
export const plankAt = (index: number) =>
  new Keyframe({
    0: { opacity: 0, transform: [{ scaleX: 0 }] },
    100: { opacity: 1, transform: [{ scaleX: 1 }] },
  })
    .duration(360)
    .delay(delayOf(index * 3))
    .reduceMotion(ReduceMotion.System);

/**
 * D: counts from 0 up to `target` (ease out, 700 ms) when `animate`; otherwise, or with reduce
 * motion on, it is just the target.
 */
export function useCountUp(target: number, animate: boolean) {
  const [value, setValue] = useState(animate ? 0 : target);
  const done = useRef(!animate);
  useEffect(() => {
    if (done.current) return setValue(target);
    let frame = 0;
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        done.current = true;
        return setValue(target);
      }
      const start = Date.now();
      const step = () => {
        const t = Math.min(1, (Date.now() - start) / 700);
        setValue(target * (1 - (1 - t) ** 3));
        if (t < 1) frame = requestAnimationFrame(step);
        else done.current = true;
      };
      frame = requestAnimationFrame(step);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [target]);
  return value;
}
