import { MongoClient } from 'mongodb';

async function run() {
  const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
  try {
    await client.connect();
    const db = client.db("rag_db");
    const collection = db.collection("test");
    console.log("Clearing your collection of any pre-existing data.");
    const deleteResult = await collection.deleteMany({});
    console.log("Deleted " + deleteResult.deletedCount + " documents");
  } catch (err) {
    console.log(err.stack);
  }
  finally {
    await client.close();
  }
}
run().catch(console.dir);
