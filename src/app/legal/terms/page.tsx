export const metadata = {
    title: "Terms of Service | KS Sports Ladder",
};

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto py-12 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Terms of Service (AGB)</h1>
                <p className="text-slate-500">Effective Date: January 1, 2026</p>
            </div>

            <div className="space-y-6 text-slate-700">
                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">1. Scope</h2>
                    <p>
                        These Terms of Service govern your use of the KS Sports Ladder application. This is a private, non-commercial platform designed for organizing sports ladders within a closed community.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">2. User Conduct & Fair Play</h2>
                    <p>
                        Users are expected to demonstrate good sportsmanship and fair play. Specifically:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>You agree to submit accurate match scores.</li>
                        <li>You will not harass, bully, or abuse other participants.</li>
                        <li>You will respect the scheduled match times and venues.</li>
                    </ul>
                    <p className="mt-2 text-sm italic">
                        Violation of these rules may result in suspension or permanent ban from the ladder.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">3. Disclaimer of Liability</h2>
                    <p>
                        <strong>Physical Activity Warning:</strong> Participation in sports matches arranged via this app involves physical exertion and risk of injury.
                    </p>
                    <p className="mt-2">
                        The platform operator assumes <strong>no liability</strong> for:
                    </p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Any physical injuries or accidents occurring during matches.</li>
                        <li>Disputes between players off-platform.</li>
                        <li>Loss of data or service interruptions.</li>
                    </ul>
                    <p className="mt-2">
                        You participate in matches entirely at your own risk.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">4. Account Termination</h2>
                    <p>
                        We reserve the right to terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                </section>
            </div>
        </div>
    );
}
