import zod from "zod";

const RegisterSchema = zod.object({
  userName: zod.string(),
  email: zod.string().email("Enter a valid email."),
  companyPhone: zod.string().optional(),
  password: zod.string().min(8, "Password should be atleast 8 characters."),
});

const LoginSchema = zod.object({
  email: zod.string().email("Enter a valid email."),
  password: zod.string().min(8, "Password should be atleast 8 characters."),
});

const ChangePasswordSchema = zod.object({
  oldPassword: zod
    .string()
    .min(8, "Old Password should be of minimum length 8 or more."),
  newPassword: zod
    .string()
    .min(8, "New Password should be of minimum length 8."),
});

const ForgotPasswordSchema = zod.object({
  email: zod.string().email(),
});

const VerifyForgotPasswordSchema = zod.object({
  newPassword: zod
    .string()
    .min(8, "Password must be of length of 8 characters."),
  otp: zod
    .string()
    .min(6, "Otp must be of length 6")
    .max(6, "Otp must be of length 6"),
  email: zod.string().email(),
});

export {
  RegisterSchema,
  LoginSchema,
  ChangePasswordSchema,
  ForgotPasswordSchema,
  VerifyForgotPasswordSchema,
};
