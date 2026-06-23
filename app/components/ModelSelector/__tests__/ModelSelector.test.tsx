import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, jest } from "@jest/globals";

const { ModelSelector } = jest.requireActual<
  typeof import("../../ModelSelector")
>("../../ModelSelector");

describe("ModelSelector (single-model)", () => {
  it("renders a static, non-interactive model badge with no tier choices", () => {
    render(<ModelSelector value="auto" onChange={jest.fn()} mode="agent" />);

    // Single-model product: shows one static label, no dropdown/options.
    expect(screen.getByText("RIFT")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/Recon|Strike|Dominate/)).not.toBeInTheDocument();
  });
});
