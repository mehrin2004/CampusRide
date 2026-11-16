const Bus = require('../models/Bus');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Route = require('../models/Route');

// @desc    Get dashboard analytics & system status summary
// @route   GET /api/analytics/stats
// @access  Private (Admin)
exports.getAnalyticsStats = async (req, res) => {
  try {
    const totalBuses = await Bus.countDocuments({});
    const activeBuses = await Bus.countDocuments({ status: 'on_route' });
    const idleBuses = await Bus.countDocuments({ status: 'idle' });
    const maintenanceBuses = await Bus.countDocuments({ status: { $in: ['breakdown', 'maintenance'] } });

    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalDrivers = await User.countDocuments({ role: 'driver' });
    const totalRoutes = await Route.countDocuments({});

    const totalComplaints = await Complaint.countDocuments({});
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const inProgressComplaints = await Complaint.countDocuments({ status: 'in_progress' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });

    // Category breakdown
    const categoryStats = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Driver vs Student complaints breakdown
    const roleStats = await Complaint.aggregate([
      { $group: { _id: '$reportedRole', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        fleet: {
          totalBuses,
          activeBuses,
          idleBuses,
          maintenanceBuses
        },
        users: {
          students: totalStudents,
          drivers: totalDrivers,
          routes: totalRoutes
        },
        complaints: {
          total: totalComplaints,
          pending: pendingComplaints,
          inProgress: inProgressComplaints,
          resolved: resolvedComplaints,
          byCategory: categoryStats,
          byRole: roleStats
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
