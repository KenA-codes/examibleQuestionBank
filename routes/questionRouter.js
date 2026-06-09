const multer = require("multer");
const questionRouter = require('express').Router();
const { uploadQuestions, getQuestionsByYearAndSubject, getAllSubjectsAndYears, getTaxonomyBySubject, getQuestionsByGroup, getClustersBySubject, searchQuestions } = require('../controller/questionController');
const { getIeltsMockTest, getIeltsSection } = require('../controller/ieltsController');
const upload = multer({ dest: "uploads/" }); // Store uploaded files in the 'uploads' directory


questionRouter.post("/upload", upload.single("file"), uploadQuestions);
questionRouter.get("/search", searchQuestions); // New Search Route
questionRouter.get("/questions/group/:contextId", getQuestionsByGroup); // Specific route first
questionRouter.get("/questions/:year/:subjectNames", getQuestionsByYearAndSubject);
questionRouter.get("/allsubjects", getAllSubjectsAndYears);
questionRouter.get("/taxonomy/:subject", getTaxonomyBySubject);
questionRouter.get("/clusters/:subject", getClustersBySubject);

// IELTS Routes
questionRouter.get("/ielts/:year/:month/:practiceTestNumber", getIeltsMockTest);
questionRouter.get("/ielts/:year/:month/:practiceTestNumber/:sectionType", getIeltsSection);

module.exports = questionRouter;






