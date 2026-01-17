export const metadata = {
    title: "Privacy Policy | KS Sports Ladder",
};

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto py-12 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Privacy Policy (Datenschutzerklärung)</h1>
                <p className="text-slate-500">Last updated: January 2026</p>
            </div>

            <div className="prose-custom space-y-6 text-slate-700">
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">1. General Information</h2>
                    <p>
                        We take the protection of your personal data very seriously. We treat your personal data confidentially and in accordance with the statutory data protection regulations (GDPR/DSGVO) and this privacy policy.
                        This application is a <strong>private, non-commercial project</strong>.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">2. Data We Collect</h2>
                    <p>When you use the KS Sports Ladder app, we collect and process the following data:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li><strong>Authentication Data:</strong> Email address (for login) and User ID.</li>
                        <li><strong>Profile Data:</strong> Name, Avatar URL (if provided).</li>
                        <li><strong>Game Data:</strong> Match scores, challenges, rankings, and ladder history.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">3. Use of Cookies</h2>
                    <p className="mb-2">
                        Our website uses cookies. Cookies are text files that are stored in the internet browser or by the internet browser on the user's computer system.
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <h3 className="font-semibold text-blue-900 mb-1">Technically Necessary Cookies (Supabase Auth)</h3>
                        <p className="text-sm text-blue-800">
                            We use authentication cookies provided by our backend service, Supabase. These cookies are <strong>strictly necessary</strong> for the secure operation of the login functionality and session management.
                            According to § 25 para. 2 no. 2 TTDSG, these cookies do not require active consent. By using the app, you acknowledge that we set these cookies to maintain your logged-in state.
                        </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                        We currently do not use third-party tracking or advertising cookies (e.g., Google Analytics).
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">4. Hosting & Backend</h2>
                    <p>
                        This application uses <strong>Supabase</strong> (Supabase Inc.) as a backend-as-a-service provider for database and authentication.
                        Data may be stored on servers managed by Supabase. Supabase complies with GDPR regulations.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">5. Your Rights</h2>
                    <p>
                        You have the right to request information about your stored data, its origin, its recipients, and the purpose of its collection at any time.
                        You also have the right to request that it be corrected, blocked, or deleted.
                        To exercise these rights, please contact the project maintainer via the contact details provided in the <a href="/legal/impressum" className="text-brand-600 hover:underline">Impressum</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
