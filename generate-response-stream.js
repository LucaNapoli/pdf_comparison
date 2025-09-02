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
const NUM_CANDIDATES = 5;
const EXACT = false;
const LIMIT = 5; // Increased limit to get more context from multiple files

async function run() {
  try {
    const documents = await getQueryResults(QUESTION, NUM_CANDIDATES, EXACT, LIMIT, PDF_FILES);
    
    // Create a prompt consisting of the question and context to pass to the LLM
    const prompt = `You are a document comparison assistant in the automotive industry. You are provided with text chunks from two documents representing subsequent versions of the same pdf, one being an update to the other one. Your task is to compare them and answer the question based on the provided context.
      
      CRITICAL CITATION INSTRUCTIONS:
      - You MUST cite sources using this EXACT format: [number](chunk:chunk-id)
      - Example: "The emission limit is 0.05 g/km [1](chunk:ae9654c6-897a-49c8-82f5-1a99631893c5)."
      - Place citations at the END of sentences
      - Use the exact chunk IDs provided below
      - Do NOT create citations without chunk IDs
      - Do NOT use plain brackets like [1] without the (chunk:id) part
      
      Available sources with their chunk IDs:
      ${documents.map((doc, index) => `[${index + 1}] Chunk ID: ${doc.chunk_id}\nSource: ${path.basename(doc.source_pdf)}, Page: ${doc.page_number}\nText: ${doc.text}`).join('\n\n')}
      
      Considering that the outcome of the comparison will impact how the company will update the codebase of their system, make up a code update, specifying where the code is and what you recommend cahnging and how.

      Question: ${QUESTION}`;

    // Use Anthropic with streaming
    const anthropic = new Anthropic();
    
    const stream = anthropic.messages.stream({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4096,
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    // Handle the streaming response
    stream.on('text', (text) => {
        process.stdout.write(text);
    });

    await stream.finalMessage();
    
  } catch (err) {
    console.error(err.stack);
  }
}

run().catch(console.dir);
