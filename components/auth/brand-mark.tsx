export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={
        "inline-flex items-center gap-2 text-[15px] font-medium tracking-tight text-foreground " +
        (className ?? "")
      }
    >
      <span
        aria-hidden
        className="inline-block size-2.5 rounded-[3px] bg-primary"
      />
      voidcraft
    </div>
  );
}
