import type { Art, ArtShape } from "@grimo/premium";
import type { CSSProperties } from "react";

const paint = (shape: ArtShape) => ({
  fill: shape.fill ?? "none",
  stroke: shape.stroke,
  strokeWidth: shape.sw,
  opacity: shape.opacity,
  strokeLinecap: shape.round ? ("round" as const) : undefined,
  strokeLinejoin: shape.round ? ("round" as const) : undefined,
});

/**
 * Draws vector art given as data (`Art`: the objects and ornaments of the paid content; mobile
 * draws the same data with `react-native-svg`). `stretch` fills the width, keeping the height.
 */
export function ArtSvg({
  art,
  label,
  stretch = false,
  className,
  style,
}: {
  art: Art;
  label?: string;
  stretch?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox={`0 0 ${art.width} ${art.height}`}
      width={stretch ? "100%" : art.width}
      height={art.height}
      preserveAspectRatio={stretch ? "none" : undefined}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={className}
      style={style}
    >
      {art.shapes.map((shape, i) => {
        if (shape.t === "path") return <path key={i} d={shape.d} {...paint(shape)} />;
        if (shape.t === "circle") {
          return <circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} {...paint(shape)} />;
        }
        if (shape.t === "ellipse") {
          return (
            <ellipse
              key={i}
              cx={shape.cx}
              cy={shape.cy}
              rx={shape.rx}
              ry={shape.ry}
              {...paint(shape)}
            />
          );
        }
        return (
          <rect
            key={i}
            x={shape.x}
            y={shape.y}
            width={shape.w}
            height={shape.h}
            rx={shape.rx}
            {...paint(shape)}
          />
        );
      })}
    </svg>
  );
}
