const BURSTS = 6;
const SPARKS = 44;
const BURST_GAP_MS = 350;
const SPARK_LIFE_MS = 1100;
const GRAVITY = 0.00018;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  bornAt: number;
  color: string;
}

/**
 * A few seconds of fireworks over the page, on a canvas that takes no clicks and removes itself.
 * Colors come from the theme. Skipped for readers who ask for less motion. Returns a stop function.
 */
export function launchFireworks(): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return () => {};

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;inset:0;z-index:70;pointer-events:none";
  document.body.append(canvas);

  const styles = getComputedStyle(document.documentElement);
  const colors = ["--color-accent", "--color-accent-start", "--color-text"].map((name) =>
    styles.getPropertyValue(name).trim(),
  );
  const startedAt = performance.now();
  const sparks: Spark[] = [];
  let launched = 0;
  let frame = 0;

  const burst = (now: number) => {
    const x = canvas.width * (0.15 + Math.random() * 0.7);
    const y = canvas.height * (0.15 + Math.random() * 0.4);
    const color = colors[launched % colors.length] ?? "#fff";
    for (let spark = 0; spark < SPARKS; spark++) {
      const angle = (spark / SPARKS) * Math.PI * 2;
      const speed = 0.08 + Math.random() * 0.22;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bornAt: now,
        color,
      });
    }
    launched += 1;
  };

  const stop = () => {
    cancelAnimationFrame(frame);
    canvas.remove();
  };

  const draw = (now: number) => {
    while (launched < BURSTS && now - startedAt >= launched * BURST_GAP_MS) burst(now);
    context.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const spark of sparks) {
      const age = now - spark.bornAt;
      if (age > SPARK_LIFE_MS) continue;
      alive = true;
      context.globalAlpha = 1 - age / SPARK_LIFE_MS;
      context.fillStyle = spark.color;
      context.beginPath();
      context.arc(
        spark.x + spark.vx * age,
        spark.y + spark.vy * age + GRAVITY * age * age,
        2.5,
        0,
        Math.PI * 2,
      );
      context.fill();
    }
    if (alive || launched < BURSTS) frame = requestAnimationFrame(draw);
    else stop();
  };
  frame = requestAnimationFrame(draw);
  return stop;
}
