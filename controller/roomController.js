require("dotenv").config();
const fs = require("fs");
const roomModel = require("../model/room");
const cloudinary = require("../config/cloudinary");
const categoryModel = require("../model/category");

exports.createRoom = async (req, res) => {
    try {

        //Get the category Id from the params
        const {id: categoryId} = req.params;
        //Extract the required fields from the request body
        const {roomName, price, description, roomNumber} = req.body;


        const categoryExists = await categoryModel.findById(categoryId);
        if(categoryExists == null) {
            return res.status(404).json({
                message: "Category not found"
            })
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "At least one image is required" });
        }

        //Get the files into a variable
        const file = req.files;

        //Declare an empty array to help hold the result
        const imageArray = [];

        //Handle the image uploading to cloudinary one after the other
        for(const image of file){
         const result = await cloudinary.uploader.upload(image.path);

         //Delete the image from  the local storage
          try {
                fs.unlinkSync(image.path);
            } catch (err) {
                console.error("Error deleting local file:", err);
            }

         //Create an object to hold the image properties
        const imageProperties = {
            imageUrl: result.secure_url,
            public_id: result.public_id
        }

        //Push the result into the initial empty array
        imageArray.push(imageProperties);
        }
        //Create an instance of the document
        const room = new roomModel({
            category: categoryId,
            roomName,
            roomNumber,
            price,
            description,
            images: imageArray
        });

        //Add the room to the category and save the category update
        categoryExists.rooms.push(room._id);
        await categoryExists.save();

        //Save the changes to the database
        await room.save();
        //Send a response to the user
        res.status(200).json({
            message: "Room created successfully",
            data: room
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};


exports.changeRoomImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        // Find the room by ID
        const roomExists = await roomModel.findById(id);
        if (roomExists == null) {
            return res.status(404).json({ 
                message: "Room Not Found" 
            });
        }

        
        const imageIndex = roomExists.images.findIndex(img => img.public_id === imageId);
        if (imageIndex === -1) {
            return res.status(404).json({ 
                message: "Image Not Found in this Room" 
            });
        }

      
        await cloudinary.uploader.destroy(imageId);

        // Upload new image to Cloudinary
        const cloudImage = await cloudinary.uploader.upload(req.file.path);

        // Update the image details in the array
        roomExists.images[imageIndex] = {
            public_id: cloudImage.public_id,
            imageUrl: cloudImage.secure_url
        };

        // Save the updated room document
        await roomExists.save();

        // Delete the uploaded file from local storage
        fs.unlink(req.file.path, (err) => {
            if (err) {
                console.error("Error deleting local file:", err);
            } else {
                console.log("Local file deleted successfully.");
            }
        });

        // Return success response
        return res.status(200).json({
            message: "Room image updated successfully",
            data: roomExists
        });

    } catch (err) {
        console.error("Error updating room image:", err);
        res.status(500).json({ message: "Internal Server Error: " + err.message });
    }
};


// exports.changeRoomImage = async (req, res) =>{
//     try{
//         const {id} = req.params;
//         const findRoom = await roomModel.findById(id);

//         if(findRoom == null){
//             return res.status(404).json({
//                 message: "Room Not Found"
//             })
//         }

//         //This uploads the image to cloudinary
// const cloudImage = await cloudinary.uploader.upload(req.file.path, (err)=>{
//     if(err){
//         return res.status(404).json({
//             message: err.message
//         })
//     }
// })
//         const newPhoto = {
//             imageUrl: cloudImage.secure_url, 
//             public_id: cloudImage.public_id
//         };

//         const delImage = await cloudinary.uploader.destroy(findRoom.images.public_id, (err)=>{
//             if(err){
//                 return res.status(404).json({
//                     message: err.message
//                 })
//             }
//         })

//          //This removes the file from the upload folder
//         fs.unlink(req.file.path, (err)=>{
//             if(err){
//                 console.log(err.message)
//             }else{
//                 console.log("Previous File Removed Successfully")
//             }
//         })

//         const updateImage = await roomModel.findByIdAndUpdate(id, newPhoto, {new: true})
//         return res.status(200).json({
//             message: "Image Successfully Updated"
//         })
//     }catch(err){
//         res.status(500).json({
//             message: "Internal Server Error" + err.message,

//         })
//     }
// }

exports.deleteRoomImage = async (req, res) => {
    try {
        const { id, imageId } = req.params;

        // Find the room by ID
        const roomExists = await roomModel.findById(id);
        if (roomExists == null) {
            return res.status(404).json({ 
                message: "Room Not Found" 
            });
        }

        const imageIndex = roomExists.images.findIndex(img => img.public_id === imageId);
        if (imageIndex === -1) {
            return res.status(404).json({ 
                message: "Image Not Found in this Room" 
            });
        }    

        // Delete the image from Cloudinary
        await cloudinary.uploader.destroy(imageId);

        // Remove the image details from the array
        roomExists.images.splice(imageIndex, 1);

        // Save the updated room document
        await roomExists.save();

        // Return success response
        return res.status(200).json({
            message: "Room image deleted successfully",
            data: roomExists
        });

    } catch (err) {
        console.error("Error deleting room image:", err);
        res.status(500).json({ 
            message: "Internal Server Error: " + err.message 
        });
    }
};