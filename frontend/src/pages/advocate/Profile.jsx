import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/userApi';
import { Button } from '../../components/common/Button';

const advocateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  countryOfResidence: z.string().optional(),
  currentAddress: z.string().optional(),
  indianAddress: z.string().optional(),
  bio: z.string().max(2000).optional(),
  yearsOfExperience: z.number().min(0).max(60).optional(),
  specializations: z.string().optional(),
  languagesSpoken: z.string().optional(),
  courtJurisdictions: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase, one lowercase, and one number',
      ),
    confirmNewPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match',
    path: ['confirmNewPassword'],
  });

const verificationStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function AdvocateProfile() {
  const { user, advocateProfile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(advocateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      countryOfResidence: user?.countryOfResidence || '',
      currentAddress: user?.currentAddress || '',
      indianAddress: user?.indianAddress || '',
      bio: advocateProfile?.bio || '',
      yearsOfExperience: advocateProfile?.yearsOfExperience || 0,
      specializations: advocateProfile?.specializations?.join(', ') || '',
      languagesSpoken: advocateProfile?.languagesSpoken?.join(', ') || '',
      courtJurisdictions: advocateProfile?.courtJurisdictions?.join(', ') || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data) => {
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    try {
      const userUpdates = {
        name: data.name,
        countryOfResidence: data.countryOfResidence,
        currentAddress: data.currentAddress,
        indianAddress: data.indianAddress,
      };
      await userApi.updateProfile(userUpdates);

      const advocateUpdates = {
        bio: data.bio,
        yearsOfExperience: data.yearsOfExperience,
        specializations: data.specializations
          ? data.specializations.split(',').map((s) => s.trim())
          : [],
        languagesSpoken: data.languagesSpoken
          ? data.languagesSpoken.split(',').map((s) => s.trim())
          : [],
        courtJurisdictions: data.courtJurisdictions
          ? data.courtJurisdictions.split(',').map((s) => s.trim())
          : [],
      };
      await userApi.updateAdvocateProfile(advocateUpdates);
      await refreshProfile();
      setProfileSuccess('Profile updated successfully');
    } catch (err) {
      setProfileError(
        err.response?.data?.message || 'Failed to update profile',
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordLoading(true);
    try {
      await userApi.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordSuccess('Password updated successfully. Please log in again.');
      resetPasswordForm();
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || 'Failed to update password',
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Verification Status Banner */}
      {advocateProfile && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">
                Verification Status
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {advocateProfile.verificationStatus === 'verified'
                  ? 'Your profile is verified. You can accept client requests.'
                  : advocateProfile.verificationStatus === 'rejected'
                    ? `Your profile was rejected. Reason: ${advocateProfile.rejectionReason || 'Not specified'}`
                    : 'Your profile is being reviewed by our admin team.'}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                verificationStatusColors[advocateProfile.verificationStatus] ||
                'bg-gray-100 text-gray-800'
              }`}
            >
              {advocateProfile.verificationStatus}
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('professional')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'professional'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Professional Details
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'password'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Change Password
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleProfileSubmit(onProfileSubmit)}
          className="space-y-6"
        >
          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {profileError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                disabled
                value={user?.phone || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                {...registerProfile('name')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {profileErrors.name && (
                <p className="mt-1 text-sm text-red-600">
                  {profileErrors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country of Residence
              </label>
              <input
                {...registerProfile('countryOfResidence')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Status
              </label>
              <div className="mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 sm:text-sm">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.accountStatus === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user?.accountStatus}
                </span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Current Address (Abroad)
              </label>
              <input
                {...registerProfile('currentAddress')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Indian Address
              </label>
              <input
                {...registerProfile('indianAddress')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Professional Details Tab */}
      {activeTab === 'professional' && (
        <form
          onSubmit={handleProfileSubmit(onProfileSubmit)}
          className="space-y-6"
        >
          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {profileError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bar Council Number
              </label>
              <input
                type="text"
                disabled
                value={advocateProfile?.barCouncilNumber || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                State Bar Council
              </label>
              <input
                type="text"
                disabled
                value={advocateProfile?.stateBarCouncil || ''}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <input
                {...registerProfile('yearsOfExperience', {
                  valueAsNumber: true,
                })}
                type="number"
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
                {...registerProfile('bio')}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Tell clients about your experience and expertise..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Specializations (comma-separated)
              </label>
              <input
                {...registerProfile('specializations')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g., Property Law, Family Law, NRI Legal Matters"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Languages Spoken (comma-separated)
              </label>
              <input
                {...registerProfile('languagesSpoken')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g., English, Hindi, Marathi"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Court Jurisdictions (comma-separated)
              </label>
              <input
                {...registerProfile('courtJurisdictions')}
                type="text"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="e.g., Bombay High Court, Pune District Court"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form
          onSubmit={handlePasswordSubmit(onPasswordSubmit)}
          className="space-y-6 max-w-md"
        >
          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              {...registerPassword('currentPassword')}
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {passwordErrors.currentPassword && (
              <p className="mt-1 text-sm text-red-600">
                {passwordErrors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              {...registerPassword('newPassword')}
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {passwordErrors.newPassword && (
              <p className="mt-1 text-sm text-red-600">
                {passwordErrors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm New Password
            </label>
            <input
              {...registerPassword('confirmNewPassword')}
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {passwordErrors.confirmNewPassword && (
              <p className="mt-1 text-sm text-red-600">
                {passwordErrors.confirmNewPassword.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={passwordLoading}>
              Update Password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default AdvocateProfile;
