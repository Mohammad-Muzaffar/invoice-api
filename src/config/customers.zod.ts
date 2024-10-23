import zod from "zod";

const AddCustomerSchema = zod.object({
  firstName: zod.string(),
  lastName: zod.string(),
  email: zod.string().email(),
  phoneNo: zod
    .string()
    .min(10, "Phone number must be 10 digit.")
    .max(10, "Phone number must be 10 digit."),
  panNo: zod
    .string()
    .min(10, "Pan no must be of 10 characters")
    .max(10, "Pan no must be of 10 characters")
    .optional(),
  companyName: zod.string().optional(),
  clientGstinNumber: zod
    .string()
    .min(15, "GST no must be of 15 characters")
    .max(15, "GST no must be of 15 characters")
    .optional(),
  addresses: zod
    .array(
      zod.object({
        street: zod.string(),
        city: zod.string(),
        state: zod.string(),
        country: zod.string(),
        postCode: zod.string(),
      })
    )
    .optional(),
});

const UpdateCustomerSchema = zod.object({
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
  email: zod.string().email().optional(),
  phoneNo: zod
    .string()
    .min(10, "Phone number must be 10 digit.")
    .max(10, "Phone number must be 10 digit.")
    .optional(),
  panNo: zod
    .string()
    .min(10, "Pan no must be of 10 characters")
    .max(10, "Pan no must be of 10 characters")
    .optional(),
  companyName: zod.string().optional(),
  clientGstinNumber: zod
    .string()
    .min(15, "GST no must be of 15 characters")
    .max(15, "GST no must be of 15 characters")
    .optional(),
});

export { AddCustomerSchema, UpdateCustomerSchema };
