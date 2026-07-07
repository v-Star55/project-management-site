"use client";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";



import { Input } from "@/components/ui/input"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link"
import { Spinner } from "./ui/spinner";
import { useDispatch } from "react-redux";
import { clearUser } from "@/lib/redux/userSlice";

interface User {
  email: string;
  password: string;
}




export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {

  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutation.mutate(user);
  }

  const router = useRouter();
  const [buttonDisabled, setButtonDisabled] = useState(false);

  const mutation = useMutation({
    mutationFn: async (user: User) => {
      setButtonDisabled(true);
      const response = await axios.post("/api/users/login", user);
      return response.data;
    },
    onSuccess: (response) => {
      toast.success("Login successfully!", { position: "top-center" });
      setUser({
        email: "",
        password: "",
      });
      // Clear stale Redux user state so the previous user's navbar/dashboard isn't shown
      dispatch(clearUser());
      // Clear React Query cache to prevent stale user status/session
      queryClient.clear();
      if (response.user.isPending) {
        router.push("/change-password");
      } else {
        router.push(`/dashboard/${response.user.id}`);
      }
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error || error.message || "Something went wrong during login";
      toast.error(errorMsg, { position: "top-center" });
      setButtonDisabled(false);
    }
  })



  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  value={user.email}
                  onChange={(e) => setUser({ ...user, email: e.target.value })}
                  placeholder="m@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <Input 
                id="password" 
                name="password" 
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })}
                type="password" 
                required />
              </Field>
              <Field>
                <Button type="submit" disabled={buttonDisabled || mutation.isPending}>
                  {mutation.isPending ? <><Spinner/> Logging In</> : "Login"}
                </Button>
                <Button variant="outline" type="button" disabled={buttonDisabled || mutation.isPending}>
                  Login with Google
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
