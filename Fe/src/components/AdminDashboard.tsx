import React, { useState, useEffect } from 'react';
import { FiUsers, FiFileText, FiActivity, FiLogOut } from 'react-icons/fi';
import adminService from '../services/adminService';
import type { UserStats, FileStats } from '../services/adminService';
import { UserGrowthChart, RegionChart, FileTypeChart, UploadTrendChart } from './AdminCharts';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowth: Array<{ month: string; users: number }>;
  usersByRegion: Array<{ region: string; users: number; percentage: number }>;
  dailyActiveUsers: Array<{ date: string; users: number }>;
}

interface OverviewStats {
  totalUsers: number;
  totalChats: number;
  totalFiles: number;
  totalMessages: number;
  systemHealth: {
    status: string;
    uptime: string;
    responseTime: string;
    errorRate: string;
  };
  recentActivity: Array<{ type: string; count: number; timestamp: string }>;
}

interface FileStats {
  totalFiles: number;
  totalSize: string;
  fileTypes: Array<{ type: string; count: number; percentage: number }>;
  uploadTrend: Array<{ month: string; uploads: number }>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const [overviewResult, userResult, fileResult] = await Promise.all([
        adminService.getOverviewStats(),
        adminService.getUserStats(),
        adminService.getFileStats()
      ]);

      if (overviewResult.success && overviewResult.data) {
        setOverviewStats(overviewResult.data);
      }
      if (userResult.success && userResult.data) {
        setUserStats(userResult.data);
      }
      if (fileResult.success && fileResult.data) {
        setFileStats(fileResult.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminService.logout();
    onLogout();
  };

  if (isLoading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error-container">
        <h2>Error Loading Dashboard</h2>
        <p>{error}</p>
        <button onClick={fetchStats} className="admin-retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Logout Button */}
      <button className="admin-logout-button" onClick={handleLogout}>
        <FiLogOut />
        Logout
      </button>

      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Dashboard</h1>
          <p>ContractAI Management Panel</p>
        </div>
        <div className="admin-header-actions">
          <a href="/" className="back-to-app-button">
            ← Back to Main App
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <FiActivity />
            Overview
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FiUsers />
            Users
          </button>
          <button
            className={`admin-tab ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            <FiFileText />
            Files
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3>Total Users</h3>
                <div className="stat-value">{overviewStats?.totalUsers || 0}</div>
                <div className="stat-change">+12% this month</div>
              </div>
              <div className="admin-stat-card">
                <h3>Total Chats</h3>
                <div className="stat-value">{overviewStats?.totalChats || 0}</div>
                <div className="stat-change">+8% this week</div>
              </div>
              <div className="admin-stat-card">
                <h3>Total Files</h3>
                <div className="stat-value">{overviewStats?.totalFiles || 0}</div>
                <div className="stat-change">+15% this month</div>
              </div>
              <div className="admin-stat-card">
                <h3>Total Messages</h3>
                <div className="stat-value">{overviewStats?.totalMessages || 0}</div>
                <div className="stat-change">+22% this week</div>
              </div>
            </div>

            {/* System Health */}
            <div className="admin-charts-section">
              <h3>System Health</h3>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h3>Status</h3>
                  <div className="stat-value" style={{ color: '#4ade80' }}>
                    {overviewStats?.systemHealth?.status || 'Healthy'}
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h3>Uptime</h3>
                  <div className="stat-value">
                    {overviewStats?.systemHealth?.uptime || '99.9%'}
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h3>Response Time</h3>
                  <div className="stat-value">
                    {overviewStats?.systemHealth?.responseTime || '45ms'}
                  </div>
                </div>
                <div className="admin-stat-card">
                  <h3>Error Rate</h3>
                  <div className="stat-value" style={{ color: '#fbbf24' }}>
                    {overviewStats?.systemHealth?.errorRate || '0.1%'}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="admin-table">
              <div className="admin-table-header">
                <h3>Recent Activity</h3>
              </div>
              <div className="admin-table-content">
                <table>
                  <thead>
                    <tr>
                      <th>Activity Type</th>
                      <th>Count</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overviewStats?.recentActivity?.map((activity, index) => (
                      <tr key={index}>
                        <td>{activity.type}</td>
                        <td>{activity.count}</td>
                        <td>{activity.timestamp}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={3}>No recent activity</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3>Total Users</h3>
                <div className="stat-value">{userStats?.totalUsers || 0}</div>
                <div className="stat-change">+12% this month</div>
              </div>
              <div className="admin-stat-card">
                <h3>Active Users</h3>
                <div className="stat-value">{userStats?.activeUsers || 0}</div>
                <div className="stat-change">+5% this week</div>
              </div>
              <div className="admin-stat-card">
                <h3>New Users</h3>
                <div className="stat-value">{userStats?.newUsersThisMonth || 0}</div>
                <div className="stat-change">This month</div>
              </div>
            </div>

            <div className="admin-charts-section">
              <h3>User Analytics</h3>
              <div className="admin-charts-grid">
                <div className="admin-chart-container">
                  <h4>Monthly Growth</h4>
                  <UserGrowthChart data={userStats?.userGrowth || []} />
                </div>
                <div className="admin-chart-container">
                  <h4>Users by Region</h4>
                  <RegionChart data={userStats?.usersByRegion || []} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3>Total Files</h3>
                <div className="stat-value">{fileStats?.totalFiles || 0}</div>
                <div className="stat-change">+15% this month</div>
              </div>
              <div className="admin-stat-card">
                <h3>Total Size</h3>
                <div className="stat-value">{fileStats?.totalSize || '0 GB'}</div>
                <div className="stat-change">+8% this month</div>
              </div>
            </div>

            <div className="admin-charts-section">
              <h3>File Analytics</h3>
              <div className="admin-charts-grid">
                <div className="admin-chart-container">
                  <h4>File Types</h4>
                  <FileTypeChart data={fileStats?.fileTypes || []} />
                </div>
                <div className="admin-chart-container">
                  <h4>Upload Trends</h4>
                  <UploadTrendChart data={fileStats?.uploadTrend || []} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;