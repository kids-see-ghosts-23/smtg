"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, OctagonAlert } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
});

export default function ResendVerificationPage() {
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [message, setMessage] = useState<string>("");
    const [pending, setPending] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setStatus("idle");
        setMessage("");
        setPending(true);

        try {
            await authClient.sendVerificationEmail({
                email: data.email,
                callbackURL: "/",
            });

            setStatus("success");
            setMessage(
                "Verification email sent! Please check your inbox and spam folder."
            );
            form.reset();
        } catch (error) {
            setStatus("error");
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to send verification email. Please try again."
            );
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <div className="flex flex-col items-center space-y-2">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-center text-2xl">
                            Resend Verification Email
                        </CardTitle>
                        <p className="text-sm text-muted-foreground text-center">
                            Enter your email address and we&apos;ll send you a
                            new verification link
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="your@email.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {status === "success" && (
                                <Alert className="bg-green-50 border-green-200">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertTitle className="text-green-800">
                                        Email Sent!
                                    </AlertTitle>
                                    <AlertDescription className="text-green-700">
                                        {message}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {status === "error" && (
                                <Alert className="bg-destructive/10 border-none">
                                    <OctagonAlert className="h-4 w-4 text-destructive" />
                                    <AlertTitle className="text-destructive">
                                        Error
                                    </AlertTitle>
                                    <AlertDescription className="text-destructive">
                                        {message}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={pending}
                            >
                                {pending
                                    ? "Sending..."
                                    : "Send Verification Email"}
                            </Button>
                        </form>
                    </Form>

                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Already verified?{" "}
                            <Link
                                href="/sign-in"
                                className="text-primary hover:underline"
                            >
                                Sign In
                            </Link>
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/sign-up"
                                className="text-primary hover:underline"
                            >
                                Sign Up
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
