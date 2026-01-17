export const metadata = {
    title: "Impressum | KS Sports Ladder",
};

export default function ImpressumPage() {
    return (
        <div className="max-w-2xl mx-auto py-12 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Impressum</h1>
                <p className="text-slate-500">Angaben gemäß § 5 TMG</p>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Betreiber / Verantwortlich für den Inhalt</h2>
                <div className="space-y-2 text-slate-600">
                    <p className="font-medium text-slate-900">[Your Full Name]</p>
                    <p>[Street Address, House Number]</p>
                    <p>[Zip Code] [City]</p>
                    <p>Germany</p>
                </div>
            </div>

            <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Kontakt</h2>
                <div className="space-y-2 text-slate-600">
                    <p>
                        <span className="font-medium text-slate-900 w-20 inline-block">E-Mail:</span>
                        <a href="mailto:khaderwiz@outlook.com" className="text-brand-600 hover:underline">
                            khaderwiz@outlook.com
                        </a>
                    </p>
                    <p>
                        <span className="font-medium text-slate-900 w-20 inline-block">Telefon:</span>
                        <span>(Optional)</span>
                    </p>
                </div>
            </div>

            <div className="space-y-4 text-slate-600 text-sm">
                <h2 className="text-lg font-semibold text-slate-900">Disclaimer (Haftungsausschluss)</h2>

                <h3 className="font-semibold text-slate-800">Haftung für Inhalte</h3>
                <p>
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
                    Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu
                    überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                </p>

                <h3 className="font-semibold text-slate-800">Haftung für Links</h3>
                <p>
                    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
                    Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten
                    ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                </p>

                <h3 className="font-semibold text-slate-800">Urheberrecht</h3>
                <p>
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
                    Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
                    bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
            </div>

            <div className="pt-8 border-t border-slate-200">
                <p className="text-xs text-slate-500 text-center">
                    This is a private, non-commercial project managed by [Your Name].
                </p>
            </div>
        </div>
    );
}
