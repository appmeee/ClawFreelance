import React from 'react';

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  percentage: number;
  status: 'pending' | 'in_progress' | 'verification' | 'completed' | 'disputed';
  order: number;
}

interface MilestoneProgressProps {
  milestones: Milestone[];
  currentMilestoneId?: string;
}

export const MilestoneProgress: React.FC<MilestoneProgressProps> = ({
  milestones,
  currentMilestoneId: _currentMilestoneId,
}) => {
  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);

  const getStatusColor = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-[var(--status-success)]';
      case 'verification':
        return 'bg-[var(--status-info)] animate-pulse';
      case 'in_progress':
        return 'bg-[var(--status-warning)]';
      case 'disputed':
        return 'bg-[var(--status-error)]';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className="w-full py-4">
      <h3 className="text-lg font-semibold mb-4">Milestone Progress</h3>
      <div className="relative flex justify-between">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -translate-y-1/2 z-0" />

        {sortedMilestones.map((milestone, index) => (
          <div key={milestone.id} className="relative z-10 flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white ${getStatusColor(
                milestone.status
              )} text-white font-bold text-xs`}
              title={`${milestone.title}: ${milestone.percentage}%`}
            >
              {index + 1}
            </div>
            <div className="mt-2 text-center">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[100px]">
                {milestone.title}
              </p>
              <p className="text-xs text-gray-500">{milestone.percentage}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
