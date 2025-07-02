const mongoose = require("mongoose");
// const { type } = require('os');
const questionSchema = new mongoose.Schema(
  {
    subjectName: {
      type: [String],
      enum: [
        // "English Language",
        "English",
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
        "Social Studies",
      ],
    },
    year: {
      type: Number,
      required: true,
    },

    questions: [
      {
        number: {
          type: String,
        },
         // Optional image (for diagrams that comes before subheading)
        diagramUrlA: { 
            type: String 
        },
        subheading: {
          type: String,
        },
        // Optional image (for diagrams that comes after subheading)
        diagramUrlB: { 
            type: String 
        },
        // Text form of the question (can be empty if diagram is used)
        question: { 
            type: String 
        },
        options: { 
            type: [String], 
            required: true 
        },
        // The correct answer (e.g., "A", "B", etc.)
        answer: { 
            type: String, 
            default: "" 
        },
        // Stores AI-generated explanations (max 4)
        aiGeneratedResponses: {
          type: [String],
          default: [],
          // validate: {
          //   validator: function(v) {
          //     return v.length <= 4;
          //   },
          //   message: "Only 4 AI-generated responses are allowed."
          // }
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
