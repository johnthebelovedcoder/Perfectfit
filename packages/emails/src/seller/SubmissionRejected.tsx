import { Text, Button } from "@react-email/components";
import React from "react";
import { BaseLayout } from "../shared/BaseLayout";

interface SubmissionRejectedProps {
  sellerFirstName: string;
  submissionReference: string;
  itemType: string;
  rejectionReason: string;
  adminNote?: string;
  canResubmit: boolean;
  sellerPortalUrl: string;
}

const heading = { fontSize: "20px", fontWeight: "600", color: "#111827" };
const body = { fontSize: "15px", color: "#374151", lineHeight: "1.6" };
const warnBox = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
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

export function SubmissionRejected({
  sellerFirstName,
  submissionReference,
  itemType,
  rejectionReason,
  adminNote,
  canResubmit,
  sellerPortalUrl,
}: SubmissionRejectedProps) {
  return (
    <BaseLayout preview={`Update on your ${itemType} submission`}>
      <Text style={heading}>Submission not accepted</Text>
      <Text style={body}>Hi {sellerFirstName},</Text>
      <Text style={body}>
        Unfortunately we're unable to accept your <strong>{itemType}</strong>{" "}
        (ref: <strong>{submissionReference}</strong>) at this time.
      </Text>
      <Text style={warnBox}>
        <strong>Reason:</strong> {rejectionReason}
        {adminNote && (
          <>
            <br />
            <br />
            <strong>Note from our team:</strong> {adminNote}
          </>
        )}
      </Text>
      {canResubmit && (
        <Text style={body}>
          You're welcome to address the feedback above and resubmit this item
          once. If it is rejected again, a 30-day cooldown will apply.
        </Text>
      )}
      <Button href={sellerPortalUrl} style={button}>
        View submission
      </Button>
    </BaseLayout>
  );
}
