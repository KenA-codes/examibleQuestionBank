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

    if (!result || result.questions.length === 0 || !result.questions) {
      return res.status(400).json({ 
        message: "Failed to extract questions" 
      });
    }

    const { subjectName, year } = req.body; // Assuming these are sent from frontend

     // Map the questions into the expected format
    //  const newQuestions = result.questions.map((q) => ({
    //   question: q.question,
    //   options: q.options,  // Ensure options are being mapped correctly
    //   answer: ""           // Placeholder for answer if required
    // }));

    const newQuestion = new questionModel({
      subjectName,
      year,
      // question: result.questions.map((q) => q.question), // Extract only the question text
      questions: result.questions
      // questions: newQuestions
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
    const buffer = fs.readFileSync(filePath);
    const { value: text } = await mammoth.extractRawText({ buffer });

    if (!text || text.trim() === "") throw new Error("No content extracted");

    console.log("Extracted Text:\n", text);

    const subheadings = [];
    const subheadingRegex = /Use the (diagram|graph) below to answer questions (\d+) and (\d+)/g;
    let subheadingMatch;
    while ((subheadingMatch = subheadingRegex.exec(text)) !== null) {
      subheadings.push({
        text: subheadingMatch[0],
        start: parseInt(subheadingMatch[2]),
        end: parseInt(subheadingMatch[3]),
      });
    }

    const questionMatches = [...text.matchAll(/(\d+)\.\s*((?:.|\n)*?)(?=\d+\.\s|$)/g)];
    console.log("Number of questions found:", questionMatches.length);

    const questions = [];

    questionMatches.forEach((match) => {
      const questionNumber = parseInt(match[1]);
      const fullText = match[2].replace(/\n/g, " ").trim();

      const currentSubheading = subheadings.find(
        (s) => questionNumber >= s.start && questionNumber <= s.end
      )?.text || null;

      const questionTextMatch = fullText.match(/^(.*?)(?:\s*A\.\s)/);
      const questionText = questionTextMatch ? questionTextMatch[1].trim() : "";

      const optionRegex = /[A-D]\.\s(.*?)(?=\s+[A-D]\.|$)/g;
      const options = [];
      let optionMatch;
      while ((optionMatch = optionRegex.exec(fullText)) !== null) {
        options.push(optionMatch[1].trim());
      }

      if (options.length === 4) {
        questions.push({
          subheading: currentSubheading,
          question: questionText,
          options,
          answer: ""
        });
      }
    });

    console.log("Parsed Questions:", questions);

    return { questions };

  } catch (error) {
    console.error("Error in readDOCX:", error.message);
    return null;
  }
};




// const readDOCX = async (filePath) => {
//   try {
//     if (!fs.existsSync(filePath)) {
//       throw new Error("File does not exist");
//     }

//     const buffer = fs.readFileSync(filePath);
//     const { value: text } = await mammoth.extractRawText({ buffer });

//     if (!text || text.trim() === "") throw new Error("No content extracted from file");

//     // Split the text into individual questions using regex to match numbered patterns
//     const questions = text
//       .split(/\n(?=\d+[\.\s])/) // Splits at new lines followed by a number
//       .filter((q) => q.trim() !== "")
//       .map((q, index) => ({
//         id: index + 1,
//         question: q.trim(),
//       }));

//     return { questions };
//   } catch (error) {
//     console.error("Error reading DOCX:", error.message);
//     return null;
//   }
// };

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
