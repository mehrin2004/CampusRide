const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

// @desc    Get complaints filtered by user role / permissions
// @route   GET /api/complaints
// @access  Private
exports.getComplaints = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query = {
        $or: [
          { reportedBy: req.user._id },
          { targetAudience: { $in: ['students', 'all'] } }
        ]
      };
    } else if (req.user.role === 'driver') {
      query = {
        $or: [
          { reportedBy: req.user._id },
          { targetAudience: { $in: ['drivers', 'all'] } }
        ]
      };
    }
    // Admin sees all complaints

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'name email role phone rollNumber licenseNumber')
      .populate('bus', 'busNumber plateNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create complaint or product requisition (Driver or Student)
// @route   POST /api/complaints
// @access  Private (Driver / Student / Admin)
exports.createComplaint = async (req, res) => {
  try {
    const { title, category, description, busId, priority, targetAudience, isVoiceSubmitted, isRequisition, estimatedPrice, billReceiptImage } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({ success: false, message: 'Please provide title, category, and description' });
    }

    const complaint = await Complaint.create({
      title,
      category,
      description,
      reportedBy: req.user._id,
      reportedRole: req.user.role,
      bus: busId || req.user.assignedBus || null,
      priority: priority || 'medium',
      targetAudience: targetAudience || (req.user.role === 'driver' ? 'drivers' : 'students'),
      status: 'pending',
      isVoiceSubmitted: !!isVoiceSubmitted,
      isRequisition: !!isRequisition,
      estimatedPrice: estimatedPrice || 0,
      billReceiptImage: billReceiptImage || ''
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('reportedBy', 'name email role phone')
      .populate('bus', 'busNumber plateNumber');

    // Create Notification for Admin
    const adminNotif = await Notification.create({
      targetRole: 'admin',
      title: `New ${req.user.role.toUpperCase()} Issue: ${title}`,
      message: `Reported by ${req.user.name || 'User'} (${req.user.role}): ${description.substring(0, 100)}`,
      type: 'complaint_submitted',
      complaintId: complaint._id
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_complaint_submitted', {
        complaint: populatedComplaint,
        notification: adminNotif,
        message: `New ${req.user.role} issue submitted: ${title}`
      });
    }

    res.status(201).json({
      success: true,
      message: isRequisition ? 'Garage product requisition submitted' : 'Complaint reported successfully',
      data: populatedComplaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: Solve complaint & upload progress targeted to students or drivers + Generate Garage Bill Pass
// @route   PUT /api/complaints/:id/progress
// @access  Private (Admin)
exports.updateComplaintProgress = async (req, res) => {
  try {
    const { status, note, targetAudience, resolutionNote, proofNote, proofImage, estimatedPrice, billPassNote, billReceiptImage } = req.body;

    const complaint = await Complaint.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('bus', 'busNumber');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (status) complaint.status = status;
    if (targetAudience) complaint.targetAudience = targetAudience;
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (proofNote !== undefined) complaint.proofNote = proofNote;
    if (proofImage !== undefined) complaint.proofImage = proofImage;
    if (estimatedPrice !== undefined) complaint.estimatedPrice = estimatedPrice;
    if (billReceiptImage) complaint.billReceiptImage = billReceiptImage;
    if (billPassNote !== undefined) {
      complaint.billPassNote = billPassNote;
      complaint.billIssuedAt = Date.now();
    }
    if (status === 'resolved') complaint.resolvedAt = Date.now();

    if (note || billPassNote) {
      const updateText = note || (billPassNote ? `Garage Purchase Bill Issued: $${estimatedPrice || 0}. Note: ${billPassNote}` : 'Progress updated by Admin');
      complaint.progressUpdates.push({
        note: updateText,
        status: status || complaint.status,
        updatedBy: req.user._id,
        updatedByName: req.user.name || 'Campus Transit Admin',
        targetAudience: targetAudience || complaint.targetAudience || 'all',
        timestamp: Date.now()
      });
    }

    await complaint.save();

    // Create notification for reporter and target audience
    const audienceLabel = (targetAudience || complaint.targetAudience).toUpperCase();
    const isResolved = complaint.status === 'resolved';
    const notifTitle = isResolved 
      ? `✅ Issue Resolved: ${complaint.title}` 
      : `🟡 Issue Progress Update: ${complaint.title}`;
    const notifMsg = `Status: ${complaint.status.toUpperCase()}. ${billPassNote ? `Bill Approved: $${complaint.estimatedPrice}. ` : ''}${note || resolutionNote || proofNote || 'Admin updated resolution progress.'}`;

    const updatedNotif = await Notification.create({
      user: complaint.reportedBy ? complaint.reportedBy._id : null,
      targetRole: targetAudience || complaint.targetAudience || 'all',
      title: notifTitle,
      message: notifMsg,
      type: 'complaint_update',
      complaintId: complaint._id
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('complaint_progress_updated', {
        complaintId: complaint._id,
        status: complaint.status,
        targetAudience: complaint.targetAudience,
        progressUpdates: complaint.progressUpdates,
        title: complaint.title,
        message: notifMsg,
        reportedBy: complaint.reportedBy ? complaint.reportedBy._id : null,
        notification: updatedNotif
      });
    }

    res.status(200).json({
      success: true,
      message: `Progress & Bill Pass updated and published to ${audienceLabel}`,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('reportedBy', 'name email role phone rollNumber licenseNumber')
      .populate('bus', 'busNumber plateNumber');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.status(200).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
