"use client";

import { useState } from "react";
import { X, Search, Mail, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ladderId: string;
    ladderName: string;
}

export function InviteMembersModal({ isOpen, onClose, ladderId, ladderName }: Props) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"existing" | "email">("existing");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [emails, setEmails] = useState("");
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [message, setMessage] = useState("");

    if (!isOpen) return null;

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            setSearchResults(data.users || []);
        } catch (error) {
            console.error("Search failed:", error);
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const toggleUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleInviteExisting = async () => {
        if (selectedUsers.length === 0) return;

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ladderId,
                    userIds: selectedUsers,
                    invited_by: user?.id, // Add current user as inviter
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`✓ ${selectedUsers.length} invitation(s) sent successfully!`);
                setTimeout(() => {
                    setSelectedUsers([]);
                    setSearchResults([]);
                    setSearchQuery("");
                    onClose();
                }, 2000);
            } else {
                setMessage(`✗ Error: ${data.error || "Failed to send invitations"}`);
            }
        } catch (error) {
            setMessage("✗ Failed to send invitations");
        } finally {
            setLoading(false);
        }
    };

    const handleInviteEmail = async () => {
        const emailList = emails.split(/[,\n]/).map(e => e.trim()).filter(e => e);

        if (emailList.length === 0) return;

        setLoading(true);
        setMessage("");

        try {
            const res = await fetch("/api/invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ladderId,
                    emails: emailList,
                    invited_by: user?.id, // Add current user as inviter
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`✓ ${emailList.length} email invitation(s) sent!`);
                setTimeout(() => {
                    setEmails("");
                    onClose();
                }, 2000);
            } else {
                setMessage(`✗ Error: ${data.error || "Failed to send emails"}`);
            }
        } catch (error) {
            setMessage("✗ Failed to send email invitations");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div>
                        <h2 className="text-xl font-semibold text-slate-900">Invite Members</h2>
                        <p className="text-sm text-slate-600 mt-1">to {ladderName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("existing")}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === "existing"
                            ? "text-brand-600 border-b-2 border-brand-600"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        <Users className="h-4 w-4 inline mr-2" />
                        Existing Users
                    </button>
                    <button
                        onClick={() => setActiveTab("email")}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === "email"
                            ? "text-brand-600 border-b-2 border-brand-600"
                            : "text-slate-600 hover:text-slate-900"
                            }`}
                    >
                        <Mail className="h-4 w-4 inline mr-2" />
                        Email Invitations
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === "existing" ? (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={searching || !searchQuery.trim()}
                                    className="btn btn-secondary"
                                >
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                </button>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <div
                                            key={user.id}
                                            onClick={() => toggleUser(user.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedUsers.includes(user.id)
                                                ? "border-brand-500 bg-brand-50"
                                                : "border-slate-200 hover:border-brand-300"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {user.full_name || user.email}
                                                    </p>
                                                    {user.full_name && (
                                                        <p className="text-xs text-slate-500">{user.email}</p>
                                                    )}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => { }}
                                                    className="h-4 w-4 text-brand-600 rounded"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedUsers.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm text-slate-600 mb-2">
                                        {selectedUsers.length} user(s) selected
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email Addresses
                                </label>
                                <textarea
                                    value={emails}
                                    onChange={(e) => setEmails(e.target.value)}
                                    placeholder="Enter email addresses (comma or newline separated)&#10;example@email.com, another@email.com"
                                    rows={6}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500">
                                Users will receive an email with a link to sign up and join this ladder.
                            </p>
                        </div>
                    )}

                    {message && (
                        <div className={`mt-4 p-3 rounded-lg text-sm ${message.startsWith("✓")
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                            }`}>
                            {message}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
                    <button onClick={onClose} className="btn btn-secondary">
                        Cancel
                    </button>
                    <button
                        onClick={activeTab === "existing" ? handleInviteExisting : handleInviteEmail}
                        disabled={
                            loading ||
                            (activeTab === "existing" && selectedUsers.length === 0) ||
                            (activeTab === "email" && !emails.trim())
                        }
                        className="btn btn-primary"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Sending...
                            </>
                        ) : (
                            `Send Invitation${activeTab === "existing"
                                ? selectedUsers.length > 1
                                    ? "s"
                                    : ""
                                : "s"
                            }`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
