"use client";

import { useActionState, useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { createClient } from "@/lib/supabase/client";
import { createGroup, type GroupFormState } from "@/features/groups/actions";

const INITIAL: GroupFormState = { error: null };

export function CreateGroupForm({ userId }: { userId: string }) {
  const [state, formAction, pending] = useActionState(createGroup, INITIAL);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/grupo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("photos").upload(path, file);
    if (!error) {
      setImageUrl(supabase.storage.from("photos").getPublicUrl(path).data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField name="name" type="text" isRequired fullWidth>
        <Label>Nombre del grupo</Label>
        <Input placeholder="Los del barrio" maxLength={40} />
      </TextField>
      <TextField name="description" type="text" fullWidth>
        <Label>Descripción (opcional)</Label>
        <Input placeholder="Se juega como se vive" maxLength={140} />
      </TextField>

      <input type="hidden" name="image_url" value={imageUrl ?? ""} />
      <div className="flex items-center gap-3">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="size-16 rounded-xl object-cover" />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-xl border border-dashed border-ice/25 text-2xl">
            🛡️
          </span>
        )}
        <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl border border-ice/20 text-sm text-ice/80 active:bg-ice/5">
          {uploading ? "Subiendo..." : imageUrl ? "Cambiar imagen" : "Imagen del grupo (opcional)"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
          />
        </label>
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}

      <Button type="submit" variant="primary" size="lg" fullWidth className="min-h-12" isDisabled={pending || uploading}>
        {pending ? "Creando..." : "Crear grupo"}
      </Button>
    </form>
  );
}
