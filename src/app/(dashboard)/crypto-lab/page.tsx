import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { CryptoLabView } from "@/modules/security/ui/views/crypto-lab-view";

const Page = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/sign-in");
    }

    return <CryptoLabView />;
};

export default Page;