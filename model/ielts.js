const mongoose = require("mongoose");

// ─────────────────────────────────────────────
// Sub-schema: A single question / task item
// Used across all 4 IELTS sections.
// ─────────────────────────────────────────────
const ieltsQuestionSchema = new mongoose.Schema(
  {
    // Sequential display number, e.g. "1", "2", "21"
    number: { type: String },

    // --- Context Block (shared across multiple questions) ---
    // A context passage, audio transcript excerpt, or instruction block.
    // Multiple questions can share the same contextId.
    contextId: { type: String, default: null },

    // Optional audio URL (for Listening section clips)
    audioUrl: { type: String, default: null },

    // Optional image / diagram
    imageUrl: { type: String, default: null },

    // The question stem / prompt text (supports HTML)
    questionText: { type: String },

    // Question format:
    //  'mcq'           – standard A/B/C/D multiple choice
    //  'fill-blank'    – fill in the blank (short answer)
    //  'true-false-ng' – True / False / Not Given (Reading)
    //  'matching'      – match headings / features
    //  'short-answer'  – write a word/phrase answer
    //  'task1-writing' – Writing Task 1 (graph/chart/diagram description)
    //  'task2-writing' – Writing Task 2 (essay)
    //  'speaking-part' – Speaking prompt (Part 1, 2, or 3)
    questionType: {
      type: String,
      enum: [
        "mcq",
        "fill-blank",
        "true-false-ng",
        "matching",
        "short-answer",
        "task1-writing",
        "task2-writing",
        "speaking-part",
      ],
      required: true,
    },

    // For MCQ: array of 4 option strings ["A. text", "B. text", ...]
    options: { type: [String], default: [] },

    // Correct answer:
    //  MCQ          → "A", "B", "C", or "D"
    //  fill-blank   → the exact word/phrase
    //  true-false-ng→ "True", "False", or "Not Given"
    //  matching     → matched label (e.g. "iv", "B")
    //  short-answer → accepted keyword(s) separated by "|" for OR
    //  Writing/Speaking → null (evaluated separately)
    answer: { type: String, default: null },

    // Band score criteria / model answer (for Writing & Speaking)
    modelAnswer: { type: String, default: null },

    // AI-generated explanation / tip (max 4 versions)
    aiGeneratedResponses: { type: [String], default: [] },

    // Topic / skill tag for analytics (e.g. "Main Idea", "Inference", "Grammar")
    topic: { type: String, default: "Uncategorised" },
  },
  { _id: false }
);

// ─────────────────────────────────────────────
// Sub-schema: One IELTS section (Listening/Reading/Writing/Speaking)
// ─────────────────────────────────────────────
const ieltsSectionSchema = new mongoose.Schema(
  {
    // 'Listening' | 'Reading' | 'Writing' | 'Speaking'
    sectionType: {
      type: String,
      enum: ["Listening", "Reading", "Writing", "Speaking"],
      required: true,
    },

    // Recommended duration in minutes for this section
    // Standard: Listening=30, Reading=60, Writing=60, Speaking=15
    durationMinutes: { type: Number, default: 60 },

    // For Listening: the main audio file for the whole section
    audioUrl: { type: String, default: null },

    // For Reading: the passage(s) text (supports HTML)
    // Multiple passages can be embedded here or referenced via contextId
    passageText: { type: String, default: null },

    // IELTS variant: 'Academic' | 'General Training' (defaults to 'Academic')
    variant: {
      type: String,
      enum: ["Academic", "General Training"],
      default: "Academic",
    },

    // The actual questions / tasks for this section
    questions: { type: [ieltsQuestionSchema], default: [] },

    // Total marks for this section (auto-derived, but store for quick lookup)
    totalMarks: { type: Number, default: 0 },
  },
  { _id: false }
);

// ─────────────────────────────────────────────
// Root Schema: One IELTS Practice Test
// e.g.  Year=2026, Month="January", practiceTestNumber=1
// ─────────────────────────────────────────────
const ieltsMockTestSchema = new mongoose.Schema(
  {
    // Publication year of this mock test package
    year: { type: Number, required: true },

    // Month label, e.g. "January", "February"
    month: {
      type: String,
      enum: [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December",
      ],
      required: true,
    },

    // Practice test number within this Year+Month package (1, 2, 3 …)
    practiceTestNumber: { type: Number, required: true, default: 1 },

    // Human-readable title, e.g. "IELTS Mock Test 2026 January – Practice Test 1"
    title: { type: String },

    // IELTS variant for the whole test (can be overridden per section)
    variant: {
      type: String,
      enum: ["Academic", "General Training", "Both"],
      default: "Academic",
    },

    // Optional difficulty / band target label
    targetBand: { type: String, default: null }, // e.g. "6.5", "7.0"

    // Metadata
    publishedOn: { type: Date, default: Date.now },
    testsTaken: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },

    // The four sections. A test may have 1-4 sections present.
    sections: {
      listening: { type: ieltsSectionSchema, default: null },
      reading:   { type: ieltsSectionSchema, default: null },
      writing:   { type: ieltsSectionSchema, default: null },
      speaking:  { type: ieltsSectionSchema, default: null },
    },

    // Exam body tag (always 'IELTS' here)
    examType: { type: String, default: "IELTS" },

    // Whether this test has been reviewed / published
    isPublished: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────
// Compound index: enforce unique test per year+month+practiceTestNumber
// ─────────────────────────────────────────────
ieltsMockTestSchema.index(
  { year: 1, month: 1, practiceTestNumber: 1 },
  { unique: true }
);

// ─────────────────────────────────────────────
// Pre-save hook: auto-generate title if not set
// ─────────────────────────────────────────────
ieltsMockTestSchema.pre("save", function (next) {
  if (!this.title) {
    this.title = `IELTS Mock Test ${this.year} ${this.month} – Practice Test ${this.practiceTestNumber}`;
  }
  next();
});

const IeltsMockTest = mongoose.model(
  "IeltsMockTest",
  ieltsMockTestSchema,
  "ielts_mock_tests"    // explicit collection name
);

module.exports = IeltsMockTest;
