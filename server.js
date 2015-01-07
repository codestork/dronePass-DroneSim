var turf = require('turf');
var droneSim = require('./droneSim');
var fs = require('fs');
var Random = require("random-js")();


var drone1 = droneSim.makeDrone('Mike-Lima-November-9-1-7');

 setInterval(function(){
    console.log(drone1.getCurrentState());
  }, 1000);


// We would like to make transcripts sounds more human and real,
// so it randomized the choice of words
var rndWords = function() {
  var len = arguments.length;
  var ind = Random.integer(0,len-1);
  return arguments[ind];
}

var io = require('socket.io-client')('http://10.6.23.224:8080');

io
  .on('connection', function (socket) {

    // Here defines the communication endpoints of a drone
    // `on` certain events, following by similar definition structure below:
    // 1. first build the report object
    //   `var report = drone1.getCurrentState();`
    // 2. attach transcript to it, should be human readable messages
    //   `report.transcript = ...`
    // 3. only `reportIn` event would emit `update` event, otherwise most of
    //    functions would emit `ack` event

    // The endpoint to report in current state of the drone. Most used.
    socket.on('reportIn', function(msg) {
      // example -> { location: [ 2.05, 12.14 ], prevPathPtInd: 0, distance: 8.999 }
      var report = drone1.getCurrentState();
      report.transcript = drone1.callSign + 
                          " loc " + report.location[0] + ", " + report.location[1] + " . " +
                          "PPI " + report.prevPathPtInd + " . " +
                          "distance " + report.distance + 
                          rndWords(' from base.', " from home.", "");

      socket.emit('update', report);
    });

    socket.on('takeOff', function(msg) {
      var report = drone1.getCurrentState();

      // if drone is flying then there is no need to take off
      if ( drone1.isFlying ) {
        report.transcript = drone1.callSign + ' copy.' +
                            ' we were flying, will keep going';
      } else {
        report.transcript = rndWords('this is ', '') + drone1.callSign + ' taking off,'+ 
                            rndWords(' confirm.', ' good day.', ' good flight.');
        drone1.takeOff();
        drone1.fly();
      }

      socket.emit('ack', report);
    });

    socket.on('setSpeed', function(msg) {
      var report = drone1.getCurrentState();

      if ( msg.newSpeed === 0 ) {

      }

      // If a drone is not flying, then it could not set a new speed
      if ( !drone1.isFlying ) {
        report.transcript = rndWords('this is ', '') + drone1.callSign +
                            rndWords(', we were idle.') +
                            rndWords(' waiting for new instruction');
      } else {
        report.transcript = rndWords('this is ', '') + drone1.callSign +
                            rndWords(' acknowledged,', ' copy,', ' understood,') +
                            rndWords(' maintaining', ' changing to', ' in') +
                            " speed " + msg.newSpeed + ' .';
        drone1.setSpeed(msg.newSpeed);
      }

      socket.emit('ack', report);
    });

    socket.on('fly', function(msg) {
      var report = drone1.getCurrentState();

      // If it was already flying, then do nothing
      if ( drone1.isFlying ) {
        report.transcript = drone1.callSign + ' copy.' +
                                    ' we were flying, will keep going';
      } 

      // It it was on the ground, then it is waiting for clearance for taking off
      else if ( !drone1.isFlying && !drone1.takenOff ) {
        report.transcript = rndWords('this is ', '') + drone1.callSign +
                            rndWords(' at ground ', '') +
                            rndWords(', need clearance for', ', waiting for') +
                            " taking off";
      }
      else if ( !drone1.isFlying && drone1.takenOff ) {
        report.transcript = rndWords('this is ', '') + drone1.callSign +
                            rndWords(' acknowledged,', ' copy,', ' understood,') +
                            rndWords(' fly ahead', ' head straight', ' going');
        drone1.fly();
      }

      socket.emit('ack', report);
      
    });

    socket.on('stop', function(msg) {
      var report = drone1.getCurrentState();

      // The drone was on the ground
      if ( !drone1.isFlying && !drone1.takenOff ) {
        report.transcript = rndWords('this is ', '') + drone1.callSign +
                            rndWords(' at stand,', ' copy,') +
                            rndWords(' we were holding', ' keeping idle') +
                            " at ground";
      }

      // The drone was already stopping(hovering) in the sky
      else if ( !drone1.isFlying && drone1.takenOff ) {
        report.transcript = rndWords('this is ', '') + drone1.callSign +
                            rndWords(' at stand,', ' copy,') +
                            rndWords(' we were stopping', ' keeping idle') +
                            " in sky";
      } else {
        report.transcript = rndWords('this is ', '') + drone1.callSign +
                            rndWords(' at stand,', ' copy,', ' understood,') +
                            rndWords(' stopping now', ' pausing around', ' idle now') +
                            " in sky";
      }

      drone1.stop();
      socket.emit('ack', report);
    });

  socket.on('land', function(msg) {
    var report = drone1.getCurrentState();

    if ( !drone1.takenOff ) {
      report.transcript = rndWords('this is ', '') + drone1.callSign +
                          rndWords(' at stand,', ' copy,') +
                          rndWords(' we were holding', ' keeping idle') +
                          " at ground";
    } else {
      report.transcript = rndWords('this is ', '') + drone1.callSign +
                          rndWords(' at stand,', ' copy,', ' understood,') +
                          rndWords(' landing now', ' going down' );
    }

    drone1.stop();
    drone1.land();
    socket.emit('ack', report);
  });

    socket.on('changeRoute', function(msg) {
      var report = drone1.getCurrentState();
      report.transcript = rndWords('this is ', '') + drone1.callSign +
                          rndWords(' reporting in,', ' copy,', ' pivoting,') +
                          rndWords(' new path received', ' following new path', ' incoming new plan accepted');
      drone1.changeRoute( msg.pivotPointInd, msg.substitutePath );
      socket.emit('ack', report);
    });
  });