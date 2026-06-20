import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface OrderOutForDeliveryProps {
  firstName: string;
  orderNumber: string;
  courierName: string;
  trackingNumber?: string;
  trackingUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const infoBox = {
  backgroundColor: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
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

export function OrderOutForDelivery({
  firstName,
  orderNumber,
  courierName,
  trackingNumber,
  trackingUrl,
}: OrderOutForDeliveryProps) {
  return (
    <BaseLayout preview="Your order is out for delivery today!">
      <Text style={heading}>Out for delivery today</Text>
      <Text style={body}>Hi {firstName},</Text>
      <Text style={body}>
        Great news — order <strong>{orderNumber}</strong> is out for delivery with{" "}
        <strong>{courierName}</strong> and should arrive today.
        {trackingNumber && (
          <>
            {" "}
            Tracking number: <strong>{trackingNumber}</strong>
          </>
        )}
      </Text>
      <Text style={infoBox}>
        Make sure someone is available to receive your package, or check with your courier for safe-drop options.
      </Text>
      <Button href={trackingUrl} style={button}>
        Track your order
      </Button>
    </BaseLayout>
  );
}
