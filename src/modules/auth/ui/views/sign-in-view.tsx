"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { OctagonAlertIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FaGithub, FaGoogle } from "react-icons/fa";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, { message: "Password is required" }),
});

export const SignInView = () => {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);
    const [verificationNeeded, setVerificationNeeded] = useState(false);
    const [verificationSent, setVerificationSent] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (data: z.infer<typeof formSchema>) => {
        setError(null);
        setVerificationNeeded(false);
        setVerificationSent(false);
        setPending(true);

        authClient.signIn.email(
            {
                email: data.email,
                password: data.password,
                callbackURL: "/",
            },
            {
                onSuccess: () => {
                    setPending(false);
                    router.push("/");
                },
                onError: ({ error }) => {
                    setPending(false);
                    if (error.status === 403) {
                        setVerificationNeeded(true);
                        setError(
                            "Please verify your email address. Check your inbox for a verification link."
                        );
                    } else {
                        setError(error.message);
                    }
                },
            }
        );
    };

    const handleResendVerification = async () => {
        const email = form.getValues("email");
        if (!email) {
            setError("Please enter your email address");
            return;
        }

        setPending(true);
        setVerificationSent(false);
        try {
            await authClient.sendVerificationEmail({
                email,
                callbackURL: "/",
            });
            setVerificationNeeded(false);
            setVerificationSent(true);
            setError(null);
        } catch {
            setError("Failed to send verification email. Please try again.");
            setVerificationNeeded(true);
        } finally {
            setPending(false);
        }
    };

    const onSocial = (provider: "google" | "github") => {
        setError(null);
        setPending(true);

        authClient.signIn.social(
            {
                provider: provider,
                callbackURL: "/",
            },
            {
                onSuccess: () => {
                    setPending(false);
                },
                onError: ({ error }) => {
                    setPending(false);
                    setError(error.message);
                },
            }
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="p-6 md:p-8"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col items-center text-center">
                                    <h1 className="text-2xl font-bold">
                                        Welcome back
                                    </h1>
                                    <p className="text-muted-foreground text-balance">
                                        Login to your account
                                    </p>
                                </div>
                                <div className="grid gap-3">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="email"
                                                        placeholder="smtg@email.com"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="password"
                                                        placeholder="smtg"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                {verificationSent && (
                                    <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                                        <OctagonAlertIcon className="h-4 w-4 text-green-600 dark:text-green-500" />
                                        <AlertTitle className="text-green-900 dark:text-green-400">
                                            Verification Email Sent!
                                        </AlertTitle>
                                        <AlertDescription className="text-green-800 dark:text-green-300">
                                            Please check your inbox and spam
                                            folder for the verification link.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                {!!error && (
                                    <Alert
                                        className={
                                            verificationNeeded
                                                ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900"
                                                : "bg-destructive/10 border-destructive/20"
                                        }
                                    >
                                        <OctagonAlertIcon
                                            className={
                                                verificationNeeded
                                                    ? "h-4 w-4 text-amber-600 dark:text-amber-500"
                                                    : "h-4 w-4 text-destructive"
                                            }
                                        />
                                        <AlertTitle
                                            className={
                                                verificationNeeded
                                                    ? "text-amber-900 dark:text-amber-400"
                                                    : "text-destructive"
                                            }
                                        >
                                            {verificationNeeded
                                                ? "Email Verification Required"
                                                : "Error"}
                                        </AlertTitle>
                                        <AlertDescription
                                            className={
                                                verificationNeeded
                                                    ? "text-amber-800 dark:text-amber-300"
                                                    : "text-destructive"
                                            }
                                        >
                                            {error}
                                            {verificationNeeded && (
                                                <div className="mt-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950"
                                                        onClick={
                                                            handleResendVerification
                                                        }
                                                        disabled={pending}
                                                    >
                                                        Resend Verification
                                                        Email
                                                    </Button>
                                                </div>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <Button
                                    disabled={pending}
                                    type="submit"
                                    className="w-full"
                                >
                                    Login
                                </Button>
                                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                                    <span className="bg-card text-muted-foreground relative z-10 px-4">
                                        Or continue with
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Button
                                        disabled={pending}
                                        onClick={() => {
                                            onSocial("google");
                                        }}
                                        variant="outline"
                                        type="button"
                                        className="w-full"
                                    >
                                        Google
                                        <FaGoogle />
                                    </Button>
                                    <Button
                                        disabled={pending}
                                        onClick={() => {
                                            onSocial("github");
                                        }}
                                        variant="outline"
                                        type="button"
                                        className="w-full"
                                    >
                                        Github
                                        <FaGithub />
                                    </Button>
                                </div>
                                <div className="text-center text-sm">
                                    Don&apos;t have an account?{" "}
                                    <Link
                                        href="/sign-up"
                                        className="underline underline-offset-5"
                                    >
                                        Sign Up
                                    </Link>
                                </div>
                                <div className="text-center text-sm">
                                    Need to verify your email?{" "}
                                    <Link
                                        href="/resend-verification"
                                        className="underline underline-offset-5"
                                    >
                                        Resend Verification
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </Form>

                    <div className="bg-radial from-sidebar-accent to-sidebar relative md:flex flex-col gap-y-4 items-center justify-center">
                        <Image
                            width={190}
                            height={110}
                            src="/logo1.png"
                            alt="image"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
