import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAgentsFilters } from "../../hooks/use-agents-filters";

export const AgentsSearchFilter = () => {
    const [filters, setFilters] = useAgentsFilters();
    return (
        <div className="relative">
            <Input
                placeholder="filter by name"
                className="h-9 bg-white w-[200px] pl-7"
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
            />
            <SearchIcon className="size-4 -translate-y-1/2 absolute top-1/2 left-2 text-muted-foreground" />
        </div>
    );
};
