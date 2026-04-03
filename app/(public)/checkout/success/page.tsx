import { SuccessClient } from "./success-client";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderNumber = first(params.order);
  const accessUrl = first(params.access);
  const isGuest = first(params.guest) === "1";
  let orderPath = "";

  if (accessUrl) {
    try {
      orderPath = new URL(accessUrl, "http://localhost").pathname;
    } catch {
      orderPath = accessUrl;
    }
  }

  return (
    <SuccessClient
      accessUrl={accessUrl}
      isGuest={isGuest}
      orderNumber={orderNumber}
      orderPath={orderPath}
    />
  );
}
