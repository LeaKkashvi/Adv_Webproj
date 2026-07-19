import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import verificationApi from '../../api/verificationApi';
import { Button } from '../../components/common/Button';

export function SubmitCredentials() {
  const { advocateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    yearsOfExperience: advocateProfile?.yearsOfExperience || 0,
    specializations: advocateProfile?.specializations?.join(', ') || '',
    languagesSpoken: advocateProfile?.languagesSpoken?.join(', ') || '',
    courtJurisdictions: advocateProfile?.courtJurisdictions?.join(', ') || '',
    bio: advocateProfile?.bio || '',
  });

  const [files, setFiles] = useState([]);
  const [existingDocs, setExistingDocs] = useState(
    advocateProfile?.credentialDocuments || [],
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length + files.length > 10) {
      setError('Maximum 10 documents allowed');
      return;
    }
    setFiles((prev) => [...prev, ...selected]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingDoc = async (index) => {
    try {
      await verificationApi.removeDocument(index);
      setExistingDocs((prev) => prev.filter((_, i) => i !== index));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove document');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = new FormData();
      payload.append('yearsOfExperience', formData.yearsOfExperience);
      payload.append(
        'specializations',
        JSON.stringify(
          formData.specializations
            ? formData.specializations.split(',').map((s) => s.trim())
            : [],
        ),
      );
      payload.append(
        'languagesSpoken',
        JSON.stringify(
          formData.languagesSpoken
            ? formData.languagesSpoken.split(',').map((s) => s.trim())
            : [],
        ),
      );
      payload.append(
        'courtJurisdictions',
        JSON.stringify(
          formData.courtJurisdictions
            ? formData.courtJurisdictions.split(',').map((s) => s.trim())
            : [],
        ),
      );
      payload.append('bio', formData.bio);

      files.forEach((file) => {
        payload.append('documents', file);
      });

      await verificationApi.submitCredentials(payload);
      await refreshProfile();
      setSuccess('Credentials submitted successfully');
      setFiles([]);
      setTimeout(() => navigate('/advocate/verification'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Submit Credentials
      </h1>
      <p className="text-sm text-gray-600 mb-6">
        Upload your professional credentials for verification. All fields below
        help our team review your application faster.
      </p>

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Years of Experience
            </label>
            <input
              type="number"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleChange}
              min="0"
              max="60"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Brief professional summary..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Specializations (comma-separated)
            </label>
            <input
              type="text"
              name="specializations"
              value={formData.specializations}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="e.g., Property Law, NRI Legal Matters"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Languages Spoken (comma-separated)
            </label>
            <input
              type="text"
              name="languagesSpoken"
              value={formData.languagesSpoken}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="e.g., English, Hindi"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Court Jurisdictions (comma-separated)
            </label>
            <input
              type="text"
              name="courtJurisdictions"
              value={formData.courtJurisdictions}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="e.g., Bombay High Court"
            />
          </div>
        </div>

        {existingDocs.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Already Uploaded
            </h3>
            <ul className="space-y-1">
              {existingDocs.map((doc, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2"
                >
                  <span className="text-gray-700 truncate mr-2">
                    {doc.type || `Document ${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => removeExistingDoc(idx)}
                      className="text-red-600 hover:text-red-800 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload New Documents
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Upload bar council certificate, degree, ID proof, etc. (max 10 files,
            PDF/JPG/PNG, up to 5MB each)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          {files.length > 0 && (
            <ul className="mt-3 space-y-1">
              {files.map((file, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-sm bg-blue-50 rounded px-3 py-2"
                >
                  <span className="text-blue-800 truncate mr-2">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-red-600 hover:text-red-800 text-xs shrink-0"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/advocate/verification')}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <Button type="submit" loading={loading}>
            Submit for Verification
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SubmitCredentials;
