var turf = require('turf');
var droneSim = require('./droneSim');
var fs = require('fs');
var Random = require("random-js")();


var drone1 = droneSim.makeDrone('Mike-Lima-November-9-1-7');

 setInterval(function(){
    console.log(drone1.getCurrentState());
  }, 1000);

var rndWords = function() {
  var len = arguments.length;
  var ind = Random.integer(0,len-1);
  return arguments[ind];
}

var io = require('socket.io')(8080);

io
  .on('connection', function (socket) {

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
      if ( drone1.isFlying ) {
        report.transcript = drone1.callSign + ' copy.' +
                                    ' we were flying, will keep going';
      } 
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

      if ( !drone1.isFlying && !drone1.takenOff ) {
        report.transcript = rndWords('this is ', '') + drone1.callSign +
                            rndWords(' at stand,', ' copy,') +
                            rndWords(' we were holding', ' keeping idle') +
                            " at ground";
      }
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