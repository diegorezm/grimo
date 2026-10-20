/**
 * Versions of the legal documents (date of the text, `YYYY-MM-DD`). Bump one when its text
 * changes in a way readers must agree to again: `me.legal.needsAcceptance` turns true and the
 * apps ask for a new acceptance. Typos and wording fixes keep the version.
 * Decisions and checklist: docs/legal/README.md.
 */
export const TERMS_VERSION = "2026-10-19";
export const PRIVACY_VERSION = "2026-10-19";

export const LEGAL_DOCUMENTS = ["terms", "privacy"] as const;
export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number];

export const CURRENT_LEGAL_VERSIONS: Record<LegalDocument, string> = {
  terms: TERMS_VERSION,
  privacy: PRIVACY_VERSION,
};

/**
 * Who answers for the service (the "controlador" of the LGPD). Provisional values are marked in
 * docs/legal/README.md ("Dados do controlador"): change them there and here together.
 */
export const LEGAL_INFO = {
  /** TODO(legal): full name of the person responsible (LGPD art. 9). */
  controllerName: "[NOME COMPLETO DO RESPONSÁVEL]",
  /** TODO(legal): provisional, until the domain is bought (privacidade@<domínio>). */
  contactEmail: "contato.morzen@gmail.com",
  forum: "Taubaté/SP",
} as const;

/** Web paths of the documents (the mobile app opens them on the web). */
export const LEGAL_PATHS = {
  terms: "/termos",
  privacy: "/privacidade",
  deleteAccount: "/excluir-conta",
} as const;
