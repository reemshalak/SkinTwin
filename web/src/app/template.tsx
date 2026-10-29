// Re-mounts on every navigation, giving each page a soft entrance.
// Pure CSS so content is visible even before JavaScript hydrates.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
