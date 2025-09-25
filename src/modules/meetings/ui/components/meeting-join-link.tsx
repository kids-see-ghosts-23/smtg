"use client";

import { Button } from "@/components/ui/button";
import { CopyIcon, LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface Props {
  meetingId: string;
}

export const MeetingJoinLink = ({ meetingId }: Props) => {
  const joinLink = `${window.location.origin}/join/${meetingId}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinLink);
    toast.success("Join link copied to clipboard");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-medium">Meeting Join Link</div>
      <div className="flex flex-wrap gap-2 w-full">
        <div className="flex-1 min-w-0 bg-muted rounded-md px-3 py-2 text-sm flex items-center gap-2 overflow-x-auto">
          <LinkIcon className="size-4 shrink-0" />
          <span className="truncate">{joinLink}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={copyToClipboard}
          className="shrink-0"
        >
          <CopyIcon className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Share this link with others to allow them to join the meeting
      </p>
    </div>
  );
};