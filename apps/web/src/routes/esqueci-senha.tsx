import { createFileRoute } from "@tanstack/react-router";
import { ForgotPassword } from "@/features/auth";

export const Route = createFileRoute("/esqueci-senha")({ component: ForgotPassword });
