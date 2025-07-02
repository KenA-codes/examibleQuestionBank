require('dotenv').config();
const { MongoClient } = require("mongodb");
const fs = require("fs");

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function uploadDocument() {
  try {
    // Read and parse the JSON file
    const rawData = fs.readFileSync("question.json", "utf8");
    const data = JSON.parse(rawData);

    // Remove _id if present (MongoDB will generate a new one)
    if (data._id) delete data._id;

    // Ensure year is a number
    if (typeof data.year === "string") {
      data.year = Number(data.year);
    }

    // Ensure subjectName is an array
    if (typeof data.subjectName === "string") {
      data.subjectName = [data.subjectName];
    }

    await client.connect();
    const db = client.db("Question");
    const collection = db.collection("questionsV2");

    const result = await collection.insertOne(data);

     if (result.insertedId) {
      console.log(`✅ Upload successful! Inserted with _id: ${result.insertedId}`);
    } else {
      console.log("⚠️ Upload did not return an insertedId.");
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

uploadDocument();