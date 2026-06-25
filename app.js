// Core Module
require('dns').setDefaultResultOrder('ipv4first');


require('dotenv').config();






const path = require('path');

// External Module
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { default: mongoose } = require('mongoose');
const multer = require('multer');


//const DB_PATH = "mongodb://akashsingh007795_db_user:8FU3mdrFtUzky9qZ@ac-ozlbtoq-shard-00-00.p7xcsuf.mongodb.net:27017,ac-ozlbtoq-shard-00-01.p7xcsuf.mongodb.net:27017,ac-ozlbtoq-shard-00-02.p7xcsuf.mongodb.net:27017/airbnb?ssl=true&replicaSet=atlas-5spy8y-shard-0&authSource=admin&appName=Cluster0";

const DB_PATH = process.env.MONGO_URI;

//Local Module
const storeRouter = require("./routes/storeRouter")
const hostRouter = require("./routes/hostRouter")
const authRouter = require("./routes/authRouter")
const rootDir = require("./utils/pathUtil");
const errorsController = require("./controllers/errors");

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');

const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

// const randomString = (length) => {
//   const characters = 'abcdefghijklmnopqrstuvwxyz';
//   let result = '';
//   for (let i = 0; i < length; i++) {
//     result += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return result;
// }
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, randomString(10) + '-' + file.originalname);
//   }
// });



const fs = require("fs");

const randomString = (length) => {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }

  return result;
};

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(null, randomString(10) + "-" + file.originalname);
  }
});







const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

const multerOptions = {
  storage, fileFilter
};

// Fixed the body-parser deprecation warning here:
app.use(express.urlencoded({ extended: true }));
app.use(multer(multerOptions).single('photo'));
app.use(express.static(path.join(rootDir, 'public')))
app.use("/uploads", express.static(path.join(rootDir, 'uploads')))
app.use("/host/uploads", express.static(path.join(rootDir, 'uploads')))
app.use("/homes/uploads", express.static(path.join(rootDir, 'uploads')))

app.use(session({
  //secret: "KnowledgeGate AI with Complete Coding",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  store
}));

app.use((req, res, next) => {
  req.isLoggedIn = req.session.isLoggedIn
  next();
})

app.use(authRouter)
app.use(storeRouter);
app.use("/host", (req, res, next) => {
  if (req.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
});
app.use("/host", hostRouter);

app.use(errorsController.pageNotFound);

///const PORT = 3006;
const PORT = process.env.PORT || 3006;

mongoose.connect(DB_PATH).then(() => {
  console.log('Connected to Mongo successfully!');
  app.listen(PORT, () => {
    console.log(`Server running on address http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log('Error while connecting to Mongo: ', err);
});



