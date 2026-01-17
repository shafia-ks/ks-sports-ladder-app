import { Mail } from "lucide-react";

export const metadata = {
    title: "Contact Us | KS Sports Ladder",
};

export default function ContactPage() {
    return (
        <div className="max-w-2xl mx-auto py-12 space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Contact Us</h1>
                <p className="text-slate-500">We'd love to hear from you.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-blue-600" />
                </div>

                <h2 className="text-xl font-semibold text-slate-900 mb-2">Email Support</h2>
                <p className="text-slate-600 mb-6">
                    For general inquiries, technical support, or partnership opportunities, please email us directly.
                </p>

                <a
                    href="mailto:support@ks-sports-ladder.com"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 transition-colors"
                >
                    support@ks-sports-ladder.com
                </a>
            </div>

            <div className="text-center text-sm text-slate-500">
                <p>Alternatively, check our <a href="/help" className="text-brand-600 hover:underline">Help Center</a> for immediate answers.</p>
            </div>
        </div>
    );
}
