require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load API Keys
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const DOCS_DIR = 'd:\\tai-lieu-pccc'; // Bạn nhớ tạo thư mục này ở ổ D nhé!

// Hàm phân mảnh văn bản nhỏ lại
function getChunks(text, maxChars = 1000) {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = '';
  for (const word of words) {
    if ((currentChunk + ' ' + word).length > maxChars) {
      if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }
  if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
  return chunks;
}

// Hàm cốt lõi đọc và học tài liệu
async function processDocuments() {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    console.log(`Đã tạo thư mục kho tài liệu tại: ${DOCS_DIR}`);
    return;
  }

  const files = fs.readdirSync(DOCS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  if (files.length === 0) return console.log(`Chưa có file .pdf nào trong thư mục ${DOCS_DIR}`);

  console.log(`Bắt đầu dạy AI học từ ${files.length} tài liệu...`);
  
  for (const file of files) {
    console.log(`\nĐang đọc và mổ xẻ nội dung: ${file}`);
    const dataBuffer = fs.readFileSync(path.join(DOCS_DIR, file));
    try {
      const data = await pdf(dataBuffer);
      const chunks = getChunks(data.text, 1500); 
      
      for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i];
        try {
          const result = await embeddingModel.embedContent(chunkContent);
          await supabase.from('pccc_documents').insert({
            content: chunkContent,
            metadata: { source: file, chunk_index: i },
            embedding: result.embedding.values
          });
        } catch (e) {
          console.error(`  - Bỏ qua Lỗi chèn đoạn ${i}:`, e.message);
        }
      }
      console.log(`=> Đã học thuộc xong tài liệu: ${file}`);
    } catch (err) {
      console.error(`Lỗi không đọc được file PDF:`, err.message);
    }
  }
}

processDocuments();
