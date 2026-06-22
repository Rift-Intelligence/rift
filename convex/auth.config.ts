// Convex Auth validates its own JWTs, signed with JWT_PRIVATE_KEY and served
// from this deployment's well-known JWKS endpoint (CONVEX_SITE_URL).
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
