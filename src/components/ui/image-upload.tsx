import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    currentImageUrl?: string | null;
    onUpload: (file: File) => Promise<string>;
    onRemove?: () => Promise<void>;
    label?: string;
    description?: string;
    maxSizeMB?: number;
    circular?: boolean;
    disabled?: boolean;
}

export function ImageUpload({
    currentImageUrl,
    onUpload,
    onRemove,
    label = "Upload Image",
    description = "Click to upload or drag and drop",
    maxSizeMB = 5,
    circular = false,
    disabled = false,
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (file: File) => {
        setError(null);

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please select an image file");
            return;
        }

        // Validate file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            await onUpload(file);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
            setPreview(currentImageUrl || null);
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (disabled || uploading) return;

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemove = async () => {
        if (!onRemove) return;

        setUploading(true);
        try {
            await onRemove();
            setPreview(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Remove failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">{label}</label>

            <div
                className={`relative border-2 border-dashed rounded-lg transition-colors ${disabled ? "border-slate-200 bg-slate-50 cursor-not-allowed" : "border-slate-300 hover:border-brand-400"
                    }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    disabled={disabled || uploading}
                    className="hidden"
                />

                {preview ? (
                    <div className="relative">
                        <div className={`relative ${circular ? "w-32 h-32 mx-auto" : "w-full h-48"} overflow-hidden ${circular ? "rounded-full" : "rounded-lg"}`}>
                            <Image
                                src={preview}
                                alt="Preview"
                                fill
                                className="object-cover"
                            />
                        </div>
                        {!disabled && (
                            <div className="absolute top-2 right-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="p-2 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-colors"
                                >
                                    <Upload className="h-4 w-4 text-slate-600" />
                                </button>
                                {onRemove && (
                                    <button
                                        type="button"
                                        onClick={handleRemove}
                                        disabled={uploading}
                                        className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                                    >
                                        <X className="h-4 w-4 text-red-600" />
                                    </button>
                                )}
                            </div>
                        )}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                                <Loader2 className="h-8 w-8 text-white animate-spin" />
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled || uploading}
                        className="w-full p-8 flex flex-col items-center justify-center text-center"
                    >
                        {uploading ? (
                            <Loader2 className="h-8 w-8 text-brand-600 animate-spin mb-2" />
                        ) : (
                            <Upload className="h-8 w-8 text-slate-400 mb-2" />
                        )}
                        <p className="text-sm font-medium text-slate-700">{description}</p>
                        <p className="text-xs text-slate-500 mt-1">PNG, JPG up to {maxSizeMB}MB</p>
                    </button>
                )}
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
