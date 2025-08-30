import { getQueryResults } from './retrieve-documents.js';
import { Anthropic } from "@anthropic-ai/sdk";
import path from 'path';

// The question and PDF paths are passed as command-line arguments.
const QUESTION = process.argv[2];
const PDF_FILES = process.argv.slice(3);

if (!QUESTION) {
  console.error('Please provide a question as the first command-line argument.');
  process.exit(1);
}

// Specify the search query parameters
const NUM_CANDIDATES = 40;
const EXACT = false;
const LIMIT = 10; // Increased limit to get more context from multiple files

async function run() {
  try {
    const documents = await getQueryResults(QUESTION, NUM_CANDIDATES, EXACT, LIMIT, PDF_FILES);
    
    // Uncomment below line to print out retrieved documents
    // console.log('Retrieved documents: ', documents);

    // Create a prompt consisting of the question and context to pass to the LLM
    const prompt = `You are a document comparison assistant. You are provided with text chunks from multiple documents. Your task is to compare them and answer the question based on the provided context. The source PDF for each chunk is provided.
      When answering, refer to the source PDF and page number for each piece of information. Format your references as clickable markdown links, like this: [Source: document.pdf, Page: 12](http://localhost:3000/uploads/document.pdf#page=12).
      Respond appropriately if the question cannot be feasibly answered without access to the full text.
      Acknowledge limitations when the context provided is incomplete or does not contain relevant information to answer the question.
      If you need to fill knowledge gaps using information outside of the context, clearly attribute it as such.
      Context: ${documents.map(doc => `Source: [${path.basename(doc.source_pdf)}, Page: ${doc.page_number}](http://localhost:3000/uploads/${path.basename(doc.source_pdf)}#page=${doc.page_number})\nText: ${doc.text}`).join('\n\n')}
      Question: ${QUESTION}`;

    // Substitute with your favorite LLM service provider as needed
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });
    console.log(response.content[0].text);
  } catch (err) {
    console.log(err.stack);
  }
}
run().catch(console.dir);