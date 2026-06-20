import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface ItemLiveProps {
  sellerFirstName: string;
  itemTitle: string;
  agreedPayoutFormatted: string;
  storefrontUrl: string;
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
const secondaryButton = {
  backgroundColor: "#ffffff",
  color: "#111827",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  padding: "12px 24px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  marginTop: "8px",
  marginLeft: "12px",
};

export function ItemLive({
  sellerFirstName,
  itemTitle,
  agreedPayoutFormatted,
  storefrontUrl,
  sellerPortalUrl,
}: ItemLiveProps) {
  return (
    <BaseLayout preview={`Your item is live — ${itemTitle}`}>
      <Text style={heading}>Your item is now live! 🎉</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        <strong>{itemTitle}</strong> is now live on the Thread storefront and
        available to buyers.
      </Text>
      <Text style={successBox}>
        <strong>Your payout:</strong> {agreedPayoutFormatted}
        <br />
        You'll receive this amount within 7 days of a confirmed delivery.
      </Text>
      <Text style={body}>
        Share the listing with friends — the sooner it sells, the sooner you get
        paid!
      </Text>
      <Button href={storefrontUrl} style={button}>
        View your listing
      </Button>
      <Button href={sellerPortalUrl} style={secondaryButton}>
        Track in portal
      </Button>
    </BaseLayout>
  );
}
