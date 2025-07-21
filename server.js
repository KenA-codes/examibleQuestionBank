const express = require('express');
require('dotenv').config();
const cors = require("cors");
require('./config/database');
const PORT = process.env.PORT;
const questionRouter = require('./routes/questionRouter');


const app = express();
app.use(express.json());

app.use(cors({ origin: "*", methods: "GET,HEAD,PUT,PATCH,POST,DELETE" }));



// app.use('/api/v1', userRouter);

app.use(questionRouter);


app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});