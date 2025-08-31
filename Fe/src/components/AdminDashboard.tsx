import React, { useState, useEffect } from 'react';
import { FiUsers, FiFileText, FiActivity, FiTrendingUp, FiBarChart, FiPieChart, FiLogOut, FiMessageSquare } from 'react-icons/fi';
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

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
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

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-left">
          <h1>Admin Dashboard</h1>
          <p>ContractAI Management Panel</p>
        </div>
        <div className="admin-header-actions">
          <a href="/" className="back-to-app-button">
            ← Back to Main App
          </a>
          <button className="logout-button" onClick={handleLogout}>
            <FiLogOut /> Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FiActivity /> Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <FiUsers /> Users
        </button>
        <button 
          className={`tab-button ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          <FiFileText /> Files
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && overviewStats && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <FiUsers />
                </div>
                <div className="stat-content">
                  <h3>{overviewStats.totalUsers.toLocaleString()}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon chats">
                  <FiMessageSquare />
                </div>
                <div className="stat-content">
                  <h3>{overviewStats.totalChats.toLocaleString()}</h3>
                  <p>Total Chats</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon files">
                  <FiFileText />
                </div>
                <div className="stat-content">
                  <h3>{overviewStats.totalFiles.toLocaleString()}</h3>
                  <p>Total Files</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon messages">
                  <FiActivity />
                </div>
                <div className="stat-content">
                  <h3>{overviewStats.totalMessages.toLocaleString()}</h3>
                  <p>Total Messages</p>
                </div>
              </div>
            </div>

            <div className="system-health">
              <h3><FiActivity /> System Health</h3>
              <div className="health-grid">
                <div className="health-item">
                  <span className="health-label">Status:</span>
                  <span className={`health-value ${overviewStats.systemHealth.status}`}>
                    {overviewStats.systemHealth.status.charAt(0).toUpperCase() + overviewStats.systemHealth.status.slice(1)}
                  </span>
                </div>
                <div className="health-item">
                  <span className="health-label">Uptime:</span>
                  <span className="health-value">{overviewStats.systemHealth.uptime}</span>
                </div>
                <div className="health-item">
                  <span className="health-label">Response Time:</span>
                  <span className="health-value">{overviewStats.systemHealth.responseTime}</span>
                </div>
                <div className="health-item">
                  <span className="health-label">Error Rate:</span>
                  <span className="health-value">{overviewStats.systemHealth.errorRate}</span>
                </div>
                <div className="health-item">
                  <span className="health-label">CPU Usage:</span>
                  <span className="health-value">{overviewStats.systemHealth.cpuUsage}</span>
                </div>
                <div className="health-item">
                  <span className="health-label">Memory Usage:</span>
                  <span className="health-value">{overviewStats.systemHealth.memoryUsage}</span>
                </div>
                <div className="health-item">
                  <span className="health-label">Disk Usage:</span>
                  <span className="health-value">{overviewStats.systemHealth.diskUsage}</span>
                </div>
                <div className="health-item">
                  <span className="health-label">Active Connections:</span>
                  <span className="health-value">{overviewStats.systemHealth.activeConnections}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && userStats && (
          <div className="users-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon users">
                  <FiUsers />
                </div>
                <div className="stat-content">
                  <h3>{userStats.totalUsers.toLocaleString()}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon active">
                  <FiActivity />
                </div>
                <div className="stat-content">
                  <h3>{userStats.activeUsers.toLocaleString()}</h3>
                  <p>Active Users</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon growth">
                  <FiTrendingUp />
                </div>
                <div className="stat-content">
                  <h3>{userStats.newUsersThisMonth.toLocaleString()}</h3>
                  <p>New This Month</p>
                </div>
              </div>
            </div>

            <div className="chart-section">
              <h3><FiBarChart /> User Growth Trend</h3>
              {userStats.userGrowth && userStats.userGrowth.length > 0 ? (
                <UserGrowthChart data={userStats.userGrowth} />
              ) : (
                <div className="no-data">No user growth data available</div>
              )}
            </div>

            <div className="chart-section">
              <h3><FiPieChart /> Users by Region</h3>
              {userStats.usersByRegion && userStats.usersByRegion.length > 0 ? (
                <RegionChart data={userStats.usersByRegion} />
              ) : (
                <div className="no-data">No regional data available</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'files' && fileStats && (
          <div className="files-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon files">
                  <FiFileText />
                </div>
                <div className="stat-content">
                  <h3>{fileStats.totalFiles.toLocaleString()}</h3>
                  <p>Total Files</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon storage">
                  <FiActivity />
                </div>
                <div className="stat-content">
                  <h3>{fileStats.totalSize}</h3>
                  <p>Storage Used</p>
                </div>
              </div>
            </div>

            <div className="chart-section">
              <h3><FiPieChart /> File Types Distribution</h3>
              {fileStats.fileTypes && fileStats.fileTypes.length > 0 ? (
                <FileTypeChart data={fileStats.fileTypes} />
              ) : (
                <div className="no-data">No file type data available</div>
              )}
            </div>

            <div className="chart-section">
              <h3><FiBarChart /> Upload Trend</h3>
              {fileStats.uploadTrend && fileStats.uploadTrend.length > 0 ? (
                <UploadTrendChart data={fileStats.uploadTrend} />
              ) : (
                <div className="no-data">No upload trend data available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;