// Including dependencies
var Random = require("random-js")();
var LineStep = require('./utils/lineStep');

var droneSim = {
  // drone constructor
  makeDrone: function(callSign, path, speed) {
    // `drone` object to export
    var drone = {};

    drone.callSign = callSign || "VX-seven oh two";
    path = path || 
            [
              [1, 2],
              [123, 80],
              [304, 130],
              [596, 339],
              [802, 489],
              [1034, 829]
            ];

    // `speed` indicate the speed of the drone, represented in m/s
    drone.speed = drone.speed || 3;

    // Utility to interpolate the path
    var ls = LineStep(path);

    // if `takenOff` is `false` means the drone was landed
    drone.takenOff = false;
    // the drone would only "fly" forward
    drone.isFlying = false;
    drone.isArrived = false;

    // To increase precision, update every 0.1s
    var computeInterval = 100;

    var _step;
    // Core computation to simulate drone flying state
    var compute = function() {

      // a step is calculated based on computation cycle interval
      // random fluctuation added to _step(of the moment)
      _step = droneSim.fluc(drone.speed,-10,10)/(1000/computeInterval);
      // a done can only be flying when it is in the sky
      if ( drone.takenOff && drone.isFlying ) ls.step(_step);

      if ( ls.currPoint[0] === path[path.length-1][0] ) {
        drone.isArrived = true;
      }

      // random fluctuation added to current location
      ls.currPoint = [droneSim.fluc(ls.currPoint[0],-10,10), droneSim.fluc(ls.currPoint[1],-10,10)];
    }

    // The Computing cycle interval
    intervalHandler_compute = setInterval(compute, computeInterval);


    drone.getStatusCode = function() {
      if ( drone.isArrived ) {
        // statusCode 10: drone arrived at the planned destination
        return 10;
      }
      else if ( !drone.takenOff && !drone.isFlying ) {
        // statusCode 0: at stand at ground, waiting for taking off
        return 0;
      } else if ( drone.takenOff && !drone.isFlying ) {
        // statusCode 1: hovering in sky, waiting for instruction or new plan
        return 1;
      } else if ( drone.takenOff && drone.isFlying ) {
        // statusCode 2: flying in sky, following instruction or preset plan
        return 2;
      }

      // statusCode 199: Exception, Hazard, SOS
      return 199;
    }

    drone.takeOff = function() {
      drone.takenOff = true;
    }

    drone.land = function() {
      drone.takenOff = false;
    }

    drone.fly = function() {
      drone.isFlying = true;
    }

    drone.stop = function() {
      drone.isFlying = false;
    }


    // get an object representation of the state of the drone
    drone.getCurrentState = function() {
      return { callSign: drone.callSign,
               location: [ls.currPoint[0], ls.currPoint[1]],
               speed: drone.speed,
               prevPathPtInd: ls.prevCtrlPtInd,
               distance: ls.currDist,
               statusCode: drone.getStatusCode()
             };
    }

    // set the speed of drone
    drone.setSpeed = function( newSpeed ) {
      drone.speed = newSpeed;
    }

    drone.changeRoute = function( pivotPointInd, substitute ) {
      var i;
      var dist = drone.getCurrentState().distance;
      path = 
        Array.prototype.concat(path.slice(0, pivotPointInd+1), 
                               substitute, 
                               path.slice(pivotPointInd+1, path.length-1));
      console.log('PATH',path);
      ls = LineStep(path);
      ls.step(dist);
    }

    return drone;
  },
  // Generalized fluctuation between [m,n]. AWARE, the unit of the speed is in cm/s
  fluc: function(input, m, n) {
    var d = Random.integer(m,n)/100;
    input += d;
    return input;
  }
}



var exports = module.exports = droneSim;


