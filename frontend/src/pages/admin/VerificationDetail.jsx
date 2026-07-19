import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import verificationApi from '../../api/verificationApi';
import { Loader } from '../../components/common/Loader';
import { Button } from '../../components/common/Button';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function VerificationDetail() {
  const { advocateId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [rejectReason, setRejectReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showInfoRequestForm, setShowInfoRequestForm] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await verificationApi.getAdvocateDetail(advocateId);
      setProfile(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load advocate details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [advocateId]);

  const handleApprove = async () => {
    setActionLoading(true);
    setError('');
    try {
      await verificationApi.approveVerification(advocateId, actionNotes);
      setSuccess('Advocate verified successfully');
      setActionNotes('');
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Rejection reason is required');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await verificationApi.rejectVerification(advocateId, rejectReason, actionNotes);
      setSuccess('Advocate verification rejected');
      setRejectReason('');
      setActionNotes('');
      setShowRejectForm(false);
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfo = async () => {
    if (!actionNotes.trim()) {
      setError('Please specify what information is needed');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      await verificationApi.requestMoreInfo(advocateId, actionNotes);
      setSuccess('More information requested');
      setActionNotes('');
      setShowInfoRequestForm(false);
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request info');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  if (error && !profile) {
    return (
    <div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
        <button
          onClick={() => navigate('/admin/verification')}
          className="mt-4 text-primary-600 hover:text-primary-800 text-sm font-medium"
        >
          Back to Queue
        </button>
      </div>
    );
  }

  const user = profile?.userId;
  const canAct =
    profile?.verificationStatus === 'under_review' ||
    profile?.verificationStatus === 'pending';

  return (
      <div>
      <button
        onClick={() => navigate('/admin/verification')}
        className="text-primary-600 hover:text-primary-800 text-sm font-medium mb-4"
      >
        &larr; Back to Queue
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Review Advocate</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-6">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {user?.name || 'Unknown'}
              </h2>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusColors[profile?.verificationStatus] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {profile?.verificationStatus?.replace('_', ' ')}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Email</dt>
                <dd className="text-gray-900">{user?.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Phone</dt>
                <dd className="text-gray-900">{user?.phone || 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Registered</dt>
                <dd className="text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Email Verified</dt>
                <dd className="text-gray-900">{user?.isEmailVerified ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Professional Details
            </h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Bar Council Number</dt>
                <dd className="text-gray-900">{profile?.barCouncilNumber || 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">State Bar Council</dt>
                <dd className="text-gray-900">{profile?.stateBarCouncil || 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Years of Experience</dt>
                <dd className="text-gray-900">{profile?.yearsOfExperience || 0}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Specializations</dt>
                <dd className="text-gray-900">
                  {profile?.specializations?.join(', ') || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Languages</dt>
                <dd className="text-gray-900">
                  {profile?.languagesSpoken?.join(', ') || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Court Jurisdictions</dt>
                <dd className="text-gray-900">
                  {profile?.courtJurisdictions?.join(', ') || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Bio</dt>
                <dd className="text-gray-900">{profile?.bio || 'N/A'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Uploaded Documents ({profile?.credentialDocuments?.length || 0})
            </h2>
            {profile?.credentialDocuments?.length > 0 ? (
              <ul className="space-y-2">
                {profile.credentialDocuments.map((doc, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2"
                  >
                    <span className="text-gray-700">{doc.type || `Document ${idx + 1}`}</span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 underline ml-4"
                    >
                      View
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No documents uploaded.</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>

            {!canAct ? (
              <p className="text-sm text-gray-600">
                This advocate is already {profile?.verificationStatus?.replace('_', ' ')}.
                No action available.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Internal notes..."
                  />
                </div>

                <Button
                  onClick={handleApprove}
                  loading={actionLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Approve & Verify
                </Button>

                <button
                  onClick={() => {
                    setShowInfoRequestForm(!showInfoRequestForm);
                    setShowRejectForm(false);
                  }}
                  className="w-full px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50"
                >
                  Request More Info
                </button>

                {showInfoRequestForm && (
                  <div className="border border-blue-200 rounded-md p-3 bg-blue-50">
                    <p className="text-xs text-blue-700 mb-2">
                      Explain what information is missing:
                    </p>
                    <textarea
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      rows={2}
                      className="block w-full px-3 py-2 border border-blue-300 rounded-md text-sm mb-2"
                      placeholder="e.g., Please upload a clearer copy of your bar council certificate"
                    />
                    <button
                      onClick={handleRequestInfo}
                      disabled={actionLoading}
                      className="text-sm text-blue-700 font-medium hover:text-blue-900"
                    >
                      {actionLoading ? 'Sending...' : 'Send Request'}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowRejectForm(!showRejectForm);
                    setShowInfoRequestForm(false);
                  }}
                  className="w-full px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                >
                  Reject
                </button>

                {showRejectForm && (
                  <div className="border border-red-200 rounded-md p-3 bg-red-50">
                    <p className="text-xs text-red-700 mb-2">
                      Provide a reason for rejection (required):
                    </p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={2}
                      className="block w-full px-3 py-2 border border-red-300 rounded-md text-sm mb-2"
                      placeholder="e.g., Bar council certificate is not legible"
                    />
                    <button
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="text-sm text-red-700 font-medium hover:text-red-900"
                    >
                      {actionLoading ? 'Submitting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {profile?.verificationNotes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                Previous Admin Notes
              </h3>
              <p className="text-sm text-gray-600">{profile.verificationNotes}</p>
            </div>
          )}

          {profile?.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-red-800 mb-1">
                Rejection Reason
              </h3>
              <p className="text-sm text-red-700">{profile.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VerificationDetail;
