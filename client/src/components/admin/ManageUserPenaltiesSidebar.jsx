import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNotification } from '../../contexts/NotificationContext';
import { XMarkIcon, PaperAirplaneIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Using heroicons

const API_ADMIN_BASE = "http://localhost:5000/api/admin";

const predefinedReasons = [
  { value: "SPAMMING", label: "Spamming or Flooding" },
  { value: "HARASSMENT", label: "Harassment or Bullying" },
  { value: "HATE_SPEECH", label: "Hate Speech or Discrimination" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate Content (NSFW, Gore)" },
  { value: "CHEAT_EXPLOIT", label: "Cheating or Exploiting Bugs" },
  { value: "IMPERSONATION", label: "Impersonation" },
  { value: "ACCOUNT_SHARING_TRADING", label: "Account Sharing/Trading" },
  { value: "REAL_MONEY_TRADING", label: "Real Money Trading (RMT)" },
  { value: "OTHER", label: "Other (Specify Below)" },
];

const ManageUserPenaltiesSidebar = ({ user, onClose, onActionSuccess }) => {
  const { notifySuccess, notifyError, confirm } = useNotification();

  // Form state for new penalty
  const [penaltyType, setPenaltyType] = useState('WARNING'); // WARNING, TEMP_BAN, PERMA_BAN
  const [reasonCategory, setReasonCategory] = useState(predefinedReasons[0].value);
  const [customReasonText, setCustomReasonText] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [isSubmittingPenalty, setIsSubmittingPenalty] = useState(false);

  // State for existing penalties list
  const [penalties, setPenalties] = useState([]);
  const [isLoadingPenalties, setIsLoadingPenalties] = useState(false);
  const [isUpdatingPenaltyStatus, setIsUpdatingPenaltyStatus] = useState(null); // Store penalty_id being updated
  // Add state for pagination of penalties, though UI for changing page isn't built yet
  const [penaltyPage, setPenaltyPage] = useState(1);
  const [penaltyLimit, setPenaltyLimit] = useState(10); // Or a suitable default
  const [totalPenalties, setTotalPenalties] = useState(0);

  const fetchUserPenalties = useCallback(async () => {
    if (!user?.user_id) return;
    setIsLoadingPenalties(true);
    try {
      // Construct URL with query parameters for pagination
      const url = `${API_ADMIN_BASE}/users/${user.user_id}/penalties?page=${penaltyPage}&limit=${penaltyLimit}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Failed to fetch penalties' }));
        throw new Error(errData.message || errData.error || 'Failed to fetch penalties');
      }
      const data = await res.json();
      setPenalties(data.data || []);
      setTotalPenalties(data.pagination?.totalItems || 0);
    } catch (error) {
      console.error("Error fetching user penalties:", error);
      notifyError(error.message);
      setPenalties([]);
    } finally {
      setIsLoadingPenalties(false);
    }
  }, [user?.user_id, penaltyPage, penaltyLimit, notifyError]);

  useEffect(() => {
    fetchUserPenalties();
  }, [fetchUserPenalties]);

  const handleIssuePenalty = async (e) => {
    e.preventDefault();
    if (!user?.user_id) {
      notifyError("No user selected.");
      return;
    }

    let body = {
      penalty_type: penaltyType,
      reason_category: reasonCategory,
      custom_reason_text: customReasonText,
    };

    if (penaltyType === 'TEMP_BAN') {
      if (!durationDays || isNaN(parseInt(durationDays)) || parseInt(durationDays) <= 0) {
        notifyError("Please enter a valid duration in days for a temporary ban.");
        return;
      }
      body.duration_days = parseInt(durationDays);
    }
    if (reasonCategory === 'OTHER' && !customReasonText.trim()) {
        notifyError("Please specify the reason in the custom text field when 'Other' is selected.");
        return;
    }

    setIsSubmittingPenalty(true);
    try {
      const res = await fetch(`${API_ADMIN_BASE}/users/${user.user_id}/penalties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(body),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || resData.error || 'Failed to issue penalty');
      }
      notifySuccess(resData.message || 'Penalty issued successfully!');
      // Reset form
      setPenaltyType('WARNING');
      setReasonCategory(predefinedReasons[0].value);
      setCustomReasonText('');
      setDurationDays('');
      fetchUserPenalties(); // Refresh penalty list
      if (onActionSuccess) onActionSuccess(); // Callback to parent (e.g., refresh user list)
    } catch (error) {
      console.error("Error issuing penalty:", error);
      notifyError(error.message);
    } finally {
      setIsSubmittingPenalty(false);
    }
  };

  const handleUpdatePenaltyStatus = async (penaltyId, newStatus) => {
    confirm(
      `Are you sure you want to ${newStatus ? 'reactivate' : 'deactivate'} this penalty?`,
      async () => {
        setIsUpdatingPenaltyStatus(penaltyId);
        try {
          const res = await fetch(`${API_ADMIN_BASE}/penalties/${penaltyId}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({ is_active: newStatus }),
          });
          const resData = await res.json();
          if (!res.ok) {
            throw new Error(resData.message || resData.error || 'Failed to update penalty status');
          }
          notifySuccess(resData.message || 'Penalty status updated successfully!');
          fetchUserPenalties(); // Refresh list
          if (onActionSuccess) onActionSuccess(); // Callback to parent
        } catch (error) {
          console.error("Error updating penalty status:", error);
          notifyError(error.message);
        } finally {
          setIsUpdatingPenaltyStatus(null);
        }
      }
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) {
        return dateString; // fallback if date is not valid
    }
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 250 }}
      className="fixed right-0 top-0 w-full max-w-xl h-full bg-base-200 shadow-2xl z-[60] flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-base-300 bg-base-100">
        <h2 className="text-xl font-semibold text-primary">Manage Penalties: {user.username} (ID: {user.user_id})</h2>
        <button onClick={onClose} className="btn btn-sm btn-ghost">
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {/* Issue New Penalty Form */}
        <form onSubmit={handleIssuePenalty} className="p-4 bg-base-100 rounded-lg shadow space-y-4">
          <h3 className="text-lg font-semibold text-secondary border-b border-base-300 pb-2 mb-3">Issue New Penalty</h3>
          
          <div>
            <label htmlFor="penaltyType" className="label">
              <span className="label-text">Penalty Type</span>
            </label>
            <select 
              id="penaltyType" 
              className="select select-bordered w-full rounded-md"
              value={penaltyType}
              onChange={(e) => setPenaltyType(e.target.value)}
            >
              <option value="WARNING">Warning</option>
              <option value="TEMP_BAN">Temporary Ban</option>
              <option value="PERMA_BAN">Permanent Ban</option>
            </select>
          </div>

          {penaltyType === 'TEMP_BAN' && (
            <div>
              <label htmlFor="durationDays" className="label">
                <span className="label-text">Duration (in days)</span>
              </label>
              <input 
                type="number" 
                id="durationDays" 
                className="input input-bordered w-full rounded-md"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="e.g., 7"
                min="1"
              />
            </div>
          )}

          <div>
            <label htmlFor="reasonCategory" className="label">
              <span className="label-text">Reason Category</span>
            </label>
            <select 
              id="reasonCategory" 
              className="select select-bordered w-full rounded-md"
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
            >
              {predefinedReasons.map(reason => (
                <option key={reason.value} value={reason.value}>{reason.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="customReasonText" className="label">
              <span className="label-text">Custom Reason Text (Optional, required if 'Other')</span>
            </label>
            <textarea 
              id="customReasonText" 
              className="textarea textarea-bordered w-full rounded-md" 
              rows="3"
              value={customReasonText}
              onChange={(e) => setCustomReasonText(e.target.value)}
              placeholder="Provide specific details here..."
            ></textarea>
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary w-full rounded-md" 
            disabled={isSubmittingPenalty}
          >
            {isSubmittingPenalty ? <span className="loading loading-spinner"></span> : 'Issue Penalty'}
            {!isSubmittingPenalty && <PaperAirplaneIcon className="h-5 w-5 ml-2" />}
          </button>
        </form>

        {/* Existing Penalties List - TODO */}
        <div className="p-4 bg-base-100 rounded-lg shadow space-y-4">
            <h3 className="text-lg font-semibold text-secondary border-b border-base-300 pb-2 mb-3">Penalty History ({penalties.length})</h3>
            {/* Placeholder for penalty list - to be implemented next */}
             {isLoadingPenalties ? (
                <div className="text-center p-4"><span className="loading loading-dots loading-md"></span> Loading penalties...</div>
            ) : penalties.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="table table-compact w-full table-zebra">
                        <thead className="bg-base-300 text-base-content">
                            <tr>
                                <th className="p-2">ID</th>
                                <th className="p-2">Type</th>
                                <th className="p-2 max-w-xs truncate">Reason</th>
                                <th className="p-2">Issued</th>
                                <th className="p-2">Expires</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {penalties.map(p => (
                                <tr key={p.penalty_id} className="hover">
                                    <td className="p-2 font-mono text-xs">{p.penalty_id}</td>
                                    <td className="p-2">
                                        <span className={`badge ${p.penalty_type === 'WARNING' ? 'badge-warning' : p.penalty_type === 'TEMP_BAN' ? 'badge-error' : 'badge-error badge-outline'} badge-sm`}>
                                            {p.penalty_type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-2 text-xs max-w-xs truncate" title={p.penalty_reason}>{p.penalty_reason}</td>
                                    <td className="p-2 text-xs">{formatDate(p.issued_at)}</td>
                                    <td className="p-2 text-xs">{p.penalty_type === 'PERMA_BAN' ? 'Never' : formatDate(p.expires_at)}</td>
                                    <td className="p-2">
                                        <span className={`badge ${p.is_active ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                                            {p.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-2">
                                        <button 
                                            className={`btn btn-xs rounded-md ${p.is_active ? 'btn-outline btn-error' : 'btn-outline btn-success'}`}
                                            onClick={() => handleUpdatePenaltyStatus(p.penalty_id, !p.is_active)}
                                            disabled={isUpdatingPenaltyStatus === p.penalty_id}
                                        >
                                            {isUpdatingPenaltyStatus === p.penalty_id ? 
                                                <span className="loading loading-spinner loading-xs"></span> : 
                                                (p.is_active ? <><EyeSlashIcon className="h-4 w-4 mr-1"/>Deactivate</> : <><EyeIcon className="h-4 w-4 mr-1"/>Reactivate</>)
                                            }
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-center p-4 text-base-content/70">No penalties found for this user.</p>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default ManageUserPenaltiesSidebar; 