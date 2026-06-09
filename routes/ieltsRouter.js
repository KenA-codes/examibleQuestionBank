const express = require('express');
const router = express.Router();
const { getIeltsMockTest, getIeltsSection, listIeltsMockTests } = require('../controller/ieltsController');

router.get("/ielts/tests", listIeltsMockTests);
router.get("/ielts/:year/:month/:practiceTestNumber", getIeltsMockTest);
router.get("/ielts/:year/:month/:practiceTestNumber/:sectionType", getIeltsSection);

module.exports = router;

