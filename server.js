var LineStep = require('./utils/lineStep');

var ls1 = LineStep([ [1,3],
                     [5,7],
                     [10,-19],
                         ] );

console.log(ls1.step(1.5));
console.log(ls1.step(2));
console.log(ls1.step(3));