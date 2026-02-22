import { z } from 'zod';

/** Session object returned after successful login */
export const sessionSchema = z.object({
  /** User's Decentralized Identifier (DID) */
  did: z.string(),
  /** JWT token for authenticated API requests to Bluesky */
  accessJwt: z.string(),
  /** User's Bluesky handle */
  handle: z.string(),
  /** JWT token for refreshing the session */
  refreshJwt: z.string(),
});

/** Type for authenticated session object */
export type AuthSession = z.infer<typeof sessionSchema>;

export type OgData = {
  title: string;
  description: string;
  imageUrl: string | null;
};
