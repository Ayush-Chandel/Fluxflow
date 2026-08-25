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
import { signUpSchema } from "@/lib/validation";
import z from "zod";
import { authService } from "@/services/authService";
import { authErrorMessage } from "@/lib/authErrors";
import BoxGradient from "@/components/common/BoxGradient";
import { Link } from "react-router";


type SignUpFormData = z.infer<typeof signUpSchema>; // replaces 

 function SignUp() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema)
  });

  const onSubmit = async (data: SignUpFormData) => {
        try {
         await authService.signUp(data?.email, data?.password)
         // ← no navigate() here — authService handles it
       } catch (error) {
         toast.error(authErrorMessage(error))
       }
  };

  return (
   <BoxGradient>
        <Card className="w-full max-w-sm mx-auto gap-4 mt-[100px] bg-surface border-edge rounded-2xl pb-0 overflow-hidden ">
            <CardHeader >
            
                <CardDescription className="flex gap-2 mx-auto">
                <span>Sign Up to Fluxflow </span>
                <img src='/assets/logo.jpg' alt='logo' className="w-7 h-6  rounded-full"  />
                </CardDescription>
            </CardHeader>
        <CardContent className="px-8 ">
            <form
            id="SignUp-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            >
            <FieldGroup>
                <InputField<SignUpFormData>
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

                <InputField<SignUpFormData>
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
            form="SignUp-form"
            className="w-full bg-brand text-white hover:bg-brand-hover cursor-pointer"
            disabled={isSubmitting}
            >
            {isSubmitting ? "Signing Up..." : "Sign Up"}
            </Button>
            </div>


            <p className="text-sm text-muted text-center py-3">
            Already have an account?{" "}
            <Link to="/login" className="pl-1 text-foreground underline-offset-4 underline">
                Log In
            </Link>
            </p>
        </CardFooter>
        </Card>
   </BoxGradient>
  );
}


export { SignUp as Component }