import { createFileRoute } from "@tanstack/react-router";
import { TitleScreen } from "@/components/game/title-screen";

export const Route = createFileRoute("/")({ component: TitleScreen });
