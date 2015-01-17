var turf = require('turf');
var droneSim = require('./droneSim');
var fs = require('fs');
var Random = require("random-js")();


var drone = droneSim.makeDrone('Tango-Alfa-Victor-2-4-7');


// We would like to make transcripts sounds more human and real,
// so it randomized the choice of words
var rndWords = function() {
  var len = arguments.length;
  var ind = Random.integer(0,len-1);
  return arguments[ind];
}

var socket = require('socket.io-client')('http://tower.dronepass.org:8080');
// var socket = require('socket.io-client')('http://10.6.23.224:8080');

    // Here defines the communication endpoints of a drone
    // `on` certain events, following by similar definition structure below:
    // 1. first build the report object
    //   `var report = drone.getCurrentState();`
    // 2. attach transcript to it, should be human readable messages
    //   `report.transcript = ...`
    // 3. only `reportIn` event would emit `update` event, otherwise most of
    //    functions would emit `ack` event


var init = function() {
  var report = drone.getCurrentState();
  report.transcript = rndWords('this is ', '') + drone.callSign +
                      ' at stand, request to register';

  socket.emit('DT_register', report );

}();

socket.on('TD_fileInFlightPlan', function(msg) {
  var report = drone.getCurrentState();
  report.path = drone.getCurrentPath();

  report.transcript = rndWords('this is ', '') + drone.callSign +
                      rndWords(' acknowledged,', ' copy,', ' understood,') +
                      rndWords(' filing in flight plan');

  socket.emit('DT_fileInFlightPlan', report);
});

socket.on('TD_flightPlanDecision', function(msg) {

  if ( msg.approved ) {
    setTimeout(function(){
      var report = drone.getCurrentState();
      report.transcript = drone.callSign + rndWords(' to tower', '') +
                        rndWords(' at stand,', ' copy,', ' understood,') +
                        " plan approved," +
                        ' waiting' + rndWords(' clearance','') + ' for' + 
                        " taking off";

      socket.emit('DT_readyTakeOff', report);
    }, 1800);
    
  } else {
    var report = drone.getCurrentState();
    report.transcript = rndWords('this is ', '') + drone.callSign + rndWords(' to tower', '') +
                      rndWords(' acknowledged,', ' copy,', ' understood,') +
                      rndWords(' waiting', ' standing for') +
                      rndWords(' new instruction', ' new plan');
    socket.emit('DT_ack', report);
  }


});


// The endpoint to report in current state of the drone. Most used.
socket.on('TD_update', function(msg) {
  // example -> { location: [ 2.05, 12.14 ], prevPathPtInd: 0, distance: 8.999 }
  var report = drone.getCurrentState();
  report.transcript = drone.callSign + 
                      " loc " + report.location[0] + ", " + report.location[1] + " . " +
                      "PPI " + report.prevPathPtInd + " . " +
                      "distance " + report.distance + 
                      rndWords(' from base.', " from home.", "");

  socket.emit('DT_update', report);
});

socket.on('TD_takeOff', function(msg) {
  var report = drone.getCurrentState();

  // if drone is flying then there is no need to take off
  if ( drone.isFlying ) {
    report.transcript = drone.callSign + ' copy.' +
                        ' we were flying, will keep going';
  } else {
    report.transcript = rndWords('this is ', '') + drone.callSign + ' taking off,'+ 
                        rndWords(' confirm.', ' good day.', ' good flight.');
    drone.takeOff();
    drone.fly();
  }

  socket.emit('DT_ack', report);
});

socket.on('TD_notify', function(msg) {
  var report = drone.getCurrentState();
  socket.emit('DT_ack', report);
});

socket.on('TD_setSpeed', function(msg) {
  var report = drone.getCurrentState();

  if ( msg.newSpeed === 0 ) {

  }

  // If a drone is not flying, then it could not set a new speed
  if ( !drone.isFlying ) {
    report.transcript = rndWords('this is ', '') + drone.callSign +
                        rndWords(', we were idle.') +
                        rndWords(' waiting for new instruction');
  } else {
    report.transcript = rndWords('this is ', '') + drone.callSign +
                        rndWords(' acknowledged,', ' copy,', ' understood,') +
                        rndWords(' maintaining', ' changing to', ' in') +
                        " speed " + msg.newSpeed + ' .';
    drone.setSpeed(msg.newSpeed);
  }

  socket.emit('DT_ack', report);
});

socket.on('TD_fly', function(msg) {
  var report = drone.getCurrentState();

  // If it was already flying, then do nothing
  if ( drone.isFlying ) {
    report.transcript = drone.callSign + ' copy.' +
                                ' we were flying, will keep going';
  } 

  // It it was on the ground, then it is waiting for clearance for taking off
  else if ( !drone.isFlying && !drone.takenOff ) {
    report.transcript = rndWords('this is ', '') + drone.callSign +
                        rndWords(' at ground ', '') +
                        rndWords(', need clearance for', ', waiting for') +
                        " taking off";
  }
  else if ( !drone.isFlying && drone.takenOff ) {
    report.transcript = rndWords('this is ', '') + drone.callSign +
                        rndWords(' acknowledged,', ' copy,', ' understood,') +
                        rndWords(' fly ahead', ' head straight', ' going');
    drone.fly();
  }

  socket.emit('DT_ack', report);
  
});

socket.on('TD_stop', function(msg) {
  var report = drone.getCurrentState();

  // The drone was on the ground
  if ( !drone.isFlying && !drone.takenOff ) {
    report.transcript = rndWords('this is ', '') + drone.callSign +
                        rndWords(' at stand,', ' copy,') +
                        rndWords(' we were holding', ' keeping idle') +
                        " at ground";
  }

  // The drone was already stopping(hovering) in the sky
  else if ( !drone.isFlying && drone.takenOff ) {
    report.transcript = rndWords('this is ', '') + drone.callSign +
                        rndWords(' at stand,', ' copy,') +
                        rndWords(' we were stopping', ' keeping idle') +
                        " in sky";
  } else {
    report.transcript = rndWords('this is ', '') + drone.callSign +
                        rndWords(' at stand,', ' copy,', ' understood,') +
                        rndWords(' stopping now', ' pausing around', ' idle now') +
                        " in sky";
  }

  drone.stop();
  socket.emit('DT_ack', report);
});

socket.on('TD_land', function(msg) {
var report = drone.getCurrentState();

if ( !drone.takenOff ) {
  report.transcript = rndWords('this is ', '') + drone.callSign +
                      rndWords(' at stand,', ' copy,') +
                      rndWords(' we were holding', ' keeping idle') +
                      " at ground";
} else {
  report.transcript = rndWords('this is ', '') + drone.callSign +
                      rndWords(' at stand,', ' copy,', ' understood,') +
                      rndWords(' landing now', ' going down' );
}

drone.stop();
drone.land();
socket.emit('DT_ack', report);
});

socket.on('TD_changeRoute', function(msg) {
  var report = drone.getCurrentState();
  if ( msg.callSign != drone.callSign ) return ;

  report.transcript = rndWords('this is ', '') + drone.callSign +
                      rndWords(' reporting in,', ' copy,', ' pivoting,') +
                      rndWords(' new path received', ' following new path', ' incoming new plan accepted');
  drone.changeRoute( msg.timeBufPrevPtInd, msg.path );
  socket.emit('DT_updateAck', report);
});


// ------ DEMO Interface ------
var io = require('socket.io')(8001);

io.on('connection', function(socket){
  socket.on('_path', function(msg) {
    var _path = drone.getCurrentPath();
    socket.emit('_pathUpdate', _path );
  });

  socket.on('_location', function(msg) {
    var loc = drone.getCurrentState().location;
    socket.emit('_locationUpdate', loc );
  });
}
