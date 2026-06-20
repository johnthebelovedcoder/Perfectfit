import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface OrderDispatchedProps {
  firstName: string;
  orderNumber: string;
  courierName: string;
  trackingNumber?: string;
  trackingUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
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

export function OrderDispatched({
  firstName,
  orderNumber,
  courierName,
  trackingNumber,
  trackingUrl,
}: OrderDispatchedProps) {
  return (
    <BaseLayout preview={`Your order is on its way!`}>
      <Text style={heading}>Your order is on its way</Text>
      <Text style={body}>Hi {firstName},</Text>
      <Text style={body}>
        Order <strong>{orderNumber}</strong> has been dispatched via{" "}
        <strong>{courierName}</strong>.
        {trackingNumber && (
          <>
            {" "}
            Tracking number: <strong>{trackingNumber}</strong>
          </>
        )}
      </Text>
      <Button href={trackingUrl} style={button}>
        Track your order
      </Button>
    </BaseLayout>
  );
}
