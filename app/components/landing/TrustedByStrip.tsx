const AUDIENCES = [
  "Pentest consultancies",
  "Red teams",
  "Bug bounty hunters",
  "Security researchers",
  "MSSPs",
] as const;

export function TrustedByStrip() {
  return (
    <section className="border-b border-border/40 py-10">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-[13px] text-muted-foreground">
          Trusted by{" "}
          {AUDIENCES.map((item, i) => (
            <span key={item}>
              {i > 0 ? (
                <span className="text-muted-foreground/40"> · </span>
              ) : null}
              <span className="text-foreground/80">{item}</span>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
