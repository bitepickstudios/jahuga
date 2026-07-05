import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Grupo — Jahuga" };

export default function GrupoPage() {
  return (
    <ComingSoon
      emoji="🛡️"
      title="Mi Grupo"
      description="Creá tu grupo, sumá a tus amigos y compitan por puntos y victorias. Ya casi."
    />
  );
}
