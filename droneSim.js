// Including dependencies
var Random = require("random-js")();
var LineStep = require('./utils/lineStep');


var NanoTimer = require('nanotimer');
var Timer = new NanoTimer();

var moment = require('moment');


var droneSim = {
  // drone constructor
  makeDrone: function(callSign, path, speed, dtype) {
    // `drone` object to export
    var drone = {};
    var now = moment();
    drone.flightStart = now.subtract(5, 'minutes').format('YYYY-MM-DD hh:mm:ss');
    drone.flightEnd = now.add(30, 'minutes').format('YYYY-MM-DD hh:mm:ss');

    console.log(drone);

    drone.callSign = callSign || "VX-seven oh two";
    drone.dtype = dtype;
    path = path || 
            [[1853377.5179902278,632037.7121465462],[1853696.516434419,632075.7578325507],[1853474.0955008543,631835.7773515995],[1853807.7269012013,631926.501679764],[1853582.3793764056,631625.0627829594],[1853924.7905504457,631765.5391620528],[1853992.1021487613,632102.0971536307],[1854141.358301548,631856.2634902173],[1854150.1380752414,632151.8492045597],[1854278.9080894103,631958.6941833062],[1854237.9358121748,632295.2521748842],[1854422.3110597348,632020.1525991596],[1854434.0174246593,632327.4446784264],[1854492.5492492814,632380.1233205864],[1854492.5492492814,632084.5376062441],[1854732.5297302327,632198.6746642574],[1854606.6863072948,632377.1967293553],[1854802.7679197793,632503.0401522932],[1855033.9686270372,632441.5817364397],[1855016.4090796506,632321.5914959642],[1854893.4922479438,632119.6567010174],[1854662.291540686,631777.2455269772],[1854293.5410455659,631715.7871111239],[1856160.7062510154,631347.0366160037]];

    // `speed` indicate the speed of the drone, represented in m/s
    drone.speed = drone.speed || 10;

    // Utility to interpolate the path
    var ls = LineStep(path);

    // if `takenOff` is `false` means the drone was landed
    drone.takenOff = false;
    // the drone would only "fly" forward
    drone.isFlying = false;
    drone.isArrived = false;

    // To increase precision, update every 100ms
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
    intervalHandler_compute = Timer.setInterval(compute, '', computeInterval+'m');


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


    // Find out time buffered passing control point index
    drone.getTimeBufPrevPtInd = function( second ) {
      var origDist = ls.currDist;
      var timeBufDist = origDist + drone.speed * second;
      var timeBufLineStep = LineStep(path);
      timeBufLineStep.step( timeBufDist );
      return timeBufLineStep.prevCtrlPtInd;
    }

    // get an object representation of the state of the drone
    drone.getCurrentState = function() {
      return { callSign: drone.callSign,
               droneType: drone.dtype,
               flightStart: drone.flightStart,
               flightEnd: drone.flightEnd,
               location: [ls.currPoint[0], ls.currPoint[1]],
               speed: drone.speed,
               prevPathPtInd: ls.prevCtrlPtInd,
               timeBufPrevPtInd: drone.getTimeBufPrevPtInd(10),
               distance: ls.currDist,
               statusCode: drone.getStatusCode(),
             };
    }

    drone.getCurrentPath = function() {
      return path;
    }

    // set the speed of drone
    drone.setSpeed = function( newSpeed ) {
      drone.speed = newSpeed;
    }

    drone.changeRoute = function( pivotPointInd, substitute ) {
      var i;
      var dist = ls.currDist;
      path = 
        Array.prototype.concat(path.slice(0, pivotPointInd), 
                               substitute);
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


