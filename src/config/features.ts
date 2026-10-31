/**
 * Application Feature Flags & Toggles
 *
 * GOOGLE_SIGNIN_ENABLED:
 * Temporarily disabled because Google OAuth production verification was rejected
 * due to unowned Vercel domain (codersclubku.vercel.app).
 *
 * To re-enable Google Sign-In after acquiring a custom domain:
 * 1. Complete domain verification and Google Cloud OAuth verification for the custom domain.
 * 2. Update Supabase Redirect URLs with the new custom domain callback URL.
 * 3. Set GOOGLE_SIGNIN_ENABLED to true in this file.
 */
export const GOOGLE_SIGNIN_ENABLED = false;

