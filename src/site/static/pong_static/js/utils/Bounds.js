/**
 * Represents a rectangular bounding area with minimum and maximum x and y coordinates.
 * @class
 */
export default class Bounds {
	/**
	 * Creates an instance of the Bounds class.
	 * @param {number} xMin - The minimum x-coordinate of the bounding area.
	 * @param {number} xMax - The maximum x-coordinate of the bounding area.
	 * @param {number} yMin - The minimum y-coordinate of the bounding area.
	 * @param {number} yMax - The maximum y-coordinate of the bounding area.
	 */
	constructor(xMin, xMax, yMin, yMax) 
	{
		this.xMin = xMin;
		this.xMax = xMax;
		this.yMin = yMin;
		this.yMax = yMax;
	}
}
