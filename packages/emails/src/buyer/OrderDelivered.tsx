import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface OrderDeliveredProps {
  firstName: string;
  orderNumber: string;
  returnWindowHours: number;
  returnUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const noteBox = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
  fontSize: "14px",
  color: "#92400e",
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

export function OrderDelivered({
  firstName,
  orderNumber,
  returnWindowHours,
  returnUrl,
}: OrderDeliveredProps) {
  return (
    <BaseLayout preview={`Your order has been delivered`}>
      <Text style={heading}>Order delivered</Text>
      <Text style={body}>Hi {firstName},</Text>
      <Text style={body}>
        Your order <strong>{orderNumber}</strong> has been delivered. We hope
        you love it!
      </Text>
      <Text style={noteBox}>
        If your item significantly differs from the listing description, you can
        request a return within <strong>{returnWindowHours} hours</strong> of
        delivery.
      </Text>
      <Button href={returnUrl} style={button}>
        Request a return
      </Button>
    </BaseLayout>
  );
}
