import { useState, useEffect, useCallback } from 'react';
import { Scale, AlertCircle, RefreshCw } from 'lucide-react';
import clientApi from '../../api/clientApi';
import { CaseTimeline } from '../../components/client/CaseTimeline';
import { StatusBadge } from '../../components/client/StatusBadge';
import { Loader } from '../../components/common/Loader';

export function ClientCases() {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCases = useCallback(async () => {
      try {
        setLoading(true);
        const response = await clientApi.getCases();
        setCases(response.data?.cases || []);
    } catch {
      setError('Failed to load cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleSelectCase = async (caseItem) => {
    setSelectedCase(caseItem);
    if (!caseItem.statusHistory?.length) {
      try {
        const response = await clientApi.getCaseTimeline(caseItem._id);
        setSelectedCase((prev) => ({ ...prev, statusHistory: response.data?.timeline || response.data?.statusHistory || [] }));
      } catch {
        // Use existing data if timeline fetch fails
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Cases</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track the status and progress of your legal cases.
          </p>
        </div>
        <button
          onClick={fetchCases}
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
        </div>
      )}

      {loading ? (
        <Loader size="md" className="py-12" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              All Cases ({cases.length})
            </h2>
            {cases.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Scale className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No cases found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => handleSelectCase(c)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedCase?._id === c._id
                        ? 'bg-primary-50 border-primary-200 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{c.title}</p>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 capitalize">
                      {c.serviceCategory?.replace(/_/g, ' ')}
                    </p>
                    <StatusBadge status={c.status} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedCase ? (
              <CaseTimeline caseData={selectedCase} />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Scale className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-sm font-medium text-gray-700">Select a case to view details</p>
                <p className="text-xs text-gray-500 mt-1">
                  Click on any case from the list to see its timeline and status.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientCases;
