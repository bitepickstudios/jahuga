"use client";

import { useState } from "react";
import { Button, Input, Label, TextField } from "@heroui/react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { completeOnboarding } from "@/features/profiles/actions";

export function OnboardingWizard({ nickname, userId }: { nickname: string; userId: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/foto-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("photos").upload(path, file);
    if (uploadError) {
      setError("No se pudo subir la foto. Probá con otra.");
    } else {
      setPhotoUrl(supabase.storage.from("photos").getPublicUrl(path).data.publicUrl);
    }
    setUploading(false);
  }

  async function finish() {
    setSaving(true);
    setError(null);
    const result = await completeOnboarding({ displayName, birthDate, photoUrl });
    // completeOnboarding redirige al home si sale bien; si volvió, hubo error
    if (result?.error) {
      setError(result.error);
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="text-center">
        <p className="text-sm uppercase tracking-widest text-ice/50">Paso {step} de 3</p>
        <h1 className="font-ui text-3xl font-extrabold text-ice">Hola, @{nickname}</h1>
      </header>

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <TextField type="text" fullWidth value={displayName} onChange={setDisplayName}>
            <Label>¿Cómo te llamás?</Label>
            <Input placeholder="Tu nombre" autoComplete="name" className="rounded-xl" />
          </TextField>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="min-h-12 rounded-xl"
            isDisabled={!displayName.trim()}
            onPress={() => setStep(2)}
          >
            Seguir
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="birth" className="text-sm font-medium text-ice/80">
              ¿Cuándo naciste?
            </label>
            <input
              id="birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="min-h-12 rounded-xl border border-ice/20 bg-night px-3 text-ice [color-scheme:dark]"
            />
            <p className="text-xs text-ice/40">Mostramos tu edad y tu cumpleaños, nunca la fecha completa.</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="min-h-12 rounded-xl"
            isDisabled={!birthDate}
            onPress={() => setStep(3)}
          >
            Seguir
          </Button>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm font-medium text-ice/80">Tu foto (va a la cara de tu avatar)</p>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt="Tu foto" className="size-32 rounded-full border-2 border-ice/40 object-cover" />
          ) : (
            <div className="flex size-32 items-center justify-center rounded-full border-2 border-dashed border-ice/30 text-ice/50">
              <Camera size={40} />
            </div>
          )}
          <label className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-ice/25 text-ice/80 active:bg-ice/5">
            {uploading ? "Subiendo..." : photoUrl ? "Cambiar foto" : "Elegir foto"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])}
            />
          </label>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            className="min-h-12 rounded-xl"
            isDisabled={saving || uploading}
            onPress={finish}
          >
            {saving ? "Guardando..." : photoUrl ? "Listo, al lobby" : "Saltar por ahora"}
          </Button>
        </div>
      )}

      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
