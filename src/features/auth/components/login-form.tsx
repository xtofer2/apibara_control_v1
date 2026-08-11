"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { loginAction } from "@/features/auth/actions";
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/schemas/login";

const inputClassName =
  "h-12 w-full rounded-xl border border-stone-200 bg-white px-11 text-base text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10";

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result?.error) {
        setServerError(result.error);
      }
    });
  });

  return (
    <form className="space-y-5" method="post" onSubmit={onSubmit} noValidate>
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-700" htmlFor="email">
          Correo
        </label>
        <div className="relative">
          <Mail
            aria-hidden="true"
            className="absolute top-3.5 left-4 size-5 text-stone-400"
          />
          <input
            {...register("email")}
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className={inputClassName}
            id="email"
            inputMode="email"
            placeholder="nombre@apibara.pe"
            type="email"
          />
        </div>
        {errors.email ? (
          <p className="text-sm text-red-600" id="email-error">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-stone-700"
          htmlFor="password"
        >
          Contraseña
        </label>
        <div className="relative">
          <LockKeyhole
            aria-hidden="true"
            className="absolute top-3.5 left-4 size-5 text-stone-400"
          />
          <input
            {...register("password")}
            aria-describedby={errors.password ? "password-error" : undefined}
            aria-invalid={Boolean(errors.password)}
            autoComplete="current-password"
            className={`${inputClassName} pr-12`}
            id="password"
            placeholder="Tu contraseña"
            type={showPassword ? "text" : "password"}
          />
          <button
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
        {errors.password ? (
          <p className="text-sm text-red-600" id="password-error">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {serverError}
        </div>
      ) : null}

      <Button
        className="h-12 w-full rounded-xl bg-orange-600 text-base text-white hover:bg-orange-700"
        disabled={isPending}
        size="lg"
        type="submit"
      >
        {isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="animate-spin" />
            Verificando…
          </>
        ) : (
          "Ingresar"
        )}
      </Button>
    </form>
  );
}
