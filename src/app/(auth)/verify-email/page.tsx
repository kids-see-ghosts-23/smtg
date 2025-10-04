"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">(
        "loading"
    );
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token");

            if (!token) {
                setStatus("error");
                setMessage("Invalid verification link. No token provided.");
                return;
            }

            try {
                await authClient.verifyEmail({
                    query: {
                        token,
                    },
                });

                setStatus("success");
                setMessage(
                    "Your email has been verified successfully! You can now sign in to your account."
                );

                // Redirect to sign-in page after 3 seconds
                setTimeout(() => {
                    router.push("/sign-in");
                }, 3000);
            } catch (error) {
                setStatus("error");
                setMessage(
                    error instanceof Error
                        ? error.message
                        : "Failed to verify email. The link may have expired or is invalid."
                );
            }
        };

        verifyEmail();
    }, [searchParams, router]);

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl">
                        Email Verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        {status === "loading" && (
                            <>
                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                <p className="text-center text-muted-foreground">
                                    Verifying your email address...
                                </p>
                            </>
                        )}

                        {status === "success" && (
                            <>
                                <CheckCircle2 className="h-16 w-16 text-green-600" />
                                <div className="space-y-2 text-center">
                                    <p className="font-semibold text-green-700">
                                        Email Verified!
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {message}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Redirecting to sign in page...
                                    </p>
                                </div>
                            </>
                        )}

                        {status === "error" && (
                            <>
                                <XCircle className="h-16 w-16 text-destructive" />
                                <div className="space-y-4 text-center">
                                    <p className="font-semibold text-destructive">
                                        Verification Failed
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {message}
                                    </p>
                                    <div className="flex flex-col gap-2">
                                        <Button asChild variant="default">
                                            <Link href="/sign-in">
                                                Go to Sign In
                                            </Link>
                                        </Button>
                                        <Button asChild variant="outline">
                                            <Link href="/sign-up">
                                                Create New Account
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle className="text-center text-2xl">
                                Email Verification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                                <p className="text-center text-muted-foreground">
                                    Loading...
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <VerifyEmailContent />
        </Suspense>
    );
}
