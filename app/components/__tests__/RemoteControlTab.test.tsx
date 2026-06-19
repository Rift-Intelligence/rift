import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, jest } from "@jest/globals";

jest.mock("convex/react", () => ({
  useQuery: jest.fn(() => []),
  useMutation: jest.fn(() => jest.fn()),
}));

jest.mock("@/app/contexts/GlobalState", () => ({
  useGlobalState: () => ({
    chatMode: "ask",
    setChatMode: jest.fn(),
    subscription: "free",
    sandboxPreference: "e2b",
    setSandboxPreference: jest.fn(),
    selectedModel: "auto",
    setSelectedModel: jest.fn(),
    temporaryChatsEnabled: false,
  }),
}));

const { RemoteControlTab } = jest.requireActual<
  typeof import("../RemoteControlTab")
>("../RemoteControlTab");

describe("RemoteControlTab", () => {
  it("shows unavailable message since local sandbox is disabled", () => {
    render(<RemoteControlTab />);
    expect(
      screen.getByText("Remote sandbox connections are not available."),
    ).toBeInTheDocument();
  });
});
