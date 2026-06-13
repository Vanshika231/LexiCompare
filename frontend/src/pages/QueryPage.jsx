import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function QueryPage() {
  const { docId } = useParams(); // ✅ FIXED
  const navigate = useNavigate();

  const [doc, setDoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const bottomRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docRes, queryRes] = await Promise.all([
          api.get(`/documents/${docId}`),
          api.get(`/query/${docId}`), 
        ]);

        setDoc(docRes.data.document);
        setHistory(queryRes.data.queries.reverse());
      } catch (err) {
        setPageError(err.response?.data?.error || "Failed to load.");
      }
    };

    fetchData();
  }, [docId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const isReady = doc?.status === "ready";

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading || !isReady) return;

    const q = question.trim();
    setLoading(true);
    setError("");

    const optimistic = { _id: Date.now(), question: q, answer: null };
    setHistory((prev) => [...prev, optimistic]);
    setQuestion("");

    try {
      const { data } = await api.post("/query", {
        documentId: docId,
        question: q,
      });

      setHistory((prev) =>
        prev.map((item) =>
          item._id === optimistic._id
            ? { ...item, answer: data.answer }
            : item
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || "Query failed.");
      setHistory((prev) => prev.filter((i) => i._id !== optimistic._id));
    } finally {
      setLoading(false);
    }
  };

  if (pageError) {
    return <p className="state-msg error">{pageError}</p>;
  }

  return (
    <div className="page-container query-layout">
      <header className="topbar">
        <h1>Query Document</h1>
        <button onClick={() => navigate("/dashboard")}>← Back</button>
      </header>

      <div className="chat-history">
        {doc && doc.status !== "ready" && (
          <p className="state-msg">Document still processing...</p>
        )}

        {history.map((item) => (
          <div key={item._id}>
            <p><b>You:</b> {item.question}</p>
            <p><b>AI:</b> {item.answer || "Thinking..."}</p>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleAsk}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={!isReady || loading}
        />
        <button disabled={!question.trim() || !isReady || loading}>
          Ask
        </button>
      </form>
    </div>
  );
}