"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Mail, X, Calendar, Clock } from "lucide-react";

const formSchema = z.object({
    recipientEmail: z.string(),
    scheduledDate: z.string().min(1, { message: "Date is required" }),
    scheduledTime: z.string().min(1, { message: "Time is required" }),
    message: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SendInvitationDialogProps {
    meetingId: string;
    meetingName: string;
    children?: React.ReactNode;
}

export function SendInvitationDialog({
    meetingId,
    meetingName,
    children,
}: SendInvitationDialogProps) {
    const [open, setOpen] = useState(false);
    const [recipientEmails, setRecipientEmails] = useState<string[]>([]);
    const trpc = useTRPC();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            recipientEmail: "",
            scheduledDate: "",
            scheduledTime: "",
            message: "",
        },
    });

    const sendInvitation = useMutation(
        trpc.meetings.sendInvitation.mutationOptions({
            onSuccess: () => {
                toast.success("Meeting invitations sent successfully!");
                setOpen(false);
                form.reset();
                setRecipientEmails([]);
            },
            onError: (error) => {
                toast.error(error.message || "Failed to send invitations");
            },
        })
    );

    const addEmail = () => {
        const email = form.getValues("recipientEmail");

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            form.setError("recipientEmail", {
                message: "Please enter a valid email address",
            });
            return;
        }

        // Check for duplicates
        if (recipientEmails.includes(email)) {
            form.setError("recipientEmail", {
                message: "This email has already been added",
            });
            return;
        }

        setRecipientEmails([...recipientEmails, email]);
        form.setValue("recipientEmail", "");
        form.clearErrors("recipientEmail");
    };

    const removeEmail = (emailToRemove: string) => {
        setRecipientEmails(
            recipientEmails.filter((email) => email !== emailToRemove)
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addEmail();
        }
    };

    const onSubmit = (data: FormValues) => {
        if (recipientEmails.length === 0) {
            toast.error("Please add at least one recipient email");
            return;
        }

        sendInvitation.mutate({
            meetingId,
            recipientEmails,
            scheduledDate: data.scheduledDate,
            scheduledTime: data.scheduledTime,
            message: data.message,
        });
    };

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split("T")[0];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Send Meeting Invitation</DialogTitle>
                    <DialogDescription>
                        Invite participants to <strong>{meetingName}</strong>.
                        They&apos;ll receive an email with the meeting link and
                        calendar invite.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-6"
                    >
                        {/* Recipient Emails */}
                        <FormField
                            control={form.control}
                            name="recipientEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Recipient Emails</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input
                                                placeholder="Enter email address"
                                                {...field}
                                                onKeyDown={handleKeyDown}
                                            />
                                        </FormControl>
                                        <Button
                                            type="button"
                                            onClick={addEmail}
                                            variant="secondary"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    <FormDescription>
                                        Press Enter or click Add to include each
                                        email
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Display added emails */}
                        {recipientEmails.length > 0 && (
                            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                                {recipientEmails.map((email) => (
                                    <Badge
                                        key={email}
                                        variant="secondary"
                                        className="pl-3 pr-1 py-1"
                                    >
                                        {email}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0 ml-2 hover:bg-destructive/20"
                                            onClick={() => removeEmail(email)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Date and Time Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="scheduledDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <Calendar className="h-4 w-4 inline mr-2" />
                                            Date
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="date"
                                                min={today}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="scheduledTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <Clock className="h-4 w-4 inline mr-2" />
                                            Time
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Optional Message */}
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Add a personal message to the invitation..."
                                            className="resize-none"
                                            rows={4}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This message will be included in the
                                        invitation email
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <p className="text-sm text-blue-900">
                                <strong>Note:</strong> You can start the meeting
                                at any time. The scheduled date and time is only
                                a reference for participants to know when to
                                join.
                            </p>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={sendInvitation.isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    sendInvitation.isPending ||
                                    recipientEmails.length === 0
                                }
                            >
                                {sendInvitation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {sendInvitation.isPending
                                    ? "Sending..."
                                    : "Send Invitations"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
