// require('dotenv').config();
// const { MongoClient } = require("mongodb");
// const fs = require("fs");

// const uri = process.env.DATABASE_URL;
// const client = new MongoClient(uri);

// async function uploadDocument() {
//   try {
//     // Read and parse the JSON file
//     const rawData = fs.readFileSync("question.json", "utf8");
//     const data = JSON.parse(rawData);

//     // Remove _id if present (MongoDB will generate a new one)
//     if (data._id) delete data._id;

//     // Ensure year is a number
//     if (typeof data.year === "string") {
//       data.year = Number(data.year);
//     }

//     // Ensure subjectName is an array
//     if (typeof data.subjectName === "string") {
//       data.subjectName = [data.subjectName];
//     }

//     await client.connect();
//     const db = client.db("Question");
//     const collection = db.collection("questionsV2");

//     const result = await collection.insertOne(data);

//      if (result.insertedId) {
//       console.log(`✅ Upload successful! Inserted with _id: ${result.insertedId}`);
//     } else {
//       console.log("⚠️ Upload did not return an insertedId.");
//     }
//   } catch (err) {
//     console.error("❌ Error:", err);
//   } finally {
//     await client.close();
//   }
// }

// uploadDocument();

require('dotenv').config();
const { MongoClient, ObjectId } = require("mongodb");
const fs = require("fs");
const path = require("path");

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

function isValidObjectIdString(id) {
    if (typeof id !== 'string' || id.length !== 24) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
}

function getValidIdString(id) {
    if (typeof id === 'string' && isValidObjectIdString(id)) return id;
    if (id && typeof id === 'object' && typeof id.$oid === 'string' && isValidObjectIdString(id.$oid)) {
        return id.$oid;
    }
    return null;
}

function cleanOptionText(text) {
    if (typeof text !== 'string') return text;
    const cleaningRegex = /^\s*([a-zA-Z\d]{1,2})[.)]\s*/;
    return text.replace(cleaningRegex, '').trim();
}

async function upsertDocument(filename = 'question.json') {
    const filePath = path.resolve(filename);

    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }

    const rawData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(rawData);

    if (!data || typeof data !== 'object') {
        throw new Error('Invalid JSON data. Expected an object.');
    }

    const topLevelIdString = getValidIdString(data._id);
    let filter;

    if (topLevelIdString) {
        filter = { _id: new ObjectId(topLevelIdString) };
        console.log(`[Filter] Using top-level _id: ${topLevelIdString}`);
    } else {
        if (!data.subjectName) {
            throw new Error('Missing subjectName in JSON.');
        }

        const subjectNameArray = Array.isArray(data.subjectName)
            ? data.subjectName
            : [data.subjectName];

        const year = Number(data.year);
        if (!Number.isFinite(year)) {
            throw new Error('Invalid year value in JSON.');
        }

        filter = {
            subjectName: { $in: subjectNameArray },
            year: { $in: [year, String(year)] },
        };

        console.log(`[Filter] Using flexible subjectName/year: ${JSON.stringify(filter)}`);
    }

    delete data._id;
    data.year = Number(data.year);
    if (typeof data.subjectName === 'string') {
        data.subjectName = [data.subjectName];
    }

    if (!Array.isArray(data.questions)) {
        throw new Error('Invalid JSON structure: questions must be an array.');
    }

    data.questions = data.questions.map((q) => {
        const questionData = { ...q };
        const existingIdString = getValidIdString(questionData._id);

        if (existingIdString) {
            questionData._id = new ObjectId(existingIdString);
        } else {
            questionData._id = new ObjectId();
            console.log(`[ID Info] Generated new question _id for number ${questionData.number || 'N/A'}`);
        }

        if (Array.isArray(questionData.options)) {
            questionData.options = questionData.options.map(cleanOptionText);
        }

        return questionData;
    });

    const updateOperation = { $set: data };

    await client.connect();
    const db = client.db('Question');
    const collection = db.collection('questionsV2');

    console.log('Data to replace:', JSON.stringify(data, null, 2));

    const result = await collection.replaceOne(filter, data, { upsert: true });

    if (result.upsertedCount === 1) {
        console.log(`\n✅ INSERT SUCCESS: New document created with _id: ${result.upsertedId._id || result.upsertedId}`);
    } else if (result.modifiedCount === 1) {
        console.log('\n✅ UPDATE SUCCESS: Existing document matched and modified.');
    } else if (result.matchedCount === 1 && result.modifiedCount === 0) {
        console.log('\n✅ DATA ALREADY MATCHED: Document matched, but no changes were necessary.');
    } else {
        console.log('\n⚠️ OPERATION WARNING: Unexpected result from MongoDB upsert.');
        console.log(result);
    }
}

const filename = process.argv[2] || 'question.json';
upsertDocument(filename).catch((err) => {
    console.error('❌ Upload failed:', err.message || err);
    process.exit(1);
});