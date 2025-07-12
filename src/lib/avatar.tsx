import { createAvatar } from "@dicebear/core";
import { botttsNeutral, initials }  from "@dicebear/collection"; 


interface Props {
    seed: string;
    variant: "initials" | "botttsNeutral";
}

export const generateAvatarUri = ({ seed, variant }: Props) => {
    if (variant === "botttsNeutral") {
        return createAvatar(botttsNeutral, {
            seed,
        }).toDataUri();
    }
    return createAvatar(initials, {
        seed,
        fontWeight: 500,
        fontSize: 42,
    }).toDataUri();
};