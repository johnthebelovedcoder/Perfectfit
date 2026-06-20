import { Text, Button, Hr } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface OrderItem {
  title: string;
  priceFormatted: string;
}

interface OrderConfirmationProps {
  firstName: string;
  orderNumber: string;
  items: OrderItem[];
  totalFormatted: string;
  deliveryAddress: string;
  estimatedDelivery: string;
  trackingUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const itemRow = { fontSize: "15px", color: "#374151", margin: "4px 0" };
const totalRow = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
  marginTop: "8px",
};
const button = {
  backgroundColor: "#111827",
  color: "#ffffff",
  borderRadius: "6px",
  padding: "12px 24px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "16px",
};

export function OrderConfirmation({
  firstName,
  orderNumber,
  items,
  totalFormatted,
  deliveryAddress,
  estimatedDelivery,
  trackingUrl,
}: OrderConfirmationProps) {
  return (
    <BaseLayout preview={`Order confirmed — ${orderNumber}`}>
      <Text style={heading}>Order confirmed</Text>
      <Text style={body}>Hi {firstName},</Text>
      <Text style={body}>
        Thank you for your order! Your order number is{" "}
        <strong>{orderNumber}</strong>.
      </Text>
      <Hr />
      {items.map((item, i) => (
        <Text key={i} style={itemRow}>
          {item.title} — {item.priceFormatted}
        </Text>
      ))}
      <Text style={totalRow}>Total: {totalFormatted}</Text>
      <Hr />
      <Text style={body}>
        <strong>Delivering to:</strong> {deliveryAddress}
        <br />
        <strong>Estimated delivery:</strong> {estimatedDelivery}
      </Text>
      <Button href={trackingUrl} style={button}>
        Track your order
      </Button>
    </BaseLayout>
  );
}
