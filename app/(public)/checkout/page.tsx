import { CheckoutClient } from "./checkout-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const slug = typeof params.product === "string" ? params.product : "";

  return <CheckoutClient slug={slug} />;
}
