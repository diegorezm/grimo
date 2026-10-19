import { storyCard } from "@grimo/tokens";
import { toBlob } from "html-to-image";
import type { ReactNode, Ref } from "react";
import { cn } from "@/utils/cn";

/** Renders a card at full Stories size (1080×1920) and shows it scaled down. */
export function StoryCanvas({
  scale,
  className,
  ref,
  children,
}: {
  scale: number;
  className?: string;
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <div
      style={{ width: storyCard.width * scale, height: storyCard.height * scale }}
      className={cn("shrink-0 overflow-hidden", className)}
    >
      <div
        ref={ref}
        style={{
          width: storyCard.width,
          height: storyCard.height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}

async function toFile(node: HTMLElement, name: string) {
  const blob = await toBlob(node, { pixelRatio: 1, style: { transform: "none" } });
  return blob ? new File([blob], name, { type: "image/png" }) : null;
}

function download(file: File) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** Share the card as a PNG via the Web Share API, falling back to a download. */
export async function shareCard(node: HTMLElement, name: string) {
  const file = await toFile(node, name);
  if (!file) return;
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Meu mês de leitura" });
    return;
  }
  download(file);
}

export async function downloadCard(node: HTMLElement, name: string) {
  const file = await toFile(node, name);
  if (file) download(file);
}
