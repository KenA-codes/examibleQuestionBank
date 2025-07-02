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

    // Convert _id and year to correct types
    const filter = { _id: new ObjectId(data._id.$oid) };
    // Remove _id from the update object to avoid immutable field error
    delete data._id;

    // If year is a string, convert to number
    if (typeof data.year === "string") {
      data.year = Number(data.year);
    }

    // If subjectName is a string, convert to array
    if (typeof data.subjectName === "string") {
      data.subjectName = [data.subjectName];
    }

    const update = { $set: data };

    await client.connect();
    const db = client.db("Question");
    const collection = db.collection("questionsV2");

    const result = await collection.updateOne(filter, update);

    console.log(`Matched: ${result.matchedCount}`);
    console.log(`Modified: ${result.modifiedCount}`);
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

updateDocument();
