"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Spinner } from "./ui/spinner";
import { useDispatch } from "react-redux";
import { clearUser } from "@/lib/redux/userSlice";

export function ChangePasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [buttonDisabled, setButtonDisabled] = useState(false);

  // Check user profile status on load
  const { data: userData, isLoading, isError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const response = await axios.get("/api/users/me");
      return response.data.user;
    },
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      router.push("/login");
    } else if (userData && !userData.isPending) {
      router.push(`/dashboard/${userData.id}`);
    }
  }, [userData, isError, router]);

  const mutation = useMutation({
    mutationFn: async (password: string) => {
      setButtonDisabled(true);
      const response = await axios.post("/api/users/change-password", { password });
      return response.data;
    },
    onSuccess: async () => {
      toast.success("Password updated successfully! Please login with your new password.", {
        position: "top-center",
      });
      // Clear user session and state
      dispatch(clearUser());
      // Clear React Query cache to prevent stale user status/session
      queryClient.clear();
      router.push("/login");
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message || "Failed to update password";
      toast.error(errorMsg, { position: "top-center" });
      setButtonDisabled(false);
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long", { position: "top-center" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match", { position: "top-center" });
      return;
    }
    mutation.mutate(newPassword);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-4">
        <Spinner className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Verifying session...</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Change your password</CardTitle>
          <CardDescription>
            You are logging in for the first time. Please update your password to secure your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="newPassword">New Password</FieldLabel>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirmPassword">Confirm New Password</FieldLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={buttonDisabled || mutation.isPending}>
                  {mutation.isPending ? <><Spinner/> Updating...</> : "Update Password & Login"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
