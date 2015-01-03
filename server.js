var turf = require('turf');
var droneSim = require('./droneSim');

var drone1 = droneSim.makeDrone();
drone1.takeOff();
drone1.fly();

 setTimeout(function(){
   // drone1.stop.apply(drone1);
   drone1.changeRoute.call(drone1, 1,[[-5,-5],[-8,-8]]);
 },2000)
