const multer = require("multer");
const questionRouter = require('express').Router();
const { uploadQuestions, getQuestionsByYearAndSubject, getAllSubjectsAndYears, getTaxonomyBySubject, getQuestionsByGroup, getClustersBySubject} = require('../controller/questionController');
const upload = multer({ dest: "uploads/" }); // Store uploaded files in the 'uploads' directory


questionRouter.post("/upload", upload.single("file"), uploadQuestions);
questionRouter.get("/questions/:year/:subjectNames", getQuestionsByYearAndSubject);
questionRouter.get("/allsubjects", getAllSubjectsAndYears);
questionRouter.get("/taxonomy/:subject", getTaxonomyBySubject);
questionRouter.get("/questions/group/:contextId", getQuestionsByGroup);
questionRouter.get("/clusters/:subject", getClustersBySubject);

module.exports = questionRouter;



