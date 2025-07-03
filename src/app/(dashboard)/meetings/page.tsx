import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

import { MeetingsListHeader } from "@/modules/meetings/ui/components/meetings-list-header";
import {
    MeetingsView,
    MeetingsViewError,
    MeetingsViewLoading,
} from "@/modules/meetings/ui/views/meetings-view";

import { loadSearchParams } from "@/modules/meetings/params";
import type { SearchParams } from "nuqs/server";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
    searchParams: Promise<SearchParams>;
}

const Page = async ({ searchParams }: Props) => {
    const filters = await loadSearchParams(searchParams);

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    const queryClient = getQueryClient();
    void queryClient.prefetchQuery(
        trpc.meetings.getMany.queryOptions({ ...filters })
    );

    return (
        <>
            {/* must wrap in hydration boundary for prefetching to work */}
            <MeetingsListHeader />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<MeetingsViewLoading />}>
                    <ErrorBoundary fallback={<MeetingsViewError />}>
                        <MeetingsView />
                    </ErrorBoundary>
                </Suspense>
            </HydrationBoundary>
        </>
    );
};

export default Page;

// n2ivN1fHHmnkkesKC7GAJVMBdwOBZMTe // yokoso
// 7o_FipdfVlBgixo-Rmxcw
