// WorkOS AuthKit session access tokens are signed JWTs whose `iss` claim has
// the form: https://api.workos.com/user_management/<client_id>
// This issuer is fixed per WorkOS environment and is NOT necessarily the same
// as the OAuth WORKOS_CLIENT_ID used to initiate login. These tokens do not
// include an `aud` claim, so we must rely on the (unique) issuer for matching
// and omit applicationID.
const jwtIssuer = (process.env.WORKOS_JWT_ISSUER ?? "").replace(/\/$/, "");

// All clients within a WorkOS environment share the same signing key, served
// at https://api.workos.com/sso/jwks/<client_id>. Derive it from the issuer.
const issuerClientId = jwtIssuer.split("/").pop() ?? "";

const authConfig = {
  providers:
    jwtIssuer && issuerClientId
      ? [
          {
            type: "customJwt" as const,
            issuer: jwtIssuer,
            algorithm: "RS256" as const,
            jwks: `https://api.workos.com/sso/jwks/${issuerClientId}`,
          },
        ]
      : [],
};

export default authConfig;
