const mongoose = require('mongoose');
// const { type } = require('os');
const questionSchema = new mongoose.Schema({
    subjectName: {
        type: [String],
        enum: [ "English Language",
            "Mathematics",
            "Biology",
            "Physics",
            "Chemistry",
            "Literature in English",
            "Government",
            "Economics",
            "Commerce",
            "Christian Religious Studies (CRS)",
            "Islamic Religious Studies (IRS)",
            "Geography",
            "Agricultural Science",
            "History",
            "Civic Education",
            "Principles of Accounts",
            "Igbo",
            "Yoruba",
            "Hausa",
            "Computer Studies",
            "French",
            "Arabic",
            "Home Economics",
            "Fine Arts",
            "Physical and Health Education",
            "Music",
            "Business Studies",
            "Further Mathematics",
            "Social Studies"
        ],
      },
    year: {
        type: Number,
        required: true
    },
    questions: [{
        number: { type: String },
    subheading: { type: String },
    question: { type: String, required: true },
    options: { type: [String], required: true },
    answer: { type: String, default: "" }
    }]
}, {
    timestamps: true
});

const QuestionModel = mongoose.model("Question", questionSchema);
module.exports = QuestionModel;