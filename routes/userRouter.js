const userRouter = require("express").Router();
const {register, verifyUser, resendVerificationLink, getAllUsers, login, makeAdmin, superAdminAuth } = require("../controller/userController");
const { authenticate } = require("../middleware/authentication");
const { registerValidation } = require("../middleware/validator");
const passport = require("passport");
const jwt = require("jsonwebtoken");

userRouter.post("/register", registerValidation, register);
userRouter.get("/verify-user/:token", verifyUser);
userRouter.get("/resend-verification", resendVerificationLink);
// userRouter.get("/users", authenticate, getAllUsers);
userRouter.get("/users", getAllUsers);
userRouter.post("/login", login);
userRouter.patch('/users/:id', authenticate, superAdminAuth, makeAdmin);
userRouter.get("/googleAuthenticate", passport.authenticate("google", { scope: ["profile", "email"] }));
userRouter.get("/auth/google/login", passport.authenticate("google"), async(req, res) => {
    const token = await jwt.sign({ userId: req.user._id, isVerified: req.user.isVerified}, process.env.JWT_SECRET, {expiresIn: "1day"});
    // res.redirect(`http://localhost:3000/verify-user/${token}`);
    res.status(200).json({
        message: "GoogleAuth Login Successful",
        data: req.user,
        token
    });
});

module.exports = userRouter;