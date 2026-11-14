import {
  isBuiltInShelfChoice,
  isPremiumCardTemplate,
  isPremiumShelfChoice,
  type ShelfPremiumLayer,
  type ShelfStyle,
} from "@grimo/core";
import type { CardArtProps, PremiumPlatform, SpineFinishArt } from "@grimo/premium";
import { platform } from "@grimo/premium/mobile";
import { tokens } from "@grimo/premium/tokens";
import { cardPalettes } from "@grimo/tokens";
import type { ComponentType } from "react";
import type { ViewStyle } from "react-native";

/**
 * The paid content (`@grimo/premium`), as mobile draws it (the twin of the web's
 * `lib/premium.ts`). Empty in a build without the private repository: paid choices are then not
 * offered, and anything saved with one falls back to the default look.
 */
export type MobilePremium = PremiumPlatform<
  ViewStyle,
  ViewStyle,
  SpineFinishArt<ViewStyle[]>,
  ComponentType<CardArtProps>
>;

export const premium = platform as unknown as MobilePremium;
export const premiumTokens = tokens;

const SHELF_ART: Record<ShelfPremiumLayer, Record<string, unknown>> = {
  model: premium.models,
  material: premiumTokens.shelfMaterials,
  finish: premium.finishes,
  decor: premiumTokens.decor,
  light: premium.lights,
};

/** Whether this build can draw the choice: free ones always, paid ones when their art is here. */
export const canDrawShelfChoice = (layer: ShelfPremiumLayer, key: string) =>
  !isPremiumShelfChoice(layer, key) || isBuiltInShelfChoice(layer, key) || key in SHELF_ART[layer];

/** Whether this build can draw every layer of the style (the ready styles it offers). */
export const canDrawShelfStyle = (style: ShelfStyle) =>
  canDrawShelfChoice("model", style.model) &&
  canDrawShelfChoice("material", style.material) &&
  canDrawShelfChoice("finish", style.finish) &&
  canDrawShelfChoice("light", style.light) &&
  style.decor.every((decor) => canDrawShelfChoice("decor", decor));

export const canDrawCard = (template: string) =>
  !isPremiumCardTemplate(template) || template in premium.cards;

export type AnyCardPalette = (typeof cardPalettes)[keyof typeof cardPalettes];

/** Every card palette this build has: the free ones, then the paid ones. */
export const allCardPalettes: Record<string, AnyCardPalette> = {
  ...cardPalettes,
  ...(premiumTokens.cardPalettes as Record<string, never>),
};
export const isPremiumCardPalette = (key: string) => key in premiumTokens.cardPalettes;
