require('dotenv').config();
const { MongoClient, ObjectId } = require("mongodb");

// --- CONFIGURATION ---
const DB_NAME = "Question";
const COLLECTION_NAME = "questionsV2";
// -----------------------

const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

async function deleteDuplicateDocuments() {
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);

        console.log(`Connecting to database '${DB_NAME}' to find and delete duplicates in '${COLLECTION_NAME}'.`);
        
        // 1. AGGREGATION: Find all documents that have duplicates
        // We group by the unique identifiers (subjectName and year) and count them.
        // We look for groups where the count is greater than 1.
        console.log("\n🔎 Starting search for duplicate groups...");
        
        const duplicates = await collection.aggregate([
            {
                $group: {
                    _id: { subject: "$subjectName", year: "$year" },
                    // $push stores all the IDs for a given group (subject/year combination)
                    duplicateIds: { $push: "$_id" }, 
                    count: { $sum: 1 }
                }
            },
            {
                // Filter to keep only the groups that have more than one document
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]).toArray();

        if (duplicates.length === 0) {
            console.log("✅ No duplicate documents found based on subjectName and year. Operation complete.");
            return;
        }

        console.log(`\nFound ${duplicates.length} groups of duplicated documents.`);
        let totalDeletedCount = 0;

        // 2. ITERATION: Process each duplicate group
        for (const group of duplicates) {
            // IDs are MongoDB ObjectIds, which contain a timestamp.
            // By sorting the IDs by their natural order, the LAST ID is usually the newest one inserted.
            // We want to KEEP the newest one and DELETE the older ones.
            
            // Sort the IDs to find the oldest. Array sorting keeps the newest one at the highest index.
            const sortedIds = group.duplicateIds.sort((a, b) => a.getTimestamp() - b.getTimestamp());
            
            // We keep the last/newest ID (the canonical document)
            const keepId = sortedIds.pop(); 
            // The remaining IDs in the array are the duplicates we need to delete
            const deleteIds = sortedIds; 

            if (deleteIds.length > 0) {
                console.log(`\n--- Deleting duplicates for: ${group._id.subject} (${group._id.year}) ---`);
                console.log(`Keeping document with _id: ${keepId}`);
                console.log(`Deleting ${deleteIds.length} older duplicates...`);

                // 3. DELETION: Use $in to delete all identified duplicate IDs at once
                const deleteResult = await collection.deleteMany({
                    _id: { $in: deleteIds }
                });

                totalDeletedCount += deleteResult.deletedCount;
                console.log(`🔥 Successfully deleted ${deleteResult.deletedCount} documents.`);
            }
        }

        console.log("\n--- Final Summary ---");
        console.log(`Total duplicate documents deleted: ${totalDeletedCount}`);
        console.log("Database cleanup finished.");

    } catch (err) {
        console.error("❌ Critical Error during duplicate deletion process:", err);
    } finally {
        await client.close();
    }
}

deleteDuplicateDocuments();