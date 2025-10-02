// src/app/page.tsx
import React from "react";
import {
    Bot,
    Video,
    FileText,
    Calendar,
    ArrowRight,
    Github,
    BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const Page = async () => {
    
    const features = [
        {
            icon: <Bot className="w-8 h-8" />,
            title: "AI-Powered Agents",
            description:
                "Create intelligent assistants that understand context and provide valuable insights during meetings.",
        },
        {
            icon: <Video className="w-8 h-8" />,
            title: "Real-Time Video Calls",
            description:
                "Seamless video conferencing with integrated AI assistance for better collaboration.",
        },
        {
            icon: <FileText className="w-8 h-8" />,
            title: "Automated Summaries",
            description:
                "Get comprehensive meeting summaries, action items, and key takeaways automatically.",
        },
        {
            icon: <Calendar className="w-8 h-8" />,
            title: "Meeting Management",
            description:
                "Schedule, organize, and manage all your meetings in one centralized platform.",
        },
    ];

    const steps = [
        {
            number: "01",
            title: "Create Your Agent",
            description:
                "Set up your AI assistant with custom instructions and preferences tailored to your needs.",
        },
        {
            number: "02",
            title: "Schedule Meeting",
            description:
                "Plan your meetings and invite participants with automatic calendar integration.",
        },
        {
            number: "03",
            title: "Join the Call",
            description:
                "Start your video call with your AI assistant ready to help and take notes.",
        },
        {
            number: "04",
            title: "Get Summary",
            description:
                "Receive detailed summaries, transcripts, and action items right after the meeting.",
        },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md border-b border-border z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                            <Bot className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-2xl font-bold text-foreground">
                            SMTG
                        </span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <Link
                            href="#features"
                            className="text-muted-foreground hover:text-foreground transition"
                        >
                            Features
                        </Link>
                        <Link
                            href="#how-it-works"
                            className="text-muted-foreground hover:text-foreground transition"
                        >
                            How it Works
                        </Link>
                        <Link href="/sign-in">
                            <Button
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary/10"
                            >
                                Sign In
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-sidebar via-sidebar-accent to-sidebar">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-block mb-4 px-4 py-2 bg-primary/20 rounded-full border border-primary/30">
                        <span className="text-primary-foreground text-sm font-medium">
                            AI-Powered Meeting Assistant
                        </span>
                    </div>
                    <h1 className="text-6xl md:text-7xl font-bold text-sidebar-foreground mb-6 leading-tight">
                        Transform Your Meetings
                        <br />
                        with AI-Powered Assistants
                    </h1>
                    <p className="text-xl text-sidebar-accent-foreground/90 mb-10 max-w-2xl mx-auto">
                        Experience seamless collaboration with intelligent AI
                        agents that join your meetings, take notes, and provide
                        actionable insights.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/sign-up">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg"
                            >
                                Get Started{" "}
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Button
                            size="lg"
                            variant="outline"
                            className="border-primary/40 text-sidebar-foreground hover:bg-sidebar-accent/50 px-8 py-6 text-lg"
                        >
                            Watch Demo
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-6 bg-muted">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            Powerful Features for Modern Teams
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Everything you need to run productive meetings with
                            AI assistance
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, idx) => (
                            <Card
                                key={idx}
                                className="border-border shadow-lg hover:shadow-xl transition-shadow"
                            >
                                <CardContent className="p-6">
                                    <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-20 px-6 bg-background">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                            Get started in minutes with our simple four-step
                            process
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {steps.map((step, idx) => (
                            <div key={idx} className="relative">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4 text-primary-foreground text-2xl font-bold shadow-lg">
                                        {step.number}
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {step.description}
                                    </p>
                                </div>
                                {idx < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/30 to-transparent"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-sidebar text-sidebar-foreground py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <span className="text-xl font-bold text-sidebar-foreground">
                                    SMTG
                                </span>
                            </div>
                            <p className="text-sm text-sidebar-accent-foreground/80">
                                AI-powered meeting assistant for modern teams
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sidebar-foreground mb-4">
                                Product
                            </h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link
                                        href="#features"
                                        className="hover:text-primary transition"
                                    >
                                        Features
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#how-it-works"
                                        className="hover:text-primary transition"
                                    >
                                        How it Works
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition"
                                    >
                                        Pricing
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sidebar-foreground mb-4">
                                Resources
                            </h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition flex items-center gap-2"
                                    >
                                        <BookOpen className="w-4 h-4" />{" "}
                                        Documentation
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition flex items-center gap-2"
                                    >
                                        <Github className="w-4 h-4" /> GitHub
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition"
                                    >
                                        API Reference
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sidebar-foreground mb-4">
                                Company
                            </h4>
                            <ul className="space-y-2 text-sm">
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition"
                                    >
                                        About
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition"
                                    >
                                        Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="#"
                                        className="hover:text-primary transition"
                                    >
                                        Contact
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-border/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-sidebar-accent-foreground/60">
                            ©️ 2025 SMTG. All rights reserved.
                        </p>
                        <div className="flex gap-6">
                            <Link
                                href="#"
                                className="hover:text-primary transition text-sm"
                            >
                                Privacy Policy
                            </Link>
                            <Link
                                href="#"
                                className="hover:text-primary transition text-sm"
                            >
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Page;
