import { Children, type ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { riseAt } from "@/lib/motion";

/**
 * Each child rises in after the one before (from `from`) when `animate`; otherwise the children
 * as they are. Empty children (`false`, `null`) don't take a turn.
 */
export function EnterEach({
  animate,
  from = 0,
  children,
}: {
  animate: boolean;
  from?: number;
  children: ReactNode;
}) {
  if (!animate) return <>{children}</>;
  return (
    <>
      {Children.toArray(children).map((child, index) => (
        <Enter key={index} index={from + index} animate>
          {child}
        </Enter>
      ))}
    </>
  );
}

/** One block of a screen that rises in at its turn (`index`) when `animate`. */
export function Enter({
  index,
  animate,
  style,
  children,
}: {
  index: number;
  animate: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Animated.View entering={animate ? riseAt(index) : undefined} style={style}>
      {children}
    </Animated.View>
  );
}
