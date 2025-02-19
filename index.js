import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import User from './Models/Users.js';
import nodemailer from 'nodemailer';
import multer from 'multer';
import path from 'path'

dotenv.config(); // Ensure to load environment variables from .env file

const port = 3000;

const app = express();

app.use(express.json());
app.use(express.static('./public'))
app.use(cookieParser());
app.use(cors({
    origin: 'https://vercel.com/kore-anils-projects/video-nest-frontend',
    methods: ['POST', 'GET'],
    credentials: true
}));


mongoose.connect('mongodb+srv://koreanilleader1:aRTOjhv6OPT8lioY@videonestdb.b0oa2.mongodb.net/?retryWrites=true&w=majority&appName=VideoNestDB')
    .then(() => console.log('Connected successfully to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,'public/uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
      },
})

const upload=multer({storage:storage})

app.post('/',async (req, res) => {
    const { name, password, email} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword});
        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No user found with this email' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }
        const token = jwt.sign({ email: user.email, id: user._id }, 'jwt-secret-key', /*{ expiresIn: '1d'}*/ );
        res.cookie('token', token, { httpOnly: true, secure: true,/* maxAge: 86400000 */}); // 1 day
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

//middleware for protected Routes
const verifyToken=(req,res,next)=>{
    const token=req.cookies.token;
    if(!token){
        return res.json({status:402,message:'No token available',token})
    }else{
        const decoded=jwt.verify(token,'jwt-secret-key');
        req.user=decoded;
            next()
    }
}
app.get("/home",verifyToken,async (req,res,next)=>{
    return res.json({Status:"success"});
})


app.post('/forgotpassword',async (req,res,next)=>{
    const {email}=req.body;
    const token=await req.cookies.token

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'koreanilleader1@gmail.com',
          pass: 'uxee plvy ilmh aqjn'
        }
      });
      
      var mailOptions = {
        from: 'koreanilleader1@gmail.com',
        to: email,
        subject: 'Sending Email using Node.js',
        text: `Your reset password link is http://localhost:5173/resetpassword/${token}`
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });


})
app.post('/resetpassword:token',async(req,res)=>{
    const {email,newpassword}=req.body;
    const token=await req.cookies.token
    try{
        const decoded=await jwt.verify(token,"jwt-secret-key")
        const id=decoded.id
        const newhashedpassword=await bcrypt.hash(newpassword,10)
        User.findOneAndUpdate({email:email,password:newhashedpassword})
        .then(user=>{
            console.log(user,decoded)
        })
        return res.json({status:true,message:'password updated successfully'})
    }
    catch(err){
        console.log(err)
    }
})
app.post('/dashboard',verifyToken,(req,res)=>{
    res.json({status:true,msg:"Token verified successfully"})
})

app.get('/logout',(req,res)=>{
        console.log('Cookies before clearing:', req.cookies);
        expires: new Date(0),
        res.clearCookie('token', { httpOnly: true, secure: true, maxAge: 86400000 });
        console.log('Cookies after clearing:', req.cookies);
    
    return res.json({Status:"Success",Message:"User logged Out"})
})
app.post("/uploadfile",verifyToken,upload.single('video'), async(req,res)=>{
    const {title,description}=req.body;
    const {id}=req.user

    try{
        const videoDetails={
            title,
            description,
            filepath:req.file.path,
            uploadedAt:new Date(),
        };

        const user=await User.findByIdAndUpdate(
            id,
            {$push:{uploadedVideos:videoDetails}},
            {new:true}
        );
        console.log(videoDetails)
        if (!user){
            return res.status(404).send({message:"user not found"})
        }
        res.status(200).json({message:'Video Uploaded and added to user profile successfully!!',
            user,
        });
    }
    catch (error) {
        console.error("Error in adding the vidoe to user:",error);
        res.status(500).send({ error: "Failed to upload video." });
      }
});
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
