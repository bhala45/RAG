import { useState, useEffect } from 'react';
import Layout from '../../components/AppShell/Layout';
import ProtectedRoute from '../../components/Common/ProtectedRoute';
import FileUploader from '../../components/Admin/FileUploader';
import ChunkViewerModal from '../../components/Admin/ChunkViewerModal';
import { FileText, Layers, Trash2, Eye, RefreshCw, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.data.documents);
    } catch (err) {
      console.warn('Failed to fetch documents:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" and all its vector chunks?`)) {
      return;
    }
    try {
      await api.delete(`/documents/${id}`);
      fetchDocuments();
    } catch (err) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleInspect = (id) => {
    setSelectedDocId(id);
    setIsModalOpen(true);
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Document Management</h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Upload college guidelines, syllabus records, and campus manuals into the Gemini RAG Vector Store.
              </p>
            </div>
            <button
              onClick={fetchDocuments}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-2 text-xs self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh List</span>
            </button>
          </div>

          {/* Ingestion Dropzone */}
          <FileUploader onUploadSuccess={fetchDocuments} />

          {/* Indexed Documents Table */}
          <div className="p-6 glass-panel rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-semibold text-white text-base">Knowledge Base Index</h3>
              <span className="text-xs text-slate-400">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'} active
              </span>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Loading indexed documents...
                </div>
              ) : documents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No documents in the knowledge base yet. Upload a PDF above to begin.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="pb-3 px-3">Document Title</th>
                      <th className="pb-3 px-3">Department</th>
                      <th className="pb-3 px-3">Chunks</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Uploaded</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {documents.map((doc) => (
                      <tr key={doc._id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="font-medium text-slate-200">{doc.title}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">{doc.department}</td>
                        <td className="py-3.5 px-3 font-mono text-blue-400">
                          {doc.totalChunks} chunks
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                              doc.status === 'indexed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : doc.status === 'processing'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {doc.status === 'indexed' && <CheckCircle className="w-3 h-3" />}
                            {doc.status === 'processing' && <Clock className="w-3 h-3" />}
                            {doc.status === 'failed' && <AlertTriangle className="w-3 h-3" />}
                            <span>{doc.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleInspect(doc._id)}
                            title="Inspect Chunks & Vectors"
                            className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc._id, doc.title)}
                            title="Delete Document"
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Chunk Viewer Modal */}
          <ChunkViewerModal
            documentId={selectedDocId}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
