import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ManageReportSidebar from './ManageReportSidebar'; // Import the new sidebar
// import { useNotification } from '../../contexts/NotificationContext'; // If you have notifications

const API_BASE_URL = 'http://localhost:5000'; // Ensure this is correct

const AdminReportsView = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [statusFilter, setStatusFilter] = useState('');
  // const { notifySuccess, notifyError, confirm } = useNotification(); // If using notifications

  // State for the manage report sidebar
  const [isManageSidebarOpen, setIsManageSidebarOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async (page = 1, limit = 10, filter = '') => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('authToken');
    let urlToFetch = `${API_BASE_URL}/api/admin/content-reports?page=${page}&limit=${limit}`;
    if (filter) {
      urlToFetch += `&status_filter=${filter}`;
    }

    try {
      const response = await window.fetch(urlToFetch, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network response was not ok' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setReports(data.data || []);
        setPagination(data.pagination || { currentPage: 1, totalPages: 1, limit: 10, totalItems: 0 });
      } else {
        throw new Error(data.error || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
      setReports([]); // Clear reports on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports(pagination.currentPage, pagination.limit, statusFilter);
  }, [fetchReports, pagination.currentPage, pagination.limit, statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }));
    }
  };

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to page 1 on filter change
  };

  // Functions to handle the manage sidebar
  const handleOpenManageSidebar = (report) => {
    setSelectedReport(report);
    setIsManageSidebarOpen(true);
  };

  const handleCloseManageSidebar = () => {
    setIsManageSidebarOpen(false);
    setSelectedReport(null);
  };

  const handleActionSuccess = () => {
    fetchReports(pagination.currentPage, pagination.limit, statusFilter); // Refresh data
    // Potentially show a success message here if not handled by the sidebar itself
  };

  const renderContentLink = (report) => {
    if (report.action_type === 'REPORT_POST' && report.target_post_id) {
      return <Link to={`/blog/post/${report.target_post_id}`} className="link link-hover text-primary" target="_blank" rel="noopener noreferrer">Post: {report.post_title || report.target_post_id}</Link>;
    }
    if (report.action_type === 'REPORT_COMMENT' && report.target_comment_id) {
      return <span className="text-sm">Comment ID: {report.target_comment_id} on <Link to={`/blog/post/${report.target_post_id}`} className="link link-hover text-primary" target="_blank" rel="noopener noreferrer">Post: {report.post_title || report.target_post_id}</Link></span>;
    }
    return <span className="text-xs italic">N/A</span>;
  };

  if (isLoading) {
    return <div className="p-4"><span className="loading loading-spinner"></span> Fetching reports...</div>;
  }

  if (error) {
    return <div className="p-4 text-error">Error loading reports: {error}</div>;
  }

  return (
    <div className="bg-base-100 text-base-content min-h-screen p-4 md:p-6 rounded-md">
      <h1 className="text-2xl font-bold mb-6 text-primary">Content Reports Management</h1>

      <div className="mb-4 flex items-center space-x-3 p-4 bg-neutral text-neutral-content rounded-md shadow">
        <label htmlFor="statusFilter" className="label-text">Filter by status:</label>
        <select 
          id="statusFilter"
          value={statusFilter}
          onChange={handleFilterChange}
          className="select select-bordered rounded-md shadow-sm h-12"
          style={{ height: '3rem' }}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {reports.length === 0 ? (
        <p>No reports found matching your criteria.</p>
      ) : (
        <div className="overflow-x-auto shadow-lg rounded-md">
          <table className="table w-full table-zebra table-compact">
            <thead>
              <tr className="bg-base-300 text-base-content">
                <th>ID</th>
                <th>Type</th>
                <th>Reason</th>
                <th>Custom Text</th>
                <th>Reporter</th>
                <th>Target</th>
                <th>Content Details</th>
                <th>Reported At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.action_id} className="hover">
                  <td className="font-semibold">{report.action_id}</td>
                  <td>
                    <span className={`badge ${report.action_type === 'REPORT_POST' ? 'badge-info' : 'badge-warning'} badge-sm rounded-md`}>
                      {report.action_type.replace('REPORT_','')}
                    </span>
                  </td>
                  <td>{report.reason_category}</td>
                  <td className="max-w-xs truncate" title={report.custom_reason_text}>{report.custom_reason_text || 'N/A'}</td>
                  <td>{report.reporter_username} (ID: {report.reporter_user_id})</td>
                  <td>
                    {report.action_type === 'REPORT_POST' ? 
                      `${report.post_author_username || 'User N/A'} (Post ID: ${report.target_post_id})` : 
                      `${report.comment_author_username || 'User N/A'} (Comment ID: ${report.target_comment_id})`
                    }
                  </td>
                  <td>
                    {report.action_type === 'REPORT_POST' && report.post_title && 
                      <Link to={`/post/${report.target_post_id}`} target="_blank" className="link link-hover text-xs">
                        "{report.post_title.substring(0,30)}..."
                      </Link>
                    }
                    {report.action_type === 'REPORT_COMMENT' && report.comment_snippet &&
                       <span className="text-xs italic">"{report.comment_snippet.substring(0,30)}..."</span>
                    }
                  </td>
                  <td>{new Date(report.report_created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-sm font-semibold 
                      ${report.report_status === 'PENDING' ? 'badge-warning' : 
                        report.report_status === 'RESOLVED' ? 'badge-success' : 
                        report.report_status === 'DISMISSED' ? 'badge-neutral' : 'badge-ghost'}
                    `}>
                      {report.report_status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-primary rounded-md border-2 shadow-lg"
                      onClick={() => handleOpenManageSidebar(report)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button 
            className="btn btn-sm btn-outline" 
            onClick={() => handlePageChange(pagination.currentPage - 1)} 
            disabled={pagination.currentPage === 1}
          >
            « Prev
          </button>
          <span className="text-sm">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button 
            className="btn btn-sm btn-outline" 
            onClick={() => handlePageChange(pagination.currentPage + 1)} 
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next »
          </button>
        </div>
      )}

      {/* Manage Report Sidebar */}
      <ManageReportSidebar 
        isOpen={isManageSidebarOpen}
        onClose={handleCloseManageSidebar}
        report={selectedReport}
        onActionSuccess={handleActionSuccess}
      />

    </div>
  );
};

export default AdminReportsView; 