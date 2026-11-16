const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

// @desc    Get announcements for active user
// @route   GET /api/announcements
// @access  Public / Authenticated
exports.getAnnouncements = async (req, res) => {
  try {
    let query = {};
    if (req.user) {
      if (req.user.role === 'student') {
        query = { targetAudience: { $regex: /all|students/i } };
      } else if (req.user.role === 'driver') {
        query = { targetAudience: { $regex: /all|drivers/i } };
      }
    }

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create announcement (Admin)
// @route   POST /api/announcements
// @access  Private (Admin)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience, priority } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Please provide title and message' });
    }

    const announcement = await Announcement.create({
      title,
      message,
      targetAudience: targetAudience || 'all',
      priority: priority || 'normal',
      createdBy: req.user._id,
      authorName: req.user.name || 'Campus Transit Admin'
    });

    // Create system notifications
    await Notification.create({
      targetRole: targetAudience || 'all',
      title: `Announcement: ${title}`,
      message,
      type: 'announcement'
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_announcement', {
        announcement,
        targetAudience: announcement.targetAudience
      });
    }

    res.status(201).json({
      success: true,
      message: 'Announcement published successfully',
      data: announcement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update announcement (Admin)
// @route   PUT /api/announcements/:id
// @access  Private (Admin)
exports.updateAnnouncement = async (req, res) => {
  try {
    const { title, message, targetAudience, priority } = req.body;

    let announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const updatedFields = {};
    if (title !== undefined) updatedFields.title = title;
    if (message !== undefined) updatedFields.message = message;
    if (targetAudience !== undefined) updatedFields.targetAudience = targetAudience;
    if (priority !== undefined) updatedFields.priority = priority;

    announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );

    const io = req.app.get('io');
    if (io) {
      io.emit('announcement_updated', announcement);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement updated successfully',
      data: announcement
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete announcement (Admin)
// @route   DELETE /api/announcements/:id
// @access  Private (Admin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await announcement.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.emit('announcement_deleted', req.params.id);
    }

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

