// The landing page is still a placeholder, so it only shows in local dev.
// Set VITE_SHOW_LANDING=true to opt back in once it's real (in any env).
//
// Lives in its own module because both the router guards and main.tsx need it,
// and main.tsx must be able to read it without pulling anything heavier in.
export const SHOW_LANDING =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_LANDING === 'true'
