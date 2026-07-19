import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';

const advocateRegistrationSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters'),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
    email: z.string().email('Please enter a valid email address'),
    phone: z
      .string()
      .min(10, 'Phone must be at least 10 digits')
      .max(15, 'Phone must be at most 15 digits'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain at least one uppercase, one lowercase, and one number',
      ),
    confirmPassword: z.string(),
    barCouncilNumber: z
      .string()
      .min(1, 'Bar Council number is required'),
    stateBarCouncil: z
      .string()
      .min(1, 'State Bar Council is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const steps = [
  { id: 1, name: 'Personal Information' },
  { id: 2, name: 'Professional Credentials' },
  { id: 3, name: 'Confirm & Register' },
];

export function RegisterAdvocate() {
  const navigate = useNavigate();
  const { registerAdvocate } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(advocateRegistrationSchema),
    mode: 'onChange',
  });

  const nextStep = async () => {
    let fieldsToValidate;
    if (currentStep === 1) {
      fieldsToValidate = ['name', 'username', 'email', 'phone', 'password', 'confirmPassword'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['barCouncilNumber', 'stateBarCouncil'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data) => {
    setError('');
    setLoading(true);
    try {
      const { confirmPassword: _, ...submitData } = data;
      await registerAdvocate(submitData);
      setSuccess(true);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="bg-green-50 border border-green-200 rounded-md p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Registration Successful!
            </h2>
            <p className="text-green-700 mb-4">
              Please check your email to verify your account. Your professional
              profile is now pending admin verification.
            </p>
            <Button onClick={() => navigate('/auth/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join as a Legal Professional
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center ${
                step.id <= currentStep ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.id < currentStep
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : step.id === currentStep
                      ? 'border-primary-600 text-primary-600'
                      : 'border-gray-300 text-gray-400'
                }`}
              >
                {step.id < currentStep ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">
                {step.name}
              </span>
            </div>
          ))}
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit, (formErrors) => {
            const firstKey = Object.keys(formErrors)[0];
            setError(
              formErrors[firstKey]?.message ||
                'Please fix the validation errors before submitting.',
            );
          })}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Personal Information
              </h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Full Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  {...register('username')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Choose a unique username"
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="you@lawfirm.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="+91 98765 43210"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Create a strong password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Professional Credentials */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Professional Credentials
              </h3>

              <div>
                <label
                  htmlFor="barCouncilNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Bar Council Registration Number
                </label>
                <input
                  {...register('barCouncilNumber')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your Bar Council number"
                />
                {errors.barCouncilNumber && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.barCouncilNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="stateBarCouncil"
                  className="block text-sm font-medium text-gray-700"
                >
                  State Bar Council
                </label>
                <input
                  {...register('stateBarCouncil')}
                  type="text"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="e.g., Bar Council of Maharashtra & Goa"
                />
                {errors.stateBarCouncil && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.stateBarCouncil.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Confirm & Register */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">
                Review & Register
              </h3>
              <p className="text-sm text-gray-600">
                By registering, you agree to our Terms of Service and Privacy
                Policy. Your professional credentials will be reviewed by our
                admin team before you can start accepting clients.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> After registration, you will need to
                  upload your professional credentials (Bar Council ID, degree
                  certificates) for verification by our admin team.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            {currentStep > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep}>
                Previous
              </Button>
            )}
            {currentStep < 3 ? (
              <Button type="button" onClick={nextStep} className="ml-auto">
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                loading={loading}
                className="ml-auto"
              >
                Create Account
              </Button>
            )}
          </div>

          <p className="text-center text-sm text-gray-600">
            Are you an NRI client?{' '}
            <Link
              to="/auth/register/client"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Register as a Client
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterAdvocate;
