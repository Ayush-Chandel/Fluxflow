// components/LogInForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { InputField } from "@/components/form/InputField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import { zodResolver } from "@hookform/resolvers/zod";
import { logInSchema } from "@/lib/validation";
import z from "zod";
import { authService } from "@/services/authService";
import { authErrorMessage } from "@/lib/authErrors";
import BoxGradient from "@/components/common/BoxGradient";
import { Link } from "react-router";


type LogInFormData = z.infer<typeof logInSchema>; // replaces 

function LogIn() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LogInFormData>({
    resolver: zodResolver(logInSchema)
  });

  const onSubmit = async (data: LogInFormData) => {
        try {
         await authService.logIn(data?.email, data?.password)
         // ← no navigate() here — authService handles it
       } catch (error) {
         toast.error(authErrorMessage(error))
       }
  };

  return (
   <BoxGradient>
        <aside
          className="fixed left-25 top-118 xl:top-20 xl:left-40 z-20 max-w-xs rounded-xl border border-edge bg-surface/95 px-4 py-3 text-sm shadow-lg backdrop-blur"
          aria-label="Demo login credentials"
        >
          <p className="font-semibold text-foreground">Demo credentials</p>
          <p className="mt-1 break-all text-muted">Email: test123@gmail.com</p>
          <p className="break-all text-muted">Password: Qwerty@123</p>
        </aside>
        <Card className="w-full max-w-sm mx-auto gap-4 mt-[100px] bg-surface border-edge rounded-2xl pb-0 overflow-hidden ">
            <CardHeader >
            
                <CardDescription className="flex gap-2 mx-auto">
                <span>Log in to Fluxflow </span>
                <img src='/assets/logo.jpg' alt='logo' className="w-7 h-6  rounded-full"  />
                </CardDescription>
            </CardHeader>
        <CardContent className="px-8 ">
            <form
            id="LogIn-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            >
            <FieldGroup>
                <InputField<LogInFormData>
                name="email"
                register={register}
                label="Email"
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                error={errors.email}
                labelClassName='text-foreground font-semibold '
                className="text-muted border-edge"
        
                />

                <InputField<LogInFormData>
                name="password"
                register={register}
                label="Password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                error={errors.password}
                labelClassName='text-foreground font-semibold '
                className="text-muted border-edge"
                />
            </FieldGroup>
            </form>
        </CardContent>

        <CardFooter className="flex flex-col  bg-background px-0 mt-2">
            <div  className="rounded-b-xl pb-6 w-full bg-surface px-8 border-b-edge border-b">
            <Button
            type="submit"
            form="LogIn-form"
            className="w-full bg-brand text-white hover:bg-brand-hover cursor-pointer"
            disabled={isSubmitting}
            >
            {isSubmitting ? "Logging in..." : "Log In"}
            </Button>
            </div>


            <p className="text-sm text-muted text-center py-3">
            Don't have an account?{" "}
            <Link to="/signup" className="pl-1 text-foreground underline-offset-4 underline ">
                Sign up
            </Link>
            </p>
        </CardFooter>
        </Card>
   </BoxGradient>
  );
}


export { LogIn as Component }
