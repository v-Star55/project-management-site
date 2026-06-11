"use client"

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight, ArrowLeft, Building, CheckCircle2 } from "lucide-react";
import {useMutation} from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";


interface workspace{
    name:string;
    description:string;
    imageUrl:string;
    userId:string;
}




export default function OnBoarding() {
    const user = useSelector((state: any) => state.user.user);
    const userId = user?.id;
    const router = useRouter();
    const [showform, setShowform] = useState(false);
    const [workspace, setWorkspace] = useState({
        name: "",
        description: "",
        imageUrl: "",
        userId
    });

    const handleGetStarted = () => {
        setShowform(true);
    }

    const handleBack = () => {
        setShowform(false);
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setWorkspace(prevWorkspace => ({
            ...prevWorkspace,
            [name]: value
        }));
    }

    const createWorkspaceMutation = useMutation({
        mutationFn: async (workspaceData: workspace) => {
            workspaceData.userId = userId;
            const response = await axios.post("/api/workspace/create", workspaceData);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Workspace created successfully");
            router.refresh();
            setWorkspace({
                name: "",
                description: "",
                imageUrl: "",
                userId:""
            })
        },
        onError: () => {
            toast.error("Failed to create workspace");
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createWorkspaceMutation.mutate(workspace);
    }

    return (
        <div className="relative w-full max-w-md mx-auto transition-all duration-300">
            {/* Ambient Background Glow */}
            <div className="absolute -inset-1 rounded-5xl bg-gradient-to-r from-emerald-500/20 to-blue-500/20 blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            
            <Card className="relative bg-card/60 backdrop-blur-xl border border-border/40 shadow-2xl overflow-hidden rounded-4xl">
                {showform ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <CardHeader className="pt-8 pb-4 relative">
                            <button 
                                onClick={handleBack}
                                className="absolute left-6 top-8 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="text-center">
                                <CardTitle className="text-2xl font-bold tracking-tight">
                                    Configure Workspace
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground mt-2">
                                    Set up the identity and logo for your new team space.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="py-4 space-y-4">
                                <FieldGroup className="space-y-4">
                                    <Field>
                                        <FieldLabel className="text-sm font-semibold text-foreground/90">Workspace Name</FieldLabel>
                                        <Input 
                                            value={workspace.name} 
                                            onChange={handleChange} 
                                            type="text" 
                                            placeholder="e.g. Acme Corporation" 
                                            name="name" 
                                            id="workspace-name" 
                                            required 
                                            className="h-10 border-border/40 focus-visible:ring-emerald-500/20"
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel className="text-sm font-semibold text-foreground/90">Description</FieldLabel>
                                        <Input 
                                            value={workspace.description} 
                                            onChange={handleChange} 
                                            type="text" 
                                            placeholder="Briefly describe what this workspace is for" 
                                            name="description" 
                                            id="workspace-description" 
                                            required 
                                            className="h-10 border-border/40 focus-visible:ring-emerald-500/20"
                                        />
                                        <FieldDescription className="text-xs text-muted-foreground mt-1">
                                            Describe your workspace in a few words
                                        </FieldDescription>
                                    </Field>

                                    <Field>
                                        <FieldLabel className="text-sm font-semibold text-foreground/90">Image URL</FieldLabel>
                                        <Input 
                                            value={workspace.imageUrl} 
                                            onChange={handleChange} 
                                            type="text" 
                                            placeholder="https://example.com/logo.png" 
                                            name="imageUrl" 
                                            id="workspace-imageUrl" 
                                            required 
                                            className="h-10 border-border/40 focus-visible:ring-emerald-500/20"
                                        />
                                        <FieldDescription className="text-xs text-muted-foreground mt-1">
                                            Enter the URL of the image you want to use for your workspace
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </CardContent>

                            <CardFooter className="pb-8 pt-4">
                                <Button 
                                    type="submit" 
                                    className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold rounded-3xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    {createWorkspaceMutation.isPending ? "Creating workspace..." : "Launch Workspace"}
                                </Button>
                            </CardFooter>
                        </form>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <CardHeader className="text-center pt-8 pb-4">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
                                <Building className="h-7 w-7" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                                Get Started With Your Workspace
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                                Create your first workspace to begin inviting team members and managing projects.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 py-4">
                            <div className="rounded-2xl border border-border/30 bg-muted/20 p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Invite team members</p>
                                        <p className="text-xs text-muted-foreground">Collaborate in real-time on key tasks.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Manage and track projects</p>
                                        <p className="text-xs text-muted-foreground">Keep goals organized and on track.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Custom branding</p>
                                        <p className="text-xs text-muted-foreground">Upload a logo to personalize your workspace.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pb-8 pt-4">
                            <Button 
                                className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-semibold rounded-3xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10" 
                                onClick={handleGetStarted}
                            >
                                Get Started
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </div>
                )}
            </Card>
        </div>
    );
}