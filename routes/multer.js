const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueName = uuidv4(); // Call uuidv4 function to get a unique identifier
        cb(null, uniqueName + path.extname(file.originalname));
    }
});
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/images/dp');
    },
    filename: function (req, file, cb) {
        const uniqueName = uuidv4(); // Call uuidv4 function to get a unique identifier
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage2 });
const dpupload = multer({ storage: storage });
module.exports = {
    upload,
    dpupload
};
