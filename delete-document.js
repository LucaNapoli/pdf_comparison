import { MongoClient } from 'mongodb';
import path from 'path';

async function run() {
  const pdfPath = process.argv[2];
  if (!pdfPath) {
    console.error('Please provide the path to a PDF file to delete from the database.');
    process.exit(1);
  }

  // Use the full path for matching, as stored during ingestion
  const fullPdfPath = path.resolve(pdfPath);

  const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
  try {
    await client.connect();
    const db = client.db("rag_db");
    const collection = db.collection("test");
    
    console.log(`Deleting documents from collection with source: ${pdfPath}`);
    const deleteResult = await collection.deleteMany({ source_pdf: pdfPath });
    console.log(`Deleted ${deleteResult.deletedCount} documents associated with ${pdfPath}`);

  } catch (err) {
    console.log(err.stack);
  }
  finally {
    await client.close();
  }
}

run().catch(console.dir);
