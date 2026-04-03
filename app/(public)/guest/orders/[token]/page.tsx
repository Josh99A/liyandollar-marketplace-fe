import { GuestOrderDetailClient } from "./guest-order-detail-client";

export default async function GuestOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <GuestOrderDetailClient token={token} />;
}
