"use client";

/**
 * Dark placeholder shown while an image is being generated (the generate_image
 * tool is in progress) — a grid of pulsing squares, à la Grok Imagine. Once the
 * tool completes, the generated image renders as a file part and this is
 * replaced. Keyframe `rift-img-pulse` lives in app/globals.css.
 */
export function GeneratingImagePlaceholder() {
  return (
    <div className="relative my-1 aspect-square w-full max-w-lg overflow-hidden rounded-lg border border-border bg-neutral-900">
      <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 gap-1.5 p-2.5">
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[3px] bg-neutral-700"
            style={{
              animation: "rift-img-pulse 1.4s ease-in-out infinite",
              // Diagonal wave: squares light up in sweeping bands.
              animationDelay: `${(((i % 6) + Math.floor(i / 6)) % 11) * 0.11}s`,
            }}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-neutral-100 backdrop-blur-sm">
          Generating image…
        </span>
      </div>
    </div>
  );
}

/**
 * Inline error card shown when the generate_image tool fails (no key, blocked
 * prompt, out of credits, no image returned, etc.). Replaces the stuck
 * placeholder so the user always gets a clear, actionable message.
 */
export function ImageGenerationError({ message }: { message: string }) {
  return (
    <div className="my-1 flex w-full max-w-lg items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-3">
      <svg
        viewBox="0 0 24 24"
        className="mt-0.5 size-4 shrink-0 text-destructive"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div className="text-sm leading-snug text-foreground">
        <span className="font-medium">Couldn&apos;t generate the image.</span>{" "}
        <span className="text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}
