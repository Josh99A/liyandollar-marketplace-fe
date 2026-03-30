import { OrderDetailClient } from "./order-detail-client";

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <OrderDetailClient orderId={id} />;
}
