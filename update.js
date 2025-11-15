// require('dotenv').config();
// const { MongoClient, ObjectId } = require("mongodb");
// const fs = require("fs");

// const uri = process.env.DATABASE_URL;
// const client = new MongoClient(uri);

// /**
//  * Checks if a given string is a valid 24-character hexadecimal MongoDB ObjectId string.
//  * @param {string} id The string to validate.
//  * @returns {boolean} True if valid, false otherwise.
//  */
// function isValidObjectIdString(id) {
//     if (typeof id !== 'string' || id.length !== 24) {
//         return false;
//     }
//     // Simple check: ObjectId strings must be 24 hex characters
//     return /^[0-9a-fA-F]{24}$/.test(id);
// }

// async function updateDocument() {
//     try {
//         // Read and parse the JSON file
//         const rawData = fs.readFileSync("question.json", "utf8");
//         const data = JSON.parse(rawData);

//         // Build filter using subjectName + year
//         const filter = {
//             subjectName: data.subjectName,
//             year: data.year
//         };

//         // Remove top-level _id if it exists in the JSON, as we are updating based on subject/year filter
//         delete data._id;

//         // Ensure each question sub-document has a proper ObjectId, preserving existing valid ones.
//         data.questions = data.questions.map(q => {
//             const questionData = { ...q };
//             let existingId = questionData._id;
            
//             // 1. Handle potential nested BSON ID format {"$oid": "..."}
//             if (existingId && existingId.$oid) {
//                 existingId = existingId.$oid;
//             }

//             // 2. Validate and convert the ID
//             if (isValidObjectIdString(existingId)) {
//                 // Preserve the existing valid ID
//                 questionData._id = new ObjectId(existingId);
//             } else {
//                 // Generate a brand new ObjectId if the ID is missing, null, or invalid (like an empty string "")
//                 questionData._id = new ObjectId();
//                 console.log(`[ID Warning] Generating new _id for question #${questionData.number || 'N/A'}`);
//             }

//             return questionData;
//         });

//         const update = { $set: data };

//         await client.connect();
//         const db = client.db("Question"); // same DB as upload
//         const collection = db.collection("questionsV2"); // same collection as upload

//         const result = await collection.updateOne(filter, update);

//         if (result.matchedCount === 0) {
//             console.log("⚠️ No matching document found for", filter);
//         } else {
//             console.log(`✅ Update complete!`);
//             console.log(`Matched: ${result.matchedCount}`);
//             console.log(`Modified: ${result.modifiedCount}`);
//         }
//     } catch (err) {
//         console.error("❌ Error:", err);
//     } finally {
//         await client.close();
//     }
// }

// updateDocument();


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
    // Simple check: ObjectId strings must be 24 hex characters
    return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Extracts a valid 24-char string ID from various potential formats (string, $oid object).
 * @param {*} id The ID to inspect.
 * @returns {string | null} A valid 24-char string or null.
 */
function getValidIdString(id) {
    if (typeof id === 'string' && isValidObjectIdString(id)) {
        return id;
    }
    if (typeof id === 'object' && id !== null && id.$oid && isValidObjectIdString(id.$oid)) {
        return id.$oid;
    }
    return null;
}


async function updateDocument() {
    try {
        // Read and parse the JSON file
        const rawData = fs.readFileSync("question.json", "utf8");
        const data = JSON.parse(rawData);

        // --- 1. Determine the Filter ---
        // Check for a valid top-level _id and use it for filtering if it exists.
        const topLevelIdString = getValidIdString(data._id);
        let filter;

        if (topLevelIdString) {
            // Use the top-level _id to find the document
            filter = { _id: new ObjectId(topLevelIdString) };
            console.log(`[Filter] Using top-level _id: ${topLevelIdString}`);
        } else {
            // Fallback to subjectName and year if no valid _id is in the JSON
            // ** FIX: Use $in for array matching on subjectName **
            filter = {
                subjectName: { $in: data.subjectName }, // Use $in to match elements in the array
                year: data.year
            };
            console.log(`[Filter] Using subjectName/year: ${data.subjectName} / ${data.year}`);
        }
        
        // Remove _id from the data object itself, as we don't want to $set it
        delete data._id;


        // --- 2. Process Nested Question IDs ---
        // Ensure each question sub-document has a proper ObjectId, preserving existing valid ones.
        data.questions = data.questions.map(q => {
            const questionData = { ...q };
            const existingIdString = getValidIdString(questionData._id);

            if (existingIdString) {
                // Preserve the existing valid ID
                questionData._id = new ObjectId(existingIdString);
            } else {
                // Generate a brand new ObjectId ONLY if the ID is missing or invalid
                questionData._id = new ObjectId();
                console.log(`[ID Warning] Generating new _id for question #${questionData.number || 'N/A'}`);
            }

            return questionData;
        });

        // --- 3. Perform the Update ---
        const update = { $set: data };

        await client.connect();
        const db = client.db("Question"); // Use your specific DB name
        const collection = db.collection("questionsV2");

        const result = await collection.updateOne(filter, update);

        if (result.matchedCount === 0) {
            console.log("⚠️ No matching document found for filter:", filter);
        } else {
            console.log(`✅ Update complete!`);
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