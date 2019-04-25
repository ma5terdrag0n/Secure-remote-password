var express = require("express");
var router = express.Router();
var srpClient = require("secure-remote-password/client");
var srpServ = require("secure-remote-password/server");
const User = require("../models/user").Users;

router.use(express.static(__dirname.replace("routes", "public")));

/* GET users listing. */
router.get("/register", function(req, res, next) {
  var fname = __dirname;
  fname = fname.replace("routes", "public");
  res.sendFile(fname + "/signup.html");
});

router.get("/login", function(req, res, next) {
  var fname = __dirname;
  fname = fname.replace("routes", "public");
  res.sendFile(fname + "/login.html");
});

router.post("/register", (req, res) => {
  console.log(req.body.salt);
  console.log(req.body.username);
  console.log(req.body.verifier);
  User.findOne({ username: req.body.username }).then(user => {
    if (user) {
      console.log("Already in databse");
      res.sendStatus(400);
    }

    // Saving in Database
    const newUser = new User({
      username: req.body.username,
      salt: req.body.salt,
      verifier: req.body.verifier
    });

    newUser
      .save()
      .then(user => res.sendStatus(200))
      .catch(err => console.log(err));
  });
});

router.post("/getSalt/:username", (req, res) => {
  User.findOne({ username: req.params.username }).then(user => {
    if (user) {
      console.log(user);
      res.send({ user });
    } else {
      res.sendStatus(400);
    }
  });
});

router.post("/prelogin/:username", (req, res) => {
  User.findOne({ username: req.params.username }).then(user => {
    if (user) {
      // Database stuff
      const salt = user.salt;
      const verifier = user.verifier;
      const serverEphemeral = srpServ.generateEphemeral(verifier);
      user.serverEphemeralSecret = serverEphemeral.secret;
      user.serverEphemeralPublic = serverEphemeral.public;
      user.save(err => {
        if (!err) {
          res.send({ serverEphemeralPublic: serverEphemeral.public });
        } else {
          res.sendStatus(400);
        }
      });
    } else res.sendStatus(400);
  });
});

router.get("/verified", (req, res) => {
  var fname = __dirname;
  fname = fname.replace("routes", "public");
  res.sendFile(fname + "/verified.html");
});

router.post("/postlogin/:username/:clientId/:proof", (req, res) => {
  User.findOne({ username: req.params.username }).then(user => {
    if (user) {
      // Database stuff
      const salt = user.salt;
      const verifier = user.verifier;
      const serverSecretEphemeral = user.serverEphemeralSecret;

      try {
        const serverSession = srpServ.deriveSession(
          serverSecretEphemeral,
          req.params.clientId,
          salt,
          user.username,
          verifier,
          req.params.proof
        );
        console.log(serverSession.proof);
        res.sendStatus(200);
      } catch (ex) {
        console.log(ex);
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(400);
    }
  });
});
// Previously stored `serverEphemeral.secret`
// To be done on server side only

// Verify session on client side
// srpClient.verifySession(
//   clientEphemeral.public,
//   clientSession,
//   serverSession.proof
// );

module.exports = router;
