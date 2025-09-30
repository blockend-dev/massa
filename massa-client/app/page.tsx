'use client';

import { useState, useEffect } from 'react';
import { useMassaWallet } from '@/hooks/useMassaWallet';
import { Button } from '@massalabs/react-ui-kit';
import { Plus, Search } from 'lucide-react';

import { ConnectWallet } from '@/app/components/ui/ConnectWallet';
import { ProjectCard } from '@/app/components/ui/ProjectCard';
import { CreateProjectModal } from '@/app/components/contracts/CreateProjectModal';
import { useFreelanceContract } from '../hooks/useFreelanceContract';
import { Project } from '../types';

export default function Home() {
  const { connected, account, connect, disconnect } = useMassaWallet();
  const { getOpenProjects, applyForProject, loading } = useFreelanceContract();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const openProjects = await getOpenProjects();
      setProjects(openProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleApply = async (projectId: number) => {
    try {
      await applyForProject(BigInt(projectId));
      await loadProjects(); // Refresh the list
    } catch (error) {
      console.error('Error applying for project:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FreelanceDApp</h1>
            </div>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="gradient-bg text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Decentralized Freelancing Platform</h2>
          <p className="text-xl mb-8 opacity-90">
            Hire talent or find work with secure escrow payments on Massa Blockchain
          </p>
          {connected && (
            <Button
              // size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post a Project
            </Button>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {connected ? (
          <>
            {/* Search and Filter */}
            <div className="mb-8">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search projects by title, description, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onApply={handleApply}
                  showApply={true}
                />
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No projects found. Be the first to create one!</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Connect Your Wallet to Get Started
            </h3>
            <p className="text-gray-600">
              Connect your Massa wallet to browse projects, apply for work, or hire talent.
            </p>
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadProjects}
      />
    </div>
  );
}