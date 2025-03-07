// pages/index.js
import { useState, useRef } from 'react';

const practices = [
  "We should ‘finish the ‘project for our ‘history ‘class.",
  "‘Peter is re’vising for his e’xam ‘next ‘week.",
  "‘Students will ‘spend more ‘time ‘working with ‘other ‘classmates.",
  "I ‘like to ‘watch ‘videos that ‘help me ‘learn ‘new ‘things.",
  "I have in’stalled some ‘apps on my ‘phone."
];

export default function Home() {
  const [selectedPractice, setSelectedPractice] = useState(practices[0]);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [result, setResult] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    setResult(null);
    if (!navigator.mediaDevices) {
      alert("Trình duyệt không hỗ trợ MediaDevices API.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error("Lỗi khi truy cập microphone:", error);
      alert("Không thể truy cập microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const evaluatePronunciation = async () => {
    if (!audioUrl) {
      alert("Chưa có bản ghi âm.");
      return;
    }
    // Lấy blob từ audioUrl
    const response = await fetch(audioUrl);
    const blob = await response.blob();
    // Đọc blob dưới dạng base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result.split(',')[1]; // Loại bỏ phần header "data:..."
      // Gọi API của chúng ta để đánh giá
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: selectedPractice,
          audio: base64data,
          mimeType: blob.type
        })
      });
      const json = await res.json();
      setResult(json);
    };
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Ứng dụng Đánh giá Phát âm</h1>
      <h2>Chọn nội dung luyện tập:</h2>
      <select
        value={selectedPractice}
        onChange={e => setSelectedPractice(e.target.value)}
      >
        {practices.map((practice, index) => (
          <option key={index} value={practice}>
            Practice {index + 1}: {practice}
          </option>
        ))}
      </select>

      <div style={{ marginTop: '20px' }}>
        <button onClick={startRecording} disabled={recording}>
          Bắt đầu Ghi âm
        </button>
        <button onClick={stopRecording} disabled={!recording}>
          Dừng Ghi âm
        </button>
      </div>

      {audioUrl && (
        <div style={{ marginTop: '20px' }}>
          <h3>Phát lại bản ghi âm:</h3>
          <audio controls src={audioUrl}></audio>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={evaluatePronunciation} disabled={!audioUrl}>
          Đánh giá Phát âm
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h2>Kết quả đánh giá</h2>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
