"use client";

import { ErrorState } from "@/components/error-state";
import { EmptyState } from "@/components/empty-state";
import { LoadingState } from "@/components/loading-state";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useAgentsFilters } from "../../hooks/use-agents-filters";
import { DataPagination } from "../components/data-pagination";
import { useRouter } from "next/navigation";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { VideoIcon } from "lucide-react";

export const AgentsView = () => {
    const router = useRouter();

    const [filters, setFilters] = useAgentsFilters();

    const trpc = useTRPC();
    const { data } = useSuspenseQuery(
        trpc.agents.getMany.queryOptions({
            ...filters,
        })
    );

    return (
        <div className="flex-1 px-4 pb-4 md:px-8 flex flex-col gap-y-4">
            {data.items.length === 0 ? (
                <EmptyState
                    title="Create your first agent"
                    description="Create an agent to join your meetings. Each agent will follow your instructions and can interact with participants during the call."
                />
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {data.items.map((agent) => (
                            <Card
                                key={agent.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() =>
                                    router.push(`/agents/${agent.id}`)
                                }
                            >
                                <CardHeader className="space-y-2">
                                    <div className="flex items-start gap-x-3 h-[3.5rem]">
                                        <GeneratedAvatar
                                            seed={agent.name}
                                            variant="botttsNeutral"
                                            className="size-10 flex-shrink-0"
                                        />
                                        <CardTitle className="capitalize text-lg line-clamp-2">
                                            {agent.name}
                                        </CardTitle>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className="flex items-center gap-x-2 w-fit [&>svg]:size-4"
                                    >
                                        <VideoIcon className="text-blue-700" />
                                        {agent.meetingCount}{" "}
                                        {agent.meetingCount === 1
                                            ? "meeting"
                                            : "meetings"}
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="capitalize line-clamp-3">
                                        {agent.instructions}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    <DataPagination
                        page={filters.page}
                        totalPages={data.totalPages}
                        onPageChange={(page) => setFilters({ page })}
                    />
                </>
            )}
        </div>
    );
};

export const AgentsViewLoading = () => {
    return (
        <LoadingState
            title="Loading agents"
            description="This may take a few seconds"
        />
    );
};

export const AgentsViewError = () => {
    return (
        <ErrorState
            title="Error loading agents"
            description="Something went wrong"
        />
    );
};
