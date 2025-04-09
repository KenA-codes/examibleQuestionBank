const mongoose = require('mongoose');
const roomSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    images: [{
        public_id: {
            type: String,
            required: true
        },
        imageUrl: {
            type: String,
            required: true
        }
    }],
    category: {
        type: mongoose.SchemaTypes.ObjectId, ref: 'Categories',
        required: true
    }
}, {timestamps: true});

const roomModel = mongoose.model('Rooms', roomSchema);

module.exports = roomModel;