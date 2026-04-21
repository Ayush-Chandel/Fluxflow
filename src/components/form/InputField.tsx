import { useState } from "react";
import { UseFormRegister, FieldError, Path, FieldValues } from "react-hook-form";
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError as FieldErrorMsg,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps<T extends FieldValues> {
  name: Path<T>;
  register: UseFormRegister<T>;
  label: string;
  type?: string;
  placeholder?: string;
  description?: string;
  error?: FieldError;
  autoComplete?: string;
  required?: boolean;
  labelClassName?: string;
  className?: string;
}

export function InputField<T extends FieldValues>({
  name,
  register,
  label,
  type = "text",
  placeholder,
  description,
  error,
  autoComplete,
  required,
  labelClassName,
  className
}: InputFieldProps<T>) {
  const isPasswordField = type === "password";
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={name} className={labelClassName}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </FieldLabel>

      <div className="relative">
        <Input
          {...register(name)}
          id={name}
          type={isPasswordField && showPassword ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={`${isPasswordField ? "pr-10" : ""} ${className ?? ""}`}
        />

        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldErrorMsg errors={[error]} className="text-[12px]" />}
    </Field>
  );
}