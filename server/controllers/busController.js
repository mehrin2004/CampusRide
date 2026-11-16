const Bus = require('../models/Bus');
const User = require('../models/User');
const Route = require('../models/Route');
const Notification = require('../models/Notification');

// Active background trip simulation timers running on server (keeps ticking even if driver logs out)
const activeTripSimulations = new Map();

// @desc    Get all buses
// @route   GET /api/buses
// @access  Public / Authenticated
exports.getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find({})
      .populate('driver', 'name email phone rating licenseNumber avatar')
      .populate('route');

    const enhancedBuses = buses.map(bus => {
      const busObj = bus.toObject();
      busObj.isLiveTrip = activeTripSimulations.has(bus._id.toString());
      return busObj;
    });

    res.status(200).json({
      success: true,
      count: enhancedBuses.length,
      data: enhancedBuses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single bus details
// @route   GET /api/buses/:id
// @access  Public / Authenticated
exports.getBusById = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.id)
      .populate('driver', 'name email phone rating licenseNumber avatar experienceYears')
      .populate('route');

    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const busObj = bus.toObject();
    busObj.isLiveTrip = activeTripSimulations.has(bus._id.toString());

    res.status(200).json({
      success: true,
      data: busObj
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new bus
// @route   POST /api/buses
// @access  Private (Admin)
exports.createBus = async (req, res) => {
  try {
    const { busNumber, plateNumber, capacity, driver, driverName, route, routeName, fuelLevel } = req.body;

    const existingBus = await Bus.findOne({ busNumber });
    if (existingBus) {
      return res.status(400).json({ success: false, message: 'Bus number already exists' });
    }

    // Default to Rohini College Campus (RCET) coordinates
    let initialLocation = { lat: 8.1685, lng: 77.5362, speed: 0, heading: 180, lastUpdated: Date.now() };
    let initialArrival = '45 mins to RCET';

    // If an existing route was assigned, place the bus at Stop 1 of that route
    if (route) {
      const routeDoc = await Route.findById(route);
      if (routeDoc && routeDoc.stops && routeDoc.stops.length > 0) {
        const startStop = routeDoc.stops[0];
        initialLocation = {
          lat: startStop.lat,
          lng: startStop.lng,
          speed: 0,
          heading: 180,
          lastUpdated: Date.now()
        };
        initialArrival = `${startStop.estimatedMinutesFromStart || 45} mins to ${routeDoc.endPoint || 'RCET'}`;
      }
    }

    const bus = await Bus.create({
      busNumber,
      plateNumber,
      capacity: capacity || 50,
      driver: driver || null,
      driverName: driverName || '',
      route: route || null,
      routeName: routeName || '',
      fuelLevel: fuelLevel || 100,
      currentLocation: initialLocation,
      estimatedArrival: initialArrival,
      status: 'idle'
    });

    if (driver) {
      await User.findByIdAndUpdate(driver, { assignedBus: bus._id });
    }

    const populatedBus = await Bus.findById(bus._id)
      .populate('driver', 'name email phone')
      .populate('route');

    res.status(201).json({
      success: true,
      message: 'Bus created successfully',
      data: populatedBus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update bus details
// @route   PUT /api/buses/:id
// @access  Private (Admin)
exports.updateBus = async (req, res) => {
  try {
    let bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    const oldDriver = bus.driver;
    const newDriver = req.body.driver;
    const oldRoute = bus.route;
    const newRoute = req.body.route;

    // If route is newly assigned or changed, position bus at the new route's starting stop
    if (newRoute && (!oldRoute || oldRoute.toString() !== newRoute.toString())) {
      const routeDoc = await Route.findById(newRoute);
      if (routeDoc && routeDoc.stops && routeDoc.stops.length > 0) {
        req.body.currentLocation = {
          lat: routeDoc.stops[0].lat,
          lng: routeDoc.stops[0].lng,
          speed: 0,
          heading: 180,
          lastUpdated: Date.now()
        };
        req.body.estimatedArrival = `${routeDoc.stops[0].estimatedMinutesFromStart || 45} mins to ${routeDoc.endPoint || 'RCET'}`;
      }
    }

    bus = await Bus.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('driver', 'name email phone rating')
      .populate('route');

    // Update driver assignments if changed
    if (newDriver && oldDriver && oldDriver.toString() !== newDriver.toString()) {
      await User.findByIdAndUpdate(oldDriver, { assignedBus: null });
      await User.findByIdAndUpdate(newDriver, { assignedBus: bus._id });
    } else if (newDriver && !oldDriver) {
      await User.findByIdAndUpdate(newDriver, { assignedBus: bus._id });
    }

    res.status(200).json({
      success: true,
      message: 'Bus updated successfully',
      data: bus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update bus live GPS location & speed
// @route   PUT /api/buses/:id/location
// @access  Private (Driver / Admin)
exports.updateBusLocation = async (req, res) => {
  try {
    const { lat, lng, speed, heading, estimatedArrival, status } = req.body;
    
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    bus.currentLocation = {
      lat: lat !== undefined ? lat : bus.currentLocation.lat,
      lng: lng !== undefined ? lng : bus.currentLocation.lng,
      speed: speed !== undefined ? speed : bus.currentLocation.speed,
      heading: heading !== undefined ? heading : bus.currentLocation.heading,
      lastUpdated: Date.now()
    };

    if (estimatedArrival) bus.estimatedArrival = estimatedArrival;
    if (status) bus.status = status;

    await bus.save();

    // Emit real-time Socket event if io is available
    const io = req.app.get('io');
    if (io) {
      io.emit('bus_location_update', {
        busId: bus._id,
        busNumber: bus.busNumber,
        location: bus.currentLocation,
        status: bus.status,
        estimatedArrival: bus.estimatedArrival
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bus location updated',
      data: bus.currentLocation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update bus status (delayed, breakdown, on_route, idle)
// @route   PUT /api/buses/:id/status
// @access  Private (Driver / Admin)
exports.updateBusStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const bus = await Bus.findById(req.params.id);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    if (status) {
      bus.status = status;
    }
    await bus.save();

    // Broadcast status change across all dashboards via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('bus_status_updated', {
        busId: bus._id,
        busNumber: bus.busNumber,
        status: bus.status,
        note: note || `Bus ${bus.busNumber} status changed to ${bus.status}`,
        timestamp: new Date()
      });

      io.emit('bus_location_update', {
        busId: bus._id,
        busNumber: bus.busNumber,
        location: bus.currentLocation,
        status: bus.status,
        estimatedArrival: bus.estimatedArrival
      });
    }

    res.status(200).json({
      success: true,
      message: `Bus ${bus.busNumber} status updated to ${bus.status}`,
      data: bus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Start server-side trip simulation (persists even if driver logs out)
// @route   POST /api/buses/:id/start-simulation
// @access  Private (Driver / Admin)
exports.startBusSimulation = async (req, res) => {
  try {
    const busId = req.params.id;
    const { path, direction } = req.body;

    if (!path || !Array.isArray(path) || path.length < 2) {
      return res.status(400).json({ success: false, message: 'Valid path coordinates array required' });
    }

    // Clear any existing active simulation for this bus
    if (activeTripSimulations.has(busId)) {
      clearInterval(activeTripSimulations.get(busId));
      activeTripSimulations.delete(busId);
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    bus.status = 'on_route';
    await bus.save();

    let stepIndex = 0;
    const totalSteps = path.length;
    const io = req.app.get('io');

    const interval = setInterval(async () => {
      if (stepIndex >= totalSteps) {
        clearInterval(interval);
        activeTripSimulations.delete(busId);

        try {
          const finalPoint = path[totalSteps - 1];
          await Bus.findByIdAndUpdate(busId, {
            status: 'on_route',
            estimatedArrival: `Arrived at destination`,
            currentLocation: {
              lat: finalPoint.lat,
              lng: finalPoint.lng,
              speed: 0,
              heading: finalPoint.heading,
              lastUpdated: Date.now()
            }
          });

          if (io) {
            io.emit('bus_location_update', {
              busId,
              busNumber: bus.busNumber,
              location: { lat: finalPoint.lat, lng: finalPoint.lng, speed: 0, heading: finalPoint.heading },
              status: 'on_route',
              estimatedArrival: `Arrived at destination`,
              isLiveTrip: false
            });
          }
        } catch (e) {}
        return;
      }

      const point = path[stepIndex];
      stepIndex++;

      try {
        await Bus.findByIdAndUpdate(busId, {
          status: 'on_route',
          estimatedArrival: point.etaText,
          currentLocation: {
            lat: point.lat,
            lng: point.lng,
            speed: 45,
            heading: point.heading,
            lastUpdated: Date.now()
          }
        });

        if (io) {
          io.emit('bus_location_update', {
            busId,
            busNumber: bus.busNumber,
            location: {
              lat: point.lat,
              lng: point.lng,
              speed: 45,
              heading: point.heading,
              lastUpdated: Date.now()
            },
            status: 'on_route',
            estimatedArrival: point.etaText,
            isLiveTrip: true
          });
        }
      } catch (err) {
        console.warn(`[Trip Simulation Bus ${bus.busNumber}] Tick warning:`, err.message);
      }
    }, 1500);

    activeTripSimulations.set(busId, interval);

    res.status(200).json({
      success: true,
      message: `Server-side live trip simulation started for Bus ${bus.busNumber}. GPS stream active across all dashboards.`,
      totalSteps
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pause/Stop server-side trip simulation
// @route   POST /api/buses/:id/stop-simulation
// @access  Private (Driver / Admin)
exports.stopBusSimulation = async (req, res) => {
  try {
    const busId = req.params.id;
    if (activeTripSimulations.has(busId)) {
      clearInterval(activeTripSimulations.get(busId));
      activeTripSimulations.delete(busId);
    }
    const io = req.app.get('io');
    if (io) {
      const bus = await Bus.findById(busId);
      if (bus) {
        io.emit('bus_location_update', {
          busId,
          busNumber: bus.busNumber,
          location: bus.currentLocation,
          status: bus.status,
          estimatedArrival: bus.estimatedArrival,
          isLiveTrip: false
        });
      }
    }
    res.status(200).json({ success: true, message: 'Server-side simulation paused' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset trip and stop simulation
// @route   POST /api/buses/:id/reset-trip
// @access  Private (Driver / Admin)
exports.resetBusTrip = async (req, res) => {
  try {
    const busId = req.params.id;
    const { startLat, startLng, heading, estimatedArrival } = req.body;

    if (activeTripSimulations.has(busId)) {
      clearInterval(activeTripSimulations.get(busId));
      activeTripSimulations.delete(busId);
    }

    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ success: false, message: 'Bus not found' });
    }

    bus.status = 'on_route';
    bus.currentLocation = {
      lat: startLat !== undefined ? startLat : bus.currentLocation.lat,
      lng: startLng !== undefined ? startLng : bus.currentLocation.lng,
      speed: 0,
      heading: heading !== undefined ? heading : 180,
      lastUpdated: Date.now()
    };
    if (estimatedArrival) bus.estimatedArrival = estimatedArrival;
    await bus.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('bus_location_update', {
        busId,
        busNumber: bus.busNumber,
        location: bus.currentLocation,
        status: bus.status,
        estimatedArrival: bus.estimatedArrival,
        isLiveTrip: false
      });
    }

    res.status(200).json({ success: true, message: 'Trip reset successfully', data: bus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
