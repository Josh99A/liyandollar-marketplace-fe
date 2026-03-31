import { SectionHeading } from "@/components/ui/section-heading";

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Support"
        title="Need help with deposits or orders?"
        description="Support tickets and live chat can be integrated here for faster resolution."
      />
      <div className="rounded-[2rem] border border-border bg-card/90 p-6 text-sm text-muted shadow-[var(--shadow-soft)]">
        Support tools are coming soon.
      </div>
    </div>
  );
}
