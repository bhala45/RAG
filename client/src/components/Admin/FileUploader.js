import { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

const DEPARTMENTS = ['General', 'CSE', 'ECE', 'Mechanical', 'Admissions', 'Hostel', 'Placements'];

export default function FileUploader({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('General');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
      setMessage(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      setFile(dropped);
      if (!title) {
        setTitle(dropped.name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
      setMessage(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF document to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('department', department);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage(
        `Success! Document indexed into ${res.data.data.totalChunks} semantic chunks with Gemini 768-dim embeddings.`
      );
      setFile(null);
      setTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setError(
        err.response?.data?.error || err.message || 'Failed to upload and process document.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 glass-panel rounded-2xl border border-slate-800 space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-base">Knowledge Base PDF Ingestion</h3>
          <p className="text-xs text-slate-400">
            Upload official campus PDFs. Documents are automatically chunked and embedded via Gemini `text-embedding-004`.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 bg-slate-900/60 hover:bg-slate-900 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.txt,.docx"
            className="hidden"
          />

          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>

          {file ? (
            <div className="space-y-1">
              <span className="text-sm font-semibold text-blue-400">{file.name}</span>
              <p className="text-xs text-slate-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-300">
                Click to browse or drag & drop PDF files here
              </p>
              <p className="text-xs text-slate-500">Supports PDF, DOCX, TXT (Max 25MB)</p>
            </div>
          )}
        </div>

        {/* Metadata Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2026 Academic Regulations"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Alerts */}
        {message && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting Text, Chunking & Embedding Vectors...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Ingest & Index Document</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
