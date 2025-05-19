/**
 * @file A small library for handling simple vector math.
 * @author undeadf0x
*/

class Vector {
    static strictMode = false;
    /** @private */
    #internalLength;

    /**
     * @function
     * @param {...(number|number[])} args If a single number is supplied, it's treated as a length (aka the number of dimensions).
     * If two or more values are supplied, or an array of numbers is supplied, treated as coordinates.
     * @example <caption>Creating a blank vector with 3 dimensions</caption>
     * new Vector(3);
     * 
     * @example <caption>Creating a 3d vector with filled positions</caption>
     * new Vector(3,15,20);
    */

    constructor(...args) {
        if (args.length === 1 && args[0].constructor === Number) {
            // Handle length supplied
            this.length = args[0];
        } else if (args.length > 1 || args[0].constructor === Array) {
            args = args.flat(Infinity)
            // Handle coordinates supplied
            this.length = args[0].length;
        }
    }
}
