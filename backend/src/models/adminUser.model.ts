import mongoose from 'mongoose';

const adminUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, default: 'admin' },
  passwordHash: { type: String, required: true },
  tokens: { type: [String], default: [] }
}, { timestamps: true });

export const AdminUserModel = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);
