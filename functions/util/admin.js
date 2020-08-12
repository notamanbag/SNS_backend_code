var admin = require("firebase-admin");
var serviceAccount = require("../../socialproject-a713e-firebase-adminsdk-2x50h-31abcdf78f.json");
var db = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialproject-a713e.firebaseio.com",
  storageBucket:"socialproject-a713e.appspot.com"
});

module.exports ={admin,db};