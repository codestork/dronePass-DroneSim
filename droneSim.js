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
              [-122.251911, 37.866316],
              [-122.25500106811523, 37.86401247373357],
              [-122.2723388671875, 37.86347038587407],
              [-122.271137,37.854356],
              [-122.28667259216309,37.852119505594274],
              [-122.27993488311768,37.83103950459009],
            ];

    // `speed` indicate the speed of the drone, represented in m/s
    drone.speed = drone.speed || 0.0001;

    var ls = LineStep(path);

    // if `takenOff` is `false` means the drone was landed
    drone.takenOff = false;
    // the drone would only "fly" forward
    drone.isFlying = false;
    drone.isArrived = false;

    // To increase precision, update every 0.1s
    var computeInterval = 100;

    // Core computation to simulate drone flying state
    var compute = function() {
      // a step is calculated based on computation cycle interval
      _step = droneSim.fluc(drone.speed,-80,80)/(1000/computeInterval);
      // a done can only be flying when it is in the sky
      if ( drone.takenOff && drone.isFlying ) ls.step(_step);

      if ( ls.currPoint[0] === path[path.length-1][0] )
      // random fluctuation added to current location and rounded up to .2f
      ls.currPoint = [droneSim.fluc(ls.currPoint[0],-10,10), droneSim.fluc(ls.currPoint[1],-10,10)];
      // ls.currPoint = [Math.round(ls.currPoint[0]*100)/100, Math.round(ls.currPoint[1]*100)/100];
    }

    drone.intervalHandler_compute = setInterval(compute, computeInterval);


    drone.getStatusCode = function() {
      if ( drone.isArrived ) {
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

               // location: [Math.round(ls.currPoint[0]*100)/100, Math.round(ls.currPoint[1]*100)/100],
               location: [ls.currPoint[0], ls.currPoint[1]],
               speed: drone.speed,
               prevPathPtInd: ls.prevCtrlPtInd,
               distance: Math.round(ls.currDist*100)/100,
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
      ls = LineStep(path);
      ls.step(dist);
    }

    return drone;
  },
  // Generalized fluctuation between [m,n], AWARE unit in cm/s
  fluc: function(input, m, n) {
    //var d = Random.integer(m,n)/100;
    //input += d;
    return input;
  }
}



var exports = module.exports = droneSim;


