const mongoose = require('mongoose');

// Define IELTS Schema locally if not exported
const ieltsSchema = new mongoose.Schema({
  subjectName: [String],
  year: Number,
  month: String,
  practiceTestNumber: Number,
  testId: String,
  title: String,
  parts: Array,
  sections: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const IELTSModel = mongoose.models.IELTSMockTest || mongoose.model('IELTSMockTest', ieltsSchema, 'ielts_mock_tests');

exports.getIeltsMockTest = async (req, res) => {
  try {
    const { year, month, practiceTestNumber } = req.params;
    
    const normalizedMonth = month ? (month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()) : month;

    const doc = await IELTSModel.findOne({ 
      year: Number(year), 
      month: normalizedMonth, 
      practiceTestNumber: Number(practiceTestNumber) 
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "IELTS mock test not found" });
    }

    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getIeltsSection = async (req, res) => {
  try {
    const { year, month, practiceTestNumber, sectionType } = req.params;
    
    const normalizedMonth = month ? (month.charAt(0).toUpperCase() + month.slice(1).toLowerCase()) : month;

    const doc = await IELTSModel.findOne({ 
      year: Number(year), 
      month: normalizedMonth, 
      practiceTestNumber: Number(practiceTestNumber) 
    });

    if (!doc) {
      return res.status(404).json({ success: false, message: "IELTS mock test not found" });
    }

    // Try to find in parts array case-insensitively
    let section = doc.parts && doc.parts.find(p => p.sectionType && p.sectionType.toLowerCase() === sectionType.toLowerCase());

    // Fall back to sections object case-insensitively
    if (!section && doc.sections) {
      const secKey = Object.keys(doc.sections).find(k => k.toLowerCase() === sectionType.toLowerCase());
      if (secKey && doc.sections[secKey]) {
        section = doc.sections[secKey];
      }
    }

    if (!section) {
       return res.status(404).json({ success: false, message: `Section ${sectionType} not found in this test` });
    }

    return res.status(200).json({ success: true, data: section });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.listIeltsMockTests = async (req, res) => {
  try {
    const tests = await IELTSModel.find({}, { year: 1, month: 1, practiceTestNumber: 1, title: 1, isPublished: 1 }).lean();
    return res.status(200).json({ success: true, data: tests });
  } catch (err) {
    console.error("Error listing IELTS mock tests:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

