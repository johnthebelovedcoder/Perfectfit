import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface SubmissionReceivedProps {
  sellerFirstName: string;
  submissionReference: string;
  itemType: string;
  sellerPortalUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const refBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "6px",
  padding: "12px 16px",
  fontFamily: "monospace",
  fontSize: "16px",
  fontWeight: "600",
  color: "#111827",
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

export function SubmissionReceived({
  sellerFirstName,
  submissionReference,
  itemType,
  sellerPortalUrl,
}: SubmissionReceivedProps) {
  return (
    <BaseLayout preview={`We received your submission — ${itemType}`}>
      <Text style={heading}>Submission received</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        We've received your submission for <strong>{itemType}</strong>. Our
        team will review it within 48 hours and let you know the outcome.
      </Text>
      <Text style={body}>Your reference number:</Text>
      <Text style={refBox}>{submissionReference}</Text>
      <Text style={body}>
        Keep this reference number — you'll need it if you contact us about this
        item.
      </Text>
      <Button href={sellerPortalUrl} style={button}>
        Track your submission
      </Button>
    </BaseLayout>
  );
}
