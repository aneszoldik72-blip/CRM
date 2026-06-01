export function InlineErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="relative flex items-start gap-3 rounded-[10px] border border-destructive/30 bg-destructive/10 px-3 py-2.5 pl-4 text-[13.5px] text-destructive"
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-[10px] bg-destructive"
      />
      <span className="leading-snug">{message}</span>
    </div>
  );
}
