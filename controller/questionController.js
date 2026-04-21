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

/**
 * Retrieves the taxonomy (topics and subtopics) for a specific subject.
 * Uses aggregation to find unique pairs across all documents.
 */
exports.getTaxonomyBySubject = async (req, res) => {
  try {
    const { subject } = req.params;

    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }

    const taxonomy = await questionModel.aggregate([
      // Match the subject (case-insensitive)
      {
        $match: {
          subjectName: { $elemMatch: { $regex: `^${subject}$`, $options: 'i' } }
        }
      },
      // Unwind the questions array to treat each question individually
      { $unwind: "$questions" },
      // Group by topic and collect unique subtopics
      {
        $group: {
          _id: "$questions.topic",
          subTopics: { $addToSet: "$questions.subTopic" }
        }
      },
      // Clean up the output
      {
        $project: {
          _id: 0,
          topic: "$_id",
          subTopics: 1
        }
      },
      // Sort topics alphabetically
      { $sort: { topic: 1 } }
    ]);

    if (taxonomy.length === 0) {
      return res.status(404).json({ message: `No taxonomy found for subject: ${subject}` });
    }

    return res.status(200).json({
      message: "Taxonomy retrieved successfully",
      data: taxonomy
    });
  } catch (error) {
    console.error("Error fetching taxonomy:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Retrieves all questions that belong to a specific group/cluster.
 */
exports.getQuestionsByGroup = async (req, res) => {
  try {
    const { contextId } = req.params;

    if (!contextId) {
      return res.status(400).json({ message: "contextId is required" });
    }

    // Use raw collection driver to bypass Mongoose schema casting.
    // This prevents "Cast to Number failed for NaN" errors caused by
    // documents with corrupted year fields in the database.
    const result = await questionModel.collection.aggregate([
      // Filter out documents with bad year values defensively
      { $match: { year: { $type: "number" }, "questions.contextId": contextId } },
      // Unwind to inspect individual questions
      { $unwind: "$questions" },
      // Match exactly the questions belonging to the cluster
      { $match: { "questions.contextId": contextId } },
      // Project to flatten the output
      {
        $project: {
          _id: 0,
          subjectName: 1,
          year: 1,
          question: "$questions"
        }
      }
    ]).toArray();

    return res.status(200).json({
      message: "Grouped questions retrieved successfully",
      count: result.length,
      data: result
    });
  } catch (error) {
    console.error("Error fetching grouped questions:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * NEW: Retrieves unique question clusters (passages/diagrams) for a subject.
 */
exports.getClustersBySubject = async (req, res) => {
  try {
    const { subject } = req.params;

    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }

    const clusters = await questionModel.aggregate([
      // Match the subject (case-insensitive)
      {
        $match: {
          subjectName: { $regex: `^${subject}$`, $options: 'i' }
        }
      },
      // Unwind questions
      { $unwind: "$questions" },
      // Only questions with a contextId (grouped questions)
      { $match: { "questions.contextId": { $exists: true, $ne: null } } },
      // Group by contextId to get unique clusters
      {
        $group: {
          _id: "$questions.contextId",
          previewText: { $first: "$questions.subheadingA" },
          diagramUrl: { $first: "$questions.diagramUrlB" },
          year: { $first: "$year" },
          questionCount: { $sum: 1 }
        }
      },
      // Format output
      {
        $project: {
          _id: 0,
          contextId: "$_id",
          previewText: 1,
          diagramUrl: 1,
          year: 1,
          questionCount: 1
        }
      },
      // Sort (maybe by year or contextId)
      { $sort: { year: -1, contextId: 1 } }
    ]);

    return res.status(200).json({
      message: "Clusters retrieved successfully",
      count: clusters.length,
      data: clusters
    });
  } catch (error) {
    console.error("Error fetching clusters:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
