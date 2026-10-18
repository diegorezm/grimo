import { createFileRoute } from "@tanstack/react-router";
import { BookSearch } from "@/features/books";

export const Route = createFileRoute("/_app/search")({
  component: BookSearch,
});
