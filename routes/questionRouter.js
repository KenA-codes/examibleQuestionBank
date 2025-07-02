const multer = require("multer");
const questionRouter = require('express').Router();
const { uploadQuestions, getQuestionsByYearAndSubject, getAllSubjectsAndYears} = require('../controller/questionController');
const upload = multer({ dest: "uploads/" }); // Store uploaded files in the 'uploads' directory


questionRouter.post("/upload", upload.single("file"), uploadQuestions);
questionRouter.get("/questions/:year/:subjectName", getQuestionsByYearAndSubject);
questionRouter.get("/subjects", getAllSubjectsAndYears);

module.exports = questionRouter;



