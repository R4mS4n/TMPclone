import React, { useState, useEffect } from 'react';

const reportReasonCategories = [
  "Violent or repulsive content",
  "Hateful or abusive content",
  "Impersonation",
  "Harassment or bullying",
  "Harmful or dangerous acts",
  "Misinformation",
  "Spam or misleading content",
  "Sale of regulated goods or services",
  "Other" 
];

const ReportModal = ({ isOpen, onClose, targetType, targetId, onSubmitReport }) => {
  const [selectedReasonCategory, setSelectedReasonCategory] = useState('');
  const [customReasonText, setCustomReasonText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedReasonCategory(reportReasonCategories[0]); // Default to the first category
      setCustomReasonText('');
      setError(null);
      setSuccessMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedReasonCategory) { // A category must be selected
      setError('Please select a reason category for the report.');
      return;
    }
    // Custom reason text is optional, but if "Other" is selected, it could be encouraged
    if (selectedReasonCategory === "Other" && !customReasonText.trim()) {
      setError('Please provide details if you select "Other".');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      // Pass both selectedReasonCategory and customReasonText
      await onSubmitReport(targetType, targetId, selectedReasonCategory, customReasonText);
      setSuccessMessage('Report submitted successfully! Thank you.');
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto" style={{ backdropFilter: 'blur(3px)' }}>
      <div className="absolute inset-0 bg-black opacity-50" onClick={!isSubmitting ? onClose : undefined}></div>
      <div className="bg-base-100 text-base-content w-full max-w-lg mx-4 my-8 rounded-lg shadow-xl z-10 relative flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-base-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-base-content">Report {targetType === 'post' ? 'Post' : 'Comment'}</h2>
          <button onClick={!isSubmitting ? onClose : undefined} className="btn btn-sm btn-circle btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {error && <div className="alert alert-error mb-4 text-sm p-3 shadow-lg"><div><svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{error}</span></div></div>}
          {successMessage && <div className="alert alert-success mb-4 text-sm p-3 shadow-lg"><div><svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{successMessage}</span></div></div>}
          
          {!successMessage && (
            <>
              <div>
                <label className="label">
                  <span className="label-text text-base font-medium">What\'s going on?</span>
                </label>
                <p className="text-xs text-base-content/70 mb-2">We\'ll check for all Community Guideline violations, so don\'t worry about making the perfect choice.</p>
                <div className="space-y-2">
                  {reportReasonCategories.map((category) => (
                    <div key={category} className="form-control">
                      <label className="label cursor-pointer p-2 hover:bg-base-200 rounded-md flex items-center">
                        <input 
                          type="radio" 
                          name="report_reason_category" 
                          className="radio radio-primary mr-3"
                          value={category}
                          checked={selectedReasonCategory === category}
                          onChange={(e) => setSelectedReasonCategory(e.target.value)}
                          disabled={isSubmitting}
                        />
                        <span className="label-text text-base-content">{category}</span> 
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text text-base font-medium">Provide more details (optional)</span>
                </label>
                <textarea 
                  className="w-full p-3 border border-base-300 rounded-md bg-base-200 text-base-content focus:ring-primary focus:border-primary"
                  rows="4"
                  placeholder={`If you wish, you can add more information about why you are reporting this ${targetType === 'post' ? 'post' : 'comment'}...`}
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}
        </div>
        
        {!successMessage && (
          <div className="p-6 border-t border-base-200 flex justify-end space-x-3">
            <button onClick={!isSubmitting ? onClose : undefined} className="btn btn-ghost" disabled={isSubmitting}>Cancel</button>
            <button onClick={handleSubmit} className={`btn btn-error ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal; 