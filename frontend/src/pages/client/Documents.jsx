import { useState, useEffect, useCallback } from 'react';
import { FileText, AlertCircle, RefreshCw } from 'lucide-react';
import clientApi from '../../api/clientApi';
import { FileDropzone } from '../../components/client/FileDropzone';
import { StatusBadge } from '../../components/client/StatusBadge';
import { Loader } from '../../components/common/Loader';

export function ClientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDocuments = useCallback(async () => {
      try {
        setLoading(true);
        const response = await clientApi.getDocuments();
        setDocuments(response.data?.documents || []);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (formData) => {
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      await clientApi.uploadDocument(formData);
      setSuccess('Document uploaded successfully');
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await clientApi.deleteDocument(documentId);
      setDocuments((prev) => prev.filter((d) => d._id !== documentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete document');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and manage your legal documents securely.
          </p>
        </div>
        <button
          onClick={fetchDocuments}
          className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700">&times;</button>
        </div>
      )}

      {loading ? (
        <Loader size="md" className="py-12" />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <FileDropzone
            onUpload={handleUpload}
            documents={documents}
            onDelete={handleDelete}
            uploading={uploading}
          />
        </div>
      )}

      {documents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Documents</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc._id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.originalFileName || doc.fileName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{doc.category}</p>
                  </div>
                </div>
                <StatusBadge status={doc.verificationStatus} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDocuments;
