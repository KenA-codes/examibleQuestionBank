const questionModel = require("../model/question");
const textract = require("textract");
const filePath = "../uploads/sample.docx";
const multer = require("multer");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const mammoth = require("mammoth");

exports.createQuestion = async (req, res) => {
  try {
    const { subjectName, year, question } = req.body;

    const user = new questionModel({
      id: uuid(),
      subjectName,
      year,
      question,
    });

    return res.status(200).json({
      message: "Question Created Successfully",
      data: question,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// exports.uploadQuestions = async (req, res) => {
//   try {
//     const { subjectName, year } = req.body;

//     if (!req.file) {
//       return res.status(400).json({ 
//         message: "No file uploaded" 
//       });
//     }

//     const questions = await readDOCX(req.file.path);

//     if (questions.length === 0) {
//       return res.status(400).json({ 
//         message: "No questions found in file" 
//       });
//     }

//     // Create a new document in MongoDB
//     const newEntry = new questionModel({
//       subjectName: subjectName || "Unknown Subject",
//       year,
//       question: questions,
//     });

//     await newEntry.save();

//     res.status(201).json({
//       message: "Questions saved successfully",
//       data: newEntry,
//     });
//   } catch (error) {
//     console.error("Error processing file:" + error.message);
//     res.status(500).json({ 
//       message: "Internal Server Error" 
//     });
//   }
// };


// const readDOCX = async (filePath) => {
//   try {
//     const text = await textract.fromFileWithPath(filePath);
//     if (!text) throw new Error("No content extracted from file");

//     const lines = text.split("\n").filter((line) => line.trim() !== "");

//     return {
//       questions: lines.map((line, index) => ({
//         id: index + 1,
//         question: line.trim(),
//       })),
//     };
//   } catch (error) {
//     console.error("Error reading DOCX:", error.message);
//     return null;
//   }
// };

exports.uploadQuestions = async (req, res) => {
  try {
    const filePath = req.file.path; // Ensure your multer middleware handles this correctly

    const result = await readDOCX(filePath);

    if (!result) {
      return res.status(400).json({ 
        message: "Failed to extract questions" 
      });
    }

    const { subjectName, year } = req.body; // Assuming these are sent from frontend

    const newQuestion = new questionModel({
      subjectName,
      year,
      question: result.questions.map((q) => q.question), // Extract only the question text
    });

    await newQuestion.save();

     // Delete the file after processing
     await fs.promises.unlink(filePath);
     console.log("Temporary file deleted successfully");

    res.status(201).json({ 
      message: "Questions uploaded successfully!",
      data: newQuestion
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error processing file", error: error.message 
    });
  }
};

const readDOCX = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error("File does not exist");
    }

    const buffer = fs.readFileSync(filePath);
    const { value: text } = await mammoth.extractRawText({ buffer });

    if (!text || text.trim() === "") throw new Error("No content extracted from file");

    // Split the text into individual questions using regex to match numbered patterns
    const questions = text
      .split(/\n(?=\d+[\.\s])/) // Splits at new lines followed by a number
      .filter((q) => q.trim() !== "")
      .map((q, index) => ({
        id: index + 1,
        question: q.trim(),
      }));

    return { questions };
  } catch (error) {
    console.error("Error reading DOCX:", error.message);
    return null;
  }
};

exports.getQuestionsByYearAndSubject = async (req, res) => {
  try {
    const { year, subjectName } = req.params; 

    if (!year || !subjectName) {
      return res.status(400).json({
        message: "Year and Subject Name are required",
      });
    }

    const questions = await questionModel.findOne({
      year,
      subjectName: { $regex: new RegExp(subjectName, "i") }, // Case-insensitive match
    });

    if (!questions) {
      return res.status(404).json({
        message: "No questions found for the specified year and subject",
      });
    }

    return res.status(200).json({
      message: "Questions retrieved successfully",
      data: questions,
    });
  } catch (error) {
    console.error("Error fetching questions:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
