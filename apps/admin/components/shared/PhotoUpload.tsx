"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { getCloudinaryUrl } from "@thread/utils";
import { api } from "@/lib/api";

interface UploadSignature {
  signature: string;
  timestamp: number;
  uploadPreset: string;
  cloudName: string;
  apiKey: string;
  folder: string;
}

interface PhotoUploadProps {
  value: string[];
  onChange: (ids: string[]) => void;
  max?: number;
}

export function PhotoUpload({ value, onChange, max = 8 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList) => {
    if (value.length + files.length > max) { setError(`Maximum ${max} photos`); return; }
    setUploading(true); setError(null);
    try {
      const sig = await api.get<UploadSignature>("/uploads/sign?folder=items");
      const ids = await Promise.all(Array.from(files).map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("signature", sig.signature);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("upload_preset", sig.uploadPreset);
        fd.append("api_key", sig.apiKey);
        fd.append("folder", sig.folder);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
        const json = await res.json() as { public_id: string };
        return json.public_id;
      }));
      onChange([...value, ...ids]);
    } catch { setError("Upload failed. Please try again."); }
    finally { setUploading(false); }
  }, [value, onChange, max]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {value.map((id) => (
          <div key={id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <Image src={getCloudinaryUrl(id, { width: 160, height: 160 })} alt="" fill className="object-cover" />
            <button type="button" onClick={() => onChange(value.filter((p) => p !== id))}
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80">
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 hover:bg-gray-50 transition-colors">
            <Upload className="h-4 w-4 text-gray-400" />
            <span className="mt-1 text-xs text-gray-400">{uploading ? "Uploading…" : "Add"}</span>
            <input type="file" accept="image/*,.heic,.heif" multiple className="hidden" disabled={uploading}
              onChange={(e) => e.target.files && void handleFiles(e.target.files)} />
          </label>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-xs text-gray-400">{value.length}/{max} photos</p>
    </div>
  );
}
