import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const ConversionRequestSchema = z.object({
  imageUrl: z.string().url({ message: "Invalid image URL" }),
  outputMode: z.enum(["react-tailwind", "html-css"]),
  userPreferences: z.string().optional(),
});
