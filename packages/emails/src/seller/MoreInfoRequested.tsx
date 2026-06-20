import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface MoreInfoRequestedProps {
  sellerFirstName: string;
  submissionReference: string;
  itemType: string;
  question: string;
  sellerPortalUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const infoBox = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fde68a",
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

export function MoreInfoRequested({
  sellerFirstName,
  submissionReference,
  itemType,
  question,
  sellerPortalUrl,
}: MoreInfoRequestedProps) {
  return (
    <BaseLayout preview={`We have a question about your ${itemType} submission`}>
      <Text style={heading}>We need a bit more information</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        Thanks for submitting your <strong>{itemType}</strong> (ref:{" "}
        <strong>{submissionReference}</strong>). Our team has a quick question
        before we can move forward:
      </Text>
      <Text style={infoBox}>{question}</Text>
      <Text style={body}>
        Please log in to your seller portal and reply to this request. Once we
        receive your response, we'll continue reviewing your item.
      </Text>
      <Button href={sellerPortalUrl} style={button}>
        Reply in portal
      </Button>
    </BaseLayout>
  );
}
