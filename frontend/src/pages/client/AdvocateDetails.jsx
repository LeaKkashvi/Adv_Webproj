import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdvocateCard } from '../../components/client/AdvocateCard';

const mockAdvocate = {
  name: 'Adv. Priya Sharma',
  email: 'priya.sharma@nrilegal.in',
  phone: '+91 98765 43210',
  profilePhotoUrl: null,
  barCouncilNumber: 'MH/2018/4567',
  stateBarCouncil: 'Bombay High Court',
  specializations: ['Property Dispute', 'NRI Land Registration', 'Power of Attorney', 'Legal Documentation'],
  languagesSpoken: ['English', 'Hindi', 'Marathi'],
  courtJurisdictions: ['Bombay High Court', 'Delhi High Court', 'District Court Mumbai'],
  yearsOfExperience: 9,
  bio: 'Experienced legal professional specializing in NRI property matters and land registration across India. Passionate about simplifying complex legal processes for overseas Indians and ensuring transparent, hassle-free representation.',
  education: [
    { degree: 'LL.B', institution: 'University of Mumbai', year: 2016 },
    { degree: 'LL.M (Corporate Law)', institution: 'National Law School of India University', year: 2018 },
  ],
  serviceOfferings: [
    { serviceType: 'Property Registration', pricingModel: 'fixed', priceRange: '₹15,000 – ₹25,000', estimatedTimelineDays: 14 },
    { serviceType: 'Legal Documentation', pricingModel: 'fixed', priceRange: '₹5,000 – ₹12,000', estimatedTimelineDays: 7 },
    { serviceType: 'Power of Attorney', pricingModel: 'fixed', priceRange: '₹8,000 – ₹15,000', estimatedTimelineDays: 5 },
    { serviceType: 'Property Dispute', pricingModel: 'hourly', priceRange: '₹2,500/hr', estimatedTimelineDays: 90 },
  ],
  availability: [
    { dayOfWeek: 'monday', slots: [{ start: '10:00', end: '18:00' }] },
    { dayOfWeek: 'tuesday', slots: [{ start: '10:00', end: '18:00' }] },
    { dayOfWeek: 'wednesday', slots: [{ start: '10:00', end: '18:00' }] },
    { dayOfWeek: 'thursday', slots: [{ start: '10:00', end: '18:00' }] },
    { dayOfWeek: 'friday', slots: [{ start: '10:00', end: '16:00' }] },
    { dayOfWeek: 'saturday', slots: [{ start: '10:00', end: '13:00' }] },
  ],
  averageRating: 4.8,
  totalReviews: 63,
  casesCompleted: 47,
  activeClients: 8,
  verificationStatus: 'verified',
};

export function ClientAdvocateDetails() {
  const [advocate] = useState(mockAdvocate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Advocate</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your assigned legal representative for NRI matters.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="p-2 text-gray-500 hover:text-primary-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-2xl">
        <AdvocateCard advocate={advocate} />

        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Active Cases</h3>
          <div className="space-y-3">
            {[
              { title: 'Property Dispute — Mumbai Suburban', status: 'In Progress', category: 'property_dispute' },
              { title: 'NRI Land Registration — Pune', status: 'Assigned', category: 'property_registration' },
              { title: 'Power of Attorney — Delhi', status: 'Submitted', category: 'power_of_attorney' },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-500 capitalize">{c.category.replace(/_/g, ' ')}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  c.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  c.status === 'Assigned' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientAdvocateDetails;
