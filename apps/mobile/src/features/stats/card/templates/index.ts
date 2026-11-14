import { CARD_TEMPLATES, type CardTemplate } from "@grimo/core";
import type { ComponentType } from "react";
import { premium } from "@/lib/premium";
import type { CardProps } from "../types";
import { DiarioCard } from "./diario";
import { EstanteCard } from "./estante";
import { FitaCard } from "./fita";
import { ReciboCard } from "./recibo";

const FREE: Partial<Record<CardTemplate, ComponentType<CardProps>>> = {
  fita: FitaCard,
  estante: EstanteCard,
  diario: DiarioCard,
  recibo: ReciboCard,
};

/** Every layout; a paid one without its art (a build without the content) draws as "Fita". */
export const CARD_COMPONENTS = Object.fromEntries(
  CARD_TEMPLATES.map((template) => [
    template,
    FREE[template] ?? premium.cards[template] ?? FitaCard,
  ]),
) as Record<CardTemplate, ComponentType<CardProps>>;
