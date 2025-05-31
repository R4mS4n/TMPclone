const db = require('../config/db');

const submitReport = async (req, res) => {
  console.log('[submitReport] Received req.body:', req.body); // Log the entire req.body
  const reporter_user_id = req.user.sub; // Assuming 'sub' from JWT is the user ID
  const {
    action_type, // 'REPORT_POST' or 'REPORT_COMMENT'
    target_post_id,
    target_comment_id,
    reason_category, // Selected predefined reason
    custom_reason_text // Optional custom text from user
  } = req.body;

  if (!reporter_user_id) {
    return res.status(401).json({ message: 'Authentication required to submit a report.' });
  }

  if (!action_type || (action_type !== 'REPORT_POST' && action_type !== 'REPORT_COMMENT')) {
    return res.status(400).json({ message: 'Invalid action_type provided.' });
  }

  if ((action_type === 'REPORT_POST' && !target_post_id) || (action_type === 'REPORT_COMMENT' && !target_comment_id)) {
    return res.status(400).json({ message: 'Target ID (post or comment) is required for the action type.' });
  }

  // A predefined reason category is now mandatory
  if (!reason_category || reason_category.trim() === '') {
    return res.status(400).json({ message: 'A reason category for the report is required.' });
  }
  // custom_reason_text is optional, so no specific validation for it being empty, 
  // but it could be trimmed if provided.
  const final_custom_reason = custom_reason_text ? custom_reason_text.trim() : null;

  let target_user_id = null;

  try {
    if (action_type === 'REPORT_POST') {
      const [posts] = await db.promise().query('SELECT user_id FROM Post WHERE post_id = ?', [target_post_id]);
      if (posts.length === 0) {
        return res.status(404).json({ message: 'Target post not found.' });
      }
      target_user_id = posts[0].user_id;
    } else if (action_type === 'REPORT_COMMENT') {
      const [comments] = await db.promise().query('SELECT user_id FROM Comment WHERE comment_id = ?', [target_comment_id]);
      if (comments.length === 0) {
        return res.status(404).json({ message: 'Target comment not found.' });
      }
      target_user_id = comments[0].user_id;
    }

    if (target_user_id === reporter_user_id) {
      return res.status(403).json({ message: 'You cannot report your own content.' });
    }
    
    // Check for existing pending report by the same user for the same content
    let existingReportQuery = 'SELECT action_id FROM AdminAction WHERE reporter_user_id = ? AND action_type = ? AND status = ?';
    const queryParams = [reporter_user_id, action_type, 'PENDING'];

    if (action_type === 'REPORT_POST') {
      existingReportQuery += ' AND target_post_id = ?';
      queryParams.push(target_post_id);
    } else { // REPORT_COMMENT
      existingReportQuery += ' AND target_comment_id = ?';
      queryParams.push(target_comment_id);
    }

    const [existingReports] = await db.promise().query(existingReportQuery, queryParams);

    if (existingReports.length > 0) {
      return res.status(409).json({ message: 'You have already submitted a report for this content that is pending review.' });
    }


    const [result] = await db.promise().query(
      'INSERT INTO AdminAction (action_type, reporter_user_id, target_post_id, target_comment_id, target_user_id, reason, custom_reason_text, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [action_type, reporter_user_id, target_post_id || null, target_comment_id || null, target_user_id, reason_category, final_custom_reason, 'PENDING']
    );

    res.status(201).json({ message: 'Report submitted successfully.', action_id: result.insertId });

  } catch (error) {
    console.error('Error submitting report:', error);
    res.status(500).json({ message: 'Failed to submit report due to a server error.' });
  }
};

module.exports = {
  submitReport,
}; 