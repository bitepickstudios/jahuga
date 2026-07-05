import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Skins — Jahuga" };

export default function SkinsPage() {
  return (
    <ComingSoon
      emoji="👕"
      title="Skins"
      description="Camisetas y estilos para tu avatar, comprables con Coins. Llegan con la economía."
    />
  );
}
