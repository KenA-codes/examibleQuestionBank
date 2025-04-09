const roomRouter = require("express").Router();
const {createRoom, changeRoomImage, deleteRoomImage} = require('../controller/roomController')
const upload = require('../utils/multer')

roomRouter.post('/room/:id', upload.array('images', 10), createRoom);
// roomRouter.patch('/room/:id', upload.single('image'), changeRoomImage);
roomRouter.put('/room/:id/:imageId', upload.single('image'), changeRoomImage);
roomRouter.delete('/room/:id/:imageId', deleteRoomImage);
// PUT /api/rooms/:id/image/:imageId
// roomRouter.post('/room/:id', createRoom);

module.exports = roomRouter


