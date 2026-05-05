import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function UploadPage() {
  const [files, setFiles]       = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError]       = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();

  const addFiles = (incoming) => {
    const pdfs = Array.from(incoming).filter((f) => f.type === "application/pdf");
    if (pdfs.length !== incoming.length) setError("Only PDF files are accepted.");
    else setError("");
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...pdfs.filter((f) => !names.has(f.name))];
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      await api.post("/documents/upload", form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo-mark">⚖</span>
          <h1>Legal Doc Analyzer</h1>
        </div>
        <button className="btn-ghost" onClick={() => navigate("/dashboard")}>
          ← Dashboard
        </button>
      </header>

      <main className="main-content narrow">
        <h2>Upload Documents</h2>
        <p className="page-sub">PDF files only · 10 MB max per file</p>

        <div
          className={`drop-zone ${dragging ? "active" : ""}`}
          onClick={() => inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <span className="drop-icon">📂</span>
          <p>Drop PDFs here or <span className="link-text">browse</span></p>
        </div>

        {error && <p className="state-msg error">{error}</p>}

        {files.length > 0 && (
          <div className="file-list">
            {files.map((f) => (
              <div key={f.name} className="file-row">
                <span className="file-name">📄 {f.name}</span>
                <span className="file-size">{(f.size / 1024).toFixed(1)} KB</span>
                <button className="btn-remove" onClick={() => removeFile(f.name)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <button
          className="btn-primary full-width"
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
        >
          {uploading ? "Uploading…" : `Upload ${files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : ""}`}
        </button>
      </main>
    </div>
  );
}