const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb+srv://admin1:admin1@fashion-avenue.ibcesxn.mongodb.net/?retryWrites=true&w=majority&appName=fashion-avenue')
.then(() => {
    console.log('DB Connected!');
})
.catch((err) => {
    console.log(err);
});

const adminEmail = 'admin@fashionavenue.com'

const userSchema = new mongoose.Schema({
    email: {
        required: true,
        type: String
    },
    userpwd: {
        required: true,
        type: String
    },
    verificationStatus: {
        required: true,
        type: String
    },
    verificationCode: {
        required: true,
        type: String
    }
})
const userModel = new mongoose.model('user', userSchema);

const titleSchema = new mongoose.Schema({
    customTitle: {
        required: true,
        type: String
    },
})
const titleModel = new mongoose.model('title', titleSchema);

const textEditSchema = new mongoose.Schema({
    customTitle: {
        required: true,
        type: String
    },
    titleContent: {
        required: true,
        type: String
    },
})
const textEditModel = new mongoose.model('textedit', textEditSchema);


const profileSchema = new mongoose.Schema({
    customTitle: {
        required: true,
        type: String
    },
    customHandle: {
        required: true,
        type: String
    },
})
const profileModel = new mongoose.model('profile', profileSchema);

// const signupSchema = new mongoose.Schema({
//     email: {
//         required: true,
//         type: String
//     },
//     userpwd: {
//         required: true,
//         type: String
//     },
// })
// const signupModel = new mongoose.model('signup', signupSchema);

// app.post('/signup', async (req, res) => {
//     try {
//         const { email, userpwd } = req.body;
//         const newUser = new signupModel({ email, userpwd });
//         await newUser.save();
//         res.status(201).send(newUser);
//     } catch (err) {
//         console.log(err);
//         res.status(500).send({message: err.message});
//     }
// });

app.post('/save_title', async (req, res) => {
    try {
        const { customTitle } = req.body;
        const rs = await titleModel.find({customTitle});
        if(rs.length > 0) {
            res.status(422).send(rs);
        } else {
            const newTitle = new titleModel({customTitle});
            await newTitle.save();
            res.status(201).send(newTitle);
        }        
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.get('/get_titles', async (req, res) => {
    try {
        const titles = await titleModel.find();
        res.status(200).send(titles);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.delete('/delete_title/:id', async (req, res) => {
    try {
        const _id = req.params.id;
        let rs = await titleModel.find({_id});
        await textEditModel.deleteOne({ customTitle: rs[0].customTitle });
        await titleModel.findByIdAndDelete(_id);
        res.status(204).end();
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.get('/get_titlecontent/:customTitle', async (req, res) => {
    try {
        const customTitle = req.params.customTitle;
        const titlecontent = await textEditModel.find({ customTitle });
        res.status(200).send(titlecontent);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.post('/save_title_content', async (req, res) => {
    try {
        const { customTitle, titleContent } = req.body;
        await textEditModel.deleteOne({ customTitle: customTitle });
        const newTitleContent = new textEditModel({customTitle, titleContent});
        await newTitleContent.save();
        res.status(201).send(newTitleContent);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.post('/create_user', async (req, res) => {
    try {
        const verificationStatus = "0";
        const verificationCode = "0";
        const { email, userpwd } = req.body;

        const user = await userModel.find({email});
        if(user.length > 0) {
            res.status(500).send(user);
        } else {
            const newUser = new userModel({ email, userpwd, verificationStatus, verificationCode });
            await newUser.save();
            res.status(201).send(newUser);
            let emailContent = `Click here https://4ee10bc6-e793-40a2-9db4-0592c85da2c3.e1-us-east-azure.choreoapps.dev/verify_email/${(newUser._id).toString()} to verify email`;
            let rsSendEmail = sendEmail(email, emailContent);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.post('/change_password', async (req, res) => {
    try {
        const { id, userpwd } = req.body;
        const user = await userModel.find({_id: id});
        if(user.length > 0) {
            const updateUser = await userModel.updateOne( { _id: id }, { $set: { userpwd: userpwd, verificationStatus: "1" } } );
            res.status(201).send(updateUser);
        } else {
            res.status(500).send(user);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.post('/send_email', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await userModel.find({email});
        if(user.length > 0) {
            let emailContent = `Click here https://729df12d-1df7-4184-b21c-a187b10f67d4.e1-us-east-azure.choreoapps.dev/resetpassword/${(user[0]._id).toString()} to reset password`;
            let rsSendEmail = await sendEmail(email, emailContent);
            res.status(200).send("Email send successfully");
        } else {
            res.status(500).send(user);
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.post('/login', async (req, res) => {
    try {
        const verificationStatus = "0";
        const verificationCode = "1";
        const { email, userpwd } = req.body;

        const rs = await userModel.find({$and:[{"email": email},{"userpwd": userpwd}]});
        if(rs.length > 0) {
            if(rs[0].verificationStatus == 1) {
                await userModel.updateOne( { email: email }, { $set: { verificationCode: "1" } } );
                if(adminEmail == email) {
                    res.status(200).send({message: "success", flag: 2});
                } else {
                    res.status(200).send({message: "success", flag: 1});
                }
            } else {
                res.status(406).send({message: "Email not verified", flag: 0});
            }
        } else {
            res.status(401).send({message: "invalid", flag: 0});
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message, flag: 0});
    }
});

async function sendEmail(email, text) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'devrag0507@gmail.com',
                pass: 'wkmf nfba egou psox'
            }
        });
        
        const mailOptions = {
            from: {
                name: 'Test Mail',
                address: 'devrag0507@gmail.com'
            },
            to: email,
            subject: 'FashionAvenue.com email verification',
            text: text
        };
        
        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
                return {message: 'retry'}
            } else {
                console.log('Email sent: ' + info.response);
                return {message: 'success'}
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message, flag: 0});
    }
}

app.get('/verify_email/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const updateUser = await userModel.findByIdAndUpdate(
            id,
            { verificationStatus: "1" },
            { new: true }
        );
        if(updateUser.verificationStatus == 1) {
            res.status(200).send(`<div style="margin: auto;width: 60%;margin-top: 10%;border: 3px solid #73AD21;padding: 10px;"><p style="text-align: center">Email Id successfully verified. <a href="https://729df12d-1df7-4184-b21c-a187b10f67d4.e1-us-east-azure.choreoapps.dev/">Click here to login</a></p></div>`);
        } else {
            res.status(401).send({message: "Unauthorized"});
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.get('/get_users', async (req, res) => {
    try {
        const users = await userModel.find();
        res.status(200).send(users);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.post('/save_profile', async (req, res) => {
    try {
        const { customTitle, customHandle } = req.body;
        const newProfile = new profileModel({ customTitle, customHandle });
        await profileModel.deleteMany({});
        await newProfile.save();
        res.status(201).send(newProfile);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.get('/get_profile', async (req, res) => {
    try {
        const profileData = await profileModel.find();
        res.status(200).send(profileData);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.put('/update_user/:id', async (req, res) => {
    try {
        const { username, userpwd } = req.body;
        const id = req.params.id;
        const updateUser = await userModel.findByIdAndUpdate(
            id,
            { username, userpwd },
            { new: true }
        );
        if(!updateUser) {
            return res.status(404).send({message: "user not found"});
        }
        res.status(200).send(updateUser);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.delete('/delete_user/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await userModel.findByIdAndDelete(id);
        res.status(204).end();
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.post('/signout', async (req, res) => {
    try {
        const { email } = req.body;
        await userModel.updateOne( { email: email }, { $set: { verificationCode: "0" } } );
        res.status(200).send({message: "success"});
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

app.get('/verify_session/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const rs = await userModel.find({ email });
        res.status(200).send(rs[0].verificationCode);
    } catch (err) {
        console.log(err);
        res.status(500).send({message: err.message});
    }
});

const PORT = 8080;
app.listen(PORT, () => {
    console.log(`Server is listening PORT : ${PORT}`);
});