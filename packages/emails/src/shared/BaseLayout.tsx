import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Link,
} from "@react-email/components";
import React from "react";

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

const main = {
  backgroundColor: "#f9fafb",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "40px auto",
  padding: "40px",
  maxWidth: "560px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
};

const logo = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#111827",
  marginBottom: "32px",
  display: "block",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "32px",
};

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>Thread</Text>
          <Section>{children}</Section>
          <Hr />
          <Text style={footer}>
            Thread · United States
            <br />
            <Link href="mailto:support@thread.com">support@thread.com</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
