import type { FinishedCardTemplate } from "@grimo/core";
import type { ComponentType } from "react";
import { CantinhoFinishedCard } from "./cantinho";
import { CartazFinishedCard } from "./cartaz";
import { DiarioFinishedCard } from "./diario";
import { FichaFinishedCard } from "./ficha";
import { FitaFinishedCard } from "./fita";
import type { FinishedCardProps } from "./shared";

export const FINISHED_CARD_COMPONENTS: Record<
  FinishedCardTemplate,
  ComponentType<FinishedCardProps>
> = {
  cantinho: CantinhoFinishedCard,
  diario: DiarioFinishedCard,
  fita: FitaFinishedCard,
  ficha: FichaFinishedCard,
  cartaz: CartazFinishedCard,
};
