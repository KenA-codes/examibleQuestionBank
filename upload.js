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

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

/**
 * Checks if a given string is a valid 24-character hexadecimal MongoDB ObjectId string.
 * @param {string} id The string to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidObjectIdString(id) {
    if (typeof id !== 'string' || id.length !== 24) {
        return false;
    }
    return /^[0-9a-fA-F]{24}$/.test(id);
}

function cleanOptionText(text) {
    if (typeof text !== 'string') return text;
    // Regex matches: ^\s* (start + optional space), ([a-zA-Z\d]{1,2}) (letter or number), [.)]? (separator), \s* (optional space)
    const cleaningRegex = /^\s*([a-zA-Z\d]{1,2})[.)]?\s*/;
    
    return text.replace(cleaningRegex, '').trim();
}

async function upsertDocument() {
    try {
        // Read and parse the JSON file
        const rawData = fs.readFileSync("question.json", "utf8");
        const data = JSON.parse(rawData);

        // --- 1. PREPARE FILTER AND DATA ---

        // The filter uniquely identifies the document we want to update/insert.
        const filter = {
            subjectName: Array.isArray(data.subjectName) ? data.subjectName : [data.subjectName],
            year: Number(data.year)
        };

        // Remove top-level _id as we use subjectName/year for the upsert logic.
        delete data._id;
        
        // Ensure year is a number
        if (typeof data.year === "string") {
            data.year = Number(data.year);
        }

        // Ensure subjectName is an array
        if (typeof data.subjectName === "string") {
            data.subjectName = [data.subjectName];
        }

        // 2. ENSURE UNIQUE IDS FOR QUESTIONS (Robust Logic)
        data.questions = data.questions.map(q => {
            const questionData = { ...q };
            let existingId = questionData._id;
            
            if (existingId && existingId.$oid) {
                existingId = existingId.$oid;
            }

            if (isValidObjectIdString(existingId)) {
                // Preserve the existing valid ID
                questionData._id = new ObjectId(existingId);
            } else {
                // Generate a brand new ObjectId if the ID is missing, null, or invalid
                questionData._id = new ObjectId();
                // console.log(`[ID Info] Generating new _id for question #${questionData.number || 'N/A'}`); // Uncomment for debugging
            }

            // OPTION CLEANING (New Logic)
            if (Array.isArray(questionData.options)) {
                questionData.options = questionData.options.map(cleanOptionText);
            }

            return questionData;
        });
        
        // Use $set to replace the entire document content (questions array, etc.)
        const updateOperation = { $set: data };

        // --- 3. DATABASE UPSERT OPERATION ---
        
        await client.connect();
        const db = client.db("Question");
        const collection = db.collection("questionsV2");

        console.log(`Targeting: ${JSON.stringify(filter)}`);
        
        // Use updateOne with { upsert: true }
        const result = await collection.updateOne(filter, updateOperation, { upsert: true });

        // --- 4. REPORT RESULTS ---
        
        if (result.upsertedCount === 1) {
            console.log(`\n✅ INSERT SUCCESS: New document created with _id: ${result.upsertedId}`);
        } else if (result.modifiedCount === 1) {
            console.log(`\n✅ UPDATE SUCCESS: Existing document matched and modified.`);
            console.log(`Matched Count: ${result.matchedCount}`);
            console.log(`Modified Count: ${result.modifiedCount}`);
        } else if (result.matchedCount === 1 && result.modifiedCount === 0) {
            console.log(`\n✅ DATA ALREADY MATCHED: Document matched, but no changes were necessary.`);
        } else {
            console.log("\n⚠️ OPERATION WARNING: Something unexpected happened. Check logs.");
        }

    } catch (err) {
        console.error("❌ Critical Error during Upsert:", err);
    } finally {
        await client.close();
    }
}

upsertDocument();