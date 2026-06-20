"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { getCloudinaryUrl } from "@thread/utils";
import { api } from "@/lib/api";

interface PhotoUploadProps {
  value: string[];
  onChange: (publicIds: string[]) => void;
}

interface UploadSignature {
  signature: string;
  timestamp: number;
  uploadPreset: string;
  cloudName: string;
  apiKey: string;
  folder: string;
}

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (value.length + files.length > 8) {
      setUploadError("Maximum 8 photos allowed");
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const sigData = await api.get<UploadSignature>("/uploads/sign?folder=submissions");

      const uploads = await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("signature", sigData.signature);
          formData.append("timestamp", String(sigData.timestamp));
          formData.append("upload_preset", sigData.uploadPreset);
          formData.append("api_key", sigData.apiKey);
          formData.append("folder", sigData.folder);

          const res = await fetch(
            `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
            { method: "POST", body: formData }
          );
          const data = (await res.json()) as { public_id: string };
          return data.public_id;
        })
      );

      onChange([...value, ...uploads]);
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [value, onChange]);

  const removePhoto = (publicId: string) => {
    onChange(value.filter((p) => p !== publicId));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {value.map((publicId) => (
          <div key={publicId} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            <Image
              src={getCloudinaryUrl(publicId, { width: 200, height: 200 })}
              alt="Item photo"
              fill
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(publicId)}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {value.length < 8 && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed hover:bg-muted/50 transition-colors">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="mt-1 text-xs text-muted-foreground">{uploading ? "Uploading..." : "Add Photo"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files && void handleFiles(e.target.files)}
            />
          </label>
        )}
      </div>

      {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
      <p className="text-xs text-muted-foreground">
        {value.length}/8 photos · Minimum 3 required · Front, back, and detail shots recommended
      </p>
    </div>
  );
}
