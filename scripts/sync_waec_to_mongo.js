const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();
const Question = require('../model/question.js');

const SUBJECT_MAP = {
  'Agricultural_Science': 'Agricultural Science',
  'Biology': 'Biology',
  'Chemistry': 'Chemistry',
  'Christian_Religious_Studies': 'Christian Religious Studies (CRS)',
  'Civic_Education': 'Civic Education',
  'Commerce': 'Commerce',
  'Data_Processing': 'Data Processing',
  'Economics': 'Economics',
  'English_Language': 'English Language',
  'General_Mathematics': 'General Mathematics',
  'Government': 'Government',
  'Islamic_Studies': 'Islamic Studies',
  'Literature_in_English': 'Literature in English',
  'Physics': 'Physics'
};

async function syncWaecToMongo() {
  const waecDir = path.resolve(__dirname, '../exports/WAEC');
  const files = fs.readdirSync(waecDir).filter(f => f.endsWith('.json') && !f.includes('Taxonomy') && !f.includes('map') && !f.startsWith('image'));

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Connected to MongoDB successfully!');
  console.log(`Starting sync for ${files.length} WAEC examination papers...\n`);

  let syncedPapers = 0;
  let totalQuestions = 0;
  let errorCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const base = file.replace('.json', '');
    const parts = base.split('_');
    const series = parts[parts.length - 1]; // SC, PC1, PC2
    const year = parseInt(parts[parts.length - 2], 10);
    const subjectKey = parts.slice(0, parts.length - 2).join('_');
    const subjectName = SUBJECT_MAP[subjectKey];

    if (!subjectName || isNaN(year)) {
      console.error(`Skipping invalid file: ${file}`);
      errorCount++;
      continue;
    }

    try {
      const raw = fs.readFileSync(path.join(waecDir, file), 'utf8');
      const data = JSON.parse(raw);
      const rawQuestions = Array.isArray(data) ? data : data.questions;

      const normalizedQuestions = rawQuestions.map((q, idx) => ({
        number: String(q.number || q.questionNumber || (idx + 1)),
        question: (q.question || q.questionText || '').trim(),
        options: Array.isArray(q.options) ? q.options.map(opt => String(opt).trim()) : [],
        answer: (q.answer || q.correctOption || '').trim().toUpperCase(),
        explanation: (q.explanation || (q.aiGeneratedResponses && q.aiGeneratedResponses[3] ? q.aiGeneratedResponses[3].text : '')).trim(),
        aiGeneratedResponses: Array.isArray(q.aiGeneratedResponses) ? q.aiGeneratedResponses : [],
        topic: (q.topic || '').trim(),
        subTopic: (q.subTopic || q.subtopic || '').trim(),
        contextId: q.contextId || null,
        subheadingA: q.subheadingA || '',
        diagramUrlA: q.diagramUrlA || '',
        subheadingB: q.subheadingB || '',
        diagramUrlB: q.diagramUrlB || ''
      }));

      const filter = {
        examType: 'WAEC',
        subjectName: subjectName,
        year: year,
        series: series
      };

      const update = {
        $set: {
          subjectName: [subjectName],
          year: year,
          examType: 'WAEC',
          series: series,
          paperType: 'objective',
          institution: 'N/A',
          questions: normalizedQuestions
        }
      };

      await Question.findOneAndUpdate(filter, update, { upsert: true, new: true, runValidators: true });
      syncedPapers++;
      totalQuestions += normalizedQuestions.length;

      if ((i + 1) % 25 === 0 || i === files.length - 1) {
        console.log(`[Progress ${i + 1}/${files.length}] Synced ${syncedPapers} papers (${totalQuestions} questions)...`);
      }
    } catch (err) {
      console.error(`Error syncing ${file}:`, err.message);
      errorCount++;
    }
  }

  console.log('\n==================================================');
  console.log('       MONGODB SYNC COMPLETED SUCCESSFULLY!       ');
  console.log('==================================================');
  console.log(`Total WAEC Papers Synced: ${syncedPapers} / ${files.length}`);
  console.log(`Total Questions Injected: ${totalQuestions}`);
  console.log(`Errors Encountered: ${errorCount}`);

  await mongoose.disconnect();
  console.log('MongoDB disconnected.');
}

if (require.main === module) {
  syncWaecToMongo().catch(err => {
    console.error('Fatal sync error:', err);
    process.exit(1);
  });
}

module.exports = { syncWaecToMongo };
