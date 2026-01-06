"use client";

import { useState } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { Avatar } from "./avatar";

interface AvatarPickerProps {
  currentUrl?: string | null;
  userName?: string | null;
  selectedColor?: string | null;
  onUpload?: (file: File) => Promise<void>;
  isLoading?: boolean;
}

const DEFAULT_AVATARS = [
  { id: "avatar-1", initials: "A", color: "bg-blue-500" },
  { id: "avatar-2", initials: "B", color: "bg-purple-500" },
  { id: "avatar-3", initials: "C", color: "bg-pink-500" },
  { id: "avatar-4", initials: "D", color: "bg-green-500" },
  { id: "avatar-5", initials: "E", color: "bg-orange-500" },
  { id: "avatar-6", initials: "F", color: "bg-red-500" },
  { id: "avatar-7", initials: "G", color: "bg-indigo-500" },
  { id: "avatar-8", initials: "H", color: "bg-yellow-500" },
];

export function AvatarPicker({
  currentUrl,
  userName,
  selectedColor,
  onUpload,
  isLoading,
}: AvatarPickerProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      await onUpload(file);
    } catch (err) {
      console.error("Upload failed:", err);
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24">
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : selectedColor ? (
            <div className={`w-24 h-24 rounded-full ${selectedColor} flex items-center justify-center text-white text-3xl font-bold`}>
              {userName?.charAt(0).toUpperCase() || "?"}
            </div>
          ) : (
            <Avatar name={userName} size="lg" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <label className="block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading || isLoading}
              className="hidden"
            />
            <span className="btn btn-primary cursor-pointer disabled:opacity-50">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload photo"}
            </span>
          </label>
          {preview && (
            <button
              onClick={() => setPreview(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-300"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          )}
          <p className="text-xs text-slate-500">JPG, PNG up to 5MB</p>
        </div>
      </div>
    </div>
  );
}

interface AvatarGridProps {
  selectedColor?: string | null;
  onSelectAvatar?: (avatarId: string, color: string) => void;
}

export function AvatarGrid({ selectedColor, onSelectAvatar }: AvatarGridProps) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-3">Or choose a default avatar:</p>
      <div className="grid grid-cols-4 gap-2">
        {DEFAULT_AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            onClick={() => onSelectAvatar?.(avatar.id, avatar.color)}
            type="button"
            className={`w-12 h-12 rounded-full ${avatar.color} text-white font-bold text-lg flex items-center justify-center hover:opacity-80 transition ${selectedColor === avatar.color ? "ring-2 ring-offset-2 ring-slate-400" : ""
              }`}
            title={`Avatar ${avatar.initials}`}
          >
            {avatar.initials}
          </button>
        ))}
      </div>
    </div>
  );
}
