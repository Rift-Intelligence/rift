export function SectionHeading({
  label,
  title,
  description,
  className = "",
  align = "left",
}: {
  label?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}) {
  const alignClass = align === "center" ? "text-center mx-auto" : "";

  return (
    <div className={`${alignClass} ${className}`}>
      {label ? (
        <p className="mb-2 text-[13px] font-medium text-signal">{label}</p>
      ) : null}
      <h2 className="max-w-2xl text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p
          className={`mt-2 max-w-xl text-[15px] leading-relaxed text-muted-foreground ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
