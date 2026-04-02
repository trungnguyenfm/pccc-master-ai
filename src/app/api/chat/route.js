import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SCRIPT } from '../../../../ai_script';

// Cấu hình Database Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cấu hình Trí tuệ AI Gemini bằng thư viện Google nguyên bản (Ngăn xung đột Verce-AI v6)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
  try {
    const { messages, projectInfo } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // 1. Dùng mô hình Embedding để tính toán tọa độ vector câu hỏi
    let contextText = '';
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const { embedding } = await embeddingModel.embedContent(lastMessage);
      
      const { data: documents, error } = await supabase.rpc('match_pccc_documents', {
        query_embedding: embedding.values,
        match_threshold: 0.60,
        match_count: 5
      });

      if (error) throw error;
      if (documents?.length) {
        contextText = documents.map(doc => `[Trích tài liệu LUẬT: ${doc.metadata.source}]\n${doc.content}`).join('\n\n');
      }
    } catch (err) {
      console.warn("⚠️ RAG Bypass hoặc Lỗi DB:", err.message);
    }

    // 3. Kéo lịch sử chat về định dạng chuẩn của Google (Native)
    const history = messages.slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }]
    }));

    // Tạo danh sách nguồn có đánh số để gửi về Frontend
    let sourceMap = [];
    let formattedContext = "KHÔNG TÌM THẤY TÀI LIỆU LIÊN QUAN.";
    
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const { embedding } = await embeddingModel.embedContent(lastMessage);
      
      const { data: documents, error } = await supabase.rpc('match_pccc_documents', {
        query_embedding: embedding.values,
        match_threshold: 0.55,
        match_count: 5
      });

      if (!error && documents?.length) {
        sourceMap = documents.map((doc, idx) => ({
          id: idx + 1,
          title: doc.metadata.source,
          content: doc.content
        }));
        formattedContext = sourceMap.map(s => `[Tài liệu ${s.id}: ${s.title}]\n${s.content}`).join('\n\n');
      }
    } catch (err) {
      console.warn("RAG Error:", err.message);
    }

    // 4. Nhồi Dữ liệu PCCC vào System Prompt (DỌN DẸP TRIỆT ĐỂ LẶP LỜI)
    const systemInstruction = `Bạn là Chuyên gia PCCC cao cấp.
QUY TẮC PHẢN HỒI:
1. TUYỆT ĐỐI KHÔNG lặp lại câu chào, không lặp lại yêu cầu của người dùng. 
2. Đi thẳng vào nội dung tư vấn theo cấu trúc gạch đầu dòng [1., 2., 3.].
3. NẾU TRẢ LỜI DỰA TRÊN TÀI LIỆU, bạn BẮT BUỘC phải chèn ký hiệu trích dẫn dạng [^ID] (Ví dụ: [^1], [^2]) vào cuối câu/đoạn trích dẫn. KHÔNG dùng định dạng khác.
4. Trình bày siêu ngắn gọn, ưu tiên con số và kết luận kỹ thuật.

THÔNG SỐ CÔNG TRÌNH:
- Quy mô: ${projectInfo?.scale || 'N/A'}
- Hạng/Bậc: ${projectInfo?.tier || 'A'} / ${projectInfo?.fireResistance || 'I'}
- Diện tích: ${projectInfo?.totalArea || 'N/A'}
- Chiều cao PCCC: AI TỰ TÍNH TOÁN DỰA TRÊN BẢNG (Tổng - Hầm - Tum).

DỮ LIỆU PHÁP LÝ (Hãy dùng các ID này để trích dẫn [^ID]):
${formattedContext}

${AI_SCRIPT.system_role.split('QUY TẮC ĐỌC LUẬT BẮT BUỘC:')[1] || ''}
`;

    const chatModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction
    });

    const chat = chatModel.startChat({ history });
    
    // 5. Mở Cổng truyền dữ liệu trực tiếp (Streaming)
    const streamResult = await chat.sendMessageStream(lastMessage);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // GỬI DANH SÁCH NGUỒN TRƯỚC (Protocol đặc biệt)
          if (sourceMap.length > 0) {
            const sourcesHeader = `SOURCES_DATA:${JSON.stringify(sourceMap)}@END_SOURCES@`;
            controller.enqueue(new TextEncoder().encode(sourcesHeader));
          }

          for await (const chunk of streamResult.stream) {
            controller.enqueue(new TextEncoder().encode(chunk.text()));
          }
          if (AI_SCRIPT.signature) {
            controller.enqueue(new TextEncoder().encode('\n' + AI_SCRIPT.signature));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error) {
    console.error('SERVER AI ERROR:', error);
    return new Response(JSON.stringify({ error: 'Lỗi AI: ' + error.message }), { status: 500 });
  }
}
