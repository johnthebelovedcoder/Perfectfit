import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface ItemSoldProps {
  sellerFirstName: string;
  itemTitle: string;
  payoutFormatted: string;
  settlementDate: string;
  sellerPortalUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const successBox = {
  backgroundColor: "#f0fdf4",
  border: "1px solid #bbf7d0",
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

export function ItemSold({
  sellerFirstName,
  itemTitle,
  payoutFormatted,
  settlementDate,
  sellerPortalUrl,
}: ItemSoldProps) {
  return (
    <BaseLayout preview={`Your item sold — payout incoming!`}>
      <Text style={heading}>Your item sold!</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        <strong>{itemTitle}</strong> just sold on Thread.
      </Text>
      <Text style={successBox}>
        <strong>Your payout:</strong> {payoutFormatted}
        <br />
        <strong>Expected by:</strong> {settlementDate}
      </Text>
      <Text style={body}>
        We'll send you another email once the transfer is processed.
      </Text>
      <Button href={sellerPortalUrl} style={button}>
        View payout details
      </Button>
    </BaseLayout>
  );
}
