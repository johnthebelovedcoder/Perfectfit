import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface PayoutQueuedProps {
  sellerFirstName: string;
  itemTitle: string;
  payoutFormatted: string;
  expectedByDate: string;
  sellerPortalUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const infoBox = {
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

export function PayoutQueued({
  sellerFirstName,
  itemTitle,
  payoutFormatted,
  expectedByDate,
  sellerPortalUrl,
}: PayoutQueuedProps) {
  return (
    <BaseLayout preview={`Payout scheduled — ${payoutFormatted}`}>
      <Text style={heading}>Your payout is on its way</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        <strong>{itemTitle}</strong> has been sold and your payout has been queued for processing.
      </Text>
      <Text style={infoBox}>
        <strong>Payout amount:</strong> {payoutFormatted}
        <br />
        <strong>Expected by:</strong> {expectedByDate}
      </Text>
      <Text style={body}>
        We'll send you a separate confirmation once the transfer has been processed to your bank account.
      </Text>
      <Button href={sellerPortalUrl} style={button}>
        View payout details
      </Button>
    </BaseLayout>
  );
}
