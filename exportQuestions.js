const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

// Define the schema
const questionSchema = new mongoose.Schema({}, { strict: false });
const QuestionModel = mongoose.model('Question', questionSchema, 'questionsV2');

// Create exports directory if it doesn't exist
const exportsDir = path.join(__dirname, 'exports');
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true });
}

async function exportAllQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(DATABASE_URL);
    console.log('Connected to Database');

    // Fetch all documents from questionsV2
    const allQuestions = await QuestionModel.find({});
    console.log(`Found ${allQuestions.length} documents to export`);

    // Save each document to its own file
    allQuestions.forEach((doc, index) => {
      const subjectName = Array.isArray(doc.subjectName) ? doc.subjectName[0] : doc.subjectName;
      const year = doc.year;
      const fileName = `${subjectName}_${year}_${index + 1}.json`;
      const filePath = path.join(exportsDir, fileName);

      // Format the document as shown in the example
      const formattedDoc = {
        _id: doc._id.toString(),
        subjectName: Array.isArray(doc.subjectName) ? doc.subjectName : [doc.subjectName],
        year: doc.year,
        questions: doc.questions || []
      };

      fs.writeFileSync(filePath, JSON.stringify(formattedDoc, null, 2));
      console.log(`✓ Exported: ${fileName}`);
    });

    console.log(`\n✓ All ${allQuestions.length} documents exported successfully to ./exports folder`);
    process.exit(0);

  } catch (error) {
    console.error('Error during export:', error.message);
    process.exit(1);
  }
}

// Run the export
exportAllQuestions();
