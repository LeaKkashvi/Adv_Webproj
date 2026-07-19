import { CheckCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

const stepIcons = {
  submitted: Clock,
  under_review: AlertCircle,
  assigned: CheckCircle,
  in_progress: ArrowRight,
  resolved: CheckCircle,
  closed: CheckCircle,
};

const stepColors = {
  completed: 'bg-green-500 border-green-500',
  current: 'bg-primary-600 border-primary-600 ring-4 ring-primary-100',
  upcoming: 'bg-gray-300 border-gray-300',
};

export function CaseTimeline({ caseData }) {
  if (!caseData) return null;

  const allSteps = [
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'assigned', label: 'Assigned to Advocate' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];

  const currentIdx = allSteps.findIndex((s) => s.key === caseData.status);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{caseData.title}</h3>
          <p className="text-sm text-gray-500 mt-1">{caseData.serviceCategory?.replace(/_/g, ' ')}</p>
        </div>
        <StatusBadge status={caseData.status} size="md" />
      </div>

      {caseData.priority && (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-4 ${
            caseData.priority === 'urgent'
              ? 'bg-red-100 text-red-800'
              : caseData.priority === 'normal'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
          }`}
        >
          {caseData.priority.charAt(0).toUpperCase() + caseData.priority.slice(1)} Priority
        </span>
      )}

      <div className="relative mt-6">
        <div className="absolute top-4 left-4 w-0.5 h-full bg-gray-200" />

        <div className="space-y-6">
          {allSteps.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isUpcoming = idx > currentIdx;
            const Icon = stepIcons[step.key] || Clock;

            let dotClass = stepColors.upcoming;
            if (isCompleted) dotClass = stepColors.completed;
            if (isCurrent) dotClass = stepColors.current;

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${dotClass}`}
                >
                  <Icon className={`w-4 h-4 ${isCompleted || isCurrent ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div className="pt-1">
                  <p
                    className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCompleted && caseData.statusHistory?.find((h) => h.status === step.key) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(
                        caseData.statusHistory.find((h) => h.status === step.key).changedAt,
                      ).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                  {isCurrent && (
                    <p className="text-xs text-primary-600 mt-0.5 font-medium">Current</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {caseData.advocateNotes && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-1">Advocate Notes</p>
          <p className="text-sm text-gray-600">{caseData.advocateNotes}</p>
        </div>
      )}
    </div>
  );
}

export default CaseTimeline;
