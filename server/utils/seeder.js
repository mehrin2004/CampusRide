const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Complaint = require('../models/Complaint');
const Announcement = require('../models/Announcement');

dotenv.config();

const seedDatabaseHelper = async () => {
  // Clear all sample/old data
  await User.deleteMany();
  await Bus.deleteMany();
  await Route.deleteMany();
  await Complaint.deleteMany();
  await Announcement.deleteMany();

  try {
    const Notification = require('../models/Notification');
    await Notification.deleteMany();
  } catch (e) {}

  // 1. Create User-Specified Routes
  const route14A = await Route.create({
    routeName: 'Vadukatchimathil - Dohnavur - Eruvadi - Panagudi - RCET (Route 14A)',
    routeCode: 'R-14A-RCET',
    startPoint: 'Vadukatchimathil',
    endPoint: 'Rohini College Campus (Anjugramam)',
    totalDistance: '32 km',
    estimatedDuration: '50 mins',
    stops: [
      { name: 'Vadukatchimathil', lat: 8.4850, lng: 77.5680, estimatedMinutesFromStart: 0 },
      { name: 'Dohnavur', lat: 8.4720, lng: 77.5640, estimatedMinutesFromStart: 10 },
      { name: 'Eruvadi', lat: 8.4411, lng: 77.5614, estimatedMinutesFromStart: 18 },
      { name: 'Vallioor Bypass', lat: 8.3850, lng: 77.6180, estimatedMinutesFromStart: 26 },
      { name: 'Panagudi', lat: 8.3228, lng: 77.5819, estimatedMinutesFromStart: 34 },
      { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 50 }
    ]
  });

  const route32C = await Route.create({
    routeName: 'Parappadi - Nanguneri - Vallioor - RCET (Route 32C)',
    routeCode: 'R-32C-RCET',
    startPoint: 'Parappadi',
    endPoint: 'Rohini College Campus (Anjugramam)',
    totalDistance: '38 km',
    estimatedDuration: '60 mins',
    stops: [
      { name: 'Parappadi', lat: 8.5375, lng: 77.6186, estimatedMinutesFromStart: 0 },
      { name: 'Nanguneri', lat: 8.4870, lng: 77.6580, estimatedMinutesFromStart: 10 },
      { name: 'Sirumalanji', lat: 8.4520, lng: 77.6400, estimatedMinutesFromStart: 18 },
      { name: 'Perumalanji', lat: 8.4230, lng: 77.6250, estimatedMinutesFromStart: 25 },
      { name: 'Vallioor', lat: 8.3792, lng: 77.6144, estimatedMinutesFromStart: 33 },
      { name: 'Therku Vallioor', lat: 8.3510, lng: 77.6080, estimatedMinutesFromStart: 38 },
      { name: 'Kalanthapani', lat: 8.2840, lng: 77.5750, estimatedMinutesFromStart: 48 },
      { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 60 }
    ]
  });

  const route43C = await Route.create({
    routeName: 'Town - Palayamkottai - Panagudi - RCET (Route 43C)',
    routeCode: 'R-43C-RCET',
    startPoint: 'Town (Tirunelveli)',
    endPoint: 'Rohini College Campus (Anjugramam)',
    totalDistance: '52 km',
    estimatedDuration: '75 mins',
    stops: [
      { name: 'Town (Tirunelveli)', lat: 8.7290, lng: 77.6850, estimatedMinutesFromStart: 0 },
      { name: 'Melapalayam', lat: 8.7050, lng: 77.7120, estimatedMinutesFromStart: 8 },
      { name: 'Palayamkottai', lat: 8.7150, lng: 77.7310, estimatedMinutesFromStart: 16 },
      { name: 'New Bus Stand', lat: 8.7180, lng: 77.7420, estimatedMinutesFromStart: 24 },
      { name: 'KTC Nagar', lat: 8.7120, lng: 77.7600, estimatedMinutesFromStart: 30 },
      { name: 'Nanguneri Toll Gate', lat: 8.4980, lng: 77.6650, estimatedMinutesFromStart: 45 },
      { name: 'Vallioor Bypass', lat: 8.3850, lng: 77.6180, estimatedMinutesFromStart: 55 },
      { name: 'Panagudi', lat: 8.3228, lng: 77.5819, estimatedMinutesFromStart: 65 },
      { name: 'Rohini College Campus (RCET)', lat: 8.1685, lng: 77.5362, estimatedMinutesFromStart: 75 }
    ]
  });

  // 2. Create Base Users with deterministic ObjectIds (so JWT sessions remain valid across re-seeds)
  const adminId = new mongoose.Types.ObjectId("650000000000000000000001");
  const driver14AId = new mongoose.Types.ObjectId("650000000000000000000002");
  const driver32CId = new mongoose.Types.ObjectId("650000000000000000000003");
  const driver43CId = new mongoose.Types.ObjectId("650000000000000000000004");
  const studentId = new mongoose.Types.ObjectId("650000000000000000000005");
  const driverMaheshId = new mongoose.Types.ObjectId("650000000000000000000006");

  const adminUser = await User.create({
    _id: adminId,
    name: 'Dr. M. Senthil Nathan (Transport Admin)',
    email: 'admin1@gmail.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91 94431 00202'
  });

  const driver14A = await User.create({
    _id: driver14AId,
    name: 'Subramanian (Captain 14A)',
    email: 'subu@gmail.com',
    password: 'subu14',
    role: 'driver',
    phone: '+91 98421 88301',
    licenseNumber: 'TN-72-2019-014',
    experienceYears: 12,
    rating: 4.9
  });

  const driver32C = await User.create({
    _id: driver32CId,
    name: 'Vanu (Captain 32C)',
    email: 'vanu@gmail.com',
    password: 'vanu001',
    role: 'driver',
    phone: '+91 94872 11099',
    licenseNumber: 'TN-72-2020-032',
    experienceYears: 10,
    rating: 4.9
  });

  const driver43C = await User.create({
    _id: driver43CId,
    name: 'Thangaraj (Captain 43C)',
    email: 'thangaraj@gmail.com',
    password: 'thang002',
    role: 'driver',
    phone: '+91 99441 55620',
    licenseNumber: 'TN-72-2021-043',
    experienceYears: 11,
    rating: 4.9
  });

  const driverMahesh = await User.create({
    _id: driverMaheshId,
    name: 'Mahesh (Lead Driver)',
    email: 'mahesh@gmail.com',
    password: 'mahesh01',
    role: 'driver',
    isLeadDriver: true,
    phone: '+91 98421 77200',
    licenseNumber: 'TN-72-2018-001',
    experienceYears: 15,
    rating: 5.0
  });

  // 3. Create Buses (14A, 32C & 43C)
  const bus14A = await Bus.create({
    busNumber: '14A',
    plateNumber: 'TN-72-N-1414',
    capacity: 50,
    status: 'on_route',
    currentLocation: {
      lat: 8.4850,
      lng: 77.5680, // Vadukatchimathil (Stop 1 - Start)
      speed: 0,
      heading: 180,
      lastUpdated: Date.now()
    },
    driver: driver14A._id,
    driverName: 'Subramanian (Captain 14A)',
    route: route14A._id,
    routeName: 'Vadukatchimathil - Dohnavur - Eruvadi - Panagudi - RCET (Route 14A)',
    estimatedArrival: '50 mins to RCET',
    fuelLevel: 95,
    tireCondition: 'Good'
  });

  const bus32C = await Bus.create({
    busNumber: '32C',
    plateNumber: 'TN-72-N-3232',
    capacity: 55,
    status: 'on_route',
    currentLocation: {
      lat: 8.5375,
      lng: 77.6186, // Parappadi (Stop 1 - Start)
      speed: 0,
      heading: 180,
      lastUpdated: Date.now()
    },
    driver: driver32C._id,
    driverName: 'Vanu (Captain 32C)',
    route: route32C._id,
    routeName: 'Parappadi - Nanguneri - Vallioor - RCET (Route 32C)',
    estimatedArrival: '60 mins to RCET',
    fuelLevel: 92,
    tireCondition: 'Good'
  });

  const bus43C = await Bus.create({
    busNumber: '43C',
    plateNumber: 'TN-72-N-4343',
    capacity: 60,
    status: 'on_route',
    currentLocation: {
      lat: 8.7290,
      lng: 77.6850, // Town Tirunelveli (Stop 1 - Start)
      speed: 0,
      heading: 180,
      lastUpdated: Date.now()
    },
    driver: driver43C._id,
    driverName: 'Thangaraj (Captain 43C)',
    route: route43C._id,
    routeName: 'Town - Palayamkottai - Panagudi - RCET (Route 43C)',
    estimatedArrival: '75 mins to RCET',
    fuelLevel: 90,
    tireCondition: 'Good'
  });

  // Assign buses to drivers
  await User.findByIdAndUpdate(driver14A._id, { assignedBus: bus14A._id });
  await User.findByIdAndUpdate(driver32C._id, { assignedBus: bus32C._id });
  await User.findByIdAndUpdate(driver43C._id, { assignedBus: bus43C._id });

  // 4. Create Demo Student
  const studentUser = await User.create({
    _id: studentId,
    name: 'Arun Kumar',
    email: 'student@rcet.ac.in',
    password: 'student123',
    role: 'student',
    rollNumber: '953621104012',
    department: 'Computer Science & Engineering',
    phone: '+91 94871 22334',
    parentPhone: '+91 94871 00202',
    assignedBus: bus14A._id
  });

  // 4. Initial Announcement (Empty - Admin will create first announcement)
  // No seeded announcements

  return { success: true, message: 'Database cleaned and seeded with user routes successfully' };
};

// If run directly from terminal
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusride')
    .then(async () => {
      console.log('MongoDB Connected for Seeding...');
      await seedDatabaseHelper();
      console.log('✅ Clean database populated with 32C & 43C user routes!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error Seeding Database:', err);
      process.exit(1);
    });
}

module.exports = seedDatabaseHelper;
