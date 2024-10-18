import zod from "zod";

const AddGstRateSchema = zod.object({
  hsnSacCode: zod.string().optional(),
  description: zod.string().optional(),
  gstRate: zod.number(),
  cgstRate: zod.number(),
  sgstRate: zod.number(),
  igstRate: zod.number(),
});

export { AddGstRateSchema };
