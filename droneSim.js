// Including dependencies
var Random = require("random-js")();
var LineStep = require('./utils/lineStep');

var droneSim = {
  // drone constructor
  makeDrone: function(path, speed) {
    // `drone` object to export
    var drone = {};
    path = path || 
            [
            [1,3],
            [3,19],
            [20,25],
            [26,-75],
            [-55,122],
            [60,122],
            ];

    // `speed` indicate the speed of the drone, represented in m/s
    speed = speed || 10;

    var ls = LineStep(path);

    // if `takenOff` is `false` means the drone was landed
    var takenOff = false;
    // the drone would only "fly" forward
    var isFlying = false;

    // To increase precision, update every 0.1s
    var computeInterval = 100;

    // Core computation to simulate drone flying state
    var compute = function() {
      // a step is calculated based on computation cycle interval
      _step = droneSim.fluc(speed,-80,80)/(1000/computeInterval);
      // a done can only be flying when it is in the sky
      if ( takenOff && isFlying ) ls.step(_step);

      // random fluctuation added to current location and rounded up to .2f
      ls.currPoint = [droneSim.fluc(ls.currPoint[0],-10,10), droneSim.fluc(ls.currPoint[1],-10,10)];
      ls.currPoint = [Math.round(ls.currPoint[0]*100)/100, Math.round(ls.currPoint[1]*100)/100];
    }

    drone.intervalHandler_compute = setInterval(compute, computeInterval);


    

    drone.takeOff = function() {
      takenOff = true;
    }

    drone.land = function() {
      takenOff = false;
    }

    drone.fly = function() {
      isFlying = true;
    }

    drone.stop = function() {
      isFlying = false;
    }

    // get an object representation of the state of the drone
    drone.getCurrentState = function() {
      return { location: ls.currPoint,
               prevPathPtInd: ls.prevCtrlPtInd,
               distance: ls.currDist
             };
    }

    // set the speed of drone
    drone.setSpeed = function( newSpeed ) {
      speed = newSpeed;
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

    // ------- debug logger --------
    setInterval(function(){
      console.log(drone.getCurrentState());
    }, 1000);

    return drone;
  },
  // Generalized fluctuation between [m,n], AWARE unit in cm/s
  fluc: function(input, m, n) {
    var d = Random.integer(m,n)/100;
    input += d;
    return input;
  }
}



var exports = module.exports = droneSim;


