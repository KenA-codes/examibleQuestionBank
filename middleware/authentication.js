const jwt = require("jsonwebtoken");
require("dotenv").config();
const userModel = require("../model/user");
exports.authenticate = async (req, res, next) => {
    try {
        //Extract the token from the request header
        const auth = req.header("Authorization");

        //Check if token is provided
        if (auth === undefined) {
            return res.status(401).json({
                message: "Access denied, token must be provided",
            });
        }

        const token = auth.split(" ")[1];
        if(token === undefined){
            return res.status(401).json({
                message: "Access denied, token must be provided",
            });
        }
        //This line of code verifies if the token is still valid that is it has not expired
        const decodedToken = await jwt.verify(token, process.env.JWT_SECRET)

        //Checck fo the user and throw an error if the user is not found
        const user = await userModel.findById(decodedToken.userId);
        if(user === null){
            return res.status(404).json({
                message: "Authentication failed: User not found",
            });
        }

        // if(user.isAdmin === false){
        //     return res.status(403).json({
        //         message: "Unauthorized: Not an admin",
        //     });
        // }

        req.user = decodedToken;
        next();
     
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({
                message: "Sessiion timed-out, please login to continue",
            });
        }
        console.log(error.message);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};

exports.adminAuth = async (req, res, next) => {
    try{
        if(req.user.isAdmin === true){
            next();
        }else{
            return res.status(403).json({
                message: "Unauthorized: Not an admin",
            });
        }

    }catch(error){
        console.log(error.message);
        res.status(500).json({
            message: "Internal server error",
        });
    }
}