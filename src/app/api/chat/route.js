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

    // 4. Nhồi Dữ liệu PCCC vào System Prompt
    const systemInstruction = `${AI_SCRIPT.system_role}

--- THÔNG SỐ ĐẦU VÀO ĐÃ CÓ (Tự động thu thập từ Form bên trái màn hình) ---
(AI hãy dựa vào đây để không hỏi lại những câu đã có số liệu):
- Quy mô: ${projectInfo?.scale || '(Chưa điền)'}
- Hạng sản xuất: ${projectInfo?.tier || '(Chưa điền)'}
- Diện tích sàn/Tổng diện tích: ${projectInfo?.area || '(Chưa điền)'} / ${projectInfo?.totalArea || '(Chưa điền)'}
- Bậc chịu lửa: ${projectInfo?.fireResistance || '(Chưa điền)'}
- Chiều cao PCCC: ${projectInfo?.height || '(Chưa điền)'}
- Công năng / Tum / Hầm (có thể có hoặc ko): ${projectInfo?.logic || '(Chưa điền)'}

--- QUY CHUẨN ĐƯỢC TRA CỨU TỪ HỆ THỐNG KIỂM TRA PCCC LÕI ---
(AI chỉ dùng để tự tham khảo kết luận, TUYỆT ĐỐI không được Trích xuất nguồn nếu Người dùng chưa hối thúc):
${contextText || '(Không tìm thấy quy chuẩn liên kết mật thiết)' }
`;

    const chatModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction
    });

    const chat = chatModel.startChat({ history });
    
    // 5. Mở Cổng truyền dữ liệu trực tiếp (Streaming)
    const streamResult = await chat.sendMessageStream(lastMessage);

    // Ép luồng dữ liệu về tương thích hoàn hảo với giao diện @ai-sdk/react (Định dạng Vercel Stream Data 0:"chữ")
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult.stream) {
            controller.enqueue(new TextEncoder().encode(chunk.text()));
          }
          // Chèn chữ ký "Đóng gói" cuối cùng từ biến kịch bản
          if (AI_SCRIPT.signature) {
            controller.enqueue(new TextEncoder().encode(AI_SCRIPT.signature));
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
    console.error('Lỗi nghiêm trọng Server AI:', error);
    return new Response(JSON.stringify({ error: 'Nguồn đứt gãy kết nối: ' + error.message }), { status: 500 });
  }
}
