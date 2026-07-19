import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import verificationApi from '../../api/verificationApi';
import { Loader } from '../../components/common/Loader';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  under_review: 'bg-blue-100 text-blue-800 border-blue-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  pending: 'Pending Submission',
  under_review: 'Under Review',
  verified: 'Verified',
  rejected: 'Rejected',
};

const statusMessages = {
  pending:
    'You have not submitted your credentials for verification yet. Please submit your documents to get verified.',
  under_review:
    'Your credentials are being reviewed by our admin team. This typically takes 2-3 business days.',
  verified:
    'Your account is verified. You can now accept client requests and appear in the advocate directory.',
  rejected:
    'Your verification was rejected. Please review the feedback and resubmit with the required corrections.',
};

export function VerificationStatus() {
  const { advocateProfile } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await verificationApi.getVerificationStatus();
        setStatus(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load verification status');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) return <Loader fullScreen />;

  const currentStatus = status?.verificationStatus || advocateProfile?.verificationStatus || 'pending';

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Verification Status</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
          {error}
        </div>
      )}

      <div
        className={`p-6 rounded-lg border-2 mb-6 ${statusColors[currentStatus] || 'bg-gray-100 text-gray-800 border-gray-200'}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{statusLabels[currentStatus]}</h2>
          <span className="text-sm font-medium uppercase tracking-wide">{currentStatus.replace('_', ' ')}</span>
        </div>
        <p className="text-sm">{statusMessages[currentStatus]}</p>
      </div>

      {currentStatus === 'rejected' && status?.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-red-800 mb-2">Rejection Reason</h3>
          <p className="text-sm text-red-700">{status.rejectionReason}</p>
          {status.verificationNotes && (
            <>
              <h3 className="text-sm font-medium text-red-800 mt-3 mb-1">Admin Notes</h3>
              <p className="text-sm text-red-700">{status.verificationNotes}</p>
            </>
          )}
        </div>
      )}

      {currentStatus === 'under_review' && status?.verificationNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Admin Notes</h3>
          <p className="text-sm text-blue-700">{status.verificationNotes}</p>
        </div>
      )}

      {status?.credentialDocuments?.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Submitted Documents</h3>
          <ul className="space-y-2">
            {status.credentialDocuments.map((doc, idx) => (
              <li key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{doc.type || `Document ${idx + 1}`}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-800 underline"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-4">
        {(currentStatus === 'pending' || currentStatus === 'rejected') && (
          <Link
            to="/advocate/credentials/submit"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {currentStatus === 'rejected' ? 'Resubmit Credentials' : 'Submit Credentials'}
          </Link>
        )}
        {currentStatus === 'under_review' && (
          <Link
            to="/advocate/credentials/submit"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Update Documents
          </Link>
        )}
        <Link
          to="/advocate/profile"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Edit Profile
        </Link>
      </div>
    </div>
  );
}

export default VerificationStatus;
