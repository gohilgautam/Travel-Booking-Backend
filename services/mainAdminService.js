const User = require('../models/User');
const { MAIN_ADMIN_EMAILS } = require('../shared/constants/mainAdmins');

const ensureMainAdmins = async () => {
  const result = await User.updateMany(
    { email: { $in: MAIN_ADMIN_EMAILS } },
    { $set: { role: 'superadmin', isBlocked: false } }
  );

  if (result.matchedCount > 0) {
    console.log(`Main admin accounts ensured: ${result.modifiedCount}/${result.matchedCount} updated`);
  }
};

module.exports = { ensureMainAdmins };