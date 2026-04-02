import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AI_SCRIPT } from '../../../../ai_script';

// Cấu hình Database Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Khởi tạo AI với API Key (Ưu tiên v1 ổn định nếu SDK hỗ trợ)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
  try {
    const { messages, projectInfo } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    // Log kiểm tra API Key (chỉ log 4 ký tự cuối)
    if (!process.env.GEMINI_API_KEY) {
      console.error("CRITICAL: GEMINI_API_KEY is missing!");
    } else {
      console.log("AI SYSTEM: Using key ending in:", process.env.GEMINI_API_KEY.slice(-4));
    }

    let sourceMap = [];
    let formattedContext = "KHÔNG TÌM THẤY TÀI LIỆU LIÊN QUAN.";
    
    try {
      // Dùng gemini-pro cho embedding nếu 001 lỗi
      const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
      const { embedding } = await embeddingModel.embedContent(lastMessage);
      
      const { data: documents, error } = await supabase.rpc('match_pccc_documents', {
        query_embedding: embedding.values,
        match_threshold: 0.52,
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

    const systemInstruction = `Bạn là Chuyên gia PCCC cao cấp.
QUY TẮC PHẢN HỒI:
1. ĐI THẲNG VÀO NỘI DUNG: Không chào hỏi, không lặp lại yêu cầu. 
2. TRÍCH DẪN [^ID]: Với mỗi kết luận, chèn ký hiệu [^ID] (Ví dụ: [^1]) vào cuối câu. 
3. KHÔNG LIỆT KÊ NGUỒN: Tuyệt đối không liệt kê danh sách tài liệu ở cuối (Hệ thống sẽ tự xử lý).
4. CHỮ KÝ DUY NHẤT: Kết thúc câu trả lời bằng một đường kẻ ngang "---" và nội dung bản quyền sau:
${AI_SCRIPT.signature}

THÔNG SỐ CÔNG TRÌNH:
- Quy mô: ${projectInfo?.scale || 'N/A'} - Bậc chịu lửa: ${projectInfo?.fireResistance || 'I'}
- Tổng diện tích: ${projectInfo?.totalArea || 'N/A'} - Hầm: ${projectInfo?.basementDepth || 0}m - Tum: ${projectInfo?.tumArea || 0}m2

DỮ LIỆU LUẬT (Dùng ID này để trích dẫn [^ID]):
${formattedContext}

${AI_SCRIPT.system_role.split('QUY TẮC PHẢN HỒI BẮT BUỘC:')[1] || ''}
`;

    // SỬ DỤNG ALIAS "flash-latest" ĐỂ GOOGLE TỰ CHỌN MODEL KHẢ DỤNG NHẤT
    const chatModel = genAI.getGenerativeModel({ 
      model: 'gemini-flash-latest', 
      systemInstruction
    });

    const history = (messages || []).slice(0, -1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content || '' }]
    }));

    const chat = chatModel.startChat({ history });
    
    let streamResult;
    try {
      streamResult = await chat.sendMessageStream(lastMessage);
    } catch (apiErr) {
      console.error("Gemini API Error Detail:", apiErr.message);
      
      // FALLBACK SANG PRO NẾU FLASH LỖI
      if (apiErr.message?.includes('404') || apiErr.message?.includes('not found')) {
         console.warn("Falling back to gemini-pro-latest...");
         const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro-latest', systemInstruction });
         const fallbackChat = fallbackModel.startChat({ history });
         streamResult = await fallbackChat.sendMessageStream(lastMessage);
      } else if (apiErr.message?.includes('429')) {
         return new Response('🚨 Google báo: Hết lượt dùng thử miễn phí. Sếp vui lòng đợi 1-2 phút rồi thử lại nhé.', { status: 429 });
      } else {
         throw apiErr;
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (sourceMap.length > 0) {
            controller.enqueue(new TextEncoder().encode(`SOURCES_DATA:${JSON.stringify(sourceMap)}@END_SOURCES@`));
          }
          for await (const chunk of streamResult.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
          controller.close();
        } catch (err) {
          console.error("Stream Error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
    });

  } catch (error) {
    console.error('SERVER FATAL ERROR:', error);
    return new Response(JSON.stringify({ error: 'Lỗi máy chủ PCCC: ' + error.message }), { status: 500 });
  }
}
