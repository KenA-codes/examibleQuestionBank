require('dotenv').config();
const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function updateDocument() {
  try {
    // Read and parse the JSON file
    const rawData = fs.readFileSync("question.json", "utf8");
    const data = JSON.parse(rawData);

    // Build filter using subjectName + year
    const filter = {
      subjectName: data.subjectName,
      year: data.year
    };

    // Remove _id if it exists in the JSON
    delete data._id;

    // Ensure each question has an ObjectId
    data.questions = data.questions.map(q => ({
      ...q,
      _id: q._id ? new ObjectId(q._id.$oid || q._id) : new ObjectId()
    }));

    const update = { $set: data };

    await client.connect();
    const db = client.db("Question"); // same DB as upload
    const collection = db.collection("questionsV2"); // same collection as upload

    const result = await collection.updateOne(filter, update);

    if (result.matchedCount === 0) {
      console.log("⚠️ No matching document found for", filter);
    } else {
      console.log(`Matched: ${result.matchedCount}`);
      console.log(`Modified: ${result.modifiedCount}`);
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

updateDocument();
