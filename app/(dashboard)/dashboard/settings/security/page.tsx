import { SectionHeading } from "@/components/ui/section-heading";

export default function SecuritySettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Security"
        title="Security preferences"
        description="Manage password, session, and security-related preferences here."
      />
      <div className="rounded-[2rem] border border-border bg-card/90 p-6 text-sm text-muted shadow-[var(--shadow-soft)]">
        Security settings are coming soon.
      </div>
    </div>
  );
}
