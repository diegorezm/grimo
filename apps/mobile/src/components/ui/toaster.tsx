import { type Toast, type ToastTone, useToastStore } from "@grimo/client";
import { useEffect } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { Fonts, radius, spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Glass } from "./glass";
import { Icon } from "./icon";
import { Text } from "./text";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const KICKERS: Record<ToastTone, string> = {
  success: "Salvo",
  info: "Aviso",
  error: "Não salvou",
};

const MARK = 32;
const CHECK_LENGTH = 22;

/**
 * The notice after an action, above the tab bar, in the app's glass (light in the light theme,
 * never a dark bar). It springs up, the mark pops and the check draws itself. Mounted once in the
 * root layout; screens call `toast.saved(…)` / `toast.failed(…)` from `@grimo/client`.
 */
export function Toaster() {
  const current = useToastStore((state) => state.current);
  const dismiss = useToastStore((state) => state.dismiss);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const enter = useSharedValue(0);

  useEffect(() => {
    if (!current) return;
    enter.value = 0;
    enter.value = reduceMotion
      ? withTiming(1, { duration: 150 })
      : withSpring(1, { damping: 14, stiffness: 180, mass: 0.8 });
    AccessibilityInfo.announceForAccessibility(current.message);
  }, [current, enter, reduceMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: Math.min(1, enter.value * 1.6),
    transform: [{ translateY: (1 - enter.value) * 28 }, { scale: 0.94 + 0.06 * enter.value }],
  }));

  if (!current) return null;
  return (
    <View pointerEvents="box-none" style={[styles.host, { bottom: insets.bottom + 72 }]}>
      <Animated.View style={style}>
        <ToastCard key={current.id} toast={current} onClose={() => dismiss(current.id)} />
      </Animated.View>
    </View>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const theme = useTheme();
  const error = toast.tone === "error";
  const content = (
    <>
      <Mark tone={toast.tone} />
      <View style={styles.text}>
        <Text variant="label" color={error ? "danger" : "textMuted"} style={styles.kicker}>
          {KICKERS[toast.tone]}
        </Text>
        <Text style={styles.message} numberOfLines={3}>
          {toast.message}
        </Text>
      </View>
      {toast.action ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            toast.action?.run();
            onClose();
          }}
          style={({ pressed }) => [
            styles.action,
            { borderLeftColor: error ? theme.danger : theme.edge, opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text
            variant="label"
            color={error ? "danger" : "accentInk"}
            style={{ fontFamily: Fonts.monoBold }}
          >
            {toast.action.label}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar aviso"
          onPress={onClose}
          style={styles.close}
        >
          <Icon name="close" size={14} color="textMuted" />
        </Pressable>
      )}
    </>
  );

  // An error is a pale danger wash (reads apart from a success without a dark fill).
  if (error) {
    return (
      <View
        accessibilityRole="alert"
        style={[
          styles.card,
          styles.errorCard,
          { backgroundColor: theme.dangerSoft, borderColor: theme.danger },
        ]}
      >
        {content}
      </View>
    );
  }
  return (
    <Glass accessibilityRole="alert" style={styles.card}>
      {content}
    </Glass>
  );
}

/** Round mark: gradient check (success), cloud (offline / info), "!" (error). Pops in. */
function Mark({ tone }: { tone: ToastTone }) {
  const theme = useTheme();
  const pop = useSharedValue(0);
  const draw = useSharedValue(CHECK_LENGTH);

  useEffect(() => {
    pop.value = withDelay(100, withSpring(1, { damping: 9, stiffness: 260 }));
    draw.value = withDelay(220, withTiming(0, { duration: 320 }));
  }, [pop, draw]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: draw.value }));

  if (tone === "info") {
    return (
      <Animated.View style={[styles.mark, { backgroundColor: theme.surfaceMuted }, popStyle]}>
        <Icon name="cloudOff" size={17} />
      </Animated.View>
    );
  }
  if (tone === "error") {
    return (
      <Animated.View style={[styles.mark, { backgroundColor: theme.danger }, popStyle]}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M12 6v8M12 18v.5"
            stroke={theme.dangerSoft}
            strokeWidth={2.6}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    );
  }
  return (
    <Animated.View style={[styles.mark, popStyle]}>
      <Svg width={MARK} height={MARK} viewBox="0 0 32 32">
        <Defs>
          <LinearGradient id="toast-mark" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={theme.accentStart} />
            <Stop offset="1" stopColor={theme.accent} />
          </LinearGradient>
        </Defs>
        <Circle cx={16} cy={16} r={16} fill="url(#toast-mark)" />
        <AnimatedPath
          d="M9.5 16.5l4 4 9-9"
          fill="none"
          stroke={theme.accentForeground}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={CHECK_LENGTH}
          animatedProps={checkProps}
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: spacing[4], right: spacing[4] },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    borderRadius: radius.lg,
    paddingVertical: spacing[2],
    paddingLeft: spacing[3],
    paddingRight: spacing[1],
  },
  errorCard: { borderWidth: 1 },
  mark: {
    width: MARK,
    height: MARK,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 1, paddingVertical: spacing[1] },
  kicker: { fontSize: 10 },
  message: { fontSize: 15, lineHeight: 20 },
  action: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
