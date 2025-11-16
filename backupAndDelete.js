require('dotenv').config();
const { MongoClient } = require("mongodb");
const fs = require("fs").promises; // Use promises version of fs for async/await

// --- CONFIGURATION ---
const DB_NAME = "Question";
const COLLECTION_NAME = "questionsV2";
// const BACKUP_FOLDER = "./backups";
const BACKUP_FOLDER = "./probationList";

// Replace these values with the specific document you want to target
const SUBJECT_TO_DELETE = "English";
const YEAR_TO_DELETE = 2023;
// -----------------------

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function backupAndDeleteDocument() {
    let documentData = null;
    const filter = {
        subjectName: SUBJECT_TO_DELETE,
        year: YEAR_TO_DELETE
    };

    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        console.log(`Connecting to database '${DB_NAME}' and collection '${COLLECTION_NAME}'...`);

        // 1. FIND THE DOCUMENT
        console.log(`\n🔎 Searching for document: ${JSON.stringify(filter)}`);
        documentData = await collection.findOne(filter);

        if (!documentData) {
            console.log("⚠️ Document not found. No backup or deletion will occur.");
            return; // Exit if document isn't found
        }
        console.log("✅ Document found.");

        // 2. BACKUP THE DOCUMENT
        // Use subject name (converted to a safe file name) and year for the file
        const subjectFileName = Array.isArray(documentData.subjectName) 
            ? documentData.subjectName.join('_') 
            : documentData.subjectName;

        const fileName = `${subjectFileName}_${documentData.year}.json`;
        const filePath = `${BACKUP_FOLDER}/${fileName}`;
        
        // Ensure the backup folder exists
        await fs.mkdir(BACKUP_FOLDER, { recursive: true });

        // Convert the document (including its _id) to a formatted JSON string
        // The replacer function handles the conversion of BSON types like ObjectId
        const jsonContent = JSON.stringify(documentData, (key, value) => {
            if (value && value._bsontype === 'ObjectId') {
                // Convert ObjectId to a string representation for clean JSON backup
                return value.toString();
            }
            return value;
        }, 2); // '2' for 2-space indentation

        await fs.writeFile(filePath, jsonContent);
        console.log(`\n💾 Backup successful! Saved to: ${filePath}`);

        // 3. DELETE THE DOCUMENT
        const result = await collection.deleteOne(filter);

        if (result.deletedCount === 1) {
            console.log(`\n🔥 Deletion successful! 1 document removed from '${COLLECTION_NAME}'.`);
        } else {
            // This case should be rare if findOne was successful, but included for robustness
            console.log(`\n⚠️ Deletion warning: No document was deleted.`);
        }

    } catch (err) {
        console.error("❌ An error occurred:", err.message);
    } finally {
        await client.close();
        console.log("\nConnection closed.");
    }
}

backupAndDeleteDocument();