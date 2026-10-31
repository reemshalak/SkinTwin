// Soft pink blurred cover for profile headers. Pure shapes, never a photo.
export function ProfileCover({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`glow-card relative overflow-hidden ${className}`}>
      <span className="absolute -top-16 start-[10%] size-72 rounded-full bg-blush-200/70 blur-3xl" aria-hidden />
      <span className="absolute top-6 end-[12%] size-80 rounded-full bg-rose/50 blur-3xl" aria-hidden />
      <span className="absolute -bottom-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-plum/40 blur-3xl" aria-hidden />
      <span className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" aria-hidden />
      {children}
    </div>
  );
}
