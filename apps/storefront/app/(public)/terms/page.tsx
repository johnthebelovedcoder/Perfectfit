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

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gray-900 text-white py-20 px-4 text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">Legal</p>
          <h1 className="text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-2xl space-y-10">
            <Section title="1. Acceptance of Terms">
              <p>By accessing or using Perfect Fit (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.</p>
            </Section>

            <Section title="2. The Platform">
              <p>Perfect Fit is a curated marketplace for pre-owned and new fashion items. We act as an intermediary between buyers and sellers. Perfect Fit inspects, lists, and ships items on behalf of sellers. We are not the legal seller of the items; sellers retain ownership until an item is sold.</p>
            </Section>

            <Section title="3. Buyer Terms">
              <ul className="list-disc pl-5 space-y-1">
                <li>You must be 18 or older to make a purchase.</li>
                <li>All sales are final except where our Returns Policy applies.</li>
                <li>Item descriptions and photos are provided in good faith. Minor discrepancies consistent with the stated condition grade are not grounds for return.</li>
                <li>You are responsible for providing accurate delivery information. Perfect Fit is not liable for non-delivery due to incorrect addresses.</li>
              </ul>
            </Section>

            <Section title="4. Seller Terms">
              <ul className="list-disc pl-5 space-y-1">
                <li>You must create a verified seller account to submit items.</li>
                <li>All submitted items must be accurately described. Misrepresentation is grounds for immediate account suspension.</li>
                <li>By submitting an item, you grant Perfect Fit the right to photograph, list, and sell the item on your behalf.</li>
                <li>Payouts are processed within 7 days of a sale. Perfect Fit deducts its agreed commission before disbursement.</li>
                <li>You are responsible for shipping your item to our warehouse in the condition described. Items that arrive in materially worse condition than described will be re-graded or returned.</li>
              </ul>
            </Section>

            <Section title="5. Prohibited Conduct">
              <p>You may not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Submit counterfeit, stolen, or restricted items</li>
                <li>Manipulate reviews or ratings</li>
                <li>Attempt to transact outside the Platform to avoid fees</li>
                <li>Use the Platform for any unlawful purpose</li>
              </ul>
            </Section>

            <Section title="6. Intellectual Property">
              <p>All content on Perfect Fit — including logos, copy, and design — is owned by Perfect Fit or licensed to us. You may not reproduce or use our content without written permission.</p>
              <p>By submitting photos to the Platform, you grant Perfect Fit a non-exclusive, royalty-free licence to use them in connection with listing and promoting your items.</p>
            </Section>

            <Section title="7. Limitation of Liability">
              <p>Perfect Fit is not liable for indirect, incidental, or consequential damages arising from your use of the Platform. Our total liability for any claim shall not exceed the value of the transaction giving rise to the claim.</p>
            </Section>

            <Section title="8. Changes to Terms">
              <p>We may update these terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the updated terms.</p>
            </Section>

            <Section title="9. Governing Law">
              <p>These terms are governed by applicable law. Disputes shall be resolved through good-faith negotiation before any formal proceedings.</p>
            </Section>

            <Section title="10. Contact">
              <p>Questions about these terms? Email fgsperfectfit@gmail.com.</p>
            </Section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
