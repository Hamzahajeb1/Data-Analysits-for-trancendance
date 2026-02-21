import React, { useState, useEffect, useCallback } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { analyticsAPI } from '../utils/api';
import { socket } from '../utils/socket';
import { format, subDays } from 'date-fns';
import '../styles/Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface UserProfile {
  name: string;
  nickname: string;
  mail: string;
  wins: number;
  losses: number;
  draws: number;
  elo: number;
  matchesPlayed: number;
  country: string;
  gender: string;
  age: number;
}

interface FilterOptions {
  startDate: Date;
  endDate: Date;
  userId?: string;
}

export const AnalyticsDashboard: React.FC = () => {
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: subDays(new Date(), 7),
    endDate: new Date(),
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [activityData, setActivityData] = useState<any>(null);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        startDate: format(filters.startDate, 'yyyy-MM-dd'),
        endDate: format(filters.endDate, 'yyyy-MM-dd'),
      };

      const [stats, matches, activity] = await Promise.all([
        analyticsAPI.getStats(params),
        analyticsAPI.getMatchHistory(params),
        analyticsAPI.getActivityTrends(params),
      ]);

      // Process stats - API returns an array of user_stats
      const statsArray = stats.data;
      if (statsArray && statsArray.length > 0) {
        const userStats = statsArray[0]; // Get first user's stats
        setUserProfile({
          name: 'Player 1',
          nickname: userStats.user_id?.substring(0, 8) || 'User',
          mail: 'user@transcendence.com',
          wins: userStats.total_wins || 0,
          losses: userStats.total_losses || 0,
          draws: 0,
          elo: 1000 + (userStats.total_wins || 0) * 25,
          matchesPlayed: (userStats.total_wins || 0) + (userStats.total_losses || 0),
          country: 'N/A',
          gender: 'N/A',
          age: 0,
        });

        // Stats summary for pie chart
        setStatsData({
          labels: ['Wins', 'Losses', 'Draws'],
          datasets: [
            {
              data: [userStats.total_wins || 0, userStats.total_losses || 0, 0],
              backgroundColor: [
                'rgba(16, 185, 129, 0.6)', // Emerald (Wins)
                'rgba(239, 68, 68, 0.6)',  // Red (Losses)
                'rgba(245, 158, 11, 0.6)', // Amber (Draws)
              ],
              borderColor: [
                'rgba(16, 185, 129, 1)',
                'rgba(239, 68, 68, 1)',
                'rgba(245, 158, 11, 1)',
              ],
              borderWidth: 1,
            },
          ],
        });
      }

      // Process match data for bar chart - using created_at field
      const matchCounts: any = {};
      if (matches.data && Array.isArray(matches.data)) {
        matches.data.forEach((match: any) => {
          const dateField = match.created_at || match.date;
          if (dateField) {
            const date = format(new Date(dateField), 'MMM dd');
            matchCounts[date] = (matchCounts[date] || 0) + 1;
          }
        });
      }

      setMatchData({
        labels: Object.keys(matchCounts).length > 0 ? Object.keys(matchCounts) : ['No data'],
        datasets: [
          {
            label: 'Matches per Day',
            data: Object.keys(matchCounts).length > 0 ? Object.values(matchCounts) : [0],
            backgroundColor: 'rgba(139, 92, 246, 0.6)', // Violet
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 1,
          },
        ],
      });

      // Process activity data for line chart
      const activityByDate: any = {};
      if (activity.data && Array.isArray(activity.data)) {
        activity.data.forEach((item: any) => {
          const dateField = item.date || item.timestamp;
          if (dateField) {
            const date = format(new Date(dateField), 'MMM dd');
            activityByDate[date] = (activityByDate[date] || 0) + (item.count || 1);
          }
        });
      }

      setActivityData({
        labels: Object.keys(activityByDate).length > 0 ? Object.keys(activityByDate) : ['No data'],
        datasets: [
          {
            label: 'User Activity',
            data: Object.keys(activityByDate).length > 0 ? Object.values(activityByDate) : [0],
            borderColor: 'rgba(59, 130, 246, 1)', // Blue
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDashboardData();

    // Listen for real-time updates
    const handleUpdate = () => {
      fetchDashboardData();
    };

    socket.on('dashboard-update', handleUpdate);

    return () => {
      socket.off('dashboard-update', handleUpdate);
    };
  }, [fetchDashboardData]);

  const handleDateChange = (key: keyof FilterOptions, value: Date) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleExport = (exportFormat: 'pdf' | 'csv') => {
    // For now, trigger the direct export API which is mocked to handle client side download for some formats
    analyticsAPI.exportData(exportFormat).then((response: any) => {
      // Handle blob response
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics_export.${exportFormat === 'pdf' ? 'json' : exportFormat}`; // Mock API returns JSON for PDF request for now to be safe
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div className="analytics-dashboard">
      <h1>Analytics Dashboard</h1>

      {loading ? (
        <div className="loading">Loading data...</div>
      ) : (
        <>
          {/* Player Stats Section */}
          {/* Player Stats Section */}
          {userProfile && (
            <div className="player-stats-section">
              <h2>Player Profile</h2>
              <div className="stats-grid">
                <div className="stat-card"><strong>Name</strong> {userProfile.name}</div>
                <div className="stat-card"><strong>Nickname</strong> {userProfile.nickname}</div>
                <div className="stat-card"><strong>Email</strong> {userProfile.mail}</div>
                <div className="stat-card"><strong>Age</strong> {userProfile.age}</div>
                <div className="stat-card"><strong>Gender</strong> {userProfile.gender}</div>
                <div className="stat-card"><strong>Country</strong> {userProfile.country}</div>
                <div className="stat-card"><strong>Elo</strong> {userProfile.elo}</div>
                <div className="stat-card"><strong>Matches</strong> {userProfile.matchesPlayed}</div>
                <div className="stat-card"><strong>Wins</strong> {userProfile.wins}</div>
                <div className="stat-card"><strong>Losses</strong> {userProfile.losses}</div>
                <div className="stat-card"><strong>Draws</strong> {userProfile.draws}</div>
              </div>
            </div>
          )}

          <div className="filters">
            <div className="filter-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={format(filters.startDate, 'yyyy-MM-dd')}
                onChange={(e) =>
                  handleDateChange('startDate', new Date(e.target.value))
                }
              />
            </div>

            <div className="filter-group">
              <label>End Date:</label>
              <input
                type="date"
                value={format(filters.endDate, 'yyyy-MM-dd')}
                onChange={(e) => handleDateChange('endDate', new Date(e.target.value))}
              />
            </div>

            <div className="export-buttons">
              <button onClick={() => handleExport('pdf')}>Export JSON</button>
              <button onClick={() => handleExport('csv')}>Export CSV</button>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-container">
              <h3>Matches per Day</h3>
              {matchData && <Bar data={matchData} options={{ responsive: true }} />}
            </div>

            <div className="chart-container">
              <h3>User Activity Trends</h3>
              {activityData && (
                <Line data={activityData} options={{ responsive: true }} />
              )}
            </div>

            <div className="chart-container">
              <h3>Win/Loss/Draw Distribution</h3>
              {statsData && <Pie data={statsData} options={{ responsive: true }} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
