import { createFileRoute } from "@tanstack/react-router";
import { ShelfBoard } from "@/features/shelves";

export const Route = createFileRoute("/_app/shelves")({
  component: ShelfBoard,
});
