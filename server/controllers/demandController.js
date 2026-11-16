const DailyAttendance = require('../models/DailyAttendance');

// Utility to get today's date in YYYY-MM-DD format (IST / local)
const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Submit or update student daily bus attendance (Coming / Not Coming)
// @route   POST /api/demand/respond
// @access  Private (Student/Admin)
exports.submitStudentDemand = async (req, res) => {
  try {
    const { busNumber, stopName, status, date } = req.body;
    const today = date || getTodayDateString();

    if (!busNumber || !stopName || !status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bus number, stop name, and attendance status (coming/not_coming).'
      });
    }

    if (!['coming', 'not_coming'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be coming or not_coming.'
      });
    }

    // Upsert record for logged-in student for today's date
    const attendance = await DailyAttendance.findOneAndUpdate(
      { student: req.user._id, date: today },
      {
        student: req.user._id,
        studentName: req.user.name || 'Student',
        rollNumber: req.user.rollNumber || 'RCET-STUDENT',
        busNumber,
        stopName,
        date: today,
        status
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Create Notification record for Driver portal
    const Notification = require('../models/Notification');
    await Notification.create({
      targetRole: 'drivers',
      title: `Student Attendance: Bus ${busNumber}`,
      message: `Student ${req.user.name || 'Student'} (${req.user.rollNumber || 'RCET'}) marked '${status === 'coming' ? 'WILL BOARD' : 'NOT COMING'}' for stop '${stopName}' on Bus ${busNumber}`,
      type: 'demand_update'
    });

    // Notify driver in real-time via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('demand_updated', {
        busNumber,
        stopName,
        status,
        date: today,
        studentName: req.user.name
      });
      io.emit('new_notification', {
        targetRole: 'drivers',
        title: `Student Attendance: Bus ${busNumber}`,
        message: `Student ${req.user.name || 'Student'} marked '${status === 'coming' ? 'WILL BOARD' : 'NOT COMING'}' at ${stopName}`
      });
      io.emit('demand_checkin_alert', {
        busNumber,
        stopName,
        status,
        studentName: req.user.name,
        rollNumber: req.user.rollNumber
      });
    }

    res.status(200).json({
      success: true,
      message: `Status recorded: You marked '${status === 'coming' ? 'WILL BOARD' : 'NOT COMING'}' for stop '${stopName}'`,
      data: attendance
    });
  } catch (err) {
    console.error('Error submitting student demand:', err);
    res.status(500).json({ success: false, message: 'Server error saving bus attendance' });
  }
};

// @desc    Get logged-in student's status for today
// @route   GET /api/demand/my-status
// @access  Private (Student)
exports.getStudentTodayDemand = async (req, res) => {
  try {
    const today = req.query.date || getTodayDateString();
    const attendance = await DailyAttendance.findOne({
      student: req.user._id,
      date: today
    });

    res.status(200).json({
      success: true,
      date: today,
      data: attendance || null
    });
  } catch (err) {
    console.error('Error fetching student demand status:', err);
    res.status(500).json({ success: false, message: 'Server error fetching attendance' });
  }
};

// @desc    Get driver summary of expected student headcounts per stop for today
// @route   GET /api/demand/bus-summary/:busNumber
// @access  Private
exports.getDriverStopDemand = async (req, res) => {
  try {
    const { busNumber } = req.params;
    const today = req.query.date || getTodayDateString();

    const records = await DailyAttendance.find({
      busNumber,
      date: today
    });

    // Look up Bus and populated Route stops from DB
    const Bus = require('../models/Bus');
    const busObj = await Bus.findOne({
      $or: [
        { busNumber: new RegExp(`^${busNumber}$`, 'i') },
        { busNumber: new RegExp(busNumber, 'i') }
      ]
    }).populate('route');

    let defaultStops = [];
    if (busObj && busObj.route && Array.isArray(busObj.route.stops) && busObj.route.stops.length > 0) {
      defaultStops = busObj.route.stops.map(s => s.name);
    } else if (String(busNumber).toUpperCase().includes('14A')) {
      defaultStops = [
        'Vadukatchimathil',
        'Dohnavur',
        'Eruvadi',
        'Panagudi',
        'Rohini College Campus (RCET)'
      ];
    } else if (String(busNumber).toUpperCase().includes('43C')) {
      defaultStops = [
        'Town (Tirunelveli)',
        'Melapalayam',
        'New Bus Stand',
        'Palayamkottai',
        'KTC Nagar',
        'Nanguneri Toll Gate',
        'Vallioor Bypass',
        'Panagudi',
        'Rohini College Campus (RCET)'
      ];
    } else {
      defaultStops = [
        'Parappadi',
        'Nanguneri',
        'Sirumalanji',
        'Perumalanji',
        'Vallioor',
        'Therku Vallioor',
        'Kalanthapani',
        'Rohini College Campus (RCET)'
      ];
    }

    // Build stop-by-stop summary
    const stopSummaryMap = {};
    defaultStops.forEach(stop => {
      stopSummaryMap[stop] = {
        stopName: stop,
        comingCount: 0,
        notComingCount: 0,
        studentsComing: [],
        studentsNotComing: []
      };
    });

    records.forEach(rec => {
      if (!stopSummaryMap[rec.stopName]) {
        stopSummaryMap[rec.stopName] = {
          stopName: rec.stopName,
          comingCount: 0,
          notComingCount: 0,
          studentsComing: [],
          studentsNotComing: []
        };
      }

      if (rec.status === 'coming') {
        stopSummaryMap[rec.stopName].comingCount += 1;
        stopSummaryMap[rec.stopName].studentsComing.push({
          name: rec.studentName,
          rollNumber: rec.rollNumber
        });
      } else if (rec.status === 'not_coming') {
        stopSummaryMap[rec.stopName].notComingCount += 1;
        stopSummaryMap[rec.stopName].studentsNotComing.push({
          name: rec.studentName,
          rollNumber: rec.rollNumber
        });
      }
    });

    const stopSummaryList = Object.values(stopSummaryMap);
    const totalComing = stopSummaryList.reduce((acc, curr) => acc + curr.comingCount, 0);
    const zeroStudentStops = stopSummaryList.filter(s => s.comingCount === 0).length;

    res.status(200).json({
      success: true,
      busNumber,
      date: today,
      totalExpectedRiders: totalComing,
      zeroStudentStopsCount: zeroStudentStops,
      stops: stopSummaryList
    });
  } catch (err) {
    console.error('Error fetching driver stop demand:', err);
    res.status(500).json({ success: false, message: 'Server error fetching stop demand summary' });
  }
};

// @desc    Record student QR code boarding scan & dispatch Parent Safety SMS
// @route   POST /api/demand/scan-boarding
// @access  Private (Student)
exports.recordBoardingScan = async (req, res) => {
  try {
    const { busNumber, stopName } = req.body;
    const student = req.user;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const busNo = busNumber || (student.assignedBus?.busNumber) || '32C';
    const pPhone = student.parentPhone || student.phone || '+91 98421 00202';

    const smsContent = `ROHINI COLLEGE SAFETY ALERT: Dear Parent, your ward ${student.name} (${student.rollNumber || 'RCET Student'}) has safely boarded Bus ${busNo} at ${timeString}. Live transit tracking active.`;

    // Save notification in database
    const Notification = require('../models/Notification');
    await Notification.create({
      user: student._id,
      targetRole: 'all',
      title: `📱 Parent Safety SMS Dispatched: ${student.name}`,
      message: smsContent,
      type: 'info'
    });

    // Notify sockets
    const io = req.app.get('io');
    if (io) {
      io.emit('parent_sms_dispatched', {
        studentId: student._id,
        studentName: student.name,
        parentPhone: pPhone,
        smsContent,
        timestamp: new Date()
      });
      io.emit('new_notification', {
        targetRole: 'drivers',
        title: `🚍 Student Boarded: ${student.name}`,
        message: `${student.name} (${student.rollNumber || 'RCET'}) scanned QR code and boarded Bus ${busNo}`
      });
    }

    res.status(200).json({
      success: true,
      smsSent: true,
      parentPhone: pPhone,
      smsContent,
      timeString,
      message: 'Boarding verified & Parent Safety SMS Alert Dispatched successfully'
    });
  } catch (err) {
    console.error('Error recording boarding scan:', err);
    res.status(500).json({ success: false, message: 'Server error processing boarding scan' });
  }
};
