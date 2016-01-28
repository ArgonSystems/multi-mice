//good old dependencies
var http = require('http');
var path = require('path');
var express = require("express");
var io = require("socket.io");
var uuid = require("uuid").v4;
//setup express app
var app = express();
//setup / to serve index.html
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname,"web","index.html"));
});
//serve all other files
app.get("/*", function(req, res) {
  res.sendFile(path.join(__dirname,"web",req.params[0]));
});
//init http server
var server = http.Server(app);
//init socket.io with websocket only support
var io = require('socket.io')(server, {
  transports: ['websocket']
});
//server side state
var mice={};
//socket handler
io.on('connection', function(socket) {
  //on new socket connection
  //generate a unique id for this socket so we can keep track
  socket.id = uuid();
  //send the current state to the new client so it can catch up
  socket.emit("state",mice);
  //listen on the socket for the "move" event
  socket.on("move", function(data) {
    //update server side state
    mice[socket.id]=data;
    //io.sockets is the collection of all sockets currently connected
    //so its just a shortcut to send to all of them instead of looping through
    //propagate move even that we just received back to all clients
    io.sockets.emit("move", {
      id: socket.id,
      pos: data
    });
  });
  //when a client disconnects
  socket.on("disconnect", function() {
    //remove client from state
    delete mice[socket.id];
    //propagate the removal to all clients
    io.sockets.emit("delete", socket.id);
  });
});
//listen on port
server.listen(8080);
console.log("listening on port 8080");
