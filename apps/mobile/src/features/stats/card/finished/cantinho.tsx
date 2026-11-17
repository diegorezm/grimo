import { isDarkColor } from "@grimo/core";
import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { CardCover, CardFooter, T } from "../parts";
import { buildDetailPills, type FinishedCardProps, RatingRow } from "./shared";

/**
 * "Cantinho": cozy reading nook with Grimo's original bespectacled reader mascot,
 * stacked books, steaming mug and symmetrical bedside lamp light, tinted to the active palette.
 */
export function CantinhoFinishedCard({ data, palette, showDetails = true }: FinishedCardProps) {
  const uid = useId().replace(/:/g, "");
  const dark = isDarkColor(palette.bg);
  const d = data.details;

  const wallShelf = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const spine3 = dark ? "#3B324B" : "#D6CBB8";
  const skin = dark ? "#F7EFEA" : "#FFFBF7";
  const strokeInk = dark ? "#1A1423" : palette.ink;
  const warmGlow = dark ? palette.accent2 : palette.accent;
  const mugFill = dark ? "#F3EAF2" : "#FFFDF9";
  const teaFill = dark ? "#6E473B" : "#7A4B3A";
  const accentText = dark ? palette.accent2 : palette.accent;
  const pills = buildDetailPills(data, showDetails);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <Svg viewBox="0 0 360 640" width={1080} height={1920} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id={`lamp-${uid}`} cx="22%" cy="54%" r="58%">
            <Stop offset="0%" stopColor={warmGlow} stopOpacity={0.34} />
            <Stop offset="55%" stopColor={palette.accent} stopOpacity={0.1} />
            <Stop offset="100%" stopColor={palette.bg} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id={`cone-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={palette.accent2} stopOpacity={0.3} />
            <Stop offset="65%" stopColor={palette.accent2} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={palette.accent2} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        <G opacity={0.55}>
          <Rect x={20} y={255} width={320} height={5} rx={2} fill={wallShelf} />
          <Rect x={36} y={210} width={16} height={45} rx={2} fill={wallShelf} />
          <Rect x={55} y={218} width={12} height={37} rx={2} fill={wallShelf} />
          <Rect x={70} y={205} width={18} height={50} rx={2} fill={wallShelf} />
          <Rect x={92} y={222} width={14} height={33} rx={2} fill={wallShelf} />
          <Rect x={248} y={214} width={16} height={41} rx={2} fill={wallShelf} />
          <Rect x={267} y={204} width={18} height={51} rx={2} fill={wallShelf} />
          <Rect x={289} y={220} width={13} height={35} rx={2} fill={wallShelf} />
          <Rect
            x={148}
            y={204}
            width={64}
            height={44}
            rx={4}
            fill="none"
            stroke={wallShelf}
            strokeWidth={2.5}
          />
          <Path
            d="M158 238 Q174 218 188 230 T204 224"
            fill="none"
            stroke={wallShelf}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>

        <Rect width={360} height={640} fill={`url(#lamp-${uid})`} />

        {/* Symmetrical layered light cone + bedside lamp */}
        <G transform="translate(26, 286)">
          <Polygon points="14,44 -20,192 94,192 60,44" fill={`url(#cone-${uid})`} opacity={0.45} />
          <Polygon points="18,44 -8,186 82,186 56,44" fill={`url(#cone-${uid})`} opacity={0.75} />
          <Rect x={35} y={44} width={4} height={116} rx={2} fill={palette.muted} opacity={0.75} />
          <Ellipse
            cx={37}
            cy={160}
            rx={20}
            ry={5}
            fill={palette.paper}
            stroke={strokeInk}
            strokeWidth={2}
          />
          <Path
            d="M16 44 L24 10 L50 10 L58 44 Z"
            fill={palette.accent}
            stroke={strokeInk}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <Ellipse cx={37} cy={44} rx={21} ry={4} fill={palette.accent2} opacity={0.75} />
        </G>

        {/* Rug + cushion */}
        <Ellipse cx={184} cy={494} rx={146} ry={30} fill={palette.paper} opacity={0.95} />
        <Ellipse
          cx={184}
          cy={494}
          rx={134}
          ry={22}
          fill="none"
          stroke={palette.accent2}
          strokeOpacity={0.35}
          strokeWidth={2}
          strokeDasharray="6 5"
        />
        <Rect
          x={96}
          y={382}
          width={112}
          height={82}
          rx={28}
          fill={palette.accent2}
          opacity={0.35}
          stroke={strokeInk}
          strokeWidth={2.2}
        />

        {/* Book stack */}
        <G transform="translate(226, 405)">
          <Rect
            x={0}
            y={54}
            width={96}
            height={22}
            rx={4}
            fill={spine3}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <Rect x={8} y={59} width={76} height={12} rx={2} fill={skin} opacity={0.75} />
          <Rect
            x={6}
            y={32}
            width={84}
            height={22}
            rx={4}
            fill={palette.accent2}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <Line
            x1={16}
            y1={38}
            x2={72}
            y2={38}
            stroke={strokeInk}
            strokeWidth={1.5}
            opacity={0.35}
          />
          <Rect
            x={12}
            y={10}
            width={74}
            height={22}
            rx={4}
            fill={palette.accent}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <Path
            d="M26 32 L26 45 L31 41 L36 45 L36 32 Z"
            fill={palette.accent2}
            stroke={strokeInk}
            strokeWidth={1.6}
          />
        </G>

        {/* Warm mug */}
        <G transform="translate(250, 377)">
          <Path
            d="M16 -2 C12 -10 22 -14 17 -22"
            fill="none"
            stroke={palette.ink}
            strokeOpacity={0.55}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M27 -4 C23 -12 32 -16 28 -25"
            fill="none"
            stroke={palette.ink}
            strokeOpacity={0.45}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M40 12 C51 12 51 30 40 30"
            fill="none"
            stroke={strokeInk}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <Rect
            x={4}
            y={6}
            width={38}
            height={32}
            rx={8}
            fill={mugFill}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <Ellipse
            cx={23}
            cy={6}
            rx={19}
            ry={5}
            fill={mugFill}
            stroke={strokeInk}
            strokeWidth={2}
          />
          <Ellipse cx={23} cy={6.5} rx={14} ry={3} fill={teaFill} />
          <Circle cx={17} cy={21} r={1.6} fill={strokeInk} />
          <Circle cx={29} cy={21} r={1.6} fill={strokeInk} />
          <Path
            d="M21 23 Q23 26 25 23"
            fill="none"
            stroke={strokeInk}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </G>

        {/* Original Grimo reader mascot */}
        <G transform="translate(104, 344)">
          <Circle cx={24} cy={22} r={14} fill={skin} stroke={strokeInk} strokeWidth={2.4} />
          <Circle cx={24} cy={22} r={7} fill={palette.accent} opacity={0.55} />
          <Circle cx={88} cy={22} r={14} fill={skin} stroke={strokeInk} strokeWidth={2.4} />
          <Circle cx={88} cy={22} r={7} fill={palette.accent} opacity={0.55} />

          <Path
            d="M16 112 C14 78 24 62 56 62 C88 62 98 78 96 112 C96 128 84 138 56 138 C28 138 16 128 16 112 Z"
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.4}
          />
          <Ellipse
            cx={56}
            cy={48}
            rx={40}
            ry={34}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.4}
          />

          <Path
            d="M24 72 Q56 85 88 72 Q91 80 86 85 Q56 97 26 85 Q21 80 24 72 Z"
            fill={palette.accent}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <Path
            d="M68 82 L78 106 L64 109 L58 84 Z"
            fill={palette.accent}
            stroke={strokeInk}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />

          <Ellipse cx={32} cy={54} rx={6} ry={3.5} fill={palette.accent} opacity={0.7} />
          <Ellipse cx={80} cy={54} rx={6} ry={3.5} fill={palette.accent} opacity={0.7} />

          <Circle cx={41} cy={46} r={10.5} fill="none" stroke={strokeInk} strokeWidth={2} />
          <Circle cx={71} cy={46} r={10.5} fill="none" stroke={strokeInk} strokeWidth={2} />
          <Line x1={51.5} y1={46} x2={60.5} y2={46} stroke={strokeInk} strokeWidth={2} />
          <Circle cx={42} cy={47} r={2.5} fill={strokeInk} />
          <Circle cx={70} cy={47} r={2.5} fill={strokeInk} />
          <Path
            d="M51 54 Q56 58 61 54"
            fill="none"
            stroke={strokeInk}
            strokeWidth={1.8}
            strokeLinecap="round"
          />

          <Ellipse
            cx={26}
            cy={108}
            rx={9}
            ry={7}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <Ellipse
            cx={86}
            cy={108}
            rx={9}
            ry={7}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.2}
          />

          <G transform="translate(22, 96)">
            <Path
              d="M0 10 L34 15 L68 10 L68 38 L34 43 L0 38 Z"
              fill={palette.accent2}
              stroke={strokeInk}
              strokeWidth={2.2}
              strokeLinejoin="round"
            />
            <Path
              d="M4 8 Q19 4 34 13 Q49 4 64 8 L64 34 Q49 30 34 39 Q19 30 4 34 Z"
              fill="#FFFDF9"
              stroke={strokeInk}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
            <Line x1={34} y1={13} x2={34} y2={39} stroke={strokeInk} strokeWidth={1.6} />
            <Line
              x1={11}
              y1={17}
              x2={27}
              y2={19}
              stroke={strokeInk}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Line
              x1={11}
              y1={23}
              x2={27}
              y2={25}
              stroke={strokeInk}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Line
              x1={41}
              y1={19}
              x2={57}
              y2={17}
              stroke={strokeInk}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <Line
              x1={41}
              y1={25}
              x2={57}
              y2={23}
              stroke={strokeInk}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </G>

          <Ellipse
            cx={38}
            cy={136}
            rx={10}
            ry={6}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <Ellipse
            cx={74}
            cy={136}
            rx={10}
            ry={6}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
        </G>
      </Svg>

      <View style={styles.top}>
        <T face="mono" size={28} color={palette.muted} style={{ letterSpacing: 7 }}>
          {data.eyebrow}
        </T>
        {showDetails && d?.yearRank ? (
          <View style={[styles.badge, { borderColor: palette.accent }]}>
            <T face="mono" size={26} color={palette.accent} style={{ letterSpacing: 3 }}>
              #{d.yearRank.index} DE {d.yearRank.year}
            </T>
          </View>
        ) : null}
      </View>

      <View style={styles.hero}>
        <CardCover book={data.book} width={216} palette={palette} />
        <View style={styles.flex}>
          <T face="mono" size={26} color={accentText} style={{ letterSpacing: 4 }}>
            {(data.headline ?? "Terminei de ler").toUpperCase()}
          </T>
          <T
            face="italic"
            size={data.book.title.length > 34 ? 48 : 60}
            color={palette.ink}
            lines={3}
            style={{ lineHeight: data.book.title.length > 34 ? 54 : 66, marginTop: 10 }}
          >
            {data.book.title}
          </T>
          <T size={34} color={palette.muted} lines={2} style={{ marginTop: 10 }}>
            {data.book.authors.join(", ")}
          </T>
          <View style={{ marginTop: 18 }}>
            <RatingRow
              rating={data.book.rating}
              color={accentText}
              muted={palette.muted}
              size={36}
            />
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        {pills.length > 0 && (
          <View style={styles.pills}>
            {pills.map((pill) => (
              <View
                key={pill.label}
                style={[
                  styles.pill,
                  { backgroundColor: pill.accent ? palette.accent : palette.paper },
                ]}
              >
                <T
                  face={pill.accent ? "monoBold" : "mono"}
                  size={26}
                  color={pill.accent ? (dark ? palette.bg : "#FFFFFF") : palette.ink}
                  style={{ letterSpacing: 2 }}
                >
                  {pill.label}
                </T>
              </View>
            ))}
          </View>
        )}
        <CardFooter username={data.username} palette={palette} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 1080,
    height: 1920,
    paddingTop: 72,
    paddingHorizontal: 66,
    paddingBottom: 56,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  badge: {
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  hero: { flexDirection: "row", alignItems: "center", gap: 40, marginTop: 42 },
  flex: { flex: 1 },
  bottom: { marginTop: "auto" },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  pill: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 22 },
});
