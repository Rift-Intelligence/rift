jest.mock("@e2b/code-interpreter", () => ({
  Sandbox: class MockSandbox {},
}));

import {
  getConnectionIdFromPresenceClient,
  presenceHasConnectionId,
} from "@/lib/centrifugo/presence";

describe("presenceHasConnectionId", () => {
  it("ignores the backend probe subscriber when it has no connection info", () => {
    expect(
      presenceHasConnectionId(
        {
          clients: {
            "probe-client": {
              client: "probe-client",
              user: "user-1",
            },
          },
        },
        "conn-stale",
      ),
    ).toBe(false);
  });

  it("matches the local sandbox connection from Centrifugo connInfo", () => {
    expect(
      presenceHasConnectionId(
        {
          clients: {
            "probe-client": {
              client: "probe-client",
              user: "user-1",
            },
            "sandbox-client": {
              client: "sandbox-client",
              user: "user-1",
              connInfo: { connectionId: "conn-live" },
            },
          },
        },
        "conn-live",
      ),
    ).toBe(true);
  });

  it("supports legacy presence info field names", () => {
    expect(
      getConnectionIdFromPresenceClient({
        info: { connectionId: "conn-legacy" },
      }),
    ).toBe("conn-legacy");
  });
});
