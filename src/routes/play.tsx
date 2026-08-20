import { createFileRoute } from "@tanstack/react-router";
import { GameView } from "@/components/game/game-view";
import { THEATER_ORDER } from "@/game/catalog";
import type { DifficultyId, SideId, TheaterId } from "@/game/catalog/ids";

type Search = { t: TheaterId; s: SideId; d: DifficultyId };

export const Route = createFileRoute("/play")({
  validateSearch: (raw: Record<string, unknown>): Search => ({
    t: THEATER_ORDER.includes(raw.t as TheaterId) ? (raw.t as TheaterId) : "depth",
    s: raw.s === "east" ? "east" : "west",
    d: raw.d === "recruit" || raw.d === "veteran" ? raw.d : "operator",
  }),
  component: Play,
});

function Play() {
  const { t, s, d } = Route.useSearch();
  return <GameView theaterId={t} playerSide={s} difficultyId={d} />;
}
