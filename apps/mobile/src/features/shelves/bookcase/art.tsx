import type { Art, ArtShape } from "@grimo/premium";
import Svg, { Circle, Ellipse, Path, Rect } from "react-native-svg";

const paint = (shape: ArtShape) => ({
  fill: shape.fill ?? "none",
  stroke: shape.stroke,
  strokeWidth: shape.sw,
  opacity: shape.opacity,
  strokeLinecap: shape.round ? ("round" as const) : undefined,
  strokeLinejoin: shape.round ? ("round" as const) : undefined,
});

/**
 * Draws vector art given as data (`Art`: the objects and ornaments of the paid content; the web
 * draws the same data with `<svg>`). `width` stretches it sideways, keeping the height.
 */
export function ArtSvg({ art, width }: { art: Art; width?: number }) {
  return (
    <Svg
      viewBox={`0 0 ${art.width} ${art.height}`}
      width={width ?? art.width}
      height={art.height}
      preserveAspectRatio={width ? "none" : undefined}
    >
      {art.shapes.map((shape, i) => {
        if (shape.t === "path") return <Path key={i} d={shape.d} {...paint(shape)} />;
        if (shape.t === "circle") {
          return <Circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} {...paint(shape)} />;
        }
        if (shape.t === "ellipse") {
          return (
            <Ellipse
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
          <Rect
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
    </Svg>
  );
}
