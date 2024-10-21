import zod from "zod";

const AddAddressSchema = zod.object({
  street: zod.string(),
  city: zod.string(),
  state: zod.string(),
  country: zod.string(),
  postCode: zod.string(),
  clientId: zod.string(),
});

const UpdateAddressSchema = zod.object({
    street: zod.string().optional(),
    city: zod.string().optional(),
    state: zod.string().optional(),
    country: zod.string().optional(),
    postCode: zod.string().optional(),
});

export { AddAddressSchema, UpdateAddressSchema };
