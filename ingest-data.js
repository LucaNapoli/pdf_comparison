import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { getEmbedding } from './get-embeddings.js';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const PDF_PATH = process.argv[2];

if (!PDF_PATH) {
  console.error('Please provide a path to a PDF file.');
  process.exit(1);
}

async function run() {
  try {
    // Use PDFLoader to load the PDF and extract the text
    const loader = new PDFLoader(PDF_PATH, {
      splitPages: true,
      parsedItemSeparator: ""
    });
    const docs = await loader.load();

    // Use RecursiveCharacterTextSplitter to split the text into chunks
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 100,
    });
    const chunks = await splitter.splitDocuments(docs);

    // Connect to your Atlas cluster
    const client = new MongoClient(process.env.ATLAS_CONNECTION_STRING);
    await client.connect();
    const db = client.db("rag_db");
    const collection = db.collection("test");

    // Create an array of documents to insert into the collection
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.pageContent);
      chunk.metadata.source_pdf = PDF_PATH;
      chunk.metadata.chunk_id = uuidv4(); // Add unique ID to each chunk
      await collection.insertOne({
        text: chunk.pageContent,
        page_number: chunk.metadata.loc.pageNumber,
        source_pdf: chunk.metadata.source_pdf,
        chunk_id: chunk.metadata.chunk_id,
        vector_embeddings: embedding
      });
    }
    
    console.log('Data ingestion and embedding complete.');
    await client.close();
  } catch (err) {
    console.error(err.stack);
  }
}

run();

