"use client"

import { Project, ProjectStatus } from '../../../types';
import { Button } from '@/components/ui/button';
import { Calendar, User, Coins, Tag } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onApply?: (projectId: number) => void;
  showApply?: boolean;
}

export const ProjectCard = ({ project, onApply, showApply = true }: ProjectCardProps) => {
  const statusColors = {
    [ProjectStatus.Open]: 'bg-green-100 text-green-800',
    [ProjectStatus.InProgress]: 'bg-blue-100 text-blue-800',
    [ProjectStatus.Completed]: 'bg-gray-100 text-gray-800',
    [ProjectStatus.Cancelled]: 'bg-red-100 text-red-800',
    [ProjectStatus.Disputed]: 'bg-orange-100 text-orange-800',
  };

  const statusLabels = {
    [ProjectStatus.Open]: 'Open',
    [ProjectStatus.InProgress]: 'In Progress',
    [ProjectStatus.Completed]: 'Completed',
    [ProjectStatus.Cancelled]: 'Cancelled',
    [ProjectStatus.Disputed]: 'Disputed',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-900">{project.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>

      <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4" />
          <span>{project.budget} MAS</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>{new Date(Number(project.deadline) * 1000).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span className="truncate">{project.client.slice(0, 8)}...</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4" />
          <span>{project.category}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {project.skills.map((skill, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-primary-50 text-primary-700 rounded text-xs"
          >
            {skill}
          </span>
        ))}
      </div>

      {showApply && project.status === ProjectStatus.Open && onApply && (
        <Button
          onClick={() => onApply(Number(project.id))}
          className="w-full"
        >
          Apply for Project
        </Button>
      )}
    </div>
  );
};