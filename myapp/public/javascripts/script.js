var srpClient = require("secure-remote-password/client");
var $ = require("jquery");

$(document).ready(function() {
  $("#subbut").click(function() {
    var username = $("#Email").val();
    var passwd = $("#Passwd1").val();
    var xpasswd = $("#Passwd2").val();
    if (passwd != xpasswd) {
      alert("Password Not Same!");
      return;
    }
    const salt = srpClient.generateSalt();
    const privateKey = srpClient.derivePrivateKey(salt, username, passwd);
    const verifier = srpClient.deriveVerifier(privateKey);

    // Loader
    document.getElementById("loader").style.display = "block";

    // Server POST request
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/users/register", true);
    xhttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        document.getElementById("loader").style.display = "none";
        $("#Email").val("");
        $("#Passwd1").val("");
        $("#Passwd2").val("");
        alert("Account Created! Please login to continue....");
        location.replace("/users/login");
        return;
      } else if (this.readyState == 4 && this.status == 400) {
        document.getElementById("loader").style.display = "none";
        alert("User already exists");
        return;
      }
    };
    var params =
      "salt=" + salt + "&username=" + username + "&verifier=" + verifier;
    xhttp.send(params);
  });

  $("#loginSubmit").click(function() {
    var username = $("#username").val();
    var password = $("#Passwd1").val();
    const clientEphemeral = srpClient.generateEphemeral();
    document.getElementById("loader").style.display = "block";
    // Get Salt
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/users/getsalt/" + username, true);
    xhttp.responseType = "json";
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        document.getElementById("status").innerHTML =
          "generating the client private key...";
        var salt = xhttp.response.user.salt;
        const privateKey = srpClient.derivePrivateKey(salt, username, password);
        document.getElementById("status").innerHTML =
          "Fetching server public key...";
        var xhttp2 = new XMLHttpRequest();
        xhttp2.open("POST", "/users/prelogin/" + username, true);
        xhttp2.setRequestHeader(
          "Content-Type",
          "application/x-www-form-urlencoded"
        );
        xhttp2.responseType = "json";
        xhttp2.onreadystatechange = function() {
          if (this.readyState == 4 && this.status == 200) {
            document.getElementById("status").innerHTML =
              "Deriving session key...";
            const clientSession = srpClient.deriveSession(
              clientEphemeral.secret,
              xhttp2.response.serverEphemeralPublic,
              salt,
              username,
              privateKey
            );
            var xhttp3 = new XMLHttpRequest();
            xhttp3.open(
              "POST",
              "/users/postlogin/" +
                username +
                "/" +
                clientEphemeral.public +
                "/" +
                clientSession.proof,
              true
            );
            document.getElementById("status").innerHTML =
              "Let the server verify you...";
            xhttp3.setRequestHeader(
              "Content-Type",
              "application/x-www-form-urlencoded"
            );
            xhttp3.responseType = "json";
            xhttp3.onreadystatechange = function() {
              document.getElementById("loader").style.display = "none";

              if (this.readyState == 4 && this.status == 200) {
                location.replace("/users/verified");
              } else if (this.readyState == 4 && this.status == 401) {
                alert(
                  "Please try again.. \nYou may be entering wrong password"
                );
                return;
              }
            };
            xhttp3.send();
          } else if (this.readyState == 4 && this.status == 400) {
            alert("Please try again.. \n Some error occurs");
            return;
          }
        };
        xhttp2.send();
      } else if (this.readyState == 4 && this.status == 400) {
        document.getElementById("loader").style.display = "none";
        alert("User doesn't exist!!!");
        return;
      }
    };
    xhttp.send();
  });
});
