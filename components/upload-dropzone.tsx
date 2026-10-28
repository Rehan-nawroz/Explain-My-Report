"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from "@/lib/limits";
import type { ImageMime, UploadedImage } from "@/types/report";

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Drag-and-drop / browse photo input. Client-side guards mirror the server
 * (PNG/JPEG/WebP, 4 MB) so people find out before a round-trip — the server
 * still re-validates because client checks are never trusted.
 */
export default function UploadDropzone({
  image,
  onChange,
  onError,
  disabled = false,
}: {
  image: UploadedImage | null;
  onChange: (image: UploadedImage | null) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function acceptFile(file: File) {
    if (!(IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
      onError("That file type isn't supported. Use a PNG, JPG, or WEBP photo.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onError("That image is larger than 4 MB. Try a smaller photo.");
      return;
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

    onChange({
      base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
      mimeType: file.type as ImageMime,
      name: file.name,
      size: file.size,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a photo of your report"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!disabled) inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file && !disabled) void acceptFile(file);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
          dragging
            ? "border-teal-500/60 bg-[#18191a]"
            : "border-line bg-[#18191a]/80 hover:border-teal-500/50 hover:bg-[#18191a]"
        }`}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-elevated text-ink-soft">
          <Upload className="h-6 w-6" aria-hidden />
        </div>
        <p className="text-body font-medium text-ink-strong">
          Drag &amp; drop a photo of your printed report
        </p>
        <p className="mt-1 text-caption text-ink-muted">
          Supports PNG, JPG, or WEBP (up to 4 MB)
        </p>
        <span className="mt-4 rounded-full border border-line px-4 py-1.5 text-caption text-ink transition-colors hover:bg-surface-elevated">
          Browse files
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_MIME_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void acceptFile(file);
            event.target.value = "";
          }}
        />
      </div>

      {image && (
        <div className="flex items-center justify-between rounded-xl border border-line bg-surface-ambient p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface-elevated text-primary">
              <ImageIcon className="h-5 w-5" aria-hidden />
            </div>
            <div className="flex flex-col">
              <span className="text-caption font-medium text-ink">
                {image.name}
              </span>
              <span className="text-[11px] text-ink-muted">
                {formatSize(image.size)} · Ready to send
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Remove photo"
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface-elevated hover:text-danger"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
