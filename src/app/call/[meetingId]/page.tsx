import { auth } from "@/lib/auth";
import { CallView } from "@/modules/call/ui/views/call-view";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

interface Props {
    params: Promise<{
        meetingId: string;
    }>;
}

const Page = async ({ params }: Props) => {
    const { meetingId } = await params;

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
        trpc.meetings.getOne.queryOptions({ id: meetingId })
    );

    return (
        <>
            {/* must wrap in hydration boundary for prefetching to work */}
            <HydrationBoundary state={dehydrate(queryClient)}>
                {/* <Suspense fallback={<MeetingIdViewLoading />}>
                    <ErrorBoundary fallback={<MeetingIdViewError />}>
                        <MeetingIdView meetingId={meetingId} />
                    </ErrorBoundary>
                </Suspense> */}

                <CallView meetingId={meetingId} />
            </HydrationBoundary>
        </>
    );
};

export default Page;
