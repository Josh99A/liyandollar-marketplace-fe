import { redirect } from "next/navigation";

export default async function LegacyMarketplaceProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  redirect("/");
}
