import BottomNav from "@/components/nav/BottomNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen w-full max-w-2xl mx-auto relative"
      style={{
        background:
          "radial-gradient(ellipse at top, rgba(66,55,88,0.12) 0%, transparent 50%), var(--cream)",
      }}
    >
      <div className="pb-24">{children}</div>
      <BottomNav />
    </div>
  );
}
