require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");

const uri = process.env.DATABASE_URL; 
const client = new MongoClient(uri);

// Read one JSON file (change filename each time you upload a new exam)
const data = JSON.parse(fs.readFileSync("question.json", "utf8"));

// Give each question its own ObjectId
data.questions = data.questions.map(q => ({ ...q, _id: new ObjectId() }));

async function run() {
  try {
    await client.connect();
    const db = client.db("Question"); // or "LegacyBuilderBackend" if you prefer
    const collection = db.collection("questionsV2");

    // Insert the entire exam document
    const result = await collection.insertOne(data);

    console.log("Inserted exam with _id:", result.insertedId);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
