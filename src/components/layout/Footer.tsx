import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Instagram, Linkedin, Facebook } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-slate-950 text-slate-400 py-12 mt-auto border-t border-slate-800">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

                    {/* Brand Column */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 text-white group">
                            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white/10 p-1">
                                <Image
                                    src="/app-icon-base.png"
                                    alt="KS Sports Ladder Logo"
                                    width={32}
                                    height={32}
                                    className="object-cover"
                                />
                            </div>
                            <span className="text-lg font-bold tracking-tight group-hover:text-brand-400 transition-colors">KS Sports Ladder</span>
                        </Link>
                        <p className="text-sm text-slate-500">
                            Compete. Climb. Conquer. <br />
                            The modern platform for sports ladders & leagues.
                        </p>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h3 className="text-slate-100 font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/legal/impressum" className="hover:text-brand-400 transition-colors">
                                    Imprint (Impressum)
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/privacy" className="hover:text-brand-400 transition-colors">
                                    Privacy Policy (Datenschutz)
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal/terms" className="hover:text-brand-400 transition-colors">
                                    Terms of Service (AGB)
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Column */}
                    <div>
                        <h3 className="text-slate-100 font-semibold mb-4 text-sm uppercase tracking-wider">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/contact" className="hover:text-brand-400 transition-colors">
                                    Contact Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/help" className="hover:text-brand-400 transition-colors">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/help#faq" className="hover:text-brand-400 transition-colors">
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Connect Column */}
                    <div>
                        <h3 className="text-slate-100 font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h3>
                        <div className="flex items-center gap-4">
                            <Link href="#" className="hover:text-brand-400 transition-colors" aria-label="Twitter">
                                <Twitter className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="hover:text-brand-400 transition-colors" aria-label="Instagram">
                                <Instagram className="h-5 w-5" />
                            </Link>
                            <Link href="#" className="hover:text-brand-400 transition-colors" aria-label="LinkedIn">
                                <Linkedin className="h-5 w-5" />
                            </Link>
                        </div>
                        <p className="text-xs text-slate-600 mt-4">
                            Made with ❤️ in Germany
                        </p>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
                    <p>© {currentYear} KS Sports Ladder. Private Non-Commercial Project.</p>
                    <div className="flex gap-4">
                        <Link href="/legal/privacy" className="hover:text-slate-400">Cookie Settings</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
