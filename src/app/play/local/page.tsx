import type { Metadata } from "next";
import { PenalesMatch } from "@/games/penales/ui/PenalesMatch";

export const metadata: Metadata = {
  title: "Tanda de Penales — Lobby",
};

export default function PlayLocalPage() {
  return <PenalesMatch />;
}
