import React, { ReactNode } from "react";
import { GlobalStateProvider } from "@/app/contexts/GlobalState";
import { InputProvider } from "@/app/contexts/InputContext";
import { DataStreamProvider } from "./DataStreamProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Test wrapper with all required providers for component testing
 */
export const TestWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <GlobalStateProvider>
      <InputProvider>
        <DataStreamProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </DataStreamProvider>
      </InputProvider>
    </GlobalStateProvider>
  );
};
