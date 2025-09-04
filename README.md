# PDF Comparison Assistant

An intelligent document analysis system that compares PDF documents using AI-powered vector search and provides actionable insights with clickable citations. Designed specifically for automotive industry regulatory compliance and standards management.

## 🚀 Features

- **AI-Powered Document Comparison**: Uses Claude LLM to analyze differences between document versions
- **Vector Search Integration**: MongoDB Atlas vector search for semantic document understanding
- **Clickable Citations**: Every AI insight links back to specific source material with modal previews
- **Streaming Interface**: Real-time response generation for improved user experience
- **Multi-Document Support**: Compare multiple PDF versions simultaneously
- **Code Recommendations**: Automatically suggests technical implementation changes
- **Regulatory Focus**: Specialized for automotive safety and emissions standards

## 🏗️ Architecture

- **Frontend**: Vanilla JavaScript with modern streaming UI
- **Backend**: Express.js server with RESTful API
- **Database**: MongoDB Atlas with vector search capabilities
- **AI/ML**: Anthropic Claude for analysis, Voyage AI for embeddings
- **Document Processing**: PDF parsing with intelligent chunking

## 📋 Prerequisites

- Node.js and npm installed
- MongoDB Atlas cluster (free M0 tier supported)
- API Keys:
  - [Voyage AI API key](https://docs.voyageai.com/docs/api-key-and-installation) for embeddings
  - [Anthropic API key](https://docs.anthropic.com/en/api/admin-api/apikeys/get-api-key) for LLM

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd pdf_comparison
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
ATLAS_CONNECTION_STRING=mongodb+srv://<username>:<password>@<cluster>.mongodb.net
VOYAGE_API_KEY=your_voyage_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 4. Create Vector Index

Set up the MongoDB Atlas vector search index:

```bash
node --env-file=.env build-vector-index.js
```

## 🚀 Usage

### 1. Start the Server
```bash
node --env-file=.env server.js
```

### 2. Access the Application
Open your browser and navigate to `http://localhost:3000`

### 3. Upload Documents
- Use the web interface to upload PDF documents
- The system automatically processes and indexes the content
- Supports multiple document versions for comparison

### 4. Ask Questions
- Enter questions about document differences
- Select which documents to compare
- Get real-time streaming responses with clickable citations

## 💼 Business Benefits

### Operational Efficiency
- **90% Time Reduction**: Automates manual document comparison processes
- **Scalable Analysis**: Process multiple large documents simultaneously
- **Error Elimination**: Consistent, AI-driven analysis reduces human error

### Regulatory Compliance
- **Standards Tracking**: Automatically identifies changes in safety/emissions standards
- **Impact Analysis**: Shows how updates affect existing systems
- **Audit Trail**: Maintains clear documentation chain for compliance

### Decision Support
- **Actionable Insights**: Provides specific code and system recommendations
- **Risk Assessment**: Identifies critical changes requiring immediate attention
- **Knowledge Retention**: Captures institutional knowledge in searchable format

## 🎯 Use Cases

- **Regulatory Affairs**: Track changes in automotive safety standards
- **Engineering Teams**: Understand technical requirement updates
- **Legal/Compliance**: Maintain audit trails for regulatory submissions
- **Product Management**: Assess impact of specification changes

## 🛠️ Technical Details

### File Structure
```
pdf_comparison/
├── server.js                    # Express server with streaming endpoints
├── generate-response.js         # Standard LLM response generation
├── generate-response-stream.js  # Streaming LLM response generation
├── ingest-data.js              # PDF processing and data ingestion
├── retrieve-documents.js       # Vector search functionality
├── build-vector-index.js       # MongoDB Atlas index creation
├── public/
│   ├── app.js                  # Frontend JavaScript with streaming
│   ├── styles.css              # UI styling with Lexend Deca font
│   └── index.html              # Web interface
└── uploads/                    # PDF storage directory
```

### API Endpoints

#### Standard Endpoints
- `POST /upload` - Upload PDF documents
- `GET /api/files` - List uploaded files
- `DELETE /api/files/:filename` - Delete specific file
- `GET /api/preview` - Get document chunk preview

#### Query Endpoints
- `POST /query` - Standard document comparison
- `POST /query-stream` - Streaming document comparison

### Key Technologies
- **Vector Embeddings**: Voyage AI for semantic search
- **LLM Processing**: Anthropic Claude 3.5 Haiku
- **Database**: MongoDB Atlas with vector search
- **Frontend**: Vanilla JS with marked.js for markdown rendering
- **Streaming**: HTTP chunked transfer encoding

## 🔧 Configuration

### Document Processing Settings
```javascript
// In ingest-data.js
const CHUNK_SIZE = 1000;     // Characters per chunk
const CHUNK_OVERLAP = 100;   // Overlap between chunks
```

### Search Parameters
```javascript
// In retrieve-documents.js
const NUM_CANDIDATES = 5;    // Vector search candidates
const LIMIT = 5;            // Max results returned
```

## 🚦 Development

### Adding New Features
1. Backend changes go in `server.js`
2. Frontend updates in `public/app.js`
3. LLM modifications in `generate-response*.js`
4. Styling updates in `public/styles.css`

### Testing
```bash
# Test document ingestion
node --env-file=.env ingest-data.js path/to/document.pdf

# Test vector search
node --env-file=.env retrieve-documents.js "your question"

# Test LLM response
node --env-file=.env generate-response.js "your question" path/to/document.pdf
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For questions or issues, please open a GitHub issue or contact the development team. 

## Procedure

### 1. Clone the repo

Create a copy of the repository on your machine.

### 2. Set up the environment

#### a. Install dependencies.

Run the following npm command
```shell
npm install
```

#### b. Update the values in the `.env` file.

Fill in the API keys for Voyage AI and Anthropic.

Your connection string should use the following format:

```shell
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

### 3. Create the database and collection and populate it with the data from your PDF

#### a. Copy your PDF into the directory.

#### b. Open `ingest-data.js` and replace values for `PDF_FILE`, `CHUNK_SIZE`, `CHUNK_OVERLAP` as required.

#### c. Run the following command.

```shell
node --env-file=.env ingest-data.js
```

### 4. Create the vector index

Run the following command to create the vector index in Atlas.

```shell
node --env-file=.env build-vector-index.js
```

### 5. Ask a question, retrieve vector search results, and get a response from the chatbot

#### a. Open `generate-response.js` and replace values for `QUESTION`, `NUM_CANDIDATES`, `EXACT`, `LIMIT` as required.

#### b. Run the following command.

```shell
node --env-file=.env generate-response.js
```

#### c. Repeat the current step if you want to ask a new question or change search query parameters.

#### d. Repeat step 3 if you want to change the data or data settings for the chatbot to answer from.

#### e. Uncomment line 17 to display the documents retrieved from running vector search.
