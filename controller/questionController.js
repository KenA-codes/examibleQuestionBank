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


exports.uploadQuestions = async (req, res) => {
  try {
    const filePath = req.file.path; // Ensure your multer middleware handles this correctly

    const result = await readDOCX(filePath);
    console.log("DOCX extraction result:", result);

    if (!result || result.questions.length === 0 || !result.questions) {
      return res.status(400).json({ 
        message: "Failed to extract questions" 
      });
    }

    // const { subjectName, year } = req.body; // Assuming these are sent from frontend
    let subjectName = req.body.subjectName;
    const year = req.body.year;


 // Ensure subjectName is always an array
 subjectName = Array.isArray(subjectName) ? subjectName : [subjectName];

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




//This is what was used fo the hackathon
const readDOCX = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const { value: text } = await mammoth.extractRawText({ buffer });

    if (!text || text.trim() === "") throw new Error("No content extracted");

    console.log("Extracted Text:\n", text);

    // Extract subheadings
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

    console.log("Subheadings found:", subheadings);

    // Extract questions using new pattern
    const questions = [];
    const questionPattern = /(.+?)\s*A\.\s*(.+?)\s*B\.\s*(.+?)\s*C\.\s*(.+?)\s*D\.\s*(.+?)\s*Answer:\s*([A-D])/gs;
    const questionMatches = [...text.matchAll(questionPattern)];
    console.log("Number of questions found:", questionMatches.length);

    questionMatches.forEach((match, i) => {
      const questionText = match[1].trim();
      const options = [match[2], match[3], match[4], match[5]].map((opt) => opt.trim());
      const answer = match[6].trim();

      const questionNumber = (i + 1).toString();

      const currentSubheading = subheadings.find(
        (s) => parseInt(questionNumber) >= s.start && parseInt(questionNumber) <= s.end
      )?.text || null;

      questions.push({
        number: questionNumber,
        subheading: currentSubheading,
        question: questionText,
        options,
        answer,
      });
    });

    console.log("New Extracted Questions:\n", questions);
    return { questions };

  } catch (error) {
    console.error("Error in readDOCX:", error.message);
    return null;
  }
};


//This was done before
// const readDOCX = async (filePath) => {
//   try {
//     const buffer = fs.readFileSync(filePath);
//     const { value: text } = await mammoth.extractRawText({ buffer });

//     if (!text || text.trim() === "") throw new Error("No content extracted");

//     console.log("Extracted Text:\n", text);

//     const subheadings = [];
//     const subheadingRegex = /Use the (diagram|graph) below to answer questions (\d+) and (\d+)/g;
//     let subheadingMatch;
//     while ((subheadingMatch = subheadingRegex.exec(text)) !== null) {
//       subheadings.push({
//         text: subheadingMatch[0],
//         start: parseInt(subheadingMatch[2]),
//         end: parseInt(subheadingMatch[3]),
//       });
//     }

//     const questionMatches = [...text.matchAll(/(\d+)\.\s*((?:.|\n)*?)(?=\d+\.\s|$)/g)];
//     console.log("Number of questions found:", questionMatches.length);

//     const questions = [];

//     questionMatches.forEach((match) => {
//       const questionNumber = parseInt(match[1]);
//       const fullText = match[2].replace(/\n/g, " ").trim();

//       const currentSubheading = subheadings.find(
//         (s) => questionNumber >= s.start && questionNumber <= s.end
//       )?.text || null;

//       const questionTextMatch = fullText.match(/^(.*?)(?:\s*A\.\s)/);
//       const questionText = questionTextMatch ? questionTextMatch[1].trim() : "";

//       const optionRegex = /[A-D]\.\s(.*?)(?=\s+[A-D]\.|$)/g;
//       const options = [];
//       let optionMatch;
//       while ((optionMatch = optionRegex.exec(fullText)) !== null) {
//         options.push(optionMatch[1].trim());
//       }

         


//     if (options.length === 4 && questionText) {
//       questions.push({
//         number: questionNumber.toString(),
//         subheading: currentSubheading,
//         question: questionText,
//         options,
//         answer: "", // Default answer field
//       });
//     }
//   });

//   console.log("New Extracted Questions:\n", questions);
//     return { questions };

    

//   } catch (error) {
//     console.error("Error in readDOCX:", error.message);
//     return null;
//   }
// };









exports.getQuestionsByYearAndSubject = async (req, res) => {
  try {
    const { year, subjectNames } = req.params; 
    const numYear = +year;

    if (!year || !subjectNames) {
      return res.status(400).json({
        message: "Year and Subject Name are required",
      });
    }

    const questions = await questionModel.findOne({
      year: numYear,
      subjectName: { $elemMatch: { $regex: `^${subjectNames}$`, $options: 'i' } },
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


// exports.getAllSubjectsAndYears = async (req, res) => {
//   try {
//     const subjects = await questionModel.distinct("subjectName");
//     const years = await questionModel.distinct("year");

//     return res.status(200).json({
//       message: "Subjects and Years retrieved successfully",
//       data: {
//         subjects,
//         years,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching subjects and years:", error.message);
//     return res.status(500).json({
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

exports.getAllSubjectsAndYears = async (req, res) => {
  try {
    const result = await questionModel.aggregate([
      {
        $group: {
          _id: "$subjectName",            
          years: { $addToSet: "$year" }   
        }
      },
      {
        $project: {
          _id: 0,
          subject: "$_id",
          years: 1
        }
      }
    ]);

    // Convert array to object (optional, if you prefer a map)
    const data = {};
    result.forEach(item => {
      data[item.subject] = item.years.sort(); // sort years if needed
    });

    return res.status(200).json({
      message: "Subjects and their years retrieved successfully",
      data
    });
  } catch (error) {
    console.error("Error fetching subjects and years:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
