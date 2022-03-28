/* eslint-disable */
/*!	Curve calc function for canvas 2.3.1
 *	Epistemex (c) 2013-2014
 *	License: MIT
 */


export class CurveCalc {
  /**
   * Calculates an array containing points representing a cardinal spline through given point array.
   * Points must be arranged as: [x1, y1, x2, y2, ..., xn, yn].
   *
   * The points for the cardinal spline are returned as a new array.
   *
   * @param {Array} points - point array
   * @param {Number} [tension=0.5] - tension. Typically between [0.0, 1.0] but can be exceeded
   * @param {Number} [numOfSeg=20] - number of segments between two points (line resolution)
   * @param {Boolean} [close=false] - Close the ends making the line continuous
   * @returns {Float32Array} New array with the calculated points that was added to the path
   */
  static getCurvePoints(points, tension, numOfSeg, close) {

    'use strict';

    // options or defaults
    tension = (typeof tension === 'number') ? tension : 0.5;
    numOfSeg = numOfSeg ? numOfSeg : 25;

    var pts, // for cloning point array
      i = 1,
      l = points.length,
      rPos = 0,
      rLen = (l - 2) * numOfSeg + 2 + (close ? 2 * numOfSeg : 0),
      res = new Float32Array(rLen),
      cache = new Float32Array((numOfSeg + 2) * 4),
      cachePtr = 4;

    pts = points.slice(0);

    if (close) {
      pts.unshift(points[l - 1]); // insert end point as first point
      pts.unshift(points[l - 2]);
      pts.push(points[0], points[1]); // first point as last point
    } else {
      pts.unshift(points[1]); // copy 1. point and insert at beginning
      pts.unshift(points[0]);
      pts.push(points[l - 2], points[l - 1]); // duplicate end-points
    }

    // cache inner-loop calculations as they are based on t alone
    cache[0] = 1; // 1,0,0,0

    for (; i < numOfSeg; i++) {

      var st = i / numOfSeg,
        st2 = st * st,
        st3 = st2 * st,
        st23 = st3 * 2,
        st32 = st2 * 3;

      cache[cachePtr++] = st23 - st32 + 1; // c1
      cache[cachePtr++] = st32 - st23; // c2
      cache[cachePtr++] = st3 - 2 * st2 + st; // c3
      cache[cachePtr++] = st3 - st2; // c4
    }

    cache[++cachePtr] = 1; // 0,1,0,0

    // calc. points
    parse(pts, cache, l);

    if (close) {
      //l = points.length;
      pts = [];
      pts.push(points[l - 4], points[l - 3], points[l - 2], points[l - 1]); // second last and last
      pts.push(points[0], points[1], points[2], points[3]); // first and second
      parse(pts, cache, 4);
    }

    function parse(pts, cache, l) {

      for (var i = 2, t; i < l; i += 2) {

        var pt1 = pts[i],
          pt2 = pts[i + 1],
          pt3 = pts[i + 2],
          pt4 = pts[i + 3],

          t1x = (pt3 - pts[i - 2]) * tension,
          t1y = (pt4 - pts[i - 1]) * tension,
          t2x = (pts[i + 4] - pt1) * tension,
          t2y = (pts[i + 5] - pt2) * tension;

        for (t = 0; t < numOfSeg; t++) {

          var c = t << 2, //t * 4;

            c1 = cache[c],
            c2 = cache[c + 1],
            c3 = cache[c + 2],
            c4 = cache[c + 3];

          res[rPos++] = c1 * pt1 + c2 * pt3 + c3 * t1x + c4 * t2x;
          res[rPos++] = c1 * pt2 + c2 * pt4 + c3 * t1y + c4 * t2y;
        }
      }
    }

    // add last point
    l = close ? 0 : points.length - 2;
    res[rPos++] = points[l];
    res[rPos] = points[l + 1];

    return res;
  }

  /**
   * returns an array with moving average of the input array
   * @param array - the input array
   * @param count - the number of elements to include in the moving average calculation
   * @param qualifier - an optional function that will be called on each 
   *  value to determine whether it should be used
   */
  static movingAvg(array, count, qualifier = null) {
    // calculate average for subarray
    var avg = function (array, qualifier) {

      var sum = 0,
        count = 0,
        val;
      for (var i in array) {
        val = array[i];
        if (!qualifier || qualifier(val)) {
          sum += val;
          count++;
        }
      }

      return sum / count;
    };

    var result = [],
      val;

    // pad beginning of result with null values
    for (i = 0; i < count - 1; i++)
      result.push(null);

    // calculate average for each subarray and add to result
    for (var i = 0, len = array.length - count; i <= len; i++) {

      val = avg(array.slice(i, i + count), qualifier);
      if (isNaN(val))
        result.push(null);
      else
        result.push(val);
    }

    return result;
  }

  static differential(array) {
    var result = [],
      val;

    result.push(null);

    // calculate average for each subarray and add to result
    for (var i = 1; i <= array.length; i++) {

      val = array[i] - array[i - 1];
      if (isNaN(val))
        result.push(null);
      else
        result.push(val);
    }

    return result;
  }

  static poly_simplify(V, tol) {
    // V ... [[x1,y1],[x2,y2],...] polyline
    // tol  ... approximation tolerance
    // ============================================== 
    // Copyright 2002, softSurfer (www.softsurfer.com)
    // This code may be freely used and modified for any purpose
    // providing that this copyright notice is included with it.
    // SoftSurfer makes no warranty for this code, and cannot be held
    // liable for any real or imagined damage resulting from its use.
    // Users of this code must verify correctness for their application.
    // http://softsurfer.com/Archive/algorithm_0205/algorithm_0205.htm
    var sum = function (u, v) {
      return [u[0] + v[0], u[1] + v[1]];
    }
    var diff = function (u, v) {
      return [u[0] - v[0], u[1] - v[1]];
    }
    var prod = function (u, v) {
      return [u[0] * v[0], u[1] * v[1]];
    }
    var dot = function (u, v) {
      return u[0] * v[0] + u[1] * v[1];
    }
    var norm2 = function (v) {
      return v[0] * v[0] + v[1] * v[1];
    }
    var norm = function (v) {
      return Math.sqrt(norm2(v));
    }
    var d2 = function (u, v) {
      return norm2(diff(u, v));
    }
    var d = function (u, v) {
      return norm(diff(u, v));
    }

    var simplifyDP = function (tol, v, j, k, mk) {
      //  This is the Douglas-Peucker recursive simplification routine
      //  It just marks vertices that are part of the simplified polyline
      //  for approximating the polyline subchain v[j] to v[k].
      //  mk[] ... array of markers matching vertex array v[]
      if (k <= j + 1) { // there is nothing to simplify
        return;
      }
      // check for adequate approximation by segment S from v[j] to v[k]
      var maxi = j; // index of vertex farthest from S
      var maxd2 = 0; // distance squared of farthest vertex
      var tol2 = tol * tol; // tolerance squared
      var S = [v[j], v[k]]; // segment from v[j] to v[k]
      var u = diff(S[1], S[0]); // segment direction vector
      var cu = norm2(u, u); // segment length squared
      // test each vertex v[i] for max distance from S
      // compute using the Feb 2001 Algorithm's dist_Point_to_Segment()
      // Note: this works in any dimension (2D, 3D, ...)
      var w; // vector
      var Pb; // point, base of perpendicular from v[i] to S
      var b, cw, dv2; // dv2 = distance v[i] to S squared
      for (var i = j + 1; i < k; i++) {
        // compute distance squared
        w = diff(v[i], S[0]);
        cw = dot(w, u);
        if (cw <= 0) {
          dv2 = d2(v[i], S[0]);
        } else if (cu <= cw) {
          dv2 = d2(v[i], S[1]);
        } else {
          b = cw / cu;
          Pb = [S[0][0] + b * u[0], S[0][1] + b * u[1]];
          dv2 = d2(v[i], Pb);
        }
        // test with current max distance squared
        if (dv2 <= maxd2) {
          continue;
        }
        // v[i] is a new max vertex
        maxi = i;
        maxd2 = dv2;
      }
      if (maxd2 > tol2) { // error is worse than the tolerance
        // split the polyline at the farthest vertex from S
        mk[maxi] = 1; // mark v[maxi] for the simplified polyline
        // recursively simplify the two subpolylines at v[maxi]
        simplifyDP(tol, v, j, maxi, mk); // polyline v[j] to v[maxi]
        simplifyDP(tol, v, maxi, k, mk); // polyline v[maxi] to v[k]
      }
      // else the approximation is OK, so ignore intermediate vertices
      return;
    }

    var n = V.length;
    var sV = [];
    var i, k, m, pv; // misc counters
    var tol2 = tol * tol; // tolerance squared
    var vt = []; // vertex buffer, points
    var mk = []; // marker buffer, ints

    // STAGE 1.  Vertex Reduction within tolerance of prior vertex cluster
    vt[0] = V[0]; // start at the beginning
    for (i = k = 1, pv = 0; i < n; i++) {
      if (d2(V[i], V[pv]) < tol2) {
        continue;
      }
      vt[k++] = V[i];
      pv = i;
    }
    if (pv < n - 1) {
      vt[k++] = V[n - 1]; // finish at the end
    }

    // STAGE 2.  Douglas-Peucker polyline simplification
    mk[0] = mk[k - 1] = 1; // mark the first and last vertices
    simplifyDP(tol, vt, 0, k - 1, mk);

    // copy marked vertices to the output simplified polyline
    for (i = m = 0; i < k; i++) {
      if (mk[i]) {
        sV[m++] = vt[i];
      }
    }
    return sV;
  }

  // Calculate the average of all the numbers
  static calculateMean(values) {
    const mean = (values.reduce((sum, current) => sum + current)) / values.length;
    return mean;
  };

  // Calculate variance
  static calculateVariance(values) {
    const average = CurveCalc.calculateMean(values);
    const squareDiffs = values.map((value) => {
      const diff = value - average;
      return diff * diff;
    });
    const variance = CurveCalc.calculateMean(squareDiffs);
    return variance;
  };

  // Calculate stand deviation
  static calculateSD(variance) {
    return Math.sqrt(variance);
  };
}