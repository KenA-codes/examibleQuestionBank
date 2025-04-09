const express = require('express');
require('dotenv').config();
require('./config/database');
const PORT = process.env.PORT;
const userRouter = require('./routes/userRouter');
const roomRouter = require('./routes/roomRouter');
const categoryRouter = require('./routes/categoryRouter');
const questionRouter = require('./routes/questionRouter');
const EXPRESS_SECRET = process.env.EXPRESS_SECRET;
const session = require('express-session');
const passport = require('passport');
require('./middleware/passport');


const app = express();
app.use(express.json());

app.use(session({
    secret: EXPRESS_SECRET,
    resave: false,
    saveUninitialized: false
})) 

app.use(passport.initialize());
app.use(passport.session());

// app.use('/api/v1', userRouter);
app.use(userRouter);
app.use(roomRouter);
app.use(categoryRouter);
app.use(questionRouter);


app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});