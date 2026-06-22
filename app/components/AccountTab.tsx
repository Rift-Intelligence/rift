"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/hooks/useAuth";
import DeleteAccountDialog from "./DeleteAccountDialog";

const AccountTab = () => {
  const { user } = useAuth();
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  return (
    <div className="space-y-6 min-h-0">
      {user?.email && (
        <div className="border-b pb-4">
          <div className="font-medium">Email</div>
          <div className="text-sm text-muted-foreground mt-1">{user.email}</div>
        </div>
      )}

      {/* Delete Account Section */}
      <div>
        <div className="flex items-center justify-between py-3">
          <div>
            <div className="font-medium">Delete account</div>
          </div>
          <Button
            type="button"
            data-testid="delete-account-button"
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteAccount(true)}
            aria-label="Delete account"
          >
            Delete
          </Button>
        </div>
      </div>

      <DeleteAccountDialog
        open={showDeleteAccount}
        onOpenChange={setShowDeleteAccount}
      />
    </div>
  );
};

export { AccountTab };
