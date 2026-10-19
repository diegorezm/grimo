import type { CardTemplate } from "@grimo/core";
import type { ComponentType } from "react";
import type { CardProps } from "../types";
import { DiarioCard } from "./diario";
import { EstanteCard } from "./estante";
import { FitaCard } from "./fita";
import { ReciboCard } from "./recibo";

export const CARD_COMPONENTS: Record<CardTemplate, ComponentType<CardProps>> = {
  fita: FitaCard,
  estante: EstanteCard,
  diario: DiarioCard,
  recibo: ReciboCard,
};
