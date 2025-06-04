import React, { useEffect } from 'react';
import { ChartBarIcon, EnvelopeOpenIcon, PaperAirplaneIcon, ClockIcon, ExclamationCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline'; // Using Heroicons for variety
import { useAuth } from '../context/AuthContext';

const DashboardPage: React.FC = () => {
  const auth = useAuth();

  useEffect(() => {
    if (auth.user) {
      auth.logUserActivity(auth.user.id, 'Viewed Dashboard.');
    }
  }, [auth]);


  const metrics = [
    { title: "Emails Sent Today", value: "1,256", change: "+10.2%", icon: <PaperAirplaneIcon className="w-8 h-8 text-accent" />, trend: 'up' },
    { title: "Avg. Open Rate (7d)", value: "68.5%", change: "-1.5%", icon: <EnvelopeOpenIcon className="w-8 h-8 text-highlight" />, trend: 'down' },
    { title: "Active Campaigns", value: "12", change: "+2", icon: <ChartBarIcon className="w-8 h-8 text-sky-400" />, trend: 'up' },
    { title: "Scheduled Messages", value: "48", change: "", icon: <ClockIcon className="w-8 h-8 text-amber-400" />, trend: 'neutral' },
    { title: "Bounce Rate (Last Campaign)", value: "2.1%", change: "+0.3%", icon: <ExclamationCircleIcon className="w-8 h-8 text-red-500" />, trend: 'down' }, // Lower bounce is good, so an increase is 'down' in terms of performance
    { title: "New Subscribers Today", value: "73", change: "+15", icon: <UserPlusIcon className="w-8 h-8 text-emerald-400" />, trend: 'up' },
  ];

  const activities = [
    { id: 1, text: "Email 'Welcome to Surprise Sender!' sent to new_user@example.com.", time: "2m ago", type: "sent" },
    { id: 2, text: "Bulk campaign 'August Newsletter' completed. 5,000 emails sent.", time: "1h ago", type: "campaign" },
    { id: 3, text: "SMS 'Special Offer!' scheduled for 2024-08-15 10:00 AM.", time: "3h ago", type: "scheduled" },
    { id: 4, text: "User 'Jane Doe' updated their profile settings.", time: "Yesterday", type: "system" },
    { id: 5, text: "AI generated 3 subject line suggestions for 'Promo Email'.", time: "Yesterday", type: "ai" },
    { id: 6, text: "Tracking data updated for 'July Insights' campaign.", time: "2 days ago", type: "tracking" },
  ];

  const getTrendColor = (trend: string, change: string) => {
    if (!change) return 'text-text-secondary';
    if (trend === 'up') return change.startsWith('+') ? 'text-green-400' : 'text-red-400';
    if (trend === 'down') return change.startsWith('+') ? 'text-red-400' : 'text-green-400'; // e.g. bounce rate increase is bad
    return 'text-text-secondary';
  };


  return (
    <div className="bg-secondary p-4 sm:p-6 rounded-lg shadow-xl min-h-full">
      <h1 className="text-3xl font-bold text-text-primary mb-6 border-b-2 border-accent pb-3">Dashboard Overview</h1>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {metrics.map((metric) => (
          <div key={metric.title} className="bg-primary p-5 rounded-lg shadow-lg hover:shadow-accent/40 transition-shadow duration-300 flex flex-col justify-between transform hover:scale-105">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-text-secondary">{metric.title}</h2>
              {metric.icon}
            </div>
            <div>
              <p className="text-4xl font-bold text-text-primary mb-1">{metric.value}</p>
              {metric.change && (
                <p className={`text-sm ${getTrendColor(metric.trend, metric.change)}`}>
                  {metric.change} from last period
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Recent Activity Feed */}
      <div className="bg-primary p-5 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold text-accent mb-5 border-b border-slate-700 pb-2">Recent Activity (System Wide Examples)</h2>
        <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {activities.map(activity => (
            <li key={activity.id} className="flex items-start space-x-3 p-3 bg-slate-800/70 hover:bg-slate-700 rounded-md transition-colors duration-200 cursor-pointer">
              <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${activity.type === 'sent' ? 'bg-green-500' : activity.type === 'campaign' ? 'bg-blue-500' : activity.type === 'scheduled' ? 'bg-yellow-500' : activity.type === 'system' ? 'bg-purple-500' : activity.type === 'ai' ? 'bg-sky-500' : 'bg-gray-500'}`}></div>
              <div className="flex-1">
                <p className="text-sm text-text-primary">{activity.text}</p>
                <p className="text-xs text-text-secondary">{activity.time}</p>
              </div>
            </li>
          ))}
          {activities.length === 0 && (
             <p className="text-text-secondary text-center py-4">No recent activity.</p>
          )}
        </ul>
         <p className="text-xs text-text-secondary mt-3">Note: For individual user activities, check User Management.</p>
      </div>
    </div>
  );
};

export default DashboardPage;
