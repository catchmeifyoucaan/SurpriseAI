import React from 'react';
import { ChartBarIcon, CursorArrowRaysIcon, NoSymbolIcon, CheckCircleIcon, ClockIcon, EnvelopeOpenIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext'; // To log activity if needed

interface CampaignStat {
  id: string;
  name: string;
  type: 'Email' | 'SMS' | 'HTML Bulk';
  status: string;
  sent: number;
  delivered: number;
  opens?: number;
  clicks?: number;
  bounces?: number;
  ctr?: string; // Click-through rate
  openRate?: string;
}

const mockCampaignStats: CampaignStat[] = [
  { id: 'track-1', name: 'Q3 Newsletter (Email)', type: 'Email', status: 'Completed', sent: 4850, delivered: 4800, opens: 3200, clicks: 450, bounces: 50, openRate: '66.7%', ctr: '14.1%' },
  { id: 'track-2', name: 'Summer Sale Promo (HTML)', type: 'HTML Bulk', status: 'Completed', sent: 12000, delivered: 11500, opens: 7500, clicks: 1200, bounces: 500, openRate: '65.2%', ctr: '16.0%' },
  { id: 'track-3', name: 'Weekend Promo (SMS)', type: 'SMS', status: 'Completed', sent: 1500, delivered: 1450, opens: undefined, clicks: 150, bounces: 50, openRate: 'N/A', ctr: '10.3%' }, // SMS opens often not trackable
  { id: 'track-4', name: 'New Feature Announcement (Email)', type: 'Email', status: 'Processing', sent: 500, delivered: 100, opens: 50, clicks: 5, bounces: 2, openRate: '50.0%', ctr: '10.0%'},
  { id: 'track-5', name: 'Holiday Greetings (SMS)', type: 'SMS', status: 'Scheduled', sent: 25000, delivered: 0, opens: undefined, clicks: undefined, bounces: undefined},
];


const TrackingPage: React.FC = () => {
  const auth = useAuth();
  // useEffect(() => {
  //   if (auth.user) auth.logUserActivity(auth.user.id, "Viewed Tracking Page.");
  // }, [auth]);

  const getStatusColor = (status: string) => {
    if (status === 'Completed') return 'bg-green-700 text-green-100';
    if (status === 'Processing') return 'bg-blue-700 text-blue-100';
    if (status === 'Scheduled') return 'bg-yellow-700 text-yellow-100';
    return 'bg-slate-600 text-text-secondary';
  };

  return (
    <div className="bg-secondary p-4 sm:p-6 rounded-lg shadow-xl min-h-full">
      <h1 className="text-3xl font-bold text-text-primary mb-8 border-b-2 border-accent pb-3">Campaign Performance Tracking</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-primary p-5 rounded-lg shadow-lg">
            <div className="flex items-center text-accent mb-2">
                <EnvelopeOpenIcon className="w-7 h-7 mr-2"/>
                <h2 className="text-lg font-semibold">Avg. Email Open Rate</h2>
            </div>
            <p className="text-4xl font-bold text-text-primary">65.5%</p>
            <p className="text-sm text-green-400">+2.1% vs last 7d</p>
        </div>
        <div className="bg-primary p-5 rounded-lg shadow-lg">
            <div className="flex items-center text-accent mb-2">
                <CursorArrowRaysIcon className="w-7 h-7 mr-2"/>
                <h2 className="text-lg font-semibold">Avg. Click-Through Rate</h2>
            </div>
            <p className="text-4xl font-bold text-text-primary">15.2%</p>
            <p className="text-sm text-red-400">-0.5% vs last 7d</p>
        </div>
        <div className="bg-primary p-5 rounded-lg shadow-lg">
            <div className="flex items-center text-accent mb-2">
                <CheckCircleIcon className="w-7 h-7 mr-2"/>
                <h2 className="text-lg font-semibold">Overall Delivery Rate</h2>
            </div>
            <p className="text-4xl font-bold text-text-primary">97.8%</p>
             <p className="text-sm text-text-secondary">Stable</p>
        </div>
        <div className="bg-primary p-5 rounded-lg shadow-lg">
            <div className="flex items-center text-accent mb-2">
                <NoSymbolIcon className="w-7 h-7 mr-2"/>
                <h2 className="text-lg font-semibold">Avg. Bounce Rate</h2>
            </div>
            <p className="text-4xl font-bold text-text-primary">2.2%</p>
            <p className="text-sm text-green-400">-0.1% (Improvement)</p>
        </div>
      </div>

      <div className="bg-primary p-4 sm:p-6 rounded-lg shadow-2xl border border-slate-700">
        <h2 className="text-2xl font-semibold text-text-primary mb-5 flex items-center">
            <ChartBarIcon className="w-7 h-7 mr-2 text-accent" /> Detailed Campaign Statistics
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Campaign Name</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Sent</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Delivered</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Opens</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Clicks</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Bounces</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Open Rate</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">CTR</th>
              </tr>
            </thead>
            <tbody className="bg-primary divide-y divide-slate-700">
              {mockCampaignStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{stat.name}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-text-secondary">{stat.type}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(stat.status)}`}>
                      {stat.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-text-secondary">{stat.sent.toLocaleString()}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-text-secondary">{stat.delivered.toLocaleString()}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-text-secondary">{stat.opens?.toLocaleString() ?? 'N/A'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-text-secondary">{stat.clicks?.toLocaleString() ?? 'N/A'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-text-secondary">{stat.bounces?.toLocaleString() ?? 'N/A'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-highlight">{stat.openRate ?? 'N/A'}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-sky-400">{stat.ctr ?? 'N/A'}</td>
                </tr>
              ))}
              {mockCampaignStats.length === 0 && (
                <tr>
                    <td colSpan={10} className="px-6 py-10 text-center text-text-secondary italic">No campaign data to display yet. Send some campaigns!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-secondary mt-4 text-center">
            Data shown is illustrative. Real-time tracking will populate once campaigns are processed by the backend.
        </p>
      </div>
    </div>
  );
};

export default TrackingPage;