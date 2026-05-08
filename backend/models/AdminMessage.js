import mongoose from 'mongoose';

const adminMessageSchema = new mongoose.Schema({
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subject: {
        type: String,
        required: true,
        trim: true,
        maxlength: 120,
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000,
    },
    isRead: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

const AdminMessage = mongoose.model('AdminMessage', adminMessageSchema);
export default AdminMessage;
