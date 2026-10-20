import { useRemoveAvatar, useUploadAvatar } from "@grimo/client";
import { AVATAR_CONTENT_TYPES, AVATAR_SIZE } from "@grimo/core";
import { type ChangeEvent, useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/** Center-crops the image to a square and re-encodes it as a AVATAR_SIZE px JPEG. */
async function squareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  canvas
    .getContext("2d")
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    );
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não foi possível ler a foto"))),
      "image/jpeg",
      0.85,
    ),
  );
}

/** Profile photo with "Trocar foto" / "Remover". Saves right away (not with the form). */
export function AvatarUpload({ image, name }: { image: string | null; name: string }) {
  const input = useRef<HTMLInputElement>(null);
  const upload = useUploadAvatar();
  const remove = useRemoveAvatar();
  const [error, setError] = useState<string | null>(null);
  const busy = upload.isPending || remove.isPending;

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const body = await squareJpeg(file);
      await upload.mutateAsync({ body, contentType: "image/jpeg" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível trocar a foto");
    }
  }

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <Avatar
          src={image}
          name={name}
          size="size-24"
          className="ring-2 ring-accent ring-offset-2 ring-offset-surface"
        />
        {busy && (
          <span className="glass absolute inset-0 grid place-items-center rounded-full text-xs">
            Enviando…
          </span>
        )}
      </div>
      <div className="flex flex-col items-start gap-2">
        <input
          ref={input}
          type="file"
          accept={AVATAR_CONTENT_TYPES.join(",")}
          className="sr-only"
          aria-label="Escolher foto do perfil"
          onChange={(e) => void onFile(e)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={() => input.current?.click()}
          >
            {image ? "Trocar foto" : "Adicionar foto"}
          </Button>
          {image && (
            <Button type="button" variant="ghost" disabled={busy} onClick={() => remove.mutate()}>
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-text-muted">JPG, PNG, WEBP ou HEIC, até 5 MB.</p>
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
