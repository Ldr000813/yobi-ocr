'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ message: string; isError: boolean } | null>(null);

  const triggerFileSelect = () => document.getElementById('fileInput')?.click();
  const triggerCamera = () => document.getElementById('cameraInput')?.click();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const showStatus = (message: string, isError = false) => {
    setStatusMessage({ message, isError });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const processImage = async () => {
    if (!selectedFile) return showStatus('画像を選択してください', true);

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/ocr', { method: 'POST', body: formData });

      // ------------------------------
      // デバッグ用: 生のレスポンスとパース結果をログ出力
      const text = await res.text(); 
      console.log('Raw API Response:', text); // 生のレスポンス
      const data = JSON.parse(text);          
      console.log('Parsed API Response:', data); // { text: "..." } を確認
      // ------------------------------

      if (data.error) return showStatus(data.error, true);

      setResult(data.text);
      showStatus('OCR処理が完了しました', false);
    } catch (err: any) {
      console.error(err);
      showStatus(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>📄 OCR Document Scanner</h1>
        <p>Azure AI Document Intelligence を使用した文書認識サービス</p>
      </div>

      <div className="content">
        {/* アップロードセクション */}
        <div className="upload-section">
          <h2 style={{ marginBottom: '20px', color: '#333' }}>画像をアップロード</h2>
          <div className="button-group">
            <button className="btn btn-primary" onClick={triggerCamera}>📷 カメラで撮影</button>
            <button className="btn btn-primary" onClick={triggerFileSelect}>🖼️ 既存の画像を選択</button>
          </div>
          <input
            type="file"
            id="cameraInput"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <input
            type="file"
            id="fileInput"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* プレビュー */}
        {imagePreview && (
          <div className="preview-section">
            <img src={imagePreview} alt="Image Preview" style={{ maxWidth: '100%', borderRadius: 10 }} />
          </div>
        )}

        {/* OCR処理ボタン */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button className="btn btn-primary" onClick={processImage} disabled={!selectedFile || loading}>
            🔍 OCR処理を開始
          </button>
        </div>

        {/* ローディング */}
        {loading && (
          <div className="loading" style={{ textAlign: 'center', padding: 20 }}>
            <div className="spinner" style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              width: 50,
              height: 50,
              animation: 'spin 1s linear infinite',
              margin: '0 auto 15px'
            }}></div>
            <p>処理中です。しばらくお待ちください...</p>
          </div>
        )}

        {/* ステータスメッセージ */}
        {statusMessage && (
          <div className={`status-message ${statusMessage.isError ? 'status-error' : 'status-success'}`} style={{
            marginTop: 15, padding: 12, borderRadius: 8, textAlign: 'center'
          }}>
            {statusMessage.message}
          </div>
        )}

        {/* OCR結果 */}
        {result && (
          <div className="result-section" style={{
            marginTop: 30,
            padding: 20,
            background: '#f8f9fa',
            borderRadius: 10,
            whiteSpace: 'pre-wrap',
            fontFamily: 'Courier New, monospace'
          }}>
            <h3 style={{ color: '#667eea', marginBottom: 15 }}>📋 OCR結果</h3>
            <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
              {result || '(テキストが検出されませんでした)'}
            </pre>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
