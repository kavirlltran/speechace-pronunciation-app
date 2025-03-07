// pages/api/evaluate.js
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb' // Giới hạn kích thước nếu cần
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
    return;
  }
  try {
    console.log("Request body nhận được:", req.body); // Debug: In ra request body
    const { text, audio, mimeType } = req.body;
    if (!text || !audio) {
      res.status(400).json({ error: 'Thiếu dữ liệu bắt buộc', missing: { text: !text, audio: !audio } });
      return;
    }
    console.log("Giá trị text gửi đi:", text);

    // Giải mã chuỗi base64 thành Buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // Tạo FormData và thêm các trường cần thiết
    const form = new FormData();
    form.append('text', text);
    form.append('user_audio_file', audioBuffer, {
      filename: 'recording.webm',
      contentType: mimeType || 'audio/webm'
    });

    // Lấy API key từ biến môi trường (đặt trong .env.local hoặc trên Vercel)
    const apiKey = process.env.SPEECHACE_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'API key chưa được cấu hình' });
      return;
    }
    // Xây dựng URL gọi Speechace API – sử dụng phiên bản v9, dialect en-us và user_id mẫu
    const speechaceUrl = `https://api.speechace.co/api/scoring/text/v9/json?key=${apiKey}&dialect=en-us&user_id=demo`;

    const response = await fetch(speechaceUrl, {
      method: 'POST',
      headers: form.getHeaders(),
      body: form
    });

    const data = await response.json();
    console.log("Phản hồi từ Speechace API:", data);
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Lỗi khi đánh giá phát âm:", error);
    res.status(500).json({ error: 'Lỗi máy chủ', details: error.message });
  }
}
