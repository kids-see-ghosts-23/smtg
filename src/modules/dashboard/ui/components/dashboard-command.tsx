import {
    CommandDialog,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Dispatch, SetStateAction } from "react";

interface Props {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Find agent or meeting" />
            <CommandList>
                <CommandItem>Test</CommandItem>
            </CommandList>
        </CommandDialog>
    );
};
