import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function DashboardPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    api.get("/documents")
      .then(({ data }) => setDocuments(data.documents || []))
      .catch((err) => setError(err.response?.data?.error || "Failed to load documents."))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  };

  return (
    <div className="page-container">
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo-mark">⚖</span>
          <h1>Legal Doc Analyzer</h1>
        </div>
        <div className="topbar-right">
          <span className="user-email">{user.email}</span>
          <button className="btn-ghost danger" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="section-header">
          <h2>Your Documents</h2>
          <button className="btn-primary" onClick={() => navigate("/upload")}>
            + Upload PDF
          </button>
        </div>

        {loading && <p className="state-msg">Loading…</p>}
        {error && <p className="state-msg error">{error}</p>}

        {!loading && documents.length > 0 && (
          <div className="doc-list">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className={`doc-row ${doc.status !== "ready" ? "disabled" : ""}`}
                onClick={() => navigate(`/query/${doc._id}`)}
              >
                <span className="doc-icon">📄</span>

                <div className="doc-meta">
                  <span className="doc-name">{doc.originalName}</span>
                  <span className="doc-sub">
                    {(doc.size / 1024).toFixed(1)} KB ·{" "}
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <span className={`status-pill ${doc.status}`}>
                  {doc.status}
                </span>

                <span className="row-arrow">→</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}