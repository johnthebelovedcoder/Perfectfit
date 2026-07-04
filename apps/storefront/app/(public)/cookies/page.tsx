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

const COOKIE_TYPES = [
  {
    type: "Essential",
    required: true,
    desc: "Required for the website to function. These include session cookies, authentication tokens, and cart data. Cannot be disabled.",
    examples: "Session token, cart contents, CSRF token",
  },
  {
    type: "Analytics",
    required: false,
    desc: "Help us understand how visitors use the site so we can improve the experience. All data is anonymised.",
    examples: "Page views, session duration, referral source",
  },
  {
    type: "Preferences",
    required: false,
    desc: "Remember your settings and preferences so you don't have to re-enter them on each visit.",
    examples: "Currency preference, recently viewed items",
  },
  {
    type: "Marketing",
    required: false,
    desc: "Used to show you relevant ads on other platforms. We only use these with your explicit consent.",
    examples: "Ad click tracking, retargeting pixels",
  },
];

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gray-900 text-white py-20 px-4 text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">Legal</p>
          <h1 className="text-4xl font-bold mb-3">Cookies Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-2xl space-y-10">
            <Section title="What are cookies?">
              <p>Cookies are small text files stored on your device when you visit a website. They allow the site to remember information about your visit — like items in your cart or whether you&apos;re logged in.</p>
            </Section>

            <Section title="How we use cookies">
              <p>Perfect Fit uses cookies to keep you signed in, remember your cart, understand how you use the site, and (with your consent) personalise advertising. We do not sell data collected via cookies to third parties.</p>
            </Section>

            {/* Cookie types table */}
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-4">Types of cookies we use</h2>
              <div className="space-y-3">
                {COOKIE_TYPES.map(({ type, required, desc, examples }) => (
                  <div key={type} className="border border-gray-100 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-900 text-sm">{type}</p>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${required ? "bg-gray-100 text-gray-600 border-gray-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                        {required ? "Always on" : "Optional"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                    <p className="text-xs text-gray-400 mt-2"><span className="font-medium">Examples:</span> {examples}</p>
                  </div>
                ))}
              </div>
            </div>

            <Section title="Managing cookies">
              <p>You can control non-essential cookies through your browser settings. Most browsers allow you to refuse cookies, delete existing cookies, or be notified when a cookie is set.</p>
              <p>Note that disabling cookies may affect the functionality of some parts of Perfect Fit, including keeping items in your cart and staying logged in.</p>
            </Section>

            <Section title="Third-party cookies">
              <p>Some third-party services we use (such as analytics and payment providers) may set their own cookies. These are governed by their own privacy policies. We do not control these cookies.</p>
            </Section>

            <Section title="Changes to this policy">
              <p>We may update this Cookies Policy from time to time. We&apos;ll notify you of significant changes through the site.</p>
            </Section>

            <Section title="Contact">
              <p>Questions about our use of cookies? Email fgsperfectfit@gmail.com.</p>
            </Section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
