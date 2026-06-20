import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface NegotiationOfferProps {
  sellerFirstName: string;
  submissionReference: string;
  itemType: string;
  originalPayoutFormatted: string;
  offeredPayoutFormatted: string;
  adminNote?: string;
  acceptUrl: string;
  declineUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const priceRow = {
  backgroundColor: "#f9fafb",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
};
const acceptBtn = {
  backgroundColor: "#111827",
  color: "#ffffff",
  borderRadius: "6px",
  padding: "12px 24px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  marginRight: "12px",
};
const declineBtn = {
  backgroundColor: "#ffffff",
  color: "#374151",
  borderRadius: "6px",
  padding: "12px 24px",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  display: "inline-block",
  border: "1px solid #d1d5db",
};

export function NegotiationOffer({
  sellerFirstName,
  submissionReference,
  itemType,
  originalPayoutFormatted,
  offeredPayoutFormatted,
  adminNote,
  acceptUrl,
  declineUrl,
}: NegotiationOfferProps) {
  return (
    <BaseLayout preview={`Payout offer for your ${itemType}`}>
      <Text style={heading}>Payout offer</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        We've reviewed the payout price for your{" "}
        <strong>{itemType}</strong> (ref: <strong>{submissionReference}</strong>
        ) and are offering a revised amount.
      </Text>
      <Text style={priceRow}>
        Your ask: <strong>{originalPayoutFormatted}</strong>
        <br />
        Our offer: <strong>{offeredPayoutFormatted}</strong>
      </Text>
      {adminNote && <Text style={body}>{adminNote}</Text>}
      <Text style={body}>
        Please accept or decline this offer. If you decline, our team may
        contact you to discuss further.
      </Text>
      <Button href={acceptUrl} style={acceptBtn}>
        Accept offer
      </Button>
      <Button href={declineUrl} style={declineBtn}>
        Decline
      </Button>
    </BaseLayout>
  );
}
