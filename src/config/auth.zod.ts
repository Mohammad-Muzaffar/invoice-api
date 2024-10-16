import zod from 'zod';

const RegisterSchema = zod.object({
    orgName: zod.string(),               
    username: zod.string(), 
    email: zod.string().email("Enter a valid email."),    
    gstNumber: zod.string().min(15, 'GST Number Should be atleast 15 characters.').max(15,'GST Number Should be atleast 15 character.'),
    phone: zod.string().optional(),                 
    password: zod.string().min(8,"Password should be atleast 8 characters.")              
});

const LoginSchema = zod.object({
    email: zod.string().email("Enter a valid email."),
    password: zod.string().min(8,"Password should be atleast 8 characters.")   
});

const ChangePasswordSchema = zod.object({
    oldPassword: zod.string().min(8, "Old Password should be of minimum length 8 or more."),
    newPassword: zod.string().min(8, "New Password should be of minimum length 8.")
});

export {
    RegisterSchema,
    LoginSchema,
    ChangePasswordSchema
}