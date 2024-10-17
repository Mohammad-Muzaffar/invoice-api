import zod from "zod";

const AddCustomerSchema = zod.object({
  name: zod.string(),
  email: zod.string().email(),
  phone: zod
    .string()
    .min(10, "Phone number must be 10 digit.")
    .max(10, "Phone number must be 10 digit."),
});

const UpdateCustomerSchema = zod.object({
  name: zod.string().optional(),
  email: zod.string().email().optional(),
  phone: zod
    .string()
    .min(10, "Phone number must be 10 digit.")
    .max(10, "Phone number must be 10 digit.")
    .optional(),
});

export { AddCustomerSchema, UpdateCustomerSchema };
