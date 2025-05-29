// controllers/adminController.js

const db = require('../config/db');

/**
 * Listar todos los usuarios
 */
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT 
         user_id, username, mail, xp, level, team_id, role, is_banned, ban_expires_at
       FROM \`User\``
    );

    return res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('adminController.getAllUsers error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al obtener usuarios'
    });
  }
};

/**
 * Actualizar el username de un usuario (solo role = 0)
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Falta el nuevo username'
      });
    }

    const [result] = await db.promise().query(
      `UPDATE \`User\`
       SET username = ?
       WHERE user_id = ? AND role = ?`,
      [username, id, 0]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado o no editable'
      });
    }

    return res.json({
      success: true,
      message: 'Usuario actualizado correctamente'
    });
  } catch (error) {
    console.error('adminController.updateUser error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al actualizar usuario'
    });
  }
};

/**
 * Borrar un usuario (solo role = 0)
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.promise().query(
      `DELETE FROM \`User\`
       WHERE user_id = ? AND role = ?`,
      [id, 0]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado o no borrable'
      });
    }

    return res.json({
      success: true,
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('adminController.deleteUser error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al eliminar usuario'
    });
  }
};

/**
 * Get all content reports from AdminAction table with details and pagination
 */
exports.getAdminActionsReports = async (req, res) => {
  try {
    const { page = 1, limit = 10, status_filter = '' } = req.query;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let whereClauses = "(aa.action_type = 'REPORT_POST' OR aa.action_type = 'REPORT_COMMENT')";
    const queryParams = [];

    if (status_filter && ['PENDING', 'RESOLVED', 'DISMISSED'].includes(status_filter.toUpperCase())) {
      whereClauses += " AND aa.status = ?";
      queryParams.push(status_filter.toUpperCase());
    }

    const reportsQuery = `
      SELECT
        aa.action_id,
        aa.action_type,
        aa.reporter_user_id,
        reporter.username AS reporter_username,
        aa.target_user_id,
        target_user.username AS target_username,
        aa.target_post_id,
        p.title AS post_title,
        p.user_id AS post_author_user_id,
        post_author.username AS post_author_username,
        aa.target_comment_id,
        LEFT(c.content, 100) AS comment_snippet, 
        c.user_id AS comment_author_user_id,
        comment_author.username AS comment_author_username,
        aa.reason AS reason_category,
        aa.custom_reason_text,
        aa.status AS report_status,
        aa.created_at AS report_created_at
      FROM AdminAction aa
      JOIN User reporter ON aa.reporter_user_id = reporter.user_id
      LEFT JOIN User target_user ON aa.target_user_id = target_user.user_id
      LEFT JOIN Post p ON aa.target_post_id = p.post_id
      LEFT JOIN User post_author ON p.user_id = post_author.user_id
      LEFT JOIN Comment c ON aa.target_comment_id = c.comment_id
      LEFT JOIN User comment_author ON c.user_id = comment_author.user_id
      WHERE ${whereClauses}
      ORDER BY aa.created_at DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(parseInt(limit, 10), offset);
    
    const [reports] = await db.promise().query(reportsQuery, queryParams);

    // Count total for pagination
    const countQueryParams = [];
    if (status_filter && ['PENDING', 'RESOLVED', 'DISMISSED'].includes(status_filter.toUpperCase())) {
      countQueryParams.push(status_filter.toUpperCase()); // Same filter for count
    }
    const totalReportsQuery = `SELECT COUNT(*) as total FROM AdminAction aa WHERE ${whereClauses}`;
    const [totalResult] = await db.promise().query(totalReportsQuery, countQueryParams.slice(0, whereClauses.split('?').length -1) ); // use only params for where clause

    const totalReports = totalResult[0].total;

    return res.json({
      success: true,
      data: reports,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalReports / parseInt(limit, 10)),
        totalItems: totalReports,
        limit: parseInt(limit, 10)
      }
    });

  } catch (error) {
    console.error('[adminController.getAdminActionsReports] Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
};

/**
 * Process an admin action on a content report
 * - Updates the report status in AdminAction table
 * - Records the admin_user_id who handled it
 * - Optionally issues a penalty (Warning, Temp Ban, Perma Ban)
 */
exports.processReportAction = async (req, res) => {
  const { reportId } = req.params; // action_id from AdminAction table
  const adminUserId = req.user.sub; // ID of the admin making the call (from JWT)

  const {
    new_report_status, // 'RESOLVED', 'DISMISSED' (or even back to 'PENDING')
    penalty            // Optional object for issuing a penalty
  } = req.body;

  if (!new_report_status || !['PENDING', 'RESOLVED', 'DISMISSED'].includes(new_report_status.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid new_report_status provided. Must be one of: PENDING, RESOLVED, DISMISSED.'
    });
  }

  let dbPromise; // This will be db.promise()
  try {
    dbPromise = db.promise(); // Get the promise-wrapped version of the single connection
    
    await dbPromise.beginTransaction();

    // 1. Update the AdminAction table (report itself)
    const [updateReportResult] = await dbPromise.query(
      'UPDATE AdminAction SET status = ?, admin_user_id = ? WHERE action_id = ?',
      [new_report_status.toUpperCase(), adminUserId, reportId]
    );

    if (updateReportResult.affectedRows === 0) {
      throw new Error('Report not found or not updated.');
    }

    let penaltyMessage = 'Report status updated.';

    // 2. Optionally, issue a penalty
    if (penalty && penalty.user_id_to_penalize && penalty.penalty_type) {
      const { 
        user_id_to_penalize,
        penalty_type, 
        reason,
        duration_days 
      } = penalty;

      if (!['WARNING', 'TEMP_BAN', 'PERMA_BAN'].includes(penalty_type.toUpperCase())) {
        throw new Error('Invalid penalty_type provided.');
      }

      let expires_at = null;
      if (penalty_type.toUpperCase() === 'TEMP_BAN') {
        if (!duration_days || isNaN(parseInt(duration_days)) || parseInt(duration_days) <= 0) {
          throw new Error('Valid duration_days required for TEMP_BAN.');
        }
        expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + parseInt(duration_days));
      }

      // Deactivate any previous active bans for the same user if issuing a new ban (TEMP_BAN or PERMA_BAN)
      if (penalty_type.toUpperCase() === 'TEMP_BAN' || penalty_type.toUpperCase() === 'PERMA_BAN') {
        await dbPromise.query(
          'UPDATE UserPenalties SET is_active = FALSE WHERE user_id = ? AND (penalty_type = \'TEMP_BAN\' OR penalty_type = \'PERMA_BAN\') AND is_active = TRUE',
          [user_id_to_penalize]
        );
      }

      const [newPenaltyResult] = await dbPromise.query(
        'INSERT INTO UserPenalties (user_id, admin_user_id, report_action_id, penalty_type, reason, expires_at, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
        [user_id_to_penalize, adminUserId, reportId, penalty_type.toUpperCase(), reason, expires_at]
      );
      
      if (newPenaltyResult.insertId) {
        penaltyMessage += ` Penalty (${penalty_type}) issued to user ${user_id_to_penalize}.`;
        
        // If it was a ban, update User table (optional, but good for quick checks)
        if (penalty_type.toUpperCase() === 'TEMP_BAN' || penalty_type.toUpperCase() === 'PERMA_BAN') {
            await dbPromise.query(
                'UPDATE User SET is_banned = TRUE, ban_expires_at = ? WHERE user_id = ?',
                [expires_at, user_id_to_penalize]
            );
        }
      } else {
        throw new Error('Failed to issue penalty.');
      }
    }

    await dbPromise.commit();
    res.json({
      success: true,
      message: penaltyMessage
    });

  } catch (error) {
    if (dbPromise) { // Check if dbPromise was assigned
      await dbPromise.rollback();
    }
    console.error('[adminController.processReportAction] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process report action.',
      error: error.message
    });
  } finally {
    // For a single connection managed globally (as in your db.js), 
    // we don't release or end it here per request.
    // If this were a connection obtained from a pool, we would release it.
    // if (dbPromise) { /* No explicit release for single global connection's promise wrapper */ }
  }
};

/**
 * Issue a new penalty (Warning, Temp Ban, Perma Ban) to a specific user.
 * This action also creates an AdminAction record for audit purposes.
 */
exports.issueUserPenalty = async (req, res) => {
  const { userId: targetUserId } = req.params; // User receiving the penalty
  const adminUserId = req.user.sub; // Admin issuing the penalty (from JWT)

  const {
    penalty_type,      // 'WARNING', 'TEMP_BAN', 'PERMA_BAN'
    reason_category,   // Predefined reason category
    custom_reason_text,// Optional custom text from admin
    duration_days      // Optional, for TEMP_BAN
  } = req.body;

  // Validate penalty_type
  if (!penalty_type || !['WARNING', 'TEMP_BAN', 'PERMA_BAN'].includes(penalty_type.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: 'Invalid penalty_type. Must be WARNING, TEMP_BAN, or PERMA_BAN.'
    });
  }

  if (!reason_category && !custom_reason_text) {
    return res.status(400).json({
      success: false,
      message: 'A reason (category or custom text) for the penalty is required.'
    });
  }

  let expires_at = null;
  if (penalty_type.toUpperCase() === 'TEMP_BAN') {
    if (!duration_days || isNaN(parseInt(duration_days)) || parseInt(duration_days) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid duration_days required for TEMP_BAN.' });
    }
    expires_at = new Date();
    expires_at.setDate(expires_at.getDate() + parseInt(duration_days));
  }

  const actionTypeForAdminAction = penalty_type.toUpperCase() === 'WARNING' ? 'WARN' : 'BAN';
  const combinedReason = `${reason_category ? `Category: ${reason_category}` : ''}${reason_category && custom_reason_text ? ' - ' : ''}${custom_reason_text || ''}`.trim() || 'No specific reason provided.';

  let dbPromise;
  try {
    dbPromise = db.promise();
    await dbPromise.beginTransaction();

    // 1. Create an AdminAction record for auditing this direct penalty
    const [adminActionResult] = await dbPromise.query(
      `INSERT INTO AdminAction 
        (action_type, admin_user_id, target_user_id, reason, custom_reason_text, status, created_at) 
       VALUES (?, ?, ?, ?, ?, 'RESOLVED', NOW())`,
      [actionTypeForAdminAction, adminUserId, targetUserId, reason_category, custom_reason_text]
    );
    const newAdminActionId = adminActionResult.insertId;

    if (!newAdminActionId) {
      throw new Error('Failed to create AdminAction audit record.');
    }

    // 2. Deactivate any previous active bans if issuing a new BAN (TEMP_BAN or PERMA_BAN)
    if (penalty_type.toUpperCase() === 'TEMP_BAN' || penalty_type.toUpperCase() === 'PERMA_BAN') {
      await dbPromise.query(
        'UPDATE UserPenalties SET is_active = FALSE WHERE user_id = ? AND (penalty_type = \'TEMP_BAN\' OR penalty_type = \'PERMA_BAN\') AND is_active = TRUE',
        [targetUserId]
      );
    }

    // 3. Create the UserPenalties record
    const [penaltyResult] = await dbPromise.query(
      `INSERT INTO UserPenalties 
        (user_id, admin_user_id, report_action_id, penalty_type, reason, expires_at, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [targetUserId, adminUserId, newAdminActionId, penalty_type.toUpperCase(), combinedReason, expires_at]
    );

    if (!penaltyResult.insertId) {
      throw new Error('Failed to issue penalty to user.');
    }

    let userUpdateMessage = '';
    // 4. If it was a ban, update User table
    if (penalty_type.toUpperCase() === 'TEMP_BAN' || penalty_type.toUpperCase() === 'PERMA_BAN') {
      const [userUpdateResult] = await dbPromise.query(
        'UPDATE User SET is_banned = TRUE, ban_expires_at = ? WHERE user_id = ?',
        [expires_at, targetUserId] // expires_at will be null for PERMA_BAN, which is fine
      );
      if (userUpdateResult.affectedRows > 0) {
        userUpdateMessage = 'User ban status updated.';
      }
    }

    await dbPromise.commit();
    res.status(201).json({
      success: true,
      message: `Penalty (${penalty_type}) issued successfully to user ID ${targetUserId}. ${userUpdateMessage}`.trim(),
      penaltyId: penaltyResult.insertId,
      adminActionId: newAdminActionId
    });

  } catch (error) {
    if (dbPromise) {
      await dbPromise.rollback();
    }
    console.error('[adminController.issueUserPenalty] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to issue penalty.',
      error: error.message
    });
  } 
  // No finally block to release dbPromise as it's a single global connection
};

/**
 * Get all penalties for a specific user.
 */
exports.getUserPenalties = async (req, res) => {
  const { userId: targetUserId } = req.params;
  const { page = 1, limit = 10 } = req.query; // Basic pagination
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  try {
    const dbPromise = db.promise();

    const penaltiesQuery = `
      SELECT 
        up.penalty_id,
        up.user_id,
        up.admin_user_id,
        issuer.username AS admin_username,
        up.report_action_id,
        aa.action_type AS original_admin_action_type,
        aa.reason AS original_report_reason_category,
        aa.custom_reason_text AS original_report_custom_text,
        up.penalty_type,
        up.reason AS penalty_reason,
        up.issued_at,
        up.expires_at,
        up.is_active
      FROM UserPenalties up
      JOIN User issuer ON up.admin_user_id = issuer.user_id
      LEFT JOIN AdminAction aa ON up.report_action_id = aa.action_id
      WHERE up.user_id = ?
      ORDER BY up.issued_at DESC
      LIMIT ? OFFSET ?
    `;

    const [penalties] = await dbPromise.query(penaltiesQuery, [targetUserId, parseInt(limit, 10), offset]);

    const countQuery = 'SELECT COUNT(*) as total FROM UserPenalties WHERE user_id = ?';
    const [totalResult] = await dbPromise.query(countQuery, [targetUserId]);
    const totalPenalties = totalResult[0].total;

    res.json({
      success: true,
      data: penalties,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(totalPenalties / parseInt(limit, 10)),
        totalItems: totalPenalties,
        limit: parseInt(limit, 10)
      }
    });

  } catch (error) {
    console.error('[adminController.getUserPenalties] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user penalties.',
      error: error.message
    });
  }
};

/**
 * Update the status of a specific user penalty (e.g., deactivate an active ban).
 */
exports.updateUserPenaltyStatus = async (req, res) => {
  const { penaltyId } = req.params;
  const { is_active } = req.body; // Expecting a boolean

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ success: false, message: 'is_active (boolean) is required in the request body.' });
  }

  let dbPromise;
  try {
    dbPromise = db.promise();
    await dbPromise.beginTransaction();

    // 1. Get the penalty details, especially user_id and penalty_type
    const [penaltyDetailsRows] = await dbPromise.query('SELECT user_id, penalty_type FROM UserPenalties WHERE penalty_id = ?', [penaltyId]);
    if (penaltyDetailsRows.length === 0) {
      throw new Error('Penalty not found.');
    }
    const { user_id: targetUserId, penalty_type } = penaltyDetailsRows[0];

    // 2. Update the UserPenalties record
    const [updateResult] = await dbPromise.query(
      'UPDATE UserPenalties SET is_active = ? WHERE penalty_id = ?',
      [is_active, penaltyId]
    );

    if (updateResult.affectedRows === 0) {
      // Should not happen if the first query found the penalty, but as a safeguard.
      throw new Error('Penalty not found or not updated.');
    }

    let userStatusUpdateMessage = 'Penalty status updated.';

    // 3. If a BAN type penalty was changed, update the User table's ban status
    if (penalty_type === 'TEMP_BAN' || penalty_type === 'PERMA_BAN') {
      if (is_active === false) { // A ban is being DEACTIVATED
        // Check for other active bans for this user
        const [otherActiveBans] = await dbPromise.query(
          'SELECT expires_at FROM UserPenalties WHERE user_id = ? AND is_active = TRUE AND (penalty_type = \'TEMP_BAN\' OR penalty_type = \'PERMA_BAN\') ORDER BY expires_at DESC',
          [targetUserId]
        );

        if (otherActiveBans.length === 0) {
          // No other active bans, so unban the user
          await dbPromise.query('UPDATE User SET is_banned = FALSE, ban_expires_at = NULL WHERE user_id = ?', [targetUserId]);
          userStatusUpdateMessage += ' User is no longer banned.';
        } else {
          // Still other active bans. Set ban_expires_at to the latest of those.
          // If any of them is a PERMA_BAN (expires_at is NULL), then ban_expires_at remains NULL.
          let latestExpiresAt = null;
          let hasPermaBan = false;
          for (const ban of otherActiveBans) {
            if (ban.expires_at === null) {
              hasPermaBan = true;
              break;
            }
            if (latestExpiresAt === null || new Date(ban.expires_at) > new Date(latestExpiresAt)) {
              latestExpiresAt = ban.expires_at;
            }
          }
          await dbPromise.query('UPDATE User SET is_banned = TRUE, ban_expires_at = ? WHERE user_id = ?', [hasPermaBan ? null : latestExpiresAt, targetUserId]);
          userStatusUpdateMessage += ` User remains banned due to other penalties (expires: ${hasPermaBan ? 'Permanently' : new Date(latestExpiresAt).toLocaleDateString()}).`;
        }
      } else { // A ban is being ACTIVATED (or re-activated)
        // This scenario is less common via this specific endpoint but handled for completeness.
        // We need to find the current penalty's expiry to update the User table.
        const [currentPenaltyDetails] = await dbPromise.query('SELECT expires_at FROM UserPenalties WHERE penalty_id = ?', [penaltyId]);
        await dbPromise.query('UPDATE User SET is_banned = TRUE, ban_expires_at = ? WHERE user_id = ?', 
          [currentPenaltyDetails[0].expires_at, targetUserId]);
        userStatusUpdateMessage += ' User ban status re-activated.';
      }
    }

    await dbPromise.commit();
    res.json({
      success: true,
      message: userStatusUpdateMessage
    });

  } catch (error) {
    if (dbPromise) {
      await dbPromise.rollback();
    }
    console.error('[adminController.updateUserPenaltyStatus] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update penalty status.',
      error: error.message
    });
  }
};
