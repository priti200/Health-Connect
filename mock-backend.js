const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:4200'],
  credentials: true
}));
app.use(express.json());

// In-memory storage
let users = [
  {
    id: 1,
    email: 'doctor.test@healthconnect.com',
    password: 'password123',
    fullName: 'Dr. John Smith',
    role: 'DOCTOR',
    specialization: 'General Medicine',
    licenseNumber: 'MD123456',
    phoneNumber: '+1234567890'
  },
  {
    id: 2,
    email: 'patient.test@healthconnect.com',
    password: 'password123',
    fullName: 'Jane Doe',
    role: 'PATIENT',
    phoneNumber: '+1234567891'
  }
];

let appointments = [];
let nextUserId = 3;
let nextAppointmentId = 1;

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const token = 'mock-jwt-token-' + user.id;
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        specialization: user.specialization,
        phoneNumber: user.phoneNumber
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, fullName, role, specialization, licenseNumber, phoneNumber, affiliation, yearsOfExperience, address } = req.body;
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create new user
  const newUser = {
    id: nextUserId++,
    email,
    password,
    fullName,
    role,
    phoneNumber,
    address,
    ...(role === 'DOCTOR' && {
      specialization,
      licenseNumber,
      affiliation,
      yearsOfExperience
    })
  };
  
  users.push(newUser);
  
  const token = 'mock-jwt-token-' + newUser.id;
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      specialization: newUser.specialization,
      phoneNumber: newUser.phoneNumber
    }
  });
});

// User endpoints
app.get('/api/users/doctors', (req, res) => {
  const doctors = users.filter(u => u.role === 'DOCTOR').map(d => ({
    id: d.id,
    fullName: d.fullName,
    specialization: d.specialization,
    phoneNumber: d.phoneNumber
  }));
  res.json(doctors);
});

// Appointment endpoints
app.get('/api/appointments', (req, res) => {
  const { startDate, endDate, status } = req.query;
  let filteredAppointments = appointments;
  
  if (startDate && endDate) {
    filteredAppointments = appointments.filter(apt => 
      apt.date >= startDate && apt.date <= endDate
    );
  }
  
  if (status) {
    filteredAppointments = filteredAppointments.filter(apt => apt.status === status);
  }
  
  // Add user details
  const appointmentsWithDetails = filteredAppointments.map(apt => {
    const doctor = users.find(u => u.id === apt.doctorId);
    const patient = users.find(u => u.id === apt.patientId);
    
    return {
      ...apt,
      doctor: {
        id: doctor.id,
        fullName: doctor.fullName,
        specialization: doctor.specialization
      },
      patient: {
        id: patient.id,
        fullName: patient.fullName
      }
    };
  });
  
  res.json(appointmentsWithDetails);
});

app.post('/api/appointments', (req, res) => {
  const { doctorId, date, startTime, endTime, type, reason } = req.body;
  
  const newAppointment = {
    id: nextAppointmentId++,
    doctorId: parseInt(doctorId),
    patientId: 2, // Mock patient ID
    date,
    startTime,
    endTime,
    type,
    reason,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  
  appointments.push(newAppointment);
  
  // Add user details for response
  const doctor = users.find(u => u.id === newAppointment.doctorId);
  const patient = users.find(u => u.id === newAppointment.patientId);
  
  res.status(201).json({
    ...newAppointment,
    doctor: {
      id: doctor.id,
      fullName: doctor.fullName,
      specialization: doctor.specialization
    },
    patient: {
      id: patient.id,
      fullName: patient.fullName
    }
  });
});

// Agora endpoints
app.get('/api/agora/token', (req, res) => {
  const { channelName, uid, expireTimeInSeconds = 3600 } = req.query;

  // Mock Agora configuration
  const appId = 'e4e46730b7c246babef60cdf947704e3';

  // For demo purposes, return a mock token
  // In production, use proper Agora token generation
  const mockToken = `mock-agora-token-${channelName}-${uid}-${Date.now()}`;

  res.json({
    token: mockToken,
    appId: appId,
    channelName: channelName,
    uid: uid,
    status: 'success',
    message: 'Mock token generated successfully (for testing only)'
  });
});

app.get('/api/agora/config', (req, res) => {
  res.json({
    appId: 'e4e46730b7c246babef60cdf947704e3',
    isConfigValid: 'true',
    message: 'Agora configuration for HealthConnect video calling'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mock backend is running' });
});

const PORT = 8081;
app.listen(PORT, () => {
  console.log(`🚀 Mock HealthConnect Backend running on http://localhost:${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/auth/register`);
  console.log(`   GET  /api/users/doctors`);
  console.log(`   GET  /api/appointments`);
  console.log(`   POST /api/appointments`);
  console.log(`   GET  /api/health`);
  console.log(`\n✅ Ready to test registration and role-specific dashboards!`);
});

module.exports = app;
