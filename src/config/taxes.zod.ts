import zod from "zod";

const AddTaxesSchema = zod.object({
  name: zod.string(),
  hsnSacCode: zod.string().optional(),
  description: zod.string().optional(),
  gst: zod.number(),
  cgst: zod.number().optional(),
  sgst: zod.number().optional(),
  igst: zod.number().optional(),
});

const UpdateTaxesSchema = zod.object({
  name: zod.string().optional(),
  hsnSacCode: zod.string().optional(),
  description: zod.string().optional(),
  gst: zod.number().optional(),
  cgst: zod.number().optional(),
  sgst: zod.number().optional(),
  igst: zod.number().optional(),
});

export { AddTaxesSchema, UpdateTaxesSchema };
