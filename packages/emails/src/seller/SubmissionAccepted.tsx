import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface SubmissionAcceptedProps {
  sellerFirstName: string;
  submissionReference: string;
  itemType: string;
  agreedPayoutFormatted: string;
  warehouseAddress: string;
  warehouseContact: string;
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

export function SubmissionAccepted({
  sellerFirstName,
  submissionReference,
  itemType,
  agreedPayoutFormatted,
  warehouseAddress,
  warehouseContact,
  sellerPortalUrl,
}: SubmissionAcceptedProps) {
  return (
    <BaseLayout preview={`Your ${itemType} has been accepted!`}>
      <Text style={heading}>Your item has been accepted</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        Great news — we've accepted your <strong>{itemType}</strong> (ref:{" "}
        <strong>{submissionReference}</strong>) for sale on Thread.
      </Text>
      <Text style={body}>
        Your agreed payout: <strong>{agreedPayoutFormatted}</strong> (paid after
        your item sells and delivery is confirmed).
      </Text>
      <Text style={body}>
        Please send your item to our warehouse within 7 days:
      </Text>
      <Text style={infoBox}>
        <strong>Warehouse Address:</strong>
        <br />
        {warehouseAddress}
        <br />
        <br />
        <strong>Contact:</strong> {warehouseContact}
        <br />
        <br />
        <strong>Important:</strong> Write your reference number{" "}
        <strong>{submissionReference}</strong> clearly on the parcel.
      </Text>
      <Text style={body}>
        <strong>Packaging instructions:</strong> Please wrap your item securely.
        Items that arrive damaged may be returned at your cost.
      </Text>
      <Button href={sellerPortalUrl} style={button}>
        View submission
      </Button>
    </BaseLayout>
  );
}
