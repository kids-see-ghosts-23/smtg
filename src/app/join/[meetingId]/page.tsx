"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { createGuestUserAndToken } from "./actions";

interface Props {
  params: Promise<{
    meetingId: string;
  }>;
}

export default function JoinMeetingPage({ params }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [meetingName, setMeetingName] = useState("");
  const unwrappedParams = use(params);

  useEffect(() => {
    const fetchMeetingDetails = async () => {
      try {
        const response = await fetch(`/api/meetings/${unwrappedParams.meetingId}`);
        if (response.ok) {
          const data = await response.json();
          setMeetingName(data.name || "Meeting");
        }
      } catch (err) {
        console.error("Failed to fetch meeting details:", err);
        setMeetingName("Meeting");
      }
    };

    fetchMeetingDetails();
  }, [unwrappedParams.meetingId]);

  const handleJoin = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await createGuestUserAndToken(name.trim());
      
      if (!result.success) {
        throw new Error(result.error);
      }
      localStorage.setItem(`guestUser_${unwrappedParams.meetingId}`, JSON.stringify({
        id: result.userId,
        name: name.trim(),
        token: result.token,
        meetingId: unwrappedParams.meetingId,
      }));
      router.push(`/call/${unwrappedParams.meetingId}`);
    } catch (err) {
      console.error("Failed to join meeting:", err);
      setError("Failed to join meeting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sidebar-accent to-sidebar p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Join {meetingName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name"
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          
          <Button 
            className="w-full" 
            onClick={handleJoin} 
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              "Join Meeting"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}