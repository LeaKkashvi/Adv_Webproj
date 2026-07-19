import { Mail, Phone, MapPin, Star, Calendar, Award, Globe } from 'lucide-react';
import { Badge } from '../common/Badge';

export function AdvocateCard({ advocate }) {
  if (!advocate) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-3 flex items-center justify-center">
          <Award className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700">No advocate assigned yet</p>
        <p className="text-xs text-gray-500 mt-1">
          An advocate will be assigned to your case after review.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-primary-900 px-6 py-4">
        <div className="flex items-center gap-4">
          {advocate.profilePhotoUrl ? (
            <img
              src={advocate.profilePhotoUrl}
              alt={advocate.name}
              className="w-14 h-14 rounded-full border-2 border-white/20 object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-700 flex items-center justify-center border-2 border-white/20">
              <span className="text-xl font-bold text-white">
                {advocate.name?.charAt(0) || 'A'}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-white font-semibold">{advocate.name}</h3>
            <p className="text-primary-300 text-sm">{advocate.specializations?.join(', ') || 'Legal Professional'}</p>
            <Badge variant={advocate.verificationStatus === 'verified' ? 'success' : 'warning'} className="mt-1">
              {advocate.verificationStatus === 'verified' ? 'Verified Advocate' : 'Pending Verification'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {advocate.bio && (
          <p className="text-sm text-gray-600 leading-relaxed">{advocate.bio}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {advocate.yearsOfExperience > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Award className="w-4 h-4 text-primary-500" />
              <span>{advocate.yearsOfExperience} years experience</span>
            </div>
          )}
          {advocate.averageRating > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 text-accent-500" />
              <span>{advocate.averageRating.toFixed(1)} ({advocate.totalReviews} reviews)</span>
            </div>
          )}
          {advocate.courtJurisdictions?.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-primary-500" />
              <span>{advocate.courtJurisdictions.slice(0, 2).join(', ')}</span>
            </div>
          )}
          {advocate.languagesSpoken?.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Globe className="w-4 h-4 text-primary-500" />
              <span>{advocate.languagesSpoken.slice(0, 3).join(', ')}</span>
            </div>
          )}
        </div>

        {advocate.education?.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Education</p>
            {advocate.education.map((edu, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{edu.degree} — {edu.institution} ({edu.year})</span>
              </div>
            ))}
          </div>
        )}

        {advocate.serviceOfferings?.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Services</p>
            <div className="flex flex-wrap gap-2">
              {advocate.serviceOfferings.map((service, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-medium"
                >
                  {service.serviceType}
                  {service.priceRange && (
                    <span className="ml-1 text-primary-400">&middot; {service.priceRange}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {advocate.availability?.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Availability</p>
            <div className="flex flex-wrap gap-1.5">
              {advocate.availability.map((day) => (
                <span
                  key={day.dayOfWeek}
                  className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded capitalize"
                >
                  {day.dayOfWeek.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvocateCard;
