const MAIN_ADMIN_EMAILS = ['gohilgautam2406@gmail.com'];

const isMainAdminEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return MAIN_ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

module.exports = { MAIN_ADMIN_EMAILS, isMainAdminEmail };
