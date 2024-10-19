import zod from "zod";

const UserUpdateSchema = zod.object({
  companyName: zod.string().optional(),
  companyPhone: zod.string().optional(),
  userName: zod.string().optional(),
  email: zod.string().email().optional(),
  street: zod.string().optional(),
  city: zod.string().optional(),
  state: zod.string().optional(),
  country: zod.string().optional(),
  postCode: zod.string().min(6, "postcode must be of 6 characters.").optional(),
  panNumber: zod
    .string()
    .min(10, "Pan no must be of 10 characters")
    .max(10, "Pan no must be of 10 characters")
    .optional(),
  gstinNumber: zod
    .string()
    .min(15, "GST no must be of 15 characters")
    .max(15, "GST no must be of 15 characters")
    .optional(),
  msmeNumber: zod
    .string()
    .min(12, "MSME no must be of 12 characters")
    .max(12, "MSME no must be of 12 characters")
    .optional(),
  bankName: zod.string().optional(),
  bankAccountNumber: zod.string().optional(),
  bankBranchName: zod.string().optional(),
  ifscCode: zod.string().optional(),
});

export { UserUpdateSchema };
