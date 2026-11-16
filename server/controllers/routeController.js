const Route = require('../models/Route');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public / Authenticated
exports.getAllRoutes = async (req, res) => {
  try {
    const routes = await Route.find({});
    res.status(200).json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new route
// @route   POST /api/routes
// @access  Private (Admin)
exports.createRoute = async (req, res) => {
  try {
    const { routeName, routeCode, startPoint, endPoint, totalDistance, estimatedDuration, stops } = req.body;

    const existing = await Route.findOne({ routeCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Route code already exists' });
    }

    const route = await Route.create({
      routeName,
      routeCode,
      startPoint,
      endPoint,
      totalDistance: totalDistance || '10 km',
      estimatedDuration: estimatedDuration || '30 mins',
      stops: stops || []
    });

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      data: route
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private (Admin)
exports.updateRoute = async (req, res) => {
  try {
    const route = await Route.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!route) {
      return res.status(404).json({ success: false, message: 'Route not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Route updated successfully',
      data: route
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
