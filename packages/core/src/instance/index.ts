/**
 * Instance = one Grimo installation (the official one or a self-hosted one).
 * - `personal`: a private reading journal for one reader. Sign-up closes after the first account.
 * - `community`: the social network (followers, social feed).
 */
export const INSTANCE_MODES = ["personal", "community"] as const;
export type InstanceMode = (typeof INSTANCE_MODES)[number];

export const REGISTRATION_MODES = ["open", "closed"] as const;
export type RegistrationMode = (typeof REGISTRATION_MODES)[number];

/** Public info returned by `GET /api/instance` — clients adapt the UI to it. */
export interface InstanceInfo {
  name: string;
  mode: InstanceMode;
  /** Whether the sign-up form should be shown right now. */
  registrationOpen: boolean;
  /** Follows + social feed enabled. */
  social: boolean;
}
