const admin = require("firebase-admin")

const serviceAccount = require("./firebaseKey.json")

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sneakerai-c96f0-default-rtdb.firebaseio.com"
})

const db = admin.database()

module.exports = db