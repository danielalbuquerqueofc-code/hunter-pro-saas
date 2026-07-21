"use client";

import { useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type StorageImageUploadProps = {
  id: string;
  name: string;
  label: string;
  initialUrl?: string | null;
  pathPrefix: string;
  filePrefix: string;
  help?: string;
};

function extensionFor(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) return extension;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export function StorageImageUpload({
  id,
  name,
  label,
  initialUrl,
  pathPrefix,
  filePrefix,
  help
}: StorageImageUploadProps) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Envie uma imagem valida.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem precisa ter ate 5MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const path = `${pathPrefix}/${filePrefix}-${Date.now()}.${extensionFor(file)}`;
      const { error: uploadError } = await supabase.storage.from("hunter-assets").upload(path, file, {
        cacheControl: "3600",
        upsert: true
      });

      if (uploadError) {
        setError("Nao foi possivel enviar. Confirme se a migration 0012 foi aplicada no Supabase.");
        return;
      }

      const { data } = supabase.storage.from("hunter-assets").getPublicUrl(path);
      setUrl(data.publicUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <Label htmlFor={id}>{label}</Label>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-32 w-full rounded-2xl object-cover" />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white text-zinc-400">
          <ImageUp className="h-7 w-7" />
        </div>
      )}
      <Input
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Input
        name={name}
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="Ou cole uma URL de imagem"
      />
      <p className="flex items-center gap-2 text-xs text-zinc-500">
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {error || (uploading ? "Enviando imagem..." : help ?? "PNG, JPG, WEBP ou GIF ate 5MB.")}
      </p>
    </div>
  );
}
