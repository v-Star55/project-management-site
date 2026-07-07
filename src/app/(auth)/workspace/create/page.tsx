"use client"

import { WorkspaceCreateForm } from "@/components/workspace-create-form";

export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10 bg-background relative overflow-hidden">
            {/* Subtle background abstract decorations */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/5 blur-3xl" />

            <div className="w-full max-w-lg z-10">
                <WorkspaceCreateForm />
            </div>
        </div>
    );
}
