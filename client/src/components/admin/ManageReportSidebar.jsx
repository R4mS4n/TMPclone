import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = 'https://tmp-9643.onrender.com';

const ManageReportSidebar = ({ isOpen, onClose, report, onActionSuccess }) => {
  const [newReportStatus, setNewReportStatus] = useState('');
  const [penaltyType, setPenaltyType] = useState(''); // '', 'WARNING', 'TEMP_BAN', 'PERMA_BAN'
  const [penaltyReason, setPenaltyReason] = useState('');
  const [tempBanDurationDays, setTempBanDurationDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [targetUserDetails, setTargetUserDetails] = useState(null);

  // State for the success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    if (report) {
      setNewReportStatus(report.report_status || 'PENDING'); // Default to current or PENDING
      setPenaltyType(''); // Reset penalty options when report changes
      setPenaltyReason('');
      setTempBanDurationDays(7);
      setError(null);
      fetchTargetUserDetails(report);
    } else {
      setTargetUserDetails(null);
    }
  }, [report]);

  const fetchTargetUserDetails = useCallback(async (currentReport) => {
    if (!currentReport) return;
    let userIdToFetch = null;
    if (currentReport.action_type === 'REPORT_POST' && currentReport.post_author_user_id) {
      userIdToFetch = currentReport.post_author_user_id;
    } else if (currentReport.action_type === 'REPORT_COMMENT' && currentReport.comment_author_user_id) {
      userIdToFetch = currentReport.comment_author_user_id;
    } else if (currentReport.target_user_id) { // Fallback if direct author not available from report join
      userIdToFetch = currentReport.target_user_id;
    }

    if (!userIdToFetch) {
      // console.log('No target user ID available to fetch details for.');
      setTargetUserDetails({ username: 'N/A (no direct user ID)' });
      return;
    }

    // This assumes you have an endpoint like /api/users/:id that can be accessed by an admin
    // or a specific admin endpoint to get basic user details.
    // For now, we will just display the username if available directly from the report object
    // to avoid adding another API call complexity at this stage.
    if (userIdToFetch === currentReport.post_author_user_id && currentReport.post_author_username) {
        setTargetUserDetails({ user_id: userIdToFetch, username: currentReport.post_author_username });
    } else if (userIdToFetch === currentReport.comment_author_user_id && currentReport.comment_author_username) {
        setTargetUserDetails({ user_id: userIdToFetch, username: currentReport.comment_author_username });
    } else if (userIdToFetch === currentReport.target_user_id && currentReport.target_username) {
        setTargetUserDetails({ user_id: userIdToFetch, username: currentReport.target_username });
    } else {
        setTargetUserDetails({ user_id: userIdToFetch, username: `User ID: ${userIdToFetch} (fetch details if needed)` });
    }
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!report) {
      setError('No report selected.');
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('authToken');
    const payload = {
      new_report_status: newReportStatus,
    };

    if (penaltyType && targetUserDetails && targetUserDetails.user_id) {
      if (penaltyType === 'WARNING' || penaltyType === 'TEMP_BAN' || penaltyType === 'PERMA_BAN') {
        payload.penalty = {
          user_id_to_penalize: targetUserDetails.user_id,
          penalty_type: penaltyType,
          reason: penaltyReason || `Penalty related to report #${report.action_id}`,
        };
        if (penaltyType === 'TEMP_BAN') {
          if (!tempBanDurationDays || tempBanDurationDays <= 0) {
            setError('Please enter a valid duration for temporary ban.');
            setIsSubmitting(false);
            return;
          }
          payload.penalty.duration_days = parseInt(tempBanDurationDays, 10);
        }
      }
    } else if (penaltyType) {
        setError('Target user details not available for penalty.');
        setIsSubmitting(false);
        return;
    }

    try {
      const url = `${API_BASE_URL}/api/admin/content-reports/${report.action_id}/action`;
      console.log('[ManageReportSidebar] Attempting to PUT to URL:', url);
      console.log('[ManageReportSidebar] report.action_id type:', typeof report.action_id, 'value:', report.action_id);

      const response = await window.fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || 'Failed to submit action.');
      }
      
      setModalMessage(responseData.message || 'Report action processed successfully!');
      setShowSuccessModal(true);
    } catch (err) {
      console.error('[ManageReportSidebar] handleSubmit error:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onActionSuccess(); // Refresh data
    onClose(); // Close the sidebar
  };

  if (!report) return null; // Don't render if no report is selected

  const getUserIdToPenalize = () => {
    if (report.action_type === 'REPORT_POST') return report.post_author_user_id;
    if (report.action_type === 'REPORT_COMMENT') return report.comment_author_user_id;
    return report.target_user_id; // Fallback, though ideally the joins provide specific authors
  };

  const getUsernameToPenalize = () => {
    if (report.action_type === 'REPORT_POST') return report.post_author_username;
    if (report.action_type === 'REPORT_COMMENT') return report.comment_author_username;
    return report.target_username; 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-[55]"
            onClick={onClose} // Close on overlay click
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed right-0 top-0 w-full max-w-md h-full bg-base-100 shadow-2xl z-[60] flex flex-col"
          >
            <div className="p-5 border-b border-base-300 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-base-content">Manage Report #{report.action_id}</h2>
              <button onClick={onClose} className="btn btn-sm btn-ghost text-base-content/70 hover:bg-base-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-5 space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-1 text-primary">Report Details</h3>
                <p className="text-sm"><span className="font-semibold">Type:</span> {report.action_type}</p>
                <p className="text-sm"><span className="font-semibold">Reported by:</span> {report.reporter_username} (ID: {report.reporter_user_id})</p>
                <p className="text-sm"><span className="font-semibold">Reason Category:</span> {report.reason_category}</p>
                {report.custom_reason_text && <p className="text-sm"><span className="font-semibold">Custom Reason:</span> {report.custom_reason_text}</p>}
                <p className="text-sm"><span className="font-semibold">Reported At:</span> {new Date(report.report_created_at).toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-1 text-primary">Content & Target User</h3>
                {/* Display content snippet/link here */}
                <div className="text-sm p-2 my-2 border border-base-300 rounded bg-base-200/30 max-h-24 overflow-y-auto">
                    {report.action_type === 'REPORT_POST' && (
                        <>
                            Post Title: {report.post_title || 'N/A'} <br/>
                            Author: {report.post_author_username || 'N/A'} (ID: {report.post_author_user_id || 'N/A'})
                        </>
                    )}
                    {report.action_type === 'REPORT_COMMENT' && (
                        <>
                            Comment Snippet: "{report.comment_snippet || 'N/A'}..." <br/>
                            Author: {report.comment_author_username || 'N/A'} (ID: {report.comment_author_user_id || 'N/A'})
                        </>
                    )}
                </div>
                 {targetUserDetails && (
                  <p className="text-sm font-semibold">User to Penalize: {targetUserDetails.username || 'N/A'} (ID: {targetUserDetails.user_id || 'N/A'})</p>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium text-base-content">Set Report Status:</span>
                </label>
                <select 
                  className="select select-bordered w-full"
                  value={newReportStatus}
                  onChange={(e) => setNewReportStatus(e.target.value)}
                >
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="DISMISSED">Dismissed</option>
                </select>
              </div>
              
              <hr className="my-6 border-base-300"/>

              <div>
                <h3 className="text-lg font-medium mb-2 text-accent">Issue Penalty (Optional)</h3>
                {(!targetUserDetails || !targetUserDetails.user_id) && (
                    <p className="text-sm text-error-content bg-error p-2 rounded-md">Cannot issue penalty: Target user ID not available from report details.</p>
                )}
                {targetUserDetails && targetUserDetails.user_id && (
                    <>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text font-medium text-base-content">Penalty Type:</span>
                            </label>
                            <select 
                                className="select select-bordered w-full"
                                value={penaltyType}
                                onChange={(e) => setPenaltyType(e.target.value)}
                                disabled={!getUserIdToPenalize()} // Disable if no target user ID
                            >
                                <option value="">No Penalty</option>
                                <option value="WARNING">Issue Warning</option>
                                <option value="TEMP_BAN">Temporary Ban</option>
                                <option value="PERMA_BAN">Permanent Ban</option>
                            </select>
                        </div>

                        {penaltyType === 'TEMP_BAN' && (
                            <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text font-medium text-base-content">Temp Ban Duration (days):</span>
                            </label>
                            <input 
                                type="number" 
                                className="input input-bordered w-full"
                                value={tempBanDurationDays}
                                onChange={(e) => setTempBanDurationDays(Math.max(1, parseInt(e.target.value,10) || 1))}
                                min="1"
                            />
                            </div>
                        )}

                        {(penaltyType === 'WARNING' || penaltyType === 'TEMP_BAN' || penaltyType === 'PERMA_BAN') && (
                            <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text font-medium text-base-content">Reason/Note for Penalty:</span>
                            </label>
                            <textarea 
                                className="textarea textarea-bordered w-full h-24"
                                placeholder="E.g., Violation of rule X, repeated offenses..."
                                value={penaltyReason}
                                onChange={(e) => setPenaltyReason(e.target.value)}
                            />
                            </div>
                        )}
                    </>
                )}
              </div>

              {error && <p className="text-sm text-error mt-2">Error: {error}</p>}

              <div className="pt-4 pb-2 border-t border-base-300 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting}>Cancel</button>
                <button type="submit" className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting || (!targetUserDetails && penaltyType !=='') }>
                  {isSubmitting ? 'Submitting...' : 'Submit Action'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="modal modal-open modal-bottom sm:modal-middle">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-success">Success!</h3>
            <p className="py-4">{modalMessage}</p>
            <div className="modal-action">
              <button onClick={handleCloseSuccessModal} className="btn btn-primary">OK</button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ManageReportSidebar; 