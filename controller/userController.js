//Import userModel
const userModel = require("../model/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const signUpTemplate = require("../utils/signUpTemplate");
const sendMail = require("../utils/sendMail");
// const sendMail = require("../utils/sendMail");


exports.register = async (req, res) => {
  try {
    //Extract required data from request body
    const { fullName, email, password } = req.body;
    const userExists = await userModel.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        message: "Email ${email} is already registered",
      });
    }
    //Salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //Create user
    const user = new userModel({
      fullName: fullName,
      email,
      password: hashedPassword,
    });
    const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {expiresIn: "10mins"});
    // const link = `${req.protocol}://${req.get("host")}/api/v1/verify/${token}`;
    const link = `${req.protocol}://${req.get("host")}/verify-user/${token}`;
    const firstName = user.fullName.split(" ")[0];
    const mailDetails = {
      email: email,
      subject: "Welcome to AI Podcast",
      html: signUpTemplate(firstName, link),
    };

    await user.save();

    await sendMail(mailDetails);

    res.status(201).json({
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    //Get token fom params
    const token = req.params.token;

    //verify token 
    const decodedToken = await jwt.verify(token, process.env.JWT_SECRET);

    //Find the user in the database with the decoded token
    const user = await userModel.findById(decodedToken.userId);

    //Check if user still exists
    if (user === null) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.isVerified === true) {
      return res.status(400).json({
        message: "User already verified, Please proceed to login",
      });
    }
    //Verify the user account
    user.isVerified = true;

    //Save the changes to the database
    await user.save();
    //Send a response to the user
    res.status(200).json({
      message: "User verified successfully",
    });

  } catch (error){
    console.log(error.message);
    if(error instanceof jwt.TokenExpiredError){
      return res.status(400).json({
        message: "Verification link expired: Please resend a new verification link",
      });
    }
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
exports.resendVerificationLink = async (req, res) => {
 try{
    //Extract the use's email from the request body
    const {email} = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Please enter your email",
      });
    }  ;
    //Find the user in the database with the email
    const user = await userModel.findOne({ email: email.toLowerCase() });
    if (user == null) {
      return res.status(404).json({
        message: "User not found",
      });
    };

    if(user.isVerified === true){
      return res.status(400).json({
        message: "User already verified, Please proceed to login",
      });
    }
    //Generate a token for the user
    const token = await jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {expiresIn: "30mins"});
    //Create a verification link for the user
    const link = `${req.protocol}://${req.get("host")}/api/v1/verify/${token}`;
    const firstName = user.fullName.split(" ")[0];
    const mailDetails = {
      email: email,
      subject: "Verification Link",
      html: signUpTemplate(firstName, link),
    };

    //Await nodemailer to send the email
    await sendMail(mailDetails);
    res.status(200).json({
      message: "Verification link sent successfully",
    });


 } catch(error){
   console.log(error.message);
   res.status(500).json({
     message: "Internal server error",
   });
 }
}

//This verifies and esend verification automatically
exports.verifyUserAndResend = async (req, res) => {      
    try{
        const {token} = req.params.token;

        await jwt.verify(token, process.env.JWT_SECRET, async (error, payload) => {
            if(error){
                //Check if error is JWT expired error
                if(error instanceof jwt.TokenExpiredError){
                    const decodedToken = jwt.decode(token);
                    //check if user still exists
                    const user = await userModel.findById(decodedToken.userId);
                    if(user === null){
                        return res.status(404).json({
                            message: "User not found",
                        });
                    }
                       //Check if user is already verified
                if(user.isVerified === true){
                    return res.status(400).json({
                        message: "User already verified, Please proceed to login",
                    });
                }


                    //Generate a new token for the user
                    const newToken = await jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn: "30mins"});
                    //Create a verification link for the user
                    const link = `${req.protocol}://${req.get("host")}/api/v1/verify-user/${newToken}`;
                    const firstName = user.fullName.split(" ")[0];
                    //Create the email details
                    const mailDetails = {
                        email: user.email,
                        subject: "Verification Link",
                        html: signUpTemplate(firstName, link),
                    };
                    //Await nodemailer to send the email
                    await sendMail(mailDetails);
                    //Send a response to the user
                    res.status(200).json({
                        message: "Link expired: A new verification link has been sent to your email",
                    });

                }
            }else {
                //Find the user in the database with the decoded token
                const user = await userModel.findById(payload.userId);
                //Check if user still exists
                if(user === null){
                    return res.status(404).json({
                        message: "User not found",
                    });
                }
                //Check if user is already verified
                if(user.isVerified === true){
                    return res.status(400).json({
                        message: "User already verified, Please proceed to login",
                    });
                }
                //Verify the user account
                user.isVerified = true;
                //Save the changes to the database
                await user.save();
                //Send a response to the user
                res.status(200).json({
                    message: "User verified successfully",
                });
            }
        });
           
        
    }catch(error){
        console.log(error.message);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}

exports.login = async (req, res) => {
    try {
        //Extract theh user's email and password from the request body
        const { email, password } = req.body;
    
        //Find the user in the database
        if (email == undefined || password == undefined) {
          return res.status(400).json({
            message: "Please enter your email and password",
          });
        }  
        
        //check fo the user and throw error if not found
        const user = await userModel.findOne({ email: email.toLowerCase() });
        if (user === null) {
          return res.status(404).json({
            message: "User not found",
          });
        }
        //check the password and throw error if not correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid === false) {
            return res.status(400).json({
                message: "Invalid password",
            });
        }

        //Generate a token for the user
        const token = await jwt.sign({ userId: user._id, isAdmin: user.isAdmin, isSuperAdmin: user.isSuperAdmin }, process.env.JWT_SECRET, {expiresIn: "1d"});

       const  {password: hashedPassword, ...data} = user._doc;
        //Send a response to the user
        res.status(200).json({
            message: "Login successfully",
            data: data,
            token: token
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
          message: "Internal server error",
        });
      }
    };

exports.getAllUsers = async (req, res) => {
    try {
        //Find all users in the database   
        const users = await userModel.find();
        //Send a response to the user
        res.status(200).json({
            message: "Users fetched successfully",
            data: users
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

exports.makeAdmin = async (req, res) => {
    try {
        //Find the user in the database
        const user = await userModel.findById(req.params.id);
        //Check if user still exists
        if (user === null) {
            return res.status(404).json({
                message: "User not found",
            });
        }
        if(user.isAdmin === true){
            return res.status(400).json({
                message: "User is already an admin",
            });
        }
        //Make the user an admin
        user.isAdmin = true;
        //Save the changes to the database
        await user.save();
        //Send a response to the user
        res.status(200).json({
            message: `User ${user.fullName} is now an admin`,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

exports.superAdminAuth = async (req, res, next) => {
    try {
        if (req.user.isSuperAdmin === true) {
            next();
        } else {
            return res.status(403).json({
                message: "Unauthorized: Not a super admin",
            });
        }
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
