import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '/home/am-pc-02/invoice-api/.env'});

const transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE,
    host: 'smtp.gmail.com',
    port: 465, // default is 587
    secure: true, // default is false but for 465 it's true.
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
})

const mailOptions = {
    from: {
        name: "Muzaffar Shaikh",
        address: process.env.SMTP_USER
    },
    to: ['youremail@gmail.com'],
    subject: 'Test Email',
    text: 'Hello, this is a test email sent using Nodemailer and Gmail.',
    html: "<h3>Hi Gaint</h3> <b>testing this email using nodemailer.</b>",
};

const SendEmail = async ({transporter, mailOptions}: {transporter: any, mailOptions: {}})=> {
    try{
        await transporter.sendMail(mailOptions);
        console.log("Email Sent Successfully!")
    } catch(error){
        console.error(error);
    }
}

SendEmail({transporter, mailOptions})

const SendForgotPasswordOtp = async () => {
    
}