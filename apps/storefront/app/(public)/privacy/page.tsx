import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

const LAST_UPDATED = "4 July 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm text-gray-600 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gray-900 text-white py-20 px-4 text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">Legal</p>
          <h1 className="text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-2xl space-y-10 text-gray-700">
            <Section title="1. Who we are">
              <p>Perfect Fit (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates an online marketplace for pre-owned and new fashion items. This Privacy Policy explains how we collect, use, and protect your personal data when you use our website and services.</p>
            </Section>

            <Section title="2. What data we collect">
              <p>When you use Perfect Fit, we may collect:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Account information: name, email address, password (hashed)</li>
                <li>Order details: delivery address, items purchased, payment confirmation</li>
                <li>Seller information: bank account details (for payouts), submitted item photos and descriptions</li>
                <li>Usage data: pages visited, search queries, device and browser type</li>
                <li>Cookies and similar tracking technologies (see our Cookies Policy)</li>
              </ul>
            </Section>

            <Section title="3. How we use your data">
              <p>We use your data to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Process orders and facilitate transactions</li>
                <li>Communicate with you about your orders, submissions, and account</li>
                <li>Verify seller identity and process payouts</li>
                <li>Improve our platform and prevent fraud</li>
                <li>Send you marketing communications (only with your consent)</li>
              </ul>
            </Section>

            <Section title="4. Legal basis for processing">
              <p>We process your data under the following legal bases: performance of a contract (to fulfil your orders), legitimate interests (to operate and improve our platform), and consent (for marketing communications).</p>
            </Section>

            <Section title="5. Who we share data with">
              <p>We do not sell your personal data. We may share it with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Payment processors (for secure transaction processing)</li>
                <li>Shipping and logistics partners (to fulfil deliveries)</li>
                <li>Cloud infrastructure providers (hosting and storage)</li>
                <li>Email service providers (for transactional communications)</li>
              </ul>
              <p>All third parties are required to process data in compliance with applicable data protection laws.</p>
            </Section>

            <Section title="6. Data retention">
              <p>We retain personal data for as long as necessary to provide our services and comply with legal obligations. Order data is kept for 7 years for accounting purposes. You may request deletion of your account data at any time.</p>
            </Section>

            <Section title="7. Your rights">
              <p>You have the right to: access your personal data, correct inaccurate data, request deletion (&quot;right to be forgotten&quot;), restrict or object to processing, and data portability. To exercise any of these rights, contact us at fgsperfectfit@gmail.com.</p>
            </Section>

            <Section title="8. Security">
              <p>We use industry-standard encryption and security practices to protect your data. Bank account details for sellers are stored encrypted. No method of transmission over the internet is 100% secure, but we take all reasonable steps to protect your information.</p>
            </Section>

            <Section title="9. Changes to this policy">
              <p>We may update this policy from time to time. We&apos;ll notify you of significant changes by email or by displaying a prominent notice on our website.</p>
            </Section>

            <Section title="10. Contact">
              <p>For privacy-related questions, email us at fgsperfectfit@gmail.com.</p>
            </Section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
