import {
  SCENE_CHECKS,
  SCENE_FIREFLIES,
  SCENE_FOREST_LAYERS,
  SCENE_HEIGHT,
  SCENE_HILLS,
  SCENE_RAIN_HILLS,
  SCENE_RAINDROPS,
  SCENE_SOUNDS,
  SCENE_STARS,
  SCENE_SUNSET_PINES,
  SCENE_WAVES,
  SCENE_WIDTH,
  type ReadingScene as Scene,
  type SceneSound,
} from "@grimo/core";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/utils/cn";

const ink = (percent: number) => ({
  fill: `color-mix(in srgb, var(--color-accent) ${percent}%, transparent)`,
});

function Forest() {
  return (
    <>
      {SCENE_FOREST_LAYERS.map((layer) => (
        <svg
          aria-hidden="true"
          key={layer.ink}
          viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          preserveAspectRatio="xMidYMax slice"
          className="scene-sway absolute inset-x-[-3%] bottom-0 h-[55cqh] w-[106%]"
          style={{ "--sway": `${layer.sway}s` } as CSSProperties}
        >
          <path d={layer.path} style={ink(layer.ink)} />
        </svg>
      ))}
      {SCENE_FIREFLIES.map((firefly) => (
        <span
          key={firefly.left}
          className="scene-firefly absolute size-1.5 rounded-full bg-accent"
          style={{
            left: `${firefly.left}%`,
            bottom: `${firefly.bottom}%`,
            animationDelay: `${firefly.delay}s`,
            animationDuration: `${firefly.duration}s`,
          }}
        />
      ))}
    </>
  );
}

function Rain() {
  return (
    <>
      {SCENE_RAINDROPS.map((drop) => (
        <span
          key={drop.left}
          className="scene-drop absolute top-0 h-14 w-px bg-accent"
          style={{
            left: `${drop.left}%`,
            animationDelay: `${drop.delay}s`,
            animationDuration: `${drop.duration}s`,
          }}
        />
      ))}
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[35cqh] w-full"
      >
        <path d={SCENE_RAIN_HILLS} style={ink(16)} />
      </svg>
    </>
  );
}

function Night() {
  return (
    <>
      {SCENE_STARS.map((star) => (
        <span
          key={star.left}
          className="scene-star absolute rounded-full bg-accent"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="absolute top-[12%] right-[10%] size-[16cqh]"
      >
        <path d="M62 8a42 42 0 1 0 30 62A36 36 0 0 1 62 8Z" style={ink(28)} />
      </svg>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-x-0 bottom-0 h-[45cqh] w-full"
      >
        <path d={SCENE_HILLS} style={ink(18)} />
      </svg>
    </>
  );
}

function Ocean() {
  return (
    <>
      <span className="absolute bottom-[26cqh] left-1/2 size-[28cqh] -translate-x-1/2 rounded-full bg-accent opacity-15" />
      {SCENE_WAVES.map((layer) => (
        <svg
          aria-hidden="true"
          key={layer.ink}
          viewBox={`0 0 ${SCENE_WIDTH * 2} ${SCENE_HEIGHT}`}
          preserveAspectRatio="none"
          className="scene-wave absolute bottom-0 left-0 h-[40cqh] w-[200%]"
          style={{ "--drift": `${layer.drift}s` } as CSSProperties}
        >
          <path d={layer.path} style={ink(layer.ink)} />
        </svg>
      ))}
    </>
  );
}

const FULL_SCENE = "absolute inset-0 size-full";
/** Cozy: a sleepy tabby under a patchwork blanket, a lamp breathing light, drawn with a wobbly pen. */
function Cozy() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 640 500"
      preserveAspectRatio="xMinYMax meet"
      className="absolute bottom-0 left-0 h-[46cqh] w-[70cqw] max-w-3xl opacity-30 sm:opacity-100"
    >
      <defs>
        <filter id="scene-pen">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" />
          <feDisplacementMap in="SourceGraphic" scale="4" />
        </filter>
      </defs>
      <circle className="scene-glow" cx="88" cy="190" r="110" fill="#f4c95d" opacity="0.3" />
      <g filter="url(#scene-pen)" stroke="#33261c" strokeWidth="5" strokeLinejoin="round">
        <path d="M58 225h66l-14-75H72z" fill="#f2c14e" />
        <path d="M91 225v85" fill="none" />
        <path d="M45 312h92v14H45zM60 326v90M122 326v90" fill="#8a4b2a" />
        <path d="M175 255q0-55 60-55h290q60 0 60 55v135H175z" fill="#c9962e" />
        <path
          d="M150 300q0-30 34-30t34 30v100h-68zM540 300q0-30 32-30t32 30v100h-64z"
          fill="#d8a93c"
        />
        <path d="M170 400h420v28H170zM195 428l8 40h24l6-40zM530 428l8 40h24l6-40z" fill="#8a4b2a" />
        <path d="M470 265l75-20 18 85-78 20z" fill="#8c7a4f" />
        <path d="M225 330q-22-85 58-92 80 5 72 92z" fill="#e9a66f" />
        <path d="M225 208l-8-58 48 28h48l42-30-2 62q-4 58-66 58t-62-60z" fill="#efe6d2" />
        <path d="M250 165l8 24M285 158v26M318 165l-8 24" fill="none" />
        <circle cx="258" cy="222" r="5" fill="#33261c" />
        <circle cx="310" cy="222" r="5" fill="#33261c" />
        <path d="M278 238q6 8 12 0" fill="none" />
        <path d="M312 255l76-30 26 72-78 22z" fill="#a33b2c" />
        <path d="M392 226l26 72" fill="none" stroke="#f0d9b5" />
        <rect x="215" y="300" width="372" height="168" fill="#f0d9b5" />
        {SCENE_CHECKS.map((check) => (
          <rect
            key={`${check.x}:${check.y}`}
            x={check.x}
            y={check.y}
            width="62"
            height="42"
            fill={check.fill}
            strokeWidth="3"
          />
        ))}
      </g>
    </svg>
  );
}

/** Window: someone reading in silhouette, a curtain moving, late light on the water. */
function WindowView() {
  return (
    <>
      <svg
        aria-hidden="true"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMax slice"
        className={FULL_SCENE}
      >
        <defs>
          <linearGradient id="scene-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#b9c9b8" />
            <stop offset="0.55" stopColor="#7f7c6c" />
            <stop offset="1" stopColor="#4f4638" />
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="#2a1a12" />
        <rect x="230" y="0" width="900" height="665" fill="url(#scene-haze)" />
        <path d="M230 330 620 90l230 170 280-70v220H230z" fill="#7c8a80" opacity="0.55" />
        <path d="M230 440q240-130 480-40t420-30v100H230z" fill="#5d5b50" opacity="0.7" />
        <g fill="#efe3c8">
          <ellipse className="scene-shimmer" cx="900" cy="540" rx="220" ry="9" />
          <ellipse
            className="scene-shimmer"
            cx="820"
            cy="580"
            rx="160"
            ry="7"
            style={{ animationDelay: "-2s" }}
          />
          <ellipse
            className="scene-shimmer"
            cx="950"
            cy="625"
            rx="180"
            ry="8"
            style={{ animationDelay: "-4s" }}
          />
        </g>
        <rect y="665" width="1200" height="135" fill="#6b3c22" />
        <rect x="1130" width="70" height="800" fill="#150e0a" />
        <path d="M230 660h900v8H230z" fill="#150e0a" />
        <g fill="#140f0c">
          <circle cx="345" cy="425" r="38" />
          <path d="M320 462q40-8 58 30l52 74 62-20 10 24-82 38q-14 4-24-8l-22-30 4 90-90 2q-20-120 32-200z" />
          <path d="M400 560l100-44 34 62-104 36zM300 660l90-2 70-26 76 70-20 16-60-52-68 24 12 80-16 2-34-100-30 0-30 100-16-4z" />
          <path d="M270 480l42 180-14 4-44-176z" />
        </g>
      </svg>
      <svg
        aria-hidden="true"
        viewBox="0 0 600 800"
        preserveAspectRatio="xMinYMin meet"
        className="scene-curtain absolute top-0 left-0 h-full"
      >
        <path d="M0 0h520Q330 240 0 560z" fill="#7a3f22" opacity="0.8" />
        <path d="M0 0h300Q180 200 0 360z" fill="#4a2413" opacity="0.6" />
      </svg>
    </>
  );
}

/** Sunset: a lake between mountains, the sun going down, light on the water. */
function Sunset() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMax slice"
      className={FULL_SCENE}
    >
      <defs>
        <linearGradient id="scene-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b6470" />
          <stop offset="0.6" stopColor="#e0a96d" />
          <stop offset="1" stopColor="#f6d59a" />
        </linearGradient>
        <linearGradient id="scene-lake" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7b27a" />
          <stop offset="1" stopColor="#5b4a42" />
        </linearGradient>
      </defs>
      <rect width="1200" height="480" fill="url(#scene-sky)" />
      <circle className="scene-glow" cx="480" cy="400" r="150" fill="#ffe7ad" opacity="0.5" />
      <circle cx="480" cy="400" r="34" fill="#fff4cf" />
      <g fill="#8d7069" opacity="0.65">
        <g className="scene-cloud">
          <ellipse cx="260" cy="170" rx="210" ry="24" />
          <ellipse cx="880" cy="110" rx="260" ry="34" />
        </g>
        <g className="scene-cloud" style={{ animationDelay: "-40s" }}>
          <ellipse cx="620" cy="240" rx="180" ry="18" />
        </g>
      </g>
      <path d="M0 330l190-40 170 110 120 30 180-30 170-90 370-110v290H0z" fill="#4f4546" />
      <rect y="440" width="1200" height="360" fill="url(#scene-lake)" />
      <g fill="#fff0c4">
        <ellipse className="scene-shimmer" cx="480" cy="480" rx="90" ry="5" />
        <ellipse
          className="scene-shimmer"
          cx="480"
          cy="525"
          rx="130"
          ry="6"
          style={{ animationDelay: "-1.5s" }}
        />
        <ellipse
          className="scene-shimmer"
          cx="480"
          cy="575"
          rx="70"
          ry="5"
          style={{ animationDelay: "-3s" }}
        />
      </g>
      <g transform="translate(0 400)">
        <path d={SCENE_SUNSET_PINES} fill="#23291f" />
      </g>
      <path d="M0 0h95q-12 300 12 800H0z" fill="#1f1a16" />
      <path
        d="M90 95q170 15 300-45"
        fill="none"
        stroke="#1f1a16"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <rect width="1200" height="800" fill="#1b1411" opacity="0.28" />
    </svg>
  );
}

const SCENES = {
  forest: Forest,
  rain: Rain,
  night: Night,
  ocean: Ocean,
  cozy: Cozy,
  window: WindowView,
  sunset: Sunset,
};

/**
 * The quiet picture behind the reading timer. Only tokens, so it follows the theme; it holds
 * still when the timer is paused or the reader asks for less motion.
 */
export function ReadingScene({
  scene,
  paused,
  preview = false,
}: {
  scene: Scene;
  paused: boolean;
  /** Fills its parent, as an example, instead of the screen. */
  preview?: boolean;
}) {
  if (scene === "none") return null;
  const Picture = SCENES[scene];
  return (
    <div
      aria-hidden="true"
      data-paused={paused || undefined}
      className={cn(
        "reading-scene pointer-events-none inset-0 overflow-hidden",
        preview ? "absolute" : "fixed",
      )}
    >
      <Picture />
    </div>
  );
}

/** Made here from noise and oscillators: no audio files. */
function startSound(sound: SceneSound) {
  const audio = new AudioContext();
  const buffer = audio.createBuffer(1, audio.sampleRate * 4, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = sound.noise === "white" ? white : last * 3.5;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = sound.filter;
  filter.frequency.value = sound.frequency;
  const volume = audio.createGain();
  volume.gain.value = sound.volume;
  const swell = audio.createOscillator();
  swell.frequency.value = sound.swell[0];
  const swellDepth = audio.createGain();
  swellDepth.gain.value = sound.swell[1];
  swell.connect(swellDepth).connect(volume.gain);
  source.connect(filter).connect(volume).connect(audio.destination);
  source.start();
  swell.start();
  if (sound.crickets) {
    const cricket = audio.createOscillator();
    cricket.frequency.value = 4300;
    const chirp = audio.createGain();
    chirp.gain.value = 0.004;
    const pulse = audio.createOscillator();
    pulse.type = "square";
    pulse.frequency.value = 6;
    const pulseDepth = audio.createGain();
    pulseDepth.gain.value = 0.004;
    pulse.connect(pulseDepth).connect(chirp.gain);
    cricket.connect(chirp).connect(audio.destination);
    cricket.start();
    pulse.start();
  }
  return () => void audio.close();
}

/** The theme's sound. Starts off (browsers only allow sound after a click), ends with the timer. */
export function useSceneSound(scene: Scene) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on || scene === "none") return;
    try {
      return startSound(SCENE_SOUNDS[scene]);
    } catch {
      setOn(false);
    }
  }, [on, scene]);
  return { on, toggle: () => setOn((value) => !value) };
}
