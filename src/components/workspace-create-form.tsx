"use client"

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Building, LogOut, ArrowRight, ArrowLeft } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Spinner } from "./ui/spinner";
import { useDispatch } from "react-redux";
import { clearUser } from "@/lib/redux/userSlice";

interface Workspace {
    name: string;
    description: string;
    imageUrl: string;
    userId: string;
}

export function WorkspaceCreateForm() {
    const router = useRouter();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const { data: userData, isLoading: isUserLoading } = useQuery({
        queryKey: ["currentUser"],
        queryFn: async () => {
            const response = await axios.get("/api/users/me");
            return response.data.user;
        },
        retry: false,
    });

    const userId = userData?.id;

    const [showForm, setShowForm] = useState(false);
    const [workspace, setWorkspace] = useState({
        name: "",
        description: "",
        imageUrl: "",
        userId: "",
    });

    useEffect(() => {
        if (userData?.company?.id) {
            // Already has a company, block access and redirect to dashboard
            router.push(`/dashboard/${userData.id}`);
        }
    }, [userData, router]);

    const handleLogout = async () => {
        try {
            await axios.post("/api/users/logout");
            toast.success("Logout successful", { position: "top-center" });
            dispatch(clearUser());
            queryClient.clear();
            router.push("/login");
        } catch (error: any) {
            toast.error(error.response?.data?.error || error.message, { position: "top-center" });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setWorkspace(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const createWorkspaceMutation = useMutation({
        mutationFn: async (workspaceData: Workspace) => {
            workspaceData.userId = userId || "";
            const response = await axios.post("/api/workspace/create", workspaceData);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Workspace created successfully!");
            queryClient.clear(); // Clear cache to load fresh company data
            router.push(`/dashboard/${userId}`);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || "Failed to create workspace");
        },
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createWorkspaceMutation.mutate(workspace);
    };

    if (isUserLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
                <Spinner className="size-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">Verifying user profile...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full max-w-lg mx-auto transition-all duration-300">
            {/* Background ambient light */}
            <div className="absolute -inset-1.5 rounded-[2.5rem] bg-gradient-to-r from-primary/30 to-emerald-500/20 blur-2xl opacity-60 pointer-events-none" />

            <Card className="relative bg-card/75 backdrop-blur-xl border border-border/40 shadow-2xl overflow-hidden rounded-3xl p-2">
                {showForm ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <CardHeader className="pt-8 pb-4 relative">
                            <button
                                onClick={() => setShowForm(false)}
                                className="absolute left-6 top-8 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="text-center mt-2">
                                <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                                    Configure Workspace
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground mt-2">
                                    Set up the identity and logo for your new team space.
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <form onSubmit={handleSubmit}>
                            <CardContent className="py-4 space-y-5">
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
                                            className="h-11 border-border/60 focus-visible:ring-primary/20 bg-background/50"
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
                                            className="h-11 border-border/60 focus-visible:ring-primary/20 bg-background/50"
                                        />
                                        <FieldDescription className="text-xs text-muted-foreground mt-1">
                                            Describe your workspace in a few words
                                        </FieldDescription>
                                    </Field>

                                    <Field>
                                        <FieldLabel className="text-sm font-semibold text-foreground/90">Logo/Image URL</FieldLabel>
                                        <Input
                                            value={workspace.imageUrl}
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="https://example.com/logo.png"
                                            name="imageUrl"
                                            id="workspace-imageUrl"
                                            required
                                            className="h-11 border-border/60 focus-visible:ring-primary/20 bg-background/50"
                                        />
                                        <FieldDescription className="text-xs text-muted-foreground mt-1">
                                            Enter the URL of the image you want to use for your workspace
                                        </FieldDescription>
                                    </Field>
                                </FieldGroup>
                            </CardContent>

                            <CardFooter className="pb-8 pt-4 flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    disabled={createWorkspaceMutation.isPending}
                                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                >
                                    {createWorkspaceMutation.isPending ? (
                                        <><Spinner className="size-4 animate-spin text-primary-foreground" /> Creating...</>
                                    ) : (
                                        <><Sparkles className="h-4 w-4" /> Launch Workspace</>
                                    )}
                                </Button>
                            </CardFooter>
                        </form>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <CardHeader className="text-center pt-8 pb-4 relative">
                            <button
                                onClick={handleLogout}
                                className="absolute right-6 top-8 text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-full hover:bg-muted flex items-center gap-1 text-xs"
                                title="Sign out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
                                <Building className="h-8 w-8" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                                Welcome to Antigravity
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                                Create your workspace to begin inviting team members and managing projects.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4 py-4">
                            <div className="rounded-2xl border border-border/40 bg-muted/30 p-5 space-y-4">
                                <div className="flex gap-4">
                                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                        1
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Launch Workspace</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Customize your company branding and details.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                        2
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Invite Your Team</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Collaborate in real-time, log hours, and manage tasks.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                                        3
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Track Progress</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Get unified overview of tickets, sprints, and client requests.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pb-8 pt-4">
                            <Button
                                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/95 transition-all font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                                onClick={() => setShowForm(true)}
                            >
                                Let's get started
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </div>
                )}
            </Card>
        </div>
    );
}
