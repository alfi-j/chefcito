import mongoose from 'mongoose';

const WorkstationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  states: {
    new: { type: String, required: true, default: 'new' },
    inProgress: { type: String, required: true, default: 'in progress' },
    ready: { type: String, required: true, default: 'ready' }
  },
  position: { type: Number, default: 0, required: true }
}, {
  timestamps: true
});

// Add an index for position sorting
WorkstationSchema.index({ position: 1, createdAt: 1 });

// Prevent model recompilation in development mode
const Workstation = mongoose.models.Workstation || mongoose.model('Workstation', WorkstationSchema, 'workstations');
export default Workstation;