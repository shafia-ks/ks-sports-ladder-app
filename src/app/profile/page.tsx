"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { AvatarPicker, AvatarGrid } from "@/components/ui/avatar-picker";
import { useAuth } from "@/lib/auth/auth-context";
import { Loader2, Key, Trash2, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    full_name: "",
    email: "",
    avatar_url: "",
    avatar_color: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.firstName || "",
        last_name: user.lastName || "",
        full_name: user.fullName || "",
        email: user.email || "",
        avatar_url: user.avatarUrl || "",
        avatar_color: "", // Don't initialize with avatarUrl
      });
    }
  }, [user]);

  const handleAvatarUpload = async (file: File) => {
    try {
      if (!supabase) throw new Error("Supabase not configured");
      if (!user?.id) throw new Error("User not found");

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error("File must be an image");
      }

      setIsLoading(true);
      setError(null);

      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update form data
      setFormData(prev => ({
        ...prev,
        avatar_url: publicUrl,
        avatar_color: "" // Clear color when uploading image
      }));

      // Refresh auth context to sync changes across app
      await refreshProfile();

      setSuccess("Avatar uploaded successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to upload avatar";
      setError(errorMessage);
      console.error("Avatar upload error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase) throw new Error("Supabase not configured");
      if (!user?.id) throw new Error("User not found");

      // Validate full_name is not empty
      if (!formData.full_name?.trim()) {
        throw new Error("Full name is required");
      }

      // Use Supabase client directly since we're authenticated
      const { data, error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name?.trim() || null,
          last_name: formData.last_name?.trim() || null,
          full_name: formData.full_name.trim(),
          avatar_url: formData.avatar_url || null,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Refresh auth context to sync changes across the entire app
      await refreshProfile();

      setSuccess("Profile updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;

    setIsResettingPassword(true);
    setError(null);
    setSuccess(null);

    try {
      if (!supabase) throw new Error("Supabase not configured");

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        user.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) throw resetError;

      setSuccess(
        "Password reset email sent! Check your inbox to complete the reset."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to send password reset email"
      );
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      if (!supabase) throw new Error("Supabase not configured");
      if (!user?.id) throw new Error("User not found");

      // Sign out and delete account
      await supabase.auth.signOut({ scope: "global" });

      // Clear all auth tokens
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") || key.startsWith("auth-") || key.startsWith("profile_")) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();

      // Redirect to signup with message
      router.push("/signup?deleted=true");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete account"
      );
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Manage your profile information and avatar."
      />

      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="text-red-600 text-sm flex-1">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="card p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-green-700 text-sm font-medium">{success}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="card space-y-6 p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Avatar</h2>
          <AvatarPicker
            currentUrl={user.avatarUrl}
            userName={user.fullName || user.email}
            selectedColor={formData.avatar_color}
            onUpload={handleAvatarUpload}
            isLoading={isLoading}
          />
          <div className="mt-4">
            <AvatarGrid
              selectedColor={formData.avatar_color}
              onSelectAvatar={(avatarId, color) => {
                setFormData((prev) => ({
                  ...prev,
                  avatar_url: "", // Clear URL when selecting color
                  avatar_color: color,
                }));
              }}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Personal Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full rounded-lg border border-slate-200 px-4 py-2 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">Email cannot be changed here. Contact support.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary flex items-center gap-2"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSaving ? "Saving..." : "Save Profile"}
          </button>
          <Link href="/dashboard" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>

      <div className="card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Password & Security</h2>
            <p className="text-sm text-slate-600 mt-1">Manage your account security</p>
          </div>
          <Key className="h-5 w-5 text-slate-400" />
        </div>

        <div className="border-t border-slate-200 pt-4">
          <button
            onClick={handleResetPassword}
            disabled={isResettingPassword}
            className="btn btn-secondary flex items-center gap-2"
          >
            {isResettingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
            {isResettingPassword ? "Sending..." : "Reset Password"}
          </button>
          <p className="text-xs text-slate-500 mt-2">
            We'll send a password reset link to your email address.
          </p>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="card space-y-4 p-6 border-2 border-danger-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-danger-700">Danger Zone</h2>
            <p className="text-sm text-slate-600 mt-1">Permanently delete your account</p>
          </div>
          <Trash2 className="h-5 w-5 text-danger-500" />
        </div>

        <div className="border-t border-danger-200 pt-4 space-y-3">
          <p className="text-sm text-slate-700">
            Once you delete your account, there is no going back. This action cannot be undone.
            All your data will be permanently removed.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn bg-danger-600 text-white hover:bg-danger-700 flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Account
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-danger-50 rounded-lg">
              <p className="text-sm font-semibold text-danger-900">
                Are you absolutely sure?
              </p>
              <p className="text-xs text-danger-800">
                Type <strong>DELETE</strong> below to confirm account deletion:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full rounded-lg border border-danger-300 px-4 py-2 focus:border-danger-500 focus:outline-none focus:ring-1 focus:ring-danger-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmText !== "DELETE"}
                  className="btn bg-danger-600 text-white hover:bg-danger-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isDeleting ? "Deleting..." : "I understand, delete my account"}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="btn btn-secondary"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
