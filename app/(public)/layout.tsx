import { PublicFooter } from "@/components/layout/public-footer";
import { PublicHeader } from "@/components/layout/public-header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell">
      <PublicHeader />
      <main className="pt-20">{children}</main>
      <PublicFooter />
    </div>
  );
}
