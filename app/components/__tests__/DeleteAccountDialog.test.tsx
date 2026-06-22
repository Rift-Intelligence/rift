import "@testing-library/jest-dom";
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import DeleteAccountDialog from "../DeleteAccountDialog";
// The manual convex/react mock (via moduleNameMapper) exposes injectable
// auth helpers; drive the real Convex Auth-backed useAuth shim through them.
import { __setAuthState, __setViewer, __resetAuth } from "convex/react";

const ACCOUNT_EMAIL = "signin.rift.co.harmonize442@passmail.net";

jest.mock("@/convex/_generated/api", () => ({
  api: {
    userDeletion: {
      deleteAllUserData: "userDeletion.deleteAllUserData",
    },
  },
}));

jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}));

describe("DeleteAccountDialog", () => {
  const mockUser = { email: ACCOUNT_EMAIL };

  const renderDialog = () =>
    render(<DeleteAccountDialog open={true} onOpenChange={jest.fn()} />);

  const renderControlledDialog = (open: boolean) =>
    render(<DeleteAccountDialog open={open} onOpenChange={jest.fn()} />);

  beforeEach(() => {
    __setAuthState({ isLoading: false, isAuthenticated: true });
    __setViewer({
      _id: "user_1",
      email: ACCOUNT_EMAIL,
      name: null,
      image: null,
    });
  });

  afterEach(() => {
    __resetAuth();
  });

  it("keeps the delete button visible but disabled before confirmation", () => {
    renderDialog();

    expect(screen.getByTestId("delete-button")).toBeDisabled();
    expect(screen.getByTestId("delete-account-description")).toHaveClass(
      "pt-2",
    );
    expect(screen.getByTestId("delete-account-footer")).toHaveClass("pt-4");
  });

  it("shows the email in the input placeholder without filling it", () => {
    renderDialog();

    const emailInput = screen.getByTestId(
      "email-confirmation",
    ) as HTMLInputElement;

    expect(emailInput.value).toBe("");
    expect(emailInput.placeholder).toBe(mockUser.email);
  });

  it("enables account deletion only after email and phrase both match", () => {
    renderDialog();

    const deleteButton = screen.getByTestId("delete-button");
    fireEvent.change(screen.getByTestId("delete-phrase-input"), {
      target: { value: "DELETE" },
    });

    expect(deleteButton).toBeDisabled();

    fireEvent.change(screen.getByTestId("email-confirmation"), {
      target: { value: mockUser.email },
    });

    expect(deleteButton).toBeEnabled();
  });

  it("resets confirmations after the dialog closes", () => {
    const { rerender } = renderControlledDialog(true);

    fireEvent.change(screen.getByTestId("delete-phrase-input"), {
      target: { value: "DELETE" },
    });
    fireEvent.change(screen.getByTestId("email-confirmation"), {
      target: { value: mockUser.email },
    });

    expect(screen.getByTestId("delete-button")).toBeEnabled();

    rerender(<DeleteAccountDialog open={false} onOpenChange={jest.fn()} />);
    rerender(<DeleteAccountDialog open={true} onOpenChange={jest.fn()} />);

    expect(screen.getByTestId("delete-button")).toBeDisabled();
    expect(
      (screen.getByTestId("email-confirmation") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (screen.getByTestId("delete-phrase-input") as HTMLInputElement).value,
    ).toBe("");
  });
});
