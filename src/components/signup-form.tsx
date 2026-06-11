"use client";
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
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"




import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Spinner } from "./ui/spinner";

interface User {
  email: string;
  password: string;
  name: string;
}

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {

  const router = useRouter();

  const [user, setUser] = useState({
    email: "",
    password: "",
    name: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");

  const [buttonDisabled, setButtonDisabled] = useState(false);

  const mutation = useMutation({
    mutationFn: async (user: User) => {
      setButtonDisabled(true);
      const response = await axios.post("/api/users/signup",user);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Sign up successfully!",{ position: "top-center" });
      setUser({
        email: "",
        password: "",
        name: "",
      });
      router.push("/login");
    },
    onError: () => {
      toast.error("Something went wrong during sign up",{ position: "top-center" });
      setButtonDisabled(false);
    }
  })

  const onSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.password !== confirmPassword) {
      toast.error("Passwords do not match!",{ position: "top-center" });
      return;
    }
    
    try {
      mutation.mutate(user)
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong during sign up",{ position: "top-center" });
    } finally {
      setButtonDisabled(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your information below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSignUp}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Full Name</FieldLabel>
              <Input
                id="name"
                name="name"
                value={user.name}
                onChange={handleChange}
                type="text"
                placeholder="John Doe"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                value={user.email}
                onChange={handleChange}
                type="email"
                placeholder="m@example.com"
                required
              />
              <FieldDescription>
                We&apos;ll use this to contact you. We will not share your email
                with anyone else.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                name="password"
                value={user.password}
                onChange={handleChange}
                type="password"
                required
              />
              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">
                Confirm Password
              </FieldLabel>
              <Input
                id="confirm-password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                required
              />
              <FieldDescription>Please confirm your password.</FieldDescription>
            </Field>
            <FieldGroup>
              <Field>
                <Button type="submit" disabled={buttonDisabled || mutation.isPending}>
                  {mutation.isPending ? <><Spinner/> Creating Account</> : "Create Account"}
                </Button>
                <Button variant="outline" type="button" disabled={buttonDisabled || mutation.isPending}>
                  Sign up with Google
                </Button>
                <FieldDescription className="px-6 text-center">
                  Already have an account? <Link href="#">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

