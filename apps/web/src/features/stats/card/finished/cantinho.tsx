import { isDarkColor } from "@grimo/core";
import { useId } from "react";
import { CardCover, CardFooter } from "../parts";
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
    <div
      className="relative flex h-full w-full flex-col overflow-hidden"
      style={{ background: palette.bg, color: palette.ink, padding: "72px 66px 56px" }}
    >
      {/* Scene SVG scaled seamlessly to 1080×1920 from our 360×640 design grid */}
      <svg
        aria-hidden="true"
        viewBox="0 0 360 640"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id={`lamp-${uid}`} cx="0.22" cy="0.54" r="0.58">
            <stop offset="0%" stopColor={warmGlow} stopOpacity={0.34} />
            <stop offset="55%" stopColor={palette.accent} stopOpacity={0.1} />
            <stop offset="100%" stopColor={palette.bg} stopOpacity={0} />
          </radialGradient>
          <linearGradient id={`cone-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={palette.accent2} stopOpacity={0.34} />
            <stop offset="65%" stopColor={palette.accent2} stopOpacity={0.1} />
            <stop offset="100%" stopColor={palette.accent2} stopOpacity={0} />
          </linearGradient>
          <filter id={`cone-blur-${uid}`} x="-30%" y="-10%" width="160%" height="130%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        {/* Subtle wall shelf + framed sketch */}
        <g opacity={0.55}>
          <rect x={20} y={255} width={320} height={5} rx={2} fill={wallShelf} />
          <rect x={36} y={210} width={16} height={45} rx={2} fill={wallShelf} />
          <rect x={55} y={218} width={12} height={37} rx={2} fill={wallShelf} />
          <rect x={70} y={205} width={18} height={50} rx={2} fill={wallShelf} />
          <rect x={92} y={222} width={14} height={33} rx={2} fill={wallShelf} />
          <rect x={248} y={214} width={16} height={41} rx={2} fill={wallShelf} />
          <rect x={267} y={204} width={18} height={51} rx={2} fill={wallShelf} />
          <rect x={289} y={220} width={13} height={35} rx={2} fill={wallShelf} />
          <rect
            x={148}
            y={204}
            width={64}
            height={44}
            rx={4}
            fill="none"
            stroke={wallShelf}
            strokeWidth={2.5}
          />
          <path
            d="M158 238 Q174 218 188 230 T204 224"
            fill="none"
            stroke={wallShelf}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>

        <rect width={360} height={640} fill={`url(#lamp-${uid})`} />

        {/* Bedside lamp with symmetrical soft cone */}
        <g transform="translate(26, 286)">
          <polygon
            points="16,44 -14,190 88,190 58,44"
            fill={`url(#cone-${uid})`}
            filter={`url(#cone-blur-${uid})`}
          />
          <rect x={35} y={44} width={4} height={116} rx={2} fill={palette.muted} opacity={0.75} />
          <ellipse
            cx={37}
            cy={160}
            rx={20}
            ry={5}
            fill={palette.paper}
            stroke={strokeInk}
            strokeWidth={2}
          />
          <path
            d="M16 44 L24 10 L50 10 L58 44 Z"
            fill={palette.accent}
            stroke={strokeInk}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <ellipse cx={37} cy={44} rx={21} ry={4} fill={palette.accent2} opacity={0.75} />
        </g>

        {/* Cozy rug + cushion */}
        <ellipse cx={184} cy={494} rx={146} ry={30} fill={palette.paper} opacity={0.95} />
        <ellipse
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
        <rect
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
        <g transform="translate(226, 405)">
          <rect
            x={0}
            y={54}
            width={96}
            height={22}
            rx={4}
            fill={spine3}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <rect x={8} y={59} width={76} height={12} rx={2} fill={skin} opacity={0.75} />
          <rect
            x={6}
            y={32}
            width={84}
            height={22}
            rx={4}
            fill={palette.accent2}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <line
            x1={16}
            y1={38}
            x2={72}
            y2={38}
            stroke={strokeInk}
            strokeWidth={1.5}
            opacity={0.35}
          />
          <rect
            x={12}
            y={10}
            width={74}
            height={22}
            rx={4}
            fill={palette.accent}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <path
            d="M26 32 L26 45 L31 41 L36 45 L36 32 Z"
            fill={palette.accent2}
            stroke={strokeInk}
            strokeWidth={1.6}
          />
        </g>

        {/* Warm steaming mug resting flush on the stack */}
        <g transform="translate(250, 377)">
          <path
            d="M16 -2 C12 -10 22 -14 17 -22"
            fill="none"
            stroke={palette.ink}
            strokeOpacity={0.55}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d="M27 -4 C23 -12 32 -16 28 -25"
            fill="none"
            stroke={palette.ink}
            strokeOpacity={0.45}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d="M40 12 C51 12 51 30 40 30"
            fill="none"
            stroke={strokeInk}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
          <rect
            x={4}
            y={6}
            width={38}
            height={32}
            rx={8}
            fill={mugFill}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <ellipse
            cx={23}
            cy={6}
            rx={19}
            ry={5}
            fill={mugFill}
            stroke={strokeInk}
            strokeWidth={2}
          />
          <ellipse cx={23} cy={6.5} rx={14} ry={3} fill={teaFill} />
          <circle cx={17} cy={21} r={1.6} fill={strokeInk} />
          <circle cx={29} cy={21} r={1.6} fill={strokeInk} />
          <path
            d="M21 23 Q23 26 25 23"
            fill="none"
            stroke={strokeInk}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </g>

        {/* Original Grimo reader mascot */}
        <g transform="translate(104, 344)">
          <circle cx={24} cy={22} r={14} fill={skin} stroke={strokeInk} strokeWidth={2.4} />
          <circle cx={24} cy={22} r={7} fill={palette.accent} opacity={0.55} />
          <circle cx={88} cy={22} r={14} fill={skin} stroke={strokeInk} strokeWidth={2.4} />
          <circle cx={88} cy={22} r={7} fill={palette.accent} opacity={0.55} />

          <path
            d="M16 112 C14 78 24 62 56 62 C88 62 98 78 96 112 C96 128 84 138 56 138 C28 138 16 128 16 112 Z"
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.4}
          />
          <ellipse
            cx={56}
            cy={48}
            rx={40}
            ry={34}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.4}
          />

          <path
            d="M24 72 Q56 85 88 72 Q91 80 86 85 Q56 97 26 85 Q21 80 24 72 Z"
            fill={palette.accent}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <path
            d="M68 82 L78 106 L64 109 L58 84 Z"
            fill={palette.accent}
            stroke={strokeInk}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />

          <ellipse cx={32} cy={54} rx={6} ry={3.5} fill={palette.accent} opacity={0.7} />
          <ellipse cx={80} cy={54} rx={6} ry={3.5} fill={palette.accent} opacity={0.7} />

          <circle cx={41} cy={46} r={10.5} fill="none" stroke={strokeInk} strokeWidth={2} />
          <circle cx={71} cy={46} r={10.5} fill="none" stroke={strokeInk} strokeWidth={2} />
          <line x1={51.5} y1={46} x2={60.5} y2={46} stroke={strokeInk} strokeWidth={2} />
          <circle cx={42} cy={47} r={2.5} fill={strokeInk} />
          <circle cx={70} cy={47} r={2.5} fill={strokeInk} />
          <path
            d="M51 54 Q56 58 61 54"
            fill="none"
            stroke={strokeInk}
            strokeWidth={1.8}
            strokeLinecap="round"
          />

          <ellipse
            cx={26}
            cy={108}
            rx={9}
            ry={7}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <ellipse
            cx={86}
            cy={108}
            rx={9}
            ry={7}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.2}
          />

          <g transform="translate(22, 96)">
            <path
              d="M0 10 L34 15 L68 10 L68 38 L34 43 L0 38 Z"
              fill={palette.accent2}
              stroke={strokeInk}
              strokeWidth={2.2}
              strokeLinejoin="round"
            />
            <path
              d="M4 8 Q19 4 34 13 Q49 4 64 8 L64 34 Q49 30 34 39 Q19 30 4 34 Z"
              fill="#FFFDF9"
              stroke={strokeInk}
              strokeWidth={1.8}
              strokeLinejoin="round"
            />
            <line x1={34} y1={13} x2={34} y2={39} stroke={strokeInk} strokeWidth={1.6} />
            <line
              x1={11}
              y1={17}
              x2={27}
              y2={19}
              stroke={strokeInk}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <line
              x1={11}
              y1={23}
              x2={27}
              y2={25}
              stroke={strokeInk}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <line
              x1={41}
              y1={19}
              x2={57}
              y2={17}
              stroke={strokeInk}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
            <line
              x1={41}
              y1={25}
              x2={57}
              y2={23}
              stroke={strokeInk}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          </g>

          <ellipse
            cx={38}
            cy={136}
            rx={10}
            ry={6}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
          <ellipse
            cx={74}
            cy={136}
            rx={10}
            ry={6}
            fill={skin}
            stroke={strokeInk}
            strokeWidth={2.2}
          />
        </g>
      </svg>

      {/* Header */}
      <div className="relative flex items-center justify-between">
        <span
          className="font-mono"
          style={{ fontSize: 28, letterSpacing: "0.24em", color: palette.muted }}
        >
          {data.eyebrow}
        </span>
        {showDetails && d?.yearRank && (
          <span
            className="font-mono"
            style={{
              fontSize: 26,
              letterSpacing: "0.1em",
              padding: "8px 22px",
              borderRadius: 999,
              border: `2px solid ${palette.accent}`,
              color: palette.accent,
            }}
          >
            #{d.yearRank.index} DE {d.yearRank.year}
          </span>
        )}
      </div>

      {/* Book cover + info */}
      <div className="relative flex items-center" style={{ gap: 40, marginTop: 42 }}>
        <CardCover book={data.book} width={216} palette={palette} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            className="font-mono"
            style={{
              fontSize: 26,
              letterSpacing: "0.14em",
              color: accentText,
              textTransform: "uppercase",
            }}
          >
            {data.headline}
          </p>
          <h1
            className="font-serif"
            style={{
              fontSize: data.book.title.length > 34 ? 48 : 60,
              lineHeight: 1.08,
              fontStyle: "italic",
              fontWeight: 700,
              marginTop: 10,
            }}
          >
            {data.book.title}
          </h1>
          <p style={{ fontSize: 34, marginTop: 10, color: palette.muted }}>
            {data.book.authors.join(", ")}
          </p>
          <div style={{ marginTop: 18 }}>
            <RatingRow
              rating={data.book.rating}
              color={accentText}
              muted={palette.muted}
              size={36}
            />
          </div>
        </div>
      </div>

      {/* Bottom pills + footer */}
      <div className="relative" style={{ marginTop: "auto" }}>
        {pills.length > 0 && (
          <div className="flex flex-wrap justify-center" style={{ gap: 16, marginBottom: 32 }}>
            {pills.map((pill) => (
              <span
                key={pill.label}
                className="font-mono"
                style={{
                  fontSize: 26,
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: pill.accent ? palette.accent : palette.paper,
                  color: pill.accent ? (dark ? palette.bg : "#FFFFFF") : palette.ink,
                  fontWeight: pill.accent ? 700 : 500,
                  letterSpacing: "0.06em",
                }}
              >
                {pill.label}
              </span>
            ))}
          </div>
        )}
        <CardFooter username={data.username} palette={palette} />
      </div>
    </div>
  );
}
