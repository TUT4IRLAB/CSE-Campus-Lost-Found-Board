const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Increases text parser capacity for base64 image strings
app.use(express.urlencoded({ limit: '5mb', extended: true }));


// Import Route Files
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes'); // <-- New line

// Mount Route Files to API entry paths
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes); // <-- New line

// Health check route
app.get('/', (req, res) => {
  res.send('Campus Lost and Found API is running smoothly...');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
});
