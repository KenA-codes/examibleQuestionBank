/**
 * fix_nan_years.js
 * Finds all documents in questionsV2 where year is NaN (corrupt upload data),
 * reports them, and deletes them so the aggregation pipelines stop crashing.
 * 
 * Run with: node fix_nan_years.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const col = mongoose.connection.db.collection('questionsV2');

  // NaN != NaN is true — so we use $expr to find docs where year !== year
  const nanDocs = await col.find({
    $expr: { $ne: ['$year', '$year'] }
  }).toArray();

  if (nanDocs.length === 0) {
    console.log('✅ No documents with NaN year found. Database is clean.');
    await mongoose.disconnect();
    return;
  }

  console.log(`\n⚠️  Found ${nanDocs.length} document(s) with year: NaN:\n`);
  nanDocs.forEach((doc, i) => {
    console.log(`  ${i + 1}. _id: ${doc._id} | subject: ${JSON.stringify(doc.subjectName)} | questions: ${doc.questions?.length || 0}`);
  });

  // --- DELETE THEM ---
  const ids = nanDocs.map(d => d._id);
  const result = await col.deleteMany({ _id: { $in: ids } });
  console.log(`\n🗑️  Deleted ${result.deletedCount} corrupt document(s).`);
  console.log('✅ Done. Re-upload the affected questions with the correct year.');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Script error:', err.message);
  process.exit(1);
});
