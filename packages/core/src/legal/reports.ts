import { z } from "zod";

/** What can be reported ("message": in a Juntos conversation). */
export const REPORT_TARGETS = ["post", "comment", "user", "message"] as const;
export type ReportTarget = (typeof REPORT_TARGETS)[number];

/** Title of the report dialog/sheet. */
export const REPORT_TARGET_TITLES: Record<ReportTarget, string> = {
  post: "Denunciar publicação",
  comment: "Denunciar comentário",
  user: "Denunciar leitor",
  message: "Denunciar mensagem",
};

export const REPORT_REASONS = [
  "spam",
  "harassment",
  "hate",
  "sexual",
  "violence",
  "spoiler",
  "copyright",
  "underage",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  spam: "Spam ou golpe",
  harassment: "Assédio ou bullying",
  hate: "Discurso de ódio",
  sexual: "Conteúdo sexual",
  violence: "Violência ou ameaça",
  spoiler: "Spoiler sem aviso",
  copyright: "Violação de direitos autorais",
  underage: "Parece ter menos de 16 anos",
  other: "Outro motivo",
};

export const REPORT_STATUSES = ["open", "dismissed", "actioned"] as const;

/** Moderation team roles: moderators work the queue, admins also hand out the role. */
export const STAFF_ROLES = ["admin", "moderator"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

/** How long a suspension lasts: days, or `"permanent"` (admins only). */
export const SUSPENSION_DURATIONS = [1, 7, 30, "permanent"] as const;
export type SuspensionDuration = (typeof SUSPENSION_DURATIONS)[number];

export const SUSPENSION_DURATION_LABELS: Record<string, string> = {
  1: "1 dia",
  7: "7 dias",
  30: "30 dias",
  permanent: "Permanente",
};

export const MAX_SUSPENSION_REASON = 500;

export const reportSchema = z
  .object({
    target: z.enum(REPORT_TARGETS),
    targetId: z.string().min(1),
    reason: z.enum(REPORT_REASONS),
    details: z.string().trim().max(1000).optional(),
  })
  .refine((report) => report.reason !== "other" || Boolean(report.details), {
    message: "Conta pra gente o que aconteceu",
    path: ["details"],
  });
export type ReportInput = z.infer<typeof reportSchema>;
