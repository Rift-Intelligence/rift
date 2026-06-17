import { Button } from "@/components/ui/button";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Paperclip } from "lucide-react";

interface AttachmentButtonProps {
  onAttachClick: () => void;
  disabled?: boolean;
}

export const AttachmentButton = ({
  onAttachClick,
  disabled = false,
}: AttachmentButtonProps) => {
  // File / image attachments are available to everyone — no plan gate.
  return (
    <TooltipPrimitive.Root>
      <TooltipTrigger asChild>
        <Button
          type="button"
          onClick={onAttachClick}
          variant="ghost"
          size="icon"
          className="h-6 w-6 min-w-0 rounded-md p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Attach files"
          data-testid="attach-files-button"
          disabled={disabled}
        >
          <Paperclip className="w-[15px] h-[15px]" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Add files or images</p>
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
};
