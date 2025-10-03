import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { VideoIcon, MailIcon } from "lucide-react";
import Link from "next/link";
import { SendInvitationDialog } from "@/components/send-invitation-dialog";

interface Props {
    meetingId: string;
    meetingName: string;
}

export const UpcomingState = ({
    meetingId,
    meetingName,
}: Props) => {
    return (
        <div className="bg-white rounded-lg px-4 py-5 flex flex-col gap-y-8 items-center justify-center">
            <EmptyState
                image="/upcoming.svg"
                title="Not started yet"
                description="Once you started this meeting, summary will appear here"
            />
            <div className="flex flex-col-reverse lg:flex-row lg:justify-center items-center gap-2 w-full">
                <SendInvitationDialog
                    meetingId={meetingId}
                    meetingName={meetingName}
                >
                    <Button
                        variant="outline"
                        className="w-full lg:w-auto"
                    >
                        <MailIcon />
                        Send Invitation
                    </Button>
                </SendInvitationDialog>
                
                <Button
                    asChild
                    className="w-full lg:w-auto "
                >
                    <Link href={`/call/${meetingId}`}>
                        <VideoIcon />
                        start meeting
                    </Link>
                </Button>
            </div>
        </div>
    );
};
