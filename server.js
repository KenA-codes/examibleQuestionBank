const express = require('express');
require('dotenv').config();
require('./config/database');
const PORT = process.env.PORT;
const questionRouter = require('./routes/questionRouter');


const app = express();
app.use(express.json());




// app.use('/api/v1', userRouter);

app.use(questionRouter);


app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});