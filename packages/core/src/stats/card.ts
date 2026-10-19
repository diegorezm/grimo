/** Layouts for the shareable monthly card (rendered by each client). */
export const CARD_TEMPLATES = ["fita", "estante", "diario", "recibo"] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number];

export const CARD_TEMPLATE_LABELS: Record<CardTemplate, { label: string; description: string }> = {
  fita: { label: "Fita", description: "Ousado, com faixa e números grandes" },
  estante: { label: "Estante", description: "Os livros do mês lado a lado" },
  diario: { label: "Diário", description: "Delicado, com brilhos e capa" },
  recibo: { label: "Recibo", description: "Seu mês em forma de nota fiscal" },
};
