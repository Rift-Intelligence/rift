// Manual mock for the ESM-only @convex-dev/auth/react entry so Jest (which
// doesn't transpile it) can load component graphs that use Convex Auth actions.
const signIn = jest.fn();
const signOut = jest.fn();

export const useAuthActions = () => ({ signIn, signOut });
