import { Text } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface PayoutProcessedProps {
  sellerFirstName: string;
  itemTitle: string;
  payoutFormatted: string;
  bankName: string;
  transferReference: string;
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

export function PayoutProcessed({
  sellerFirstName,
  itemTitle,
  payoutFormatted,
  bankName,
  transferReference,
}: PayoutProcessedProps) {
  return (
    <BaseLayout preview={`Payout sent — ${payoutFormatted}`}>
      <Text style={heading}>Payout sent</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        Your payout for <strong>{itemTitle}</strong> has been processed.
      </Text>
      <Text style={successBox}>
        <strong>Amount:</strong> {payoutFormatted}
        <br />
        <strong>Bank:</strong> {bankName}
        <br />
        <strong>Reference:</strong> {transferReference}
      </Text>
      <Text style={body}>
        Please allow 1–2 business days for the funds to reflect in your account.
        If you have any issues, contact us at support@thread.com.
      </Text>
    </BaseLayout>
  );
}
