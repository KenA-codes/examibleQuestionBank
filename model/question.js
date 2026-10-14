const mongoose = require("mongoose");
// const { type } = require('os');
const questionSchema = new mongoose.Schema(
  {
    subjectName: {
      type: [String],
      enum: [
        "English",
        "English Language",
        "Mathematics",
        "General Mathematics",
        "Biology",
        "Physics",
        "Chemistry",
        "Literature in English",
        "Government",
        "Economics",
        "Commerce",
        "Christian Religious Studies (CRS)",
        "CRK",
        "Islamic Religious Studies (IRS)",
        "Islamic Studies",
        "Geography",
        "Agricultural Science",
        "History",
        "Civic Education",
        "Principles of Accounts",
        "Igbo",
        "Yoruba",
        "Hausa",
        "Computer Studies",
        "Data Processing",
        "French",
        "Arabic",
        "Home Economics",
        "Fine Arts",
        "Physical and Health Education",
        "Music",
        "Business Studies",
        "Further Mathematics",
        "Social Studies",
        "DemoTest",
      ],
    },
    year: {
      type: Number,
      required: true,
    },
    examType: {
      type: String,
      default: "JAMB",
    },
    institution: {
      type: String,
      default: "N/A",
    },
    paperType: {
      type: String,
      default: "objective",
    },
    series: {
      type: String,
      default: "SC",
    },

    questions: [
      {
        number: {
          type: String,
        },
         // Optional image (for diagrams that comes before subheading)
         subheadingA: {
           type: String,
         },
        diagramUrlA: { 
            type: String 
        },
        // Optional image (for diagrams that comes after subheading)
        subheadingB: {
          type: String,
        },
        diagramUrlB: { 
            type: String 
        },
        // Text form of the question (can be empty if diagram is used)
        question: { 
            type: String 
        },
        diagramUrl: {
            type: String
        },
        scoreWeight: {
            type: String
        },
        sectionInstruction: {
            type: String
        },
        answerMarkingGuide: {
            type: String
        },
        subQuestions: {
            type: Array,
            default: []
        },
        options: { 
            type: [String], 
            required: false,
            default: []
        },
        // The correct answer (e.g., "A", "B", etc.)
        answer: { 
            type: String, 
            default: "" 
        },
        explanation: {
          type: String,
          default: ""
        },
        // Stores AI-generated explanations (max 4)
        aiGeneratedResponses: {
          type: [mongoose.Schema.Types.Mixed],
          default: [],
        },
        topic: {
          type: String,
          default: "Uncategorized",
        },
        subTopic: {
          type: String,
          default: "Uncategorized",
        },
        contextId: {
          type: String,
        },

      },
    ],
  },
  {
    timestamps: true,
  }
);

// const QuestionModel = mongoose.model("Question", questionSchema);
const QuestionModel = mongoose.model("Question", questionSchema, "questionsV2");
module.exports = QuestionModel;
