const Notification = require('../models/Notification');

// @desc    Get user notifications (filtered by user ID or role)
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let roleTargets = ['all'];
    if (userRole === 'student') roleTargets.push('students');
    else if (userRole === 'driver') roleTargets.push('drivers');
    else if (userRole === 'admin') roleTargets.push('admin');

    const notifications = await Notification.find({
      $or: [
        { user: userId },
        { targetRole: { $in: roleTargets } }
      ]
    })
      .populate('complaintId', 'title category status reportedRole')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    let roleTargets = ['all'];
    if (userRole === 'student') roleTargets.push('students');
    else if (userRole === 'driver') roleTargets.push('drivers');
    else if (userRole === 'admin') roleTargets.push('admin');

    await Notification.updateMany(
      {
        $or: [
          { user: userId },
          { targetRole: { $in: roleTargets } }
        ],
        isRead: false
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
