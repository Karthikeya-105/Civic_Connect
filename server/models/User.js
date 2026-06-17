const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, default: 'citizen' }, // citizen | admin | dept_admin
  department: { type: String, default: '' }, // for dept_admin: Sanitation Department, Roads, etc.
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  address: { type: String, default: '' },

  // Gamification
  points: { type: Number, default: 0 },
  badges: [{
    name: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  level: { type: String, default: 'Civic Newcomer' },
  reportCount: { type: Number, default: 0 },
  resolvedCount: { type: Number, default: 0 },
  upvotesGiven: { type: Number, default: 0 },

  // Environmental impact
  treesSaved: { type: Number, default: 0 },
  co2Reduced: { type: Number, default: 0 },
  paperSaved: { type: Number, default: 0 },

  // Settings
  notifications: { type: Boolean, default: true },
  notifyWhatsapp: { type: Boolean, default: true },
  notifyEmail: { type: Boolean, default: true },
  // Vouchers redeemed
  redeemedVouchers: [{ voucherId: String, code: String, redeemedAt: { type: Date, default: Date.now } }],
  language: { type: String, default: 'en' },

  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
});

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLevel = function () {
  if (this.points >= 500) this.level = 'Civic Champion';
  else if (this.points >= 200) this.level = 'Eco Warrior';
  else if (this.points >= 100) this.level = 'Community Guardian';
  else if (this.points >= 50) this.level = 'Civic Volunteer';
  else this.level = 'Civic Newcomer';
};

module.exports = mongoose.model('User', userSchema);
