const GoogleStrategy = require('passport-google-oauth20').Strategy;
const passport = require('passport');
const userModel = require('../model/user');



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:4060/auth/google/login"
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
      let user = await userModel.findOne({email: profile.emails[0].value});
      if(!user){
        user = new userModel({
            fullName: profile.displayName,
            email: profile.email[0].value,
            isVerified: profile.emails[0].isVerified,
            password: ''
        });
        await user.save();
      }
      return cb(null, user);
  }catch (error) {
      console.log(error.message);
      return cb(error, null);
  }
  }
));

passport.serializeUser((user, cb) => {
    console.log('User Serialised:', user);
    cb(null, user._id);
});
  
  passport.deserializeUser(async (id, cb) => {
    try{
        const user = await userModel.findById(id);
        if(!user){
            return cb(new Error('User not found'), null);
        }
        cb(null, user);
    }catch (error) {
        console.log(error.message);
        return cb(error, null);
    }
  });

  module.exports = passport;