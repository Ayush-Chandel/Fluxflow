
import { z } from "zod";

export const logInSchema = z.object({
  email: z.string().min(1, "Required").email("Invalid email"),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    ),
});

export const signUpSchema = z.object({
  email: z.string().min(1, "Required").email("Invalid email"),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    ),
});

