import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Amigos — Jahuga" };

export default function AmigosPage() {
  return (
    <ComingSoon
      emoji="👥"
      title="Amigos"
      description="Solicitudes por nickname, link de invitación y retar directo desde tu lista. Ya casi."
    />
  );
}
