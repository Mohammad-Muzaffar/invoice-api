import zod from 'zod';

const UserUpdateSchema = zod.object({
    orgName : zod.string().optional(),  
    username: zod.string().optional(),    
    email: zod.string().email().optional(),  
    gstNumber: zod.string().min(15, "GST Number Should be atleast 15 characters.")
    .max(15, "GST Number Should be atleast 15 character.").optional(), 
    phone: zod.string().optional()
});

export {
    UserUpdateSchema
}