var turf = require('turf');
var drone1 = require('./droneSim');

drone1.takeOff();
drone1.fly();
setTimeout(function(){
  drone1.stop.apply(drone1);
},3500)
