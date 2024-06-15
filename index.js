const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { config } = require('dotenv');
const dbConnection = require('./database/dbConnection.js');
const {
  authRoutes,
  userRoutes,
  bankRoutes,
  notificationRoutes,
  customerVerificationRoutes,
  settingsRoutes,
  securityRoutes,
  transactionRoutes,
} = require('./routes');
const { randomBytes } = require('crypto');

config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));

dbConnection();

app.use('/api/V1/auth', authRoutes);
app.use('/api/V1/user', userRoutes);
app.use('/api/V1/bank', bankRoutes);
app.use('/api/V1/notification', notificationRoutes);
app.use('/api/V1/customerVerification', customerVerificationRoutes);
app.use('/api/V1/settings', settingsRoutes);
app.use('/api/V1/security', securityRoutes);
app.use('/api/V1/transaction', transactionRoutes);

app.listen(PORT, () => {
  console.log(`Azax server is running on http://localhost:${PORT}`);
});
