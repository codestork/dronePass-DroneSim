/**
 * LineStep interpolates the coordinates 
 * along the length of a potentially multi-segment line.
 *
 * Note: this module's function documentation frequently refers to a `Point`
 * object, which is simply an array of two numbers (the x- and y- coordinates).
 */

'use strict';

/**
 * @param {Point} pt1
 * @param {Point} pt2
 * @return number The Euclidean distance between `pt1` and `pt2`.
 */
var distance = function( pt1, pt2 ){
  var deltaX = pt1[0] - pt2[0];
  var deltaY = pt1[1] - pt2[1];
  return Math.sqrt( deltaX * deltaX + deltaY * deltaY );
}

/**
 * @param {array of Point} ctrlPoints The vertices of the (multi-segment) line
 *      to be interpolate along.
 * @param {int} number The number of points to interpolate along the line; this
 *      includes the endpoints, and has an effective minimum value of 2 (if a
 *      smaller number is given, then the endpoints will still be returned).
 * @param {number} [offsetDist] An optional perpendicular distance to offset
 *      each point from the line-segment it would otherwise lie on.
 */

var LineStep = function( ctrlPoints ) {
  var newObj = {};
  newObj.current = ctrlPoints[ 0 ];

  newObj.step = function( step ){

    // Calculate path distance from each control point (vertex) to the beginning
    // of the line, and also the ratio of `offsetDist` to the length of every
    // line segment, for use in computing offsets.
    var totalDist = 0;
    var ctrlPtDists = [ 0 ];
    for( var pt = 1; pt < ctrlPoints.length; pt++ ){
      var dist = distance( ctrlPoints[ pt ], ctrlPoints[ pt - 1 ] );
      totalDist += dist;
      ctrlPtDists.push( totalDist );
    }

    // Variables used to control interpolation.
    var interpPoints = [ ctrlPoints[ 0 ] ];
    var currPoint = newObj.current;
    var prevCtrlPtInd = 0;
    var currDist = 0;
    var nextDist = 0;

    return function( step ) {
      nextDist += step;

      // Find the segment in which the next interpolated point lies.
      while( nextDist > ctrlPtDists[ prevCtrlPtInd + 1 ] ){
        prevCtrlPtInd++;
        currDist = ctrlPtDists[ prevCtrlPtInd ];
        currPoint = ctrlPoints[ prevCtrlPtInd ];
      }

      if ( prevCtrlPtInd === ctrlPoints.length - 1 ) {
        return newObj.current = currPoint;
      }

      // Interpolate the coordinates of the next point along the current segment.
      var remainingDist = nextDist - currDist;
      var ctrlPtsDeltaX = ctrlPoints[ prevCtrlPtInd + 1 ][ 0 ] -
        ctrlPoints[ prevCtrlPtInd ][ 0 ];
      var ctrlPtsDeltaY = ctrlPoints[ prevCtrlPtInd + 1 ][ 1 ] -
        ctrlPoints[ prevCtrlPtInd ][ 1 ];
      var ctrlPtsDist = ctrlPtDists[ prevCtrlPtInd + 1 ] -
        ctrlPtDists[ prevCtrlPtInd ];
      var distRatio = remainingDist / ctrlPtsDist;

      currPoint = [
        currPoint[ 0 ] + ctrlPtsDeltaX * distRatio,
        currPoint[ 1 ] + ctrlPtsDeltaY * distRatio
      ];

      currDist = nextDist;

      return newObj.current = currPoint;
    }

    
  }();

  return newObj;
}


module.exports = LineStep;