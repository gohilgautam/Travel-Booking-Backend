require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { ensureMainAdmins } = require('./services/mainAdminService');
const { ensureDefaultCategories } = require('./services/categoryInitService');

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await ensureMainAdmins();
  await ensureDefaultCategories();
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
