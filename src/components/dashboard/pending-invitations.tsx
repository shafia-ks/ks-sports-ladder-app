"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { usePendingInvitations, useRespondToInvitation } from "@/features/invitations/api";
import { Loader2, Check, X, Mail } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export function PendingInvitationsCard() {
    const { user } = useAuth();
    const { data: invitations, isLoading } = usePendingInvitations(user?.email);
    const { mutate: respond, isPending } = useRespondToInvitation();
    const { push: toast } = useToast();

    if (isLoading || !invitations || invitations.length === 0) return null;

    const handleRespond = (id: string, action: 'accept' | 'reject') => {
        if (!user?.id) return;
        respond({ id, action, userId: user.id }, {
            onSuccess: () => {
                toast({ title: action === 'accept' ? "Invitation Accepted" : "Invitation Declined", variant: "success" });
            },
            onError: (err) => {
                toast({ title: "Error", description: err.message, variant: "error" });
            }
        });
    };

    return (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Pending Invitations</h3>
            </div>
            <div className="space-y-3">
                {invitations.map((inv: any) => (
                    <div key={inv.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-3 rounded-lg border border-blue-100 shadow-sm gap-3">
                        <div>
                            <p className="text-sm font-medium text-slate-900">
                                You have been invited to join <span className="font-bold text-brand-600">{inv.ladders?.name || "a ladder"}</span>
                            </p>
                            <p className="text-xs text-slate-500">
                                Expires on {new Date(inv.expires_at).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={() => handleRespond(inv.id, 'accept')}
                                disabled={isPending}
                                className="flex-1 sm:flex-none btn btn-sm bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center gap-1 min-w-[100px]"
                            >
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> Accept</>}
                            </button>
                            <button
                                onClick={() => handleRespond(inv.id, 'reject')}
                                disabled={isPending}
                                className="flex-1 sm:flex-none btn btn-sm bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center gap-1 min-w-[100px]"
                            >
                                <X className="h-4 w-4" /> Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
