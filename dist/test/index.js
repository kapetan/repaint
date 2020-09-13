(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){
var once = require('once');

var isError = function(e) {
  return Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
};

module.exports = function(afterAllCb) {

  afterAllCb = once(afterAllCb || function() {});
  
  var errorMessage ='"next" function called after the final callback.'+
    ' Make sure all the calls to "next" are on the same tick';
  var calls = 0;
  var done = false;
  var finalError = null;

  process.nextTick(function() {
    if (calls === 0) {
      done = true;
      afterAllCb();
    }
  });

  return function next(cb) {
    if (done) throw new Error(errorMessage);
    calls++;

    return function thecallback(err) {
      var args = arguments;
      if (isError(err) && !finalError) finalError = err;
      process.nextTick(function() {
        if (cb) cb.apply(null, args);
        if (--calls === 0) {
          done = true;
          afterAllCb(finalError);
        }
      });
    };
  };
};

}).call(this,require('_process'))
},{"_process":7,"once":97}],2:[function(require,module,exports){
(function (Buffer){
(function (w) {
  "use strict";

  function findBest(atobNative) {
    // normal window
    if ('function' === typeof atobNative) { return atobNative; }


    // browserify (web worker)
    if ('function' === typeof Buffer) {
      return function atobBrowserify(a) {
        //!! Deliberately using an API that's deprecated in node.js because
        //!! this file is for browsers and we expect them to cope with it.
        //!! Discussion: github.com/node-browser-compat/atob/pull/9
        return new Buffer(a, 'base64').toString('binary');
      };
    }

    // ios web worker with base64js
    if ('object' === typeof w.base64js) {
      // bufferToBinaryString
      // https://git.coolaj86.com/coolaj86/unibabel.js/blob/master/index.js#L50
      return function atobWebWorker_iOS(a) {
        var buf = w.base64js.b64ToByteArray(a);
        return Array.prototype.map.call(buf, function (ch) {
          return String.fromCharCode(ch);
        }).join('');
      };
    }

		return function () {
			// ios web worker without base64js
			throw new Error("You're probably in an old browser or an iOS webworker." +
				" It might help to include beatgammit's base64-js.");
    };
  }

  var atobBest = findBest(w.atob);
  w.atob = atobBest;

  if ((typeof module === 'object') && module && module.exports) {
    module.exports = atobBest;
  }
}(window));

}).call(this,require("buffer").Buffer)
},{"buffer":8}],3:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],4:[function(require,module,exports){
module.exports = {
	trueFunc: function trueFunc(){
		return true;
	},
	falseFunc: function falseFunc(){
		return false;
	}
};
},{}],5:[function(require,module,exports){

},{}],6:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],7:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":3,"buffer":8,"ieee754":89}],9:[function(require,module,exports){
module.exports = function(obj) {
    if (typeof obj === 'string') return camelCase(obj);
    return walk(obj);
};

function walk (obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (isDate(obj) || isRegex(obj)) return obj;
    if (isArray(obj)) return map(obj, walk);
    return reduce(objectKeys(obj), function (acc, key) {
        var camel = camelCase(key);
        acc[camel] = walk(obj[key]);
        return acc;
    }, {});
}

function camelCase(str) {
    return str.replace(/[_.-](\w|$)/g, function (_,x) {
        return x.toUpperCase();
    });
}

var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

var isDate = function (obj) {
    return Object.prototype.toString.call(obj) === '[object Date]';
};

var isRegex = function (obj) {
    return Object.prototype.toString.call(obj) === '[object RegExp]';
};

var has = Object.prototype.hasOwnProperty;
var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) {
        if (has.call(obj, key)) keys.push(key);
    }
    return keys;
};

function map (xs, f) {
    if (xs.map) return xs.map(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        res.push(f(xs[i], i));
    }
    return res;
}

function reduce (xs, f, acc) {
    if (xs.reduce) return xs.reduce(f, acc);
    for (var i = 0; i < xs.length; i++) {
        acc = f(acc, xs[i], i);
    }
    return acc;
}

},{}],10:[function(require,module,exports){
module.exports = function (string, preserve) {
  if (!preserve) {
    string = string.toLowerCase();
  }
  return string.charAt(0).toUpperCase() + string.substring(1);
}

module.exports.words = function (string, preserve) {
  if (!preserve) {
    string = string.toLowerCase();
  }
  return string.replace(/(?!^[0-9])(^|[^a-zA-Z\u00C0-\u017F\u0400-\u04FF'])([a-zA-Z\u00C0-\u017F\u0400-\u04FF])/g, function (m) {
    return m.toUpperCase()
  })
}

},{}],11:[function(require,module,exports){
/* MIT license */

module.exports = {
  rgb2hsl: rgb2hsl,
  rgb2hsv: rgb2hsv,
  rgb2hwb: rgb2hwb,
  rgb2cmyk: rgb2cmyk,
  rgb2keyword: rgb2keyword,
  rgb2xyz: rgb2xyz,
  rgb2lab: rgb2lab,
  rgb2lch: rgb2lch,

  hsl2rgb: hsl2rgb,
  hsl2hsv: hsl2hsv,
  hsl2hwb: hsl2hwb,
  hsl2cmyk: hsl2cmyk,
  hsl2keyword: hsl2keyword,

  hsv2rgb: hsv2rgb,
  hsv2hsl: hsv2hsl,
  hsv2hwb: hsv2hwb,
  hsv2cmyk: hsv2cmyk,
  hsv2keyword: hsv2keyword,

  hwb2rgb: hwb2rgb,
  hwb2hsl: hwb2hsl,
  hwb2hsv: hwb2hsv,
  hwb2cmyk: hwb2cmyk,
  hwb2keyword: hwb2keyword,

  cmyk2rgb: cmyk2rgb,
  cmyk2hsl: cmyk2hsl,
  cmyk2hsv: cmyk2hsv,
  cmyk2hwb: cmyk2hwb,
  cmyk2keyword: cmyk2keyword,

  keyword2rgb: keyword2rgb,
  keyword2hsl: keyword2hsl,
  keyword2hsv: keyword2hsv,
  keyword2hwb: keyword2hwb,
  keyword2cmyk: keyword2cmyk,
  keyword2lab: keyword2lab,
  keyword2xyz: keyword2xyz,

  xyz2rgb: xyz2rgb,
  xyz2lab: xyz2lab,
  xyz2lch: xyz2lch,

  lab2xyz: lab2xyz,
  lab2rgb: lab2rgb,
  lab2lch: lab2lch,

  lch2lab: lch2lab,
  lch2xyz: lch2xyz,
  lch2rgb: lch2rgb
}


function rgb2hsl(rgb) {
  var r = rgb[0]/255,
      g = rgb[1]/255,
      b = rgb[2]/255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min,
      h, s, l;

  if (max == min)
    h = 0;
  else if (r == max)
    h = (g - b) / delta;
  else if (g == max)
    h = 2 + (b - r) / delta;
  else if (b == max)
    h = 4 + (r - g)/ delta;

  h = Math.min(h * 60, 360);

  if (h < 0)
    h += 360;

  l = (min + max) / 2;

  if (max == min)
    s = 0;
  else if (l <= 0.5)
    s = delta / (max + min);
  else
    s = delta / (2 - max - min);

  return [h, s * 100, l * 100];
}

function rgb2hsv(rgb) {
  var r = rgb[0],
      g = rgb[1],
      b = rgb[2],
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      delta = max - min,
      h, s, v;

  if (max == 0)
    s = 0;
  else
    s = (delta/max * 1000)/10;

  if (max == min)
    h = 0;
  else if (r == max)
    h = (g - b) / delta;
  else if (g == max)
    h = 2 + (b - r) / delta;
  else if (b == max)
    h = 4 + (r - g) / delta;

  h = Math.min(h * 60, 360);

  if (h < 0)
    h += 360;

  v = ((max / 255) * 1000) / 10;

  return [h, s, v];
}

function rgb2hwb(rgb) {
  var r = rgb[0],
      g = rgb[1],
      b = rgb[2],
      h = rgb2hsl(rgb)[0],
      w = 1/255 * Math.min(r, Math.min(g, b)),
      b = 1 - 1/255 * Math.max(r, Math.max(g, b));

  return [h, w * 100, b * 100];
}

function rgb2cmyk(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255,
      c, m, y, k;

  k = Math.min(1 - r, 1 - g, 1 - b);
  c = (1 - r - k) / (1 - k) || 0;
  m = (1 - g - k) / (1 - k) || 0;
  y = (1 - b - k) / (1 - k) || 0;
  return [c * 100, m * 100, y * 100, k * 100];
}

function rgb2keyword(rgb) {
  return reverseKeywords[JSON.stringify(rgb)];
}

function rgb2xyz(rgb) {
  var r = rgb[0] / 255,
      g = rgb[1] / 255,
      b = rgb[2] / 255;

  // assume sRGB
  r = r > 0.04045 ? Math.pow(((r + 0.055) / 1.055), 2.4) : (r / 12.92);
  g = g > 0.04045 ? Math.pow(((g + 0.055) / 1.055), 2.4) : (g / 12.92);
  b = b > 0.04045 ? Math.pow(((b + 0.055) / 1.055), 2.4) : (b / 12.92);

  var x = (r * 0.4124) + (g * 0.3576) + (b * 0.1805);
  var y = (r * 0.2126) + (g * 0.7152) + (b * 0.0722);
  var z = (r * 0.0193) + (g * 0.1192) + (b * 0.9505);

  return [x * 100, y *100, z * 100];
}

function rgb2lab(rgb) {
  var xyz = rgb2xyz(rgb),
        x = xyz[0],
        y = xyz[1],
        z = xyz[2],
        l, a, b;

  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  l = (116 * y) - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);

  return [l, a, b];
}

function rgb2lch(args) {
  return lab2lch(rgb2lab(args));
}

function hsl2rgb(hsl) {
  var h = hsl[0] / 360,
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      t1, t2, t3, rgb, val;

  if (s == 0) {
    val = l * 255;
    return [val, val, val];
  }

  if (l < 0.5)
    t2 = l * (1 + s);
  else
    t2 = l + s - l * s;
  t1 = 2 * l - t2;

  rgb = [0, 0, 0];
  for (var i = 0; i < 3; i++) {
    t3 = h + 1 / 3 * - (i - 1);
    t3 < 0 && t3++;
    t3 > 1 && t3--;

    if (6 * t3 < 1)
      val = t1 + (t2 - t1) * 6 * t3;
    else if (2 * t3 < 1)
      val = t2;
    else if (3 * t3 < 2)
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    else
      val = t1;

    rgb[i] = val * 255;
  }

  return rgb;
}

function hsl2hsv(hsl) {
  var h = hsl[0],
      s = hsl[1] / 100,
      l = hsl[2] / 100,
      sv, v;

  if(l === 0) {
      // no need to do calc on black
      // also avoids divide by 0 error
      return [0, 0, 0];
  }

  l *= 2;
  s *= (l <= 1) ? l : 2 - l;
  v = (l + s) / 2;
  sv = (2 * s) / (l + s);
  return [h, sv * 100, v * 100];
}

function hsl2hwb(args) {
  return rgb2hwb(hsl2rgb(args));
}

function hsl2cmyk(args) {
  return rgb2cmyk(hsl2rgb(args));
}

function hsl2keyword(args) {
  return rgb2keyword(hsl2rgb(args));
}


function hsv2rgb(hsv) {
  var h = hsv[0] / 60,
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      hi = Math.floor(h) % 6;

  var f = h - Math.floor(h),
      p = 255 * v * (1 - s),
      q = 255 * v * (1 - (s * f)),
      t = 255 * v * (1 - (s * (1 - f))),
      v = 255 * v;

  switch(hi) {
    case 0:
      return [v, t, p];
    case 1:
      return [q, v, p];
    case 2:
      return [p, v, t];
    case 3:
      return [p, q, v];
    case 4:
      return [t, p, v];
    case 5:
      return [v, p, q];
  }
}

function hsv2hsl(hsv) {
  var h = hsv[0],
      s = hsv[1] / 100,
      v = hsv[2] / 100,
      sl, l;

  l = (2 - s) * v;
  sl = s * v;
  sl /= (l <= 1) ? l : 2 - l;
  sl = sl || 0;
  l /= 2;
  return [h, sl * 100, l * 100];
}

function hsv2hwb(args) {
  return rgb2hwb(hsv2rgb(args))
}

function hsv2cmyk(args) {
  return rgb2cmyk(hsv2rgb(args));
}

function hsv2keyword(args) {
  return rgb2keyword(hsv2rgb(args));
}

// http://dev.w3.org/csswg/css-color/#hwb-to-rgb
function hwb2rgb(hwb) {
  var h = hwb[0] / 360,
      wh = hwb[1] / 100,
      bl = hwb[2] / 100,
      ratio = wh + bl,
      i, v, f, n;

  // wh + bl cant be > 1
  if (ratio > 1) {
    wh /= ratio;
    bl /= ratio;
  }

  i = Math.floor(6 * h);
  v = 1 - bl;
  f = 6 * h - i;
  if ((i & 0x01) != 0) {
    f = 1 - f;
  }
  n = wh + f * (v - wh);  // linear interpolation

  switch (i) {
    default:
    case 6:
    case 0: r = v; g = n; b = wh; break;
    case 1: r = n; g = v; b = wh; break;
    case 2: r = wh; g = v; b = n; break;
    case 3: r = wh; g = n; b = v; break;
    case 4: r = n; g = wh; b = v; break;
    case 5: r = v; g = wh; b = n; break;
  }

  return [r * 255, g * 255, b * 255];
}

function hwb2hsl(args) {
  return rgb2hsl(hwb2rgb(args));
}

function hwb2hsv(args) {
  return rgb2hsv(hwb2rgb(args));
}

function hwb2cmyk(args) {
  return rgb2cmyk(hwb2rgb(args));
}

function hwb2keyword(args) {
  return rgb2keyword(hwb2rgb(args));
}

function cmyk2rgb(cmyk) {
  var c = cmyk[0] / 100,
      m = cmyk[1] / 100,
      y = cmyk[2] / 100,
      k = cmyk[3] / 100,
      r, g, b;

  r = 1 - Math.min(1, c * (1 - k) + k);
  g = 1 - Math.min(1, m * (1 - k) + k);
  b = 1 - Math.min(1, y * (1 - k) + k);
  return [r * 255, g * 255, b * 255];
}

function cmyk2hsl(args) {
  return rgb2hsl(cmyk2rgb(args));
}

function cmyk2hsv(args) {
  return rgb2hsv(cmyk2rgb(args));
}

function cmyk2hwb(args) {
  return rgb2hwb(cmyk2rgb(args));
}

function cmyk2keyword(args) {
  return rgb2keyword(cmyk2rgb(args));
}


function xyz2rgb(xyz) {
  var x = xyz[0] / 100,
      y = xyz[1] / 100,
      z = xyz[2] / 100,
      r, g, b;

  r = (x * 3.2406) + (y * -1.5372) + (z * -0.4986);
  g = (x * -0.9689) + (y * 1.8758) + (z * 0.0415);
  b = (x * 0.0557) + (y * -0.2040) + (z * 1.0570);

  // assume sRGB
  r = r > 0.0031308 ? ((1.055 * Math.pow(r, 1.0 / 2.4)) - 0.055)
    : r = (r * 12.92);

  g = g > 0.0031308 ? ((1.055 * Math.pow(g, 1.0 / 2.4)) - 0.055)
    : g = (g * 12.92);

  b = b > 0.0031308 ? ((1.055 * Math.pow(b, 1.0 / 2.4)) - 0.055)
    : b = (b * 12.92);

  r = Math.min(Math.max(0, r), 1);
  g = Math.min(Math.max(0, g), 1);
  b = Math.min(Math.max(0, b), 1);

  return [r * 255, g * 255, b * 255];
}

function xyz2lab(xyz) {
  var x = xyz[0],
      y = xyz[1],
      z = xyz[2],
      l, a, b;

  x /= 95.047;
  y /= 100;
  z /= 108.883;

  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + (16 / 116);
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + (16 / 116);
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + (16 / 116);

  l = (116 * y) - 16;
  a = 500 * (x - y);
  b = 200 * (y - z);

  return [l, a, b];
}

function xyz2lch(args) {
  return lab2lch(xyz2lab(args));
}

function lab2xyz(lab) {
  var l = lab[0],
      a = lab[1],
      b = lab[2],
      x, y, z, y2;

  if (l <= 8) {
    y = (l * 100) / 903.3;
    y2 = (7.787 * (y / 100)) + (16 / 116);
  } else {
    y = 100 * Math.pow((l + 16) / 116, 3);
    y2 = Math.pow(y / 100, 1/3);
  }

  x = x / 95.047 <= 0.008856 ? x = (95.047 * ((a / 500) + y2 - (16 / 116))) / 7.787 : 95.047 * Math.pow((a / 500) + y2, 3);

  z = z / 108.883 <= 0.008859 ? z = (108.883 * (y2 - (b / 200) - (16 / 116))) / 7.787 : 108.883 * Math.pow(y2 - (b / 200), 3);

  return [x, y, z];
}

function lab2lch(lab) {
  var l = lab[0],
      a = lab[1],
      b = lab[2],
      hr, h, c;

  hr = Math.atan2(b, a);
  h = hr * 360 / 2 / Math.PI;
  if (h < 0) {
    h += 360;
  }
  c = Math.sqrt(a * a + b * b);
  return [l, c, h];
}

function lab2rgb(args) {
  return xyz2rgb(lab2xyz(args));
}

function lch2lab(lch) {
  var l = lch[0],
      c = lch[1],
      h = lch[2],
      a, b, hr;

  hr = h / 360 * 2 * Math.PI;
  a = c * Math.cos(hr);
  b = c * Math.sin(hr);
  return [l, a, b];
}

function lch2xyz(args) {
  return lab2xyz(lch2lab(args));
}

function lch2rgb(args) {
  return lab2rgb(lch2lab(args));
}

function keyword2rgb(keyword) {
  return cssKeywords[keyword];
}

function keyword2hsl(args) {
  return rgb2hsl(keyword2rgb(args));
}

function keyword2hsv(args) {
  return rgb2hsv(keyword2rgb(args));
}

function keyword2hwb(args) {
  return rgb2hwb(keyword2rgb(args));
}

function keyword2cmyk(args) {
  return rgb2cmyk(keyword2rgb(args));
}

function keyword2lab(args) {
  return rgb2lab(keyword2rgb(args));
}

function keyword2xyz(args) {
  return rgb2xyz(keyword2rgb(args));
}

var cssKeywords = {
  aliceblue:  [240,248,255],
  antiquewhite: [250,235,215],
  aqua: [0,255,255],
  aquamarine: [127,255,212],
  azure:  [240,255,255],
  beige:  [245,245,220],
  bisque: [255,228,196],
  black:  [0,0,0],
  blanchedalmond: [255,235,205],
  blue: [0,0,255],
  blueviolet: [138,43,226],
  brown:  [165,42,42],
  burlywood:  [222,184,135],
  cadetblue:  [95,158,160],
  chartreuse: [127,255,0],
  chocolate:  [210,105,30],
  coral:  [255,127,80],
  cornflowerblue: [100,149,237],
  cornsilk: [255,248,220],
  crimson:  [220,20,60],
  cyan: [0,255,255],
  darkblue: [0,0,139],
  darkcyan: [0,139,139],
  darkgoldenrod:  [184,134,11],
  darkgray: [169,169,169],
  darkgreen:  [0,100,0],
  darkgrey: [169,169,169],
  darkkhaki:  [189,183,107],
  darkmagenta:  [139,0,139],
  darkolivegreen: [85,107,47],
  darkorange: [255,140,0],
  darkorchid: [153,50,204],
  darkred:  [139,0,0],
  darksalmon: [233,150,122],
  darkseagreen: [143,188,143],
  darkslateblue:  [72,61,139],
  darkslategray:  [47,79,79],
  darkslategrey:  [47,79,79],
  darkturquoise:  [0,206,209],
  darkviolet: [148,0,211],
  deeppink: [255,20,147],
  deepskyblue:  [0,191,255],
  dimgray:  [105,105,105],
  dimgrey:  [105,105,105],
  dodgerblue: [30,144,255],
  firebrick:  [178,34,34],
  floralwhite:  [255,250,240],
  forestgreen:  [34,139,34],
  fuchsia:  [255,0,255],
  gainsboro:  [220,220,220],
  ghostwhite: [248,248,255],
  gold: [255,215,0],
  goldenrod:  [218,165,32],
  gray: [128,128,128],
  green:  [0,128,0],
  greenyellow:  [173,255,47],
  grey: [128,128,128],
  honeydew: [240,255,240],
  hotpink:  [255,105,180],
  indianred:  [205,92,92],
  indigo: [75,0,130],
  ivory:  [255,255,240],
  khaki:  [240,230,140],
  lavender: [230,230,250],
  lavenderblush:  [255,240,245],
  lawngreen:  [124,252,0],
  lemonchiffon: [255,250,205],
  lightblue:  [173,216,230],
  lightcoral: [240,128,128],
  lightcyan:  [224,255,255],
  lightgoldenrodyellow: [250,250,210],
  lightgray:  [211,211,211],
  lightgreen: [144,238,144],
  lightgrey:  [211,211,211],
  lightpink:  [255,182,193],
  lightsalmon:  [255,160,122],
  lightseagreen:  [32,178,170],
  lightskyblue: [135,206,250],
  lightslategray: [119,136,153],
  lightslategrey: [119,136,153],
  lightsteelblue: [176,196,222],
  lightyellow:  [255,255,224],
  lime: [0,255,0],
  limegreen:  [50,205,50],
  linen:  [250,240,230],
  magenta:  [255,0,255],
  maroon: [128,0,0],
  mediumaquamarine: [102,205,170],
  mediumblue: [0,0,205],
  mediumorchid: [186,85,211],
  mediumpurple: [147,112,219],
  mediumseagreen: [60,179,113],
  mediumslateblue:  [123,104,238],
  mediumspringgreen:  [0,250,154],
  mediumturquoise:  [72,209,204],
  mediumvioletred:  [199,21,133],
  midnightblue: [25,25,112],
  mintcream:  [245,255,250],
  mistyrose:  [255,228,225],
  moccasin: [255,228,181],
  navajowhite:  [255,222,173],
  navy: [0,0,128],
  oldlace:  [253,245,230],
  olive:  [128,128,0],
  olivedrab:  [107,142,35],
  orange: [255,165,0],
  orangered:  [255,69,0],
  orchid: [218,112,214],
  palegoldenrod:  [238,232,170],
  palegreen:  [152,251,152],
  paleturquoise:  [175,238,238],
  palevioletred:  [219,112,147],
  papayawhip: [255,239,213],
  peachpuff:  [255,218,185],
  peru: [205,133,63],
  pink: [255,192,203],
  plum: [221,160,221],
  powderblue: [176,224,230],
  purple: [128,0,128],
  rebeccapurple: [102, 51, 153],
  red:  [255,0,0],
  rosybrown:  [188,143,143],
  royalblue:  [65,105,225],
  saddlebrown:  [139,69,19],
  salmon: [250,128,114],
  sandybrown: [244,164,96],
  seagreen: [46,139,87],
  seashell: [255,245,238],
  sienna: [160,82,45],
  silver: [192,192,192],
  skyblue:  [135,206,235],
  slateblue:  [106,90,205],
  slategray:  [112,128,144],
  slategrey:  [112,128,144],
  snow: [255,250,250],
  springgreen:  [0,255,127],
  steelblue:  [70,130,180],
  tan:  [210,180,140],
  teal: [0,128,128],
  thistle:  [216,191,216],
  tomato: [255,99,71],
  turquoise:  [64,224,208],
  violet: [238,130,238],
  wheat:  [245,222,179],
  white:  [255,255,255],
  whitesmoke: [245,245,245],
  yellow: [255,255,0],
  yellowgreen:  [154,205,50]
};

var reverseKeywords = {};
for (var key in cssKeywords) {
  reverseKeywords[JSON.stringify(cssKeywords[key])] = key;
}

},{}],12:[function(require,module,exports){
var conversions = require("./conversions");

var convert = function() {
   return new Converter();
}

for (var func in conversions) {
  // export Raw versions
  convert[func + "Raw"] =  (function(func) {
    // accept array or plain args
    return function(arg) {
      if (typeof arg == "number")
        arg = Array.prototype.slice.call(arguments);
      return conversions[func](arg);
    }
  })(func);

  var pair = /(\w+)2(\w+)/.exec(func),
      from = pair[1],
      to = pair[2];

  // export rgb2hsl and ["rgb"]["hsl"]
  convert[from] = convert[from] || {};

  convert[from][to] = convert[func] = (function(func) { 
    return function(arg) {
      if (typeof arg == "number")
        arg = Array.prototype.slice.call(arguments);
      
      var val = conversions[func](arg);
      if (typeof val == "string" || val === undefined)
        return val; // keyword

      for (var i = 0; i < val.length; i++)
        val[i] = Math.round(val[i]);
      return val;
    }
  })(func);
}


/* Converter does lazy conversion and caching */
var Converter = function() {
   this.convs = {};
};

/* Either get the values for a space or
  set the values for a space, depending on args */
Converter.prototype.routeSpace = function(space, args) {
   var values = args[0];
   if (values === undefined) {
      // color.rgb()
      return this.getValues(space);
   }
   // color.rgb(10, 10, 10)
   if (typeof values == "number") {
      values = Array.prototype.slice.call(args);        
   }

   return this.setValues(space, values);
};
  
/* Set the values for a space, invalidating cache */
Converter.prototype.setValues = function(space, values) {
   this.space = space;
   this.convs = {};
   this.convs[space] = values;
   return this;
};

/* Get the values for a space. If there's already
  a conversion for the space, fetch it, otherwise
  compute it */
Converter.prototype.getValues = function(space) {
   var vals = this.convs[space];
   if (!vals) {
      var fspace = this.space,
          from = this.convs[fspace];
      vals = convert[fspace][space](from);

      this.convs[space] = vals;
   }
  return vals;
};

["rgb", "hsl", "hsv", "cmyk", "keyword"].forEach(function(space) {
   Converter.prototype[space] = function(vals) {
      return this.routeSpace(space, arguments);
   }
});

module.exports = convert;
},{"./conversions":11}],13:[function(require,module,exports){
module.exports={
  "aqua": "#00ffff",
  "aliceblue": "#f0f8ff",
  "antiquewhite": "#faebd7",
  "black": "#000000",
  "blue": "#0000ff",
  "cyan": "#00ffff",
  "darkblue": "#00008b",
  "darkcyan": "#008b8b",
  "darkgreen": "#006400",
  "darkturquoise": "#00ced1",
  "deepskyblue": "#00bfff",
  "green": "#008000",
  "lime": "#00ff00",
  "mediumblue": "#0000cd",
  "mediumspringgreen": "#00fa9a",
  "navy": "#000080",
  "springgreen": "#00ff7f",
  "teal": "#008080",
  "midnightblue": "#191970",
  "dodgerblue": "#1e90ff",
  "lightseagreen": "#20b2aa",
  "forestgreen": "#228b22",
  "seagreen": "#2e8b57",
  "darkslategray": "#2f4f4f",
  "darkslategrey": "#2f4f4f",
  "limegreen": "#32cd32",
  "mediumseagreen": "#3cb371",
  "turquoise": "#40e0d0",
  "royalblue": "#4169e1",
  "steelblue": "#4682b4",
  "darkslateblue": "#483d8b",
  "mediumturquoise": "#48d1cc",
  "indigo": "#4b0082",
  "darkolivegreen": "#556b2f",
  "cadetblue": "#5f9ea0",
  "cornflowerblue": "#6495ed",
  "mediumaquamarine": "#66cdaa",
  "dimgray": "#696969",
  "dimgrey": "#696969",
  "slateblue": "#6a5acd",
  "olivedrab": "#6b8e23",
  "slategray": "#708090",
  "slategrey": "#708090",
  "lightslategray": "#778899",
  "lightslategrey": "#778899",
  "mediumslateblue": "#7b68ee",
  "lawngreen": "#7cfc00",
  "aquamarine": "#7fffd4",
  "chartreuse": "#7fff00",
  "gray": "#808080",
  "grey": "#808080",
  "maroon": "#800000",
  "olive": "#808000",
  "purple": "#800080",
  "lightskyblue": "#87cefa",
  "skyblue": "#87ceeb",
  "blueviolet": "#8a2be2",
  "darkmagenta": "#8b008b",
  "darkred": "#8b0000",
  "saddlebrown": "#8b4513",
  "darkseagreen": "#8fbc8f",
  "lightgreen": "#90ee90",
  "mediumpurple": "#9370db",
  "darkviolet": "#9400d3",
  "palegreen": "#98fb98",
  "darkorchid": "#9932cc",
  "yellowgreen": "#9acd32",
  "sienna": "#a0522d",
  "brown": "#a52a2a",
  "darkgray": "#a9a9a9",
  "darkgrey": "#a9a9a9",
  "greenyellow": "#adff2f",
  "lightblue": "#add8e6",
  "paleturquoise": "#afeeee",
  "lightsteelblue": "#b0c4de",
  "powderblue": "#b0e0e6",
  "firebrick": "#b22222",
  "darkgoldenrod": "#b8860b",
  "mediumorchid": "#ba55d3",
  "rosybrown": "#bc8f8f",
  "darkkhaki": "#bdb76b",
  "silver": "#c0c0c0",
  "mediumvioletred": "#c71585",
  "indianred": "#cd5c5c",
  "peru": "#cd853f",
  "chocolate": "#d2691e",
  "tan": "#d2b48c",
  "lightgray": "#d3d3d3",
  "lightgrey": "#d3d3d3",
  "thistle": "#d8bfd8",
  "goldenrod": "#daa520",
  "orchid": "#da70d6",
  "palevioletred": "#db7093",
  "crimson": "#dc143c",
  "gainsboro": "#dcdcdc",
  "plum": "#dda0dd",
  "burlywood": "#deb887",
  "lightcyan": "#e0ffff",
  "lavender": "#e6e6fa",
  "darksalmon": "#e9967a",
  "palegoldenrod": "#eee8aa",
  "violet": "#ee82ee",
  "azure": "#f0ffff",
  "honeydew": "#f0fff0",
  "khaki": "#f0e68c",
  "lightcoral": "#f08080",
  "sandybrown": "#f4a460",
  "beige": "#f5f5dc",
  "mintcream": "#f5fffa",
  "wheat": "#f5deb3",
  "whitesmoke": "#f5f5f5",
  "ghostwhite": "#f8f8ff",
  "lightgoldenrodyellow": "#fafad2",
  "linen": "#faf0e6",
  "salmon": "#fa8072",
  "oldlace": "#fdf5e6",
  "bisque": "#ffe4c4",
  "blanchedalmond": "#ffebcd",
  "coral": "#ff7f50",
  "cornsilk": "#fff8dc",
  "darkorange": "#ff8c00",
  "deeppink": "#ff1493",
  "floralwhite": "#fffaf0",
  "fuchsia": "#ff00ff",
  "gold": "#ffd700",
  "hotpink": "#ff69b4",
  "ivory": "#fffff0",
  "lavenderblush": "#fff0f5",
  "lemonchiffon": "#fffacd",
  "lightpink": "#ffb6c1",
  "lightsalmon": "#ffa07a",
  "lightyellow": "#ffffe0",
  "magenta": "#ff00ff",
  "mistyrose": "#ffe4e1",
  "moccasin": "#ffe4b5",
  "navajowhite": "#ffdead",
  "orange": "#ffa500",
  "orangered": "#ff4500",
  "papayawhip": "#ffefd5",
  "peachpuff": "#ffdab9",
  "pink": "#ffc0cb",
  "red": "#ff0000",
  "seashell": "#fff5ee",
  "snow": "#fffafa",
  "tomato": "#ff6347",
  "white": "#ffffff",
  "yellow": "#ffff00",
  "rebeccapurple": "#663399"
}

},{}],14:[function(require,module,exports){
"use strict";

module.exports = CSSselect;

var DomUtils = require("domutils");
var falseFunc = require("boolbase").falseFunc;
var compileRaw = require("./lib/compile.js");

function wrapCompile(func) {
    return function addAdapter(selector, options, context) {
        options = options || {};
        options.adapter = options.adapter || DomUtils;

        return func(selector, options, context);
    };
}

var compile = wrapCompile(compileRaw);
var compileUnsafe = wrapCompile(compileRaw.compileUnsafe);

function getSelectorFunc(searchFunc) {
    return function select(query, elems, options) {
        options = options || {};
        options.adapter = options.adapter || DomUtils;

        if (typeof query !== "function") {
            query = compileUnsafe(query, options, elems);
        }
        if (query.shouldTestNextSiblings) {
            elems = appendNextSiblings((options && options.context) || elems, options.adapter);
        }
        if (!Array.isArray(elems)) elems = options.adapter.getChildren(elems);
        else elems = options.adapter.removeSubsets(elems);
        return searchFunc(query, elems, options);
    };
}

function getNextSiblings(elem, adapter) {
    var siblings = adapter.getSiblings(elem);
    if (!Array.isArray(siblings)) return [];
    siblings = siblings.slice(0);
    while (siblings.shift() !== elem);
    return siblings;
}

function appendNextSiblings(elems, adapter) {
    // Order matters because jQuery seems to check the children before the siblings
    if (!Array.isArray(elems)) elems = [elems];
    var newElems = elems.slice(0);

    for (var i = 0, len = elems.length; i < len; i++) {
        var nextSiblings = getNextSiblings(newElems[i], adapter);
        newElems.push.apply(newElems, nextSiblings);
    }
    return newElems;
}

var selectAll = getSelectorFunc(function selectAll(query, elems, options) {
    return query === falseFunc || !elems || elems.length === 0 ? [] : options.adapter.findAll(query, elems);
});

var selectOne = getSelectorFunc(function selectOne(query, elems, options) {
    return query === falseFunc || !elems || elems.length === 0 ? null : options.adapter.findOne(query, elems);
});

function is(elem, query, options) {
    options = options || {};
    options.adapter = options.adapter || DomUtils;
    return (typeof query === "function" ? query : compile(query, options))(elem);
}

/*
	the exported interface
*/
function CSSselect(query, elems, options) {
    return selectAll(query, elems, options);
}

CSSselect.compile = compile;
CSSselect.filters = compileRaw.Pseudos.filters;
CSSselect.pseudos = compileRaw.Pseudos.pseudos;

CSSselect.selectAll = selectAll;
CSSselect.selectOne = selectOne;

CSSselect.is = is;

//legacy methods (might be removed)
CSSselect.parse = compile;
CSSselect.iterate = selectAll;

//hooks
CSSselect._compileUnsafe = compileUnsafe;
CSSselect._compileToken = compileRaw.compileToken;

},{"./lib/compile.js":16,"boolbase":4,"domutils":49}],15:[function(require,module,exports){
var falseFunc = require("boolbase").falseFunc;

//https://github.com/slevithan/XRegExp/blob/master/src/xregexp.js#L469
var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;

/*
	attribute selectors
*/
var attributeRules = {
    __proto__: null,
    equals: function(next, data, options) {
        var name = data.name;
        var value = data.value;
        var adapter = options.adapter;

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return function equalsIC(elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return attr != null && attr.toLowerCase() === value && next(elem);
            };
        }

        return function equals(elem) {
            return adapter.getAttributeValue(elem, name) === value && next(elem);
        };
    },
    hyphen: function(next, data, options) {
        var name = data.name;
        var value = data.value;
        var len = value.length;
        var adapter = options.adapter;

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return function hyphenIC(elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return (
                    attr != null &&
                    (attr.length === len || attr.charAt(len) === "-") &&
                    attr.substr(0, len).toLowerCase() === value &&
                    next(elem)
                );
            };
        }

        return function hyphen(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return (
                attr != null &&
                attr.substr(0, len) === value &&
                (attr.length === len || attr.charAt(len) === "-") &&
                next(elem)
            );
        };
    },
    element: function(next, data, options) {
        var name = data.name;
        var value = data.value;
        var adapter = options.adapter;

        if (/\s/.test(value)) {
            return falseFunc;
        }

        value = value.replace(reChars, "\\$&");

        var pattern = "(?:^|\\s)" + value + "(?:$|\\s)",
            flags = data.ignoreCase ? "i" : "",
            regex = new RegExp(pattern, flags);

        return function element(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && regex.test(attr) && next(elem);
        };
    },
    exists: function(next, data, options) {
        var name = data.name;
        var adapter = options.adapter;

        return function exists(elem) {
            return adapter.hasAttrib(elem, name) && next(elem);
        };
    },
    start: function(next, data, options) {
        var name = data.name;
        var value = data.value;
        var len = value.length;
        var adapter = options.adapter;

        if (len === 0) {
            return falseFunc;
        }

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return function startIC(elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return attr != null && attr.substr(0, len).toLowerCase() === value && next(elem);
            };
        }

        return function start(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.substr(0, len) === value && next(elem);
        };
    },
    end: function(next, data, options) {
        var name = data.name;
        var value = data.value;
        var len = -value.length;
        var adapter = options.adapter;

        if (len === 0) {
            return falseFunc;
        }

        if (data.ignoreCase) {
            value = value.toLowerCase();

            return function endIC(elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return attr != null && attr.substr(len).toLowerCase() === value && next(elem);
            };
        }

        return function end(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.substr(len) === value && next(elem);
        };
    },
    any: function(next, data, options) {
        var name = data.name;
        var value = data.value;
        var adapter = options.adapter;

        if (value === "") {
            return falseFunc;
        }

        if (data.ignoreCase) {
            var regex = new RegExp(value.replace(reChars, "\\$&"), "i");

            return function anyIC(elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return attr != null && regex.test(attr) && next(elem);
            };
        }

        return function any(elem) {
            var attr = adapter.getAttributeValue(elem, name);
            return attr != null && attr.indexOf(value) >= 0 && next(elem);
        };
    },
    not: function(next, data, options) {
        var name = data.name;
        var value = data.value;
        var adapter = options.adapter;

        if (value === "") {
            return function notEmpty(elem) {
                return !!adapter.getAttributeValue(elem, name) && next(elem);
            };
        } else if (data.ignoreCase) {
            value = value.toLowerCase();

            return function notIC(elem) {
                var attr = adapter.getAttributeValue(elem, name);
                return attr != null && attr.toLowerCase() !== value && next(elem);
            };
        }

        return function not(elem) {
            return adapter.getAttributeValue(elem, name) !== value && next(elem);
        };
    }
};

module.exports = {
    compile: function(next, data, options) {
        if (options && options.strict && (data.ignoreCase || data.action === "not")) {
            throw new Error("Unsupported attribute selector");
        }
        return attributeRules[data.action](next, data, options);
    },
    rules: attributeRules
};

},{"boolbase":4}],16:[function(require,module,exports){
/*
	compiles a selector to an executable function
*/

module.exports = compile;

var parse = require("css-what").parse;
var BaseFuncs = require("boolbase");
var sortRules = require("./sort.js");
var procedure = require("./procedure.json");
var Rules = require("./general.js");
var Pseudos = require("./pseudos.js");
var trueFunc = BaseFuncs.trueFunc;
var falseFunc = BaseFuncs.falseFunc;

var filters = Pseudos.filters;

function compile(selector, options, context) {
    var next = compileUnsafe(selector, options, context);
    return wrap(next, options);
}

function wrap(next, options) {
    var adapter = options.adapter;

    return function base(elem) {
        return adapter.isTag(elem) && next(elem);
    };
}

function compileUnsafe(selector, options, context) {
    var token = parse(selector, options);
    return compileToken(token, options, context);
}

function includesScopePseudo(t) {
    return (
        t.type === "pseudo" &&
        (t.name === "scope" ||
            (Array.isArray(t.data) &&
                t.data.some(function(data) {
                    return data.some(includesScopePseudo);
                })))
    );
}

var DESCENDANT_TOKEN = { type: "descendant" };
var FLEXIBLE_DESCENDANT_TOKEN = { type: "_flexibleDescendant" };
var SCOPE_TOKEN = { type: "pseudo", name: "scope" };
var PLACEHOLDER_ELEMENT = {};

//CSS 4 Spec (Draft): 3.3.1. Absolutizing a Scope-relative Selector
//http://www.w3.org/TR/selectors4/#absolutizing
function absolutize(token, options, context) {
    var adapter = options.adapter;

    //TODO better check if context is document
    var hasContext =
        !!context &&
        !!context.length &&
        context.every(function(e) {
            return e === PLACEHOLDER_ELEMENT || !!adapter.getParent(e);
        });

    token.forEach(function(t) {
        if (t.length > 0 && isTraversal(t[0]) && t[0].type !== "descendant") {
            //don't return in else branch
        } else if (hasContext && !(Array.isArray(t) ? t.some(includesScopePseudo) : includesScopePseudo(t))) {
            t.unshift(DESCENDANT_TOKEN);
        } else {
            return;
        }

        t.unshift(SCOPE_TOKEN);
    });
}

function compileToken(token, options, context) {
    token = token.filter(function(t) {
        return t.length > 0;
    });

    token.forEach(sortRules);

    var isArrayContext = Array.isArray(context);

    context = (options && options.context) || context;

    if (context && !isArrayContext) context = [context];

    absolutize(token, options, context);

    var shouldTestNextSiblings = false;

    var query = token
        .map(function(rules) {
            if (rules[0] && rules[1] && rules[0].name === "scope") {
                var ruleType = rules[1].type;
                if (isArrayContext && ruleType === "descendant") {
                    rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
                } else if (ruleType === "adjacent" || ruleType === "sibling") {
                    shouldTestNextSiblings = true;
                }
            }
            return compileRules(rules, options, context);
        })
        .reduce(reduceRules, falseFunc);

    query.shouldTestNextSiblings = shouldTestNextSiblings;

    return query;
}

function isTraversal(t) {
    return procedure[t.type] < 0;
}

function compileRules(rules, options, context) {
    return rules.reduce(function(func, rule) {
        if (func === falseFunc) return func;

        if (!(rule.type in Rules)) {
            throw new Error("Rule type " + rule.type + " is not supported by css-select");
        }

        return Rules[rule.type](func, rule, options, context);
    }, (options && options.rootFunc) || trueFunc);
}

function reduceRules(a, b) {
    if (b === falseFunc || a === trueFunc) {
        return a;
    }
    if (a === falseFunc || b === trueFunc) {
        return b;
    }

    return function combine(elem) {
        return a(elem) || b(elem);
    };
}

function containsTraversal(t) {
    return t.some(isTraversal);
}

//:not, :has and :matches have to compile selectors
//doing this in lib/pseudos.js would lead to circular dependencies,
//so we add them here
filters.not = function(next, token, options, context) {
    var opts = {
        xmlMode: !!(options && options.xmlMode),
        strict: !!(options && options.strict),
        adapter: options.adapter
    };

    if (opts.strict) {
        if (token.length > 1 || token.some(containsTraversal)) {
            throw new Error("complex selectors in :not aren't allowed in strict mode");
        }
    }

    var func = compileToken(token, opts, context);

    if (func === falseFunc) return next;
    if (func === trueFunc) return falseFunc;

    return function not(elem) {
        return !func(elem) && next(elem);
    };
};

filters.has = function(next, token, options) {
    var adapter = options.adapter;
    var opts = {
        xmlMode: !!(options && options.xmlMode),
        strict: !!(options && options.strict),
        adapter: adapter
    };

    //FIXME: Uses an array as a pointer to the current element (side effects)
    var context = token.some(containsTraversal) ? [PLACEHOLDER_ELEMENT] : null;

    var func = compileToken(token, opts, context);

    if (func === falseFunc) return falseFunc;
    if (func === trueFunc) {
        return function hasChild(elem) {
            return adapter.getChildren(elem).some(adapter.isTag) && next(elem);
        };
    }

    func = wrap(func, options);

    if (context) {
        return function has(elem) {
            return next(elem) && ((context[0] = elem), adapter.existsOne(func, adapter.getChildren(elem)));
        };
    }

    return function has(elem) {
        return next(elem) && adapter.existsOne(func, adapter.getChildren(elem));
    };
};

filters.matches = function(next, token, options, context) {
    var opts = {
        xmlMode: !!(options && options.xmlMode),
        strict: !!(options && options.strict),
        rootFunc: next,
        adapter: options.adapter
    };

    return compileToken(token, opts, context);
};

compile.compileToken = compileToken;
compile.compileUnsafe = compileUnsafe;
compile.Pseudos = Pseudos;

},{"./general.js":17,"./procedure.json":18,"./pseudos.js":19,"./sort.js":20,"boolbase":4,"css-what":33}],17:[function(require,module,exports){
var attributes = require("./attributes.js");
var Pseudos = require("./pseudos");

/*
	all available rules
*/
module.exports = {
    __proto__: null,

    attribute: attributes.compile,
    pseudo: Pseudos.compile,

    //tags
    tag: function(next, data, options) {
        var name = data.name;
        var adapter = options.adapter;

        return function tag(elem) {
            return adapter.getName(elem) === name && next(elem);
        };
    },

    //traversal
    descendant: function(next, data, options) {
        // eslint-disable-next-line no-undef
        var isFalseCache = typeof WeakSet !== "undefined" ? new WeakSet() : null;
        var adapter = options.adapter;

        return function descendant(elem) {
            var found = false;

            while (!found && (elem = adapter.getParent(elem))) {
                if (!isFalseCache || !isFalseCache.has(elem)) {
                    found = next(elem);
                    if (!found && isFalseCache) {
                        isFalseCache.add(elem);
                    }
                }
            }

            return found;
        };
    },
    _flexibleDescendant: function(next, data, options) {
        var adapter = options.adapter;

        // Include element itself, only used while querying an array
        return function descendant(elem) {
            var found = next(elem);

            while (!found && (elem = adapter.getParent(elem))) {
                found = next(elem);
            }

            return found;
        };
    },
    parent: function(next, data, options) {
        if (options && options.strict) {
            throw new Error("Parent selector isn't part of CSS3");
        }

        var adapter = options.adapter;

        return function parent(elem) {
            return adapter.getChildren(elem).some(test);
        };

        function test(elem) {
            return adapter.isTag(elem) && next(elem);
        }
    },
    child: function(next, data, options) {
        var adapter = options.adapter;

        return function child(elem) {
            var parent = adapter.getParent(elem);
            return !!parent && next(parent);
        };
    },
    sibling: function(next, data, options) {
        var adapter = options.adapter;

        return function sibling(elem) {
            var siblings = adapter.getSiblings(elem);

            for (var i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (next(siblings[i])) return true;
                }
            }

            return false;
        };
    },
    adjacent: function(next, data, options) {
        var adapter = options.adapter;

        return function adjacent(elem) {
            var siblings = adapter.getSiblings(elem),
                lastElement;

            for (var i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    lastElement = siblings[i];
                }
            }

            return !!lastElement && next(lastElement);
        };
    },
    universal: function(next) {
        return next;
    }
};

},{"./attributes.js":15,"./pseudos":19}],18:[function(require,module,exports){
module.exports={
	"universal": 50,
	"tag": 30,
	"attribute": 1,
	"pseudo": 0,
	"descendant": -1,
	"child": -1,
	"parent": -1,
	"sibling": -1,
	"adjacent": -1
}

},{}],19:[function(require,module,exports){
/*
	pseudo selectors

	---

	they are available in two forms:
	* filters called when the selector
	  is compiled and return a function
	  that needs to return next()
	* pseudos get called on execution
	  they need to return a boolean
*/

var getNCheck = require("nth-check");
var BaseFuncs = require("boolbase");
var attributes = require("./attributes.js");
var trueFunc = BaseFuncs.trueFunc;
var falseFunc = BaseFuncs.falseFunc;

var checkAttrib = attributes.rules.equals;

function getAttribFunc(name, value) {
    var data = { name: name, value: value };
    return function attribFunc(next, rule, options) {
        return checkAttrib(next, data, options);
    };
}

function getChildFunc(next, adapter) {
    return function(elem) {
        return !!adapter.getParent(elem) && next(elem);
    };
}

var filters = {
    contains: function(next, text, options) {
        var adapter = options.adapter;

        return function contains(elem) {
            return next(elem) && adapter.getText(elem).indexOf(text) >= 0;
        };
    },
    icontains: function(next, text, options) {
        var itext = text.toLowerCase();
        var adapter = options.adapter;

        return function icontains(elem) {
            return (
                next(elem) &&
                adapter
                    .getText(elem)
                    .toLowerCase()
                    .indexOf(itext) >= 0
            );
        };
    },

    //location specific methods
    "nth-child": function(next, rule, options) {
        var func = getNCheck(rule);
        var adapter = options.adapter;

        if (func === falseFunc) return func;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthChild(elem) {
            var siblings = adapter.getSiblings(elem);

            for (var i = 0, pos = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    else pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-child": function(next, rule, options) {
        var func = getNCheck(rule);
        var adapter = options.adapter;

        if (func === falseFunc) return func;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthLastChild(elem) {
            var siblings = adapter.getSiblings(elem);

            for (var pos = 0, i = siblings.length - 1; i >= 0; i--) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    else pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-of-type": function(next, rule, options) {
        var func = getNCheck(rule);
        var adapter = options.adapter;

        if (func === falseFunc) return func;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthOfType(elem) {
            var siblings = adapter.getSiblings(elem);

            for (var pos = 0, i = 0; i < siblings.length; i++) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (adapter.getName(siblings[i]) === adapter.getName(elem)) pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },
    "nth-last-of-type": function(next, rule, options) {
        var func = getNCheck(rule);
        var adapter = options.adapter;

        if (func === falseFunc) return func;
        if (func === trueFunc) return getChildFunc(next, adapter);

        return function nthLastOfType(elem) {
            var siblings = adapter.getSiblings(elem);

            for (var pos = 0, i = siblings.length - 1; i >= 0; i--) {
                if (adapter.isTag(siblings[i])) {
                    if (siblings[i] === elem) break;
                    if (adapter.getName(siblings[i]) === adapter.getName(elem)) pos++;
                }
            }

            return func(pos) && next(elem);
        };
    },

    //TODO determine the actual root element
    root: function(next, rule, options) {
        var adapter = options.adapter;

        return function(elem) {
            return !adapter.getParent(elem) && next(elem);
        };
    },

    scope: function(next, rule, options, context) {
        var adapter = options.adapter;

        if (!context || context.length === 0) {
            //equivalent to :root
            return filters.root(next, rule, options);
        }

        function equals(a, b) {
            if (typeof adapter.equals === "function") return adapter.equals(a, b);

            return a === b;
        }

        if (context.length === 1) {
            //NOTE: can't be unpacked, as :has uses this for side-effects
            return function(elem) {
                return equals(context[0], elem) && next(elem);
            };
        }

        return function(elem) {
            return context.indexOf(elem) >= 0 && next(elem);
        };
    },

    //jQuery extensions (others follow as pseudos)
    checkbox: getAttribFunc("type", "checkbox"),
    file: getAttribFunc("type", "file"),
    password: getAttribFunc("type", "password"),
    radio: getAttribFunc("type", "radio"),
    reset: getAttribFunc("type", "reset"),
    image: getAttribFunc("type", "image"),
    submit: getAttribFunc("type", "submit"),

    //dynamic state pseudos. These depend on optional Adapter methods.
    hover: function(next, rule, options) {
        var adapter = options.adapter;

        if (typeof adapter.isHovered === 'function') {
            return function hover(elem) {
                return next(elem) && adapter.isHovered(elem);
            };
        }

        return falseFunc;
    },
    visited: function(next, rule, options) {
        var adapter = options.adapter;

        if (typeof adapter.isVisited === 'function') {
            return function visited(elem) {
                return next(elem) && adapter.isVisited(elem);
            };
        }

        return falseFunc;
    },
    active: function(next, rule, options) {
        var adapter = options.adapter;

        if (typeof adapter.isActive === 'function') {
            return function active(elem) {
                return next(elem) && adapter.isActive(elem);
            };
        }

        return falseFunc;
    }
};

//helper methods
function getFirstElement(elems, adapter) {
    for (var i = 0; elems && i < elems.length; i++) {
        if (adapter.isTag(elems[i])) return elems[i];
    }
}

//while filters are precompiled, pseudos get called when they are needed
var pseudos = {
    empty: function(elem, adapter) {
        return !adapter.getChildren(elem).some(function(elem) {
            return adapter.isTag(elem) || elem.type === "text";
        });
    },

    "first-child": function(elem, adapter) {
        return getFirstElement(adapter.getSiblings(elem), adapter) === elem;
    },
    "last-child": function(elem, adapter) {
        var siblings = adapter.getSiblings(elem);

        for (var i = siblings.length - 1; i >= 0; i--) {
            if (siblings[i] === elem) return true;
            if (adapter.isTag(siblings[i])) break;
        }

        return false;
    },
    "first-of-type": function(elem, adapter) {
        var siblings = adapter.getSiblings(elem);

        for (var i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) return true;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) break;
            }
        }

        return false;
    },
    "last-of-type": function(elem, adapter) {
        var siblings = adapter.getSiblings(elem);

        for (var i = siblings.length - 1; i >= 0; i--) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) return true;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) break;
            }
        }

        return false;
    },
    "only-of-type": function(elem, adapter) {
        var siblings = adapter.getSiblings(elem);

        for (var i = 0, j = siblings.length; i < j; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) continue;
                if (adapter.getName(siblings[i]) === adapter.getName(elem)) {
                    return false;
                }
            }
        }

        return true;
    },
    "only-child": function(elem, adapter) {
        var siblings = adapter.getSiblings(elem);

        for (var i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i]) && siblings[i] !== elem) return false;
        }

        return true;
    },

    //:matches(a, area, link)[href]
    link: function(elem, adapter) {
        return adapter.hasAttrib(elem, "href");
    },
    //TODO: :any-link once the name is finalized (as an alias of :link)

    //forms
    //to consider: :target

    //:matches([selected], select:not([multiple]):not(> option[selected]) > option:first-of-type)
    selected: function(elem, adapter) {
        if (adapter.hasAttrib(elem, "selected")) return true;
        else if (adapter.getName(elem) !== "option") return false;

        //the first <option> in a <select> is also selected
        var parent = adapter.getParent(elem);

        if (!parent || adapter.getName(parent) !== "select" || adapter.hasAttrib(parent, "multiple")) {
            return false;
        }

        var siblings = adapter.getChildren(parent);
        var sawElem = false;

        for (var i = 0; i < siblings.length; i++) {
            if (adapter.isTag(siblings[i])) {
                if (siblings[i] === elem) {
                    sawElem = true;
                } else if (!sawElem) {
                    return false;
                } else if (adapter.hasAttrib(siblings[i], "selected")) {
                    return false;
                }
            }
        }

        return sawElem;
    },
    //https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
    //:matches(
    //  :matches(button, input, select, textarea, menuitem, optgroup, option)[disabled],
    //  optgroup[disabled] > option),
    // fieldset[disabled] * //TODO not child of first <legend>
    //)
    disabled: function(elem, adapter) {
        return adapter.hasAttrib(elem, "disabled");
    },
    enabled: function(elem, adapter) {
        return !adapter.hasAttrib(elem, "disabled");
    },
    //:matches(:matches(:radio, :checkbox)[checked], :selected) (TODO menuitem)
    checked: function(elem, adapter) {
        return adapter.hasAttrib(elem, "checked") || pseudos.selected(elem, adapter);
    },
    //:matches(input, select, textarea)[required]
    required: function(elem, adapter) {
        return adapter.hasAttrib(elem, "required");
    },
    //:matches(input, select, textarea):not([required])
    optional: function(elem, adapter) {
        return !adapter.hasAttrib(elem, "required");
    },

    //jQuery extensions

    //:not(:empty)
    parent: function(elem, adapter) {
        return !pseudos.empty(elem, adapter);
    },
    //:matches(h1, h2, h3, h4, h5, h6)
    header: namePseudo(["h1", "h2", "h3", "h4", "h5", "h6"]),

    //:matches(button, input[type=button])
    button: function(elem, adapter) {
        var name = adapter.getName(elem);
        return (
            name === "button" || (name === "input" && adapter.getAttributeValue(elem, "type") === "button")
        );
    },
    //:matches(input, textarea, select, button)
    input: namePseudo(["input", "textarea", "select", "button"]),
    //input:matches(:not([type!='']), [type='text' i])
    text: function(elem, adapter) {
        var attr;
        return (
            adapter.getName(elem) === "input" &&
            (!(attr = adapter.getAttributeValue(elem, "type")) || attr.toLowerCase() === "text")
        );
    }
};

function namePseudo(names) {
    if (typeof Set !== "undefined") {
        // eslint-disable-next-line no-undef
        var nameSet = new Set(names);

        return function(elem, adapter) {
            return nameSet.has(adapter.getName(elem));
        };
    }

    return function(elem, adapter) {
        return names.indexOf(adapter.getName(elem)) >= 0;
    };
}

function verifyArgs(func, name, subselect) {
    if (subselect === null) {
        if (func.length > 2 && name !== "scope") {
            throw new Error("pseudo-selector :" + name + " requires an argument");
        }
    } else {
        if (func.length === 2) {
            throw new Error("pseudo-selector :" + name + " doesn't have any arguments");
        }
    }
}

//FIXME this feels hacky
var re_CSS3 = /^(?:(?:nth|last|first|only)-(?:child|of-type)|root|empty|(?:en|dis)abled|checked|not)$/;

module.exports = {
    compile: function(next, data, options, context) {
        var name = data.name;
        var subselect = data.data;
        var adapter = options.adapter;

        if (options && options.strict && !re_CSS3.test(name)) {
            throw new Error(":" + name + " isn't part of CSS3");
        }

        if (typeof filters[name] === "function") {
            return filters[name](next, subselect, options, context);
        } else if (typeof pseudos[name] === "function") {
            var func = pseudos[name];

            verifyArgs(func, name, subselect);

            if (func === falseFunc) {
                return func;
            }

            if (next === trueFunc) {
                return function pseudoRoot(elem) {
                    return func(elem, adapter, subselect);
                };
            }

            return function pseudoArgs(elem) {
                return func(elem, adapter, subselect) && next(elem);
            };
        } else {
            throw new Error("unmatched pseudo-class :" + name);
        }
    },
    filters: filters,
    pseudos: pseudos
};

},{"./attributes.js":15,"boolbase":4,"nth-check":95}],20:[function(require,module,exports){
module.exports = sortByProcedure;

/*
	sort the parts of the passed selector,
	as there is potential for optimization
	(some types of selectors are faster than others)
*/

var procedure = require("./procedure.json");

var attributes = {
    __proto__: null,
    exists: 10,
    equals: 8,
    not: 7,
    start: 6,
    end: 6,
    any: 5,
    hyphen: 4,
    element: 4
};

function sortByProcedure(arr) {
    var procs = arr.map(getProcedure);
    for (var i = 1; i < arr.length; i++) {
        var procNew = procs[i];

        if (procNew < 0) continue;

        for (var j = i - 1; j >= 0 && procNew < procs[j]; j--) {
            var token = arr[j + 1];
            arr[j + 1] = arr[j];
            arr[j] = token;
            procs[j + 1] = procs[j];
            procs[j] = procNew;
        }
    }
}

function getProcedure(token) {
    var proc = procedure[token.type];

    if (proc === procedure.attribute) {
        proc = attributes[token.action];

        if (proc === attributes.equals && token.name === "id") {
            //prefer ID selectors (eg. #ID)
            proc = 9;
        }

        if (token.ignoreCase) {
            //ignoreCase adds some overhead, prefer "normal" token
            //this is a binary operation, to ensure it's still an int
            proc >>= 1;
        }
    } else if (proc === procedure.pseudo) {
        if (!token.data) {
            proc = 3;
        } else if (token.name === "has" || token.name === "contains") {
            proc = 0; //expensive in any case
        } else if (token.name === "matches" || token.name === "not") {
            proc = 0;
            for (var i = 0; i < token.data.length; i++) {
                //TODO better handling of complex selectors
                if (token.data[i].length !== 1) continue;
                var cur = getProcedure(token.data[i][0]);
                //avoid executing :has or :contains
                if (cur === 0) {
                    proc = 0;
                    break;
                }
                if (cur > proc) proc = cur;
            }
            if (token.data.length > 1 && proc > 0) proc -= 1;
        } else {
            proc = 1;
        }
    }
    return proc;
}

},{"./procedure.json":18}],21:[function(require,module,exports){
var url = require('css-url-regex');
var map = require('map-obj');
var isColor = require('./is-color');
var isLength = require('./is-length');
var normalizeColor = require('./normalize-color');

var ATTACHMENT = /^(fixed|local|scroll)$/;
var BOX = /^(border-box|padding-box|content-box)$/;
var IMAGE = new RegExp('^(none|' + url().source + ')$', 'i');
var REPEAT_SINGLE = /^(repeat-x|repeat-y)$/i;
var REPEAT_DOUBLE = /^(repeat|space|round|no-repeat)$/i;
var POSITION_HORIZONTAL = /^(left|center|right)$/;
var POSITION_VERTICAL = /^(top|center|bottom)$/;
var SIZE_SINGLE = /^(cover|contain)$/;
var KEYWORD = /^(inherit|initial)$/i;

var normalizeUrl = function(value) {
	return value.replace(url(), function(match) {
		return match
			.replace(/^url\(\s+/, 'url(')
			.replace(/\s+\)$/, ')');
	});
};

module.exports = function(value) {
	var result = {};
	var values = normalizeUrl(normalizeColor(value))
		.replace(/\(.*\/.*\)|(\/)+/g, (match, group1) => (!group1) ? match : ' / ')
		.split(/\s+/);

	var first = values[0];

	if(values.length === 1 && KEYWORD.test(first)) {
		return {
			'background-attachment': first,
			'background-clip': first,
			'background-image': first,
			'background-repeat': first,
			'background-color': first,
			'background-position': first,
			'background-size': first
		};
	}

	for(var i = 0; i < values.length; i++) {
		var v = values[i];

		if(ATTACHMENT.test(v)) {
			if(result.attachment) return;
			result.attachment = v;
		} else if(BOX.test(v)) {
			if(result.clip) return;
			result.clip = v;
		} else if(IMAGE.test(v)) {
			if(result.image) return;
			result.image = v;
		} else if(REPEAT_SINGLE.test(v)) {
			if(result.repeat) return;
			result.repeat = v;
		} else if(REPEAT_DOUBLE.test(v)) {
			if(result.repeat) return;

			var n = values[i + 1];

			if(n && REPEAT_DOUBLE.test(n)) {
				v += ' ' + n;
				i++;
			}

			result.repeat = v;
		} else if(isColor(v)) {
			if(result.color) return;
			result.color = v;
		} else if(POSITION_HORIZONTAL.test(v) || POSITION_VERTICAL.test(v) || isLength(v)) {
			if(result.position) return;

			var n = values[i + 1];
			var isHorizontal = POSITION_HORIZONTAL.test(v) || isLength(v);
			var isVertical = POSITION_VERTICAL.test(n) || isLength(n);

			if(isHorizontal && isVertical) {
				result.position = v + ' ' + n;
				i++;
			} else {
				result.position = v;
			}

			v = values[i + 1];

			if(v === '/') {
				i += 2;
				v = values[i];

				if(SIZE_SINGLE.test(v)) {
					result.size = v;
				} else if(v === 'auto' || isLength(v)) {
					n = values[i + 1];

					if(n === 'auto' || isLength(n)) {
						v += ' ' + n;
						i++;
					}

					result.size = v;
				} else {
					return;
				}
			}
		} else {
			return;
		}
	}

	return map(result, function(key, value) {
		return ['background-' + key, value];
	});
};

},{"./is-color":27,"./is-length":28,"./normalize-color":29,"css-url-regex":32,"map-obj":93}],22:[function(require,module,exports){
var map = require('map-obj');
var repeat = require('repeat-element');

var directional = function(value) {
	var values = value.split(/\s+/);

	if(values.length === 1) values = repeat(values[0], 4);
	else if(values.length === 2) values = values.concat(values);
	else if(values.length === 3) values.push(values[1]);
	else if(values.length > 4) return;

	return [
		'top-left',
		'top-right',
		'bottom-right',
		'bottom-left'
	].reduce(function(acc, direction, i) {
		acc[direction] = values[i];
		return acc;
	}, {});
};

var borderRadius = function(value) {
	var longhand = directional(value);

	return longhand && map(longhand, function(key, value) {
		return [ 'border-' + key + '-radius', value];
	});
}

module.exports = exports = borderRadius;

},{"map-obj":93,"repeat-element":106}],23:[function(require,module,exports){
var map = require('map-obj');
var extend = require('xtend');
var directional = require('./directional');
var isColor = require('./is-color');
var isLength = require('./is-length');
var normalize = require('./normalize-color');

var WIDTH = /^(thin|medium|thick)$/;
var STYLE = /^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/i;
var KEYWORD = /^(inherit|initial)$/i;

var suffix = function(suffix) {
	return function(value) {
		var longhand = directional(value);

		return longhand && map(longhand, function(key, value) {
			return ['border-' + key + '-' + suffix, value];
		});
	};
};

var direction = function(direction) {
	return function(value) {
		var longhand = all(value);

		return longhand && map(longhand, function(key, value) {
			return ['border-' + direction + '-' + key, value];
		});
	};
};

var all = function(value) {
	var values = normalize(value).split(/\s+/);
	var first = values[0];

	if(values.length > 3) return;
	if(values.length === 1 && KEYWORD.test(first)) {
		return {
			width: first,
			style: first,
			color: first
		};
	}

	var result = {};
	for(var i = 0; i < values.length; i++) {
		var v = values[i];

		if(WIDTH.test(v) || isLength(v)) {
			if(result.width) return;
			result.width = v;
		} else if(STYLE.test(v)) {
			if(result.style) return;
			result.style = v;
		} else if(isColor(v)) {
			if(result.color) return;
			result.color = v;
		} else {
			return;
		}
	}

	return result;
};

var border = function(value) {
	var longhand = all(value);

	return longhand && Object.keys(longhand)
		.reduce(function(acc, key) {
			var props = exports[key](longhand[key]);
			return extend(acc, props);
		}, {});
};

border.width = suffix('width');
border.style = suffix('style');
border.color = suffix('color');
border.top = direction('top');
border.right = direction('right');
border.bottom = direction('bottom');
border.left = direction('left');

module.exports = exports = border;

},{"./directional":24,"./is-color":27,"./is-length":28,"./normalize-color":29,"map-obj":93,"xtend":134}],24:[function(require,module,exports){
var repeat = require('repeat-element');

module.exports = function(value) {
	var values = value.split(/\s+/);

	if(values.length === 1) values = repeat(values[0], 4);
	else if(values.length === 2) values = values.concat(values);
	else if(values.length === 3) values.push(values[1]);
	else if(values.length > 4) return;

	return [
		'top',
		'right',
		'bottom',
		'left'
	].reduce(function(acc, direction, i) {
		acc[direction] = values[i];
		return acc;
	}, {});
};

},{"repeat-element":106}],25:[function(require,module,exports){
/**
 Copied from https://github.com/bramstein/css-font-parser
 */

/**
 * @enum {number}
 */
var states = {
	VARIATION: 1,
	LINE_HEIGHT: 2,
	FONT_FAMILY: 3
};

/**
 * @param {string} input
 * @return {Object}
 */
function parse(input) {
	var state = states.VARIATION,
			buffer = '',
			result = {
				'font-family': []
			};

	for (var c, i = 0; c = input.charAt(i); i += 1) {
		if (state === states.FONT_FAMILY && (c === '"' || c === "'")) {
			var index = i + 1;

			// consume the entire string
			do {
				index = input.indexOf(c, index) + 1;
				if (!index) {
					// If a string is not closed by a ' or " return null.
					// TODO: Check to see if this is correct.
					return null;
				}
			} while (input.charAt(index - 2) === '\\');

			result['font-family'].push(input.slice(i + 1, index - 1).replace(/\\('|")/g, "$1"));

			i = index - 1;
			buffer = '';
		} else if (state === states.FONT_FAMILY && c === ',') {
			if (!/^\s*$/.test(buffer)) {
				result['font-family'].push(buffer.replace(/^\s+|\s+$/, '').replace(/\s+/g, ' '));
				buffer = '';
			}
		} else if (state === states.VARIATION && (c === ' ' || c === '/')) {
			if (/^((xx|x)-large|(xx|s)-small|small|large|medium)$/.test(buffer) ||
					/^(larg|small)er$/.test(buffer) ||
					/^(\+|-)?([0-9]*\.)?[0-9]+(em|ex|ch|rem|vh|vw|vmin|vmax|px|mm|cm|in|pt|pc|%)$/.test(buffer)) {
				state = c === '/' ? states.LINE_HEIGHT : states.FONT_FAMILY;
				result['font-size'] = buffer;
			} else if (/^(italic|oblique)$/.test(buffer)) {
				result['font-style'] = buffer;
			} else if (/^small-caps$/.test(buffer)) {
				result['font-variant'] = buffer;
			} else if (/^(bold(er)?|lighter|normal|[1-9]00)$/.test(buffer)) {
				result['font-weight'] = buffer;
			} else if (/^((ultra|extra|semi)-)?(condensed|expanded)$/.test(buffer)) {
				result['font-stretch'] = buffer;
			}
			buffer = '';
		} else if (state === states.LINE_HEIGHT && c === ' ') {
			if (/^(\+|-)?([0-9]*\.)?[0-9]+(em|ex|ch|rem|vh|vw|vmin|vmax|px|mm|cm|in|pt|pc|%)?$/.test(buffer)) {
				result['line-height'] = buffer;
			}
			state = states.FONT_FAMILY;
			buffer = '';
		} else {
			buffer += c;
		}
	}

	if (state === states.FONT_FAMILY && !/^\s*$/.test(buffer)) {
		result['font-family'].push(buffer.replace(/^\s+|\s+$/, '').replace(/\s+/g, ' '));
	}

	if (result['font-size'] && result['font-family'].length) {
		return result;
	} else {
		return null;
	}
}

module.exports = function(input) {
	if(/^(inherit|initial)$/.test(input)) {
		return {
			'font-size': input,
			'line-height': input,
			'font-style': input,
			'font-weight': input,
			'font-variant': input,
			'font-stretch': input,
			'font-family': input
		}
	}

	input = input.replace(/\s*\/\s*/, '/');
	var result = parse(input);

	if(result) {
		result['font-family'] = result['font-family'].map(function(family) {
			return /^(serif|sans-serif|monospace|cursive|fantasy)$/.test(family) ? family : ('"' + family + '"');
		}).join(', ');
	}

	return result;
};

},{}],26:[function(require,module,exports){
var map = require('map-obj');

var font = require('./font');
var border = require('./border');
var borderRadius = require('./border-radius');
var background = require('./background');
var directional = require('./directional');
var outline = require('./outline');

var prefix = function(prefix) {
	return function(value) {
		var longhand = directional(value);

		return longhand && map(longhand, function(key, value) {
			return [prefix + '-' + key, value];
		});
	};
};

var shorthand = {
	font: font,
	padding: prefix('padding'),
	margin: prefix('margin'),
	border: border,
	'border-width': border.width,
	'border-style': border.style,
	'border-color': border.color,
	'border-top': border.top,
	'border-right': border.right,
	'border-bottom': border.bottom,
	'border-left': border.left,
	'border-radius': borderRadius,
	background: background,
	outline: outline
};

module.exports = function(property, value) {
	var normalized = value.trim();
	var important = /\s+!important$/.test(normalized);
	normalized = normalized.replace(/\s+!important$/, '');

	var parse = shorthand[property];
	var longhand = parse && parse(normalized);

	if(!longhand) return;
	if(!important) return longhand;

	return map(longhand, function(key, value) {
		return [key, value + ' !important'];
	});
};

},{"./background":21,"./border":23,"./border-radius":22,"./directional":24,"./font":25,"./outline":30,"map-obj":93}],27:[function(require,module,exports){
var hex = require('hex-color-regex');
var hsla = require('hsla-regex');
var hsl = require('hsl-regex');
var rgb = require('rgb-regex');
var rgba = require('rgba-regex');
var keywords = require('css-color-names');

var HEX = new RegExp('^' + hex().source + '$', 'i');
var HSLA = hsla({ exact: true });
var HSL = hsl({ exact: true });
var RGB = rgb({ exact: true });
var RGBA = rgba({ exact: true });

module.exports = function(value) {
	value = value.toLowerCase();

	return !!keywords[value] ||
		value === 'currentcolor' ||
		value === 'transparent' ||
		HEX.test(value) ||
		HSLA.test(value) ||
		HSL.test(value) ||
		RGB.test(value) ||
		RGBA.test(value);
};

},{"css-color-names":13,"hex-color-regex":70,"hsl-regex":71,"hsla-regex":72,"rgb-regex":107,"rgba-regex":108}],28:[function(require,module,exports){
var LENGTH = /^(\+|-)?([0-9]*\.)?[0-9]+(em|ex|ch|rem|vh|vw|vmin|vmax|px|mm|cm|in|pt|pc|%)$/i;
var ZERO = /^(\+|-)?(0*\.)?0+$/;

module.exports = function(value) {
	return LENGTH.test(value) || ZERO.test(value);
};

},{}],29:[function(require,module,exports){
var hsla = require('hsla-regex');
var hsl = require('hsl-regex');
var rgb = require('rgb-regex');
var rgba = require('rgba-regex');

var FUNCTIONS = [
	hsla(),
	hsl(),
	rgb(),
	rgba()
];

module.exports = function(value) {
	return FUNCTIONS.reduce(function(acc, func) {
		return acc.replace(func, function(match) {
			return match.replace(/\s+/g, '');
		});
	}, value);
};

},{"hsl-regex":71,"hsla-regex":72,"rgb-regex":107,"rgba-regex":108}],30:[function(require,module,exports){
var map = require('map-obj');
var extend = require('xtend');
var isColor = require('./is-color');
var isLength = require('./is-length');
var normalize = require('./normalize-color');

var WIDTH = /^(thin|medium|thick)$/;
var STYLE = /^(none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset)$/i;
var KEYWORD = /^(inherit|initial)$/i;

var outline = function(value) {
	var values = normalize(value).split(/\s+/);

	if(values.length > 3) return;
	if (values.length === 1 && KEYWORD.test(values[0])) {
		return {
			'outline-width': values[0],
			'outline-style': values[0],
			'outline-color': values[0]
		};
	}

	var result = {};
	for(var i = 0; i < values.length; i++) {
		var v = values[i];

		if (isLength(v) || WIDTH.test(v)) {
			if(result['outline-width']) return;
			result['outline-width'] = v;
		} else if (STYLE.test(v)) {
			if(result['outline-style']) return;
			result['outline-style'] = v;
		} else if (isColor(v)) {
			if(result['outline-color']) return;
			result['outline-color'] = v;
		} else {
			return;
		}
	};

	return result;
};

module.exports = exports = outline;

},{"./is-color":27,"./is-length":28,"./normalize-color":29,"map-obj":93,"xtend":134}],31:[function(require,module,exports){
/*!
 * https://github.com/gilmoreorless/css-shorthand-properties
 * MIT Licensed: https://gilmoreorless.mit-license.org/
 */
(function (exports) {
    /**
     * Data collated from multiple W3C specs: https://www.w3.org/Style/CSS/current-work
     * Only specs that are Candidate Recommendations or better are counted, with the
     * exception of some Working Drafts that have a lot of traction in browser implementations.
     * So far the WD specs included here are Animation and Transitions.
     *
     * @type {Object}
     */
    var props = exports.shorthandProperties = {
        // CSS 2.1: https://www.w3.org/TR/CSS2/propidx.html
        'list-style':      ['-type', '-position', '-image'],
        'margin':          ['-top', '-right', '-bottom', '-left'],
        'outline':         ['-width', '-style', '-color'],
        'padding':         ['-top', '-right', '-bottom', '-left'],

        // CSS Backgrounds and Borders Module Level 3: https://www.w3.org/TR/css3-background/
        'background':           ['-image', '-position', '-size', '-repeat', '-origin', '-clip', '-attachment', '-color'],
        'background-position':  ['-x', '-y'],  // Not found in the spec, but already implemented by every stable browser
        'border':               ['-width', '-style', '-color'],
        'border-color':         ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
        'border-style':         ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
        'border-width':         ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
        'border-top':           ['-width', '-style', '-color'],
        'border-right':         ['-width', '-style', '-color'],
        'border-bottom':        ['-width', '-style', '-color'],
        'border-left':          ['-width', '-style', '-color'],
        'border-radius':        ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
        'border-image':         ['-source', '-slice', '-width', '-outset', '-repeat'],

        // CSS Fonts Module Level 3: https://www.w3.org/TR/css3-fonts/
        'font':            ['-style', '-variant', '-weight', '-stretch', '-size', 'line-height', '-family'],
        'font-variant':    ['-ligatures', '-alternates', '-caps', '-numeric', '-east-asian'],

        // CSS Flexible Box Layout Module Level 1: https://www.w3.org/TR/css3-flexbox-1/
        'flex':            ['-grow', '-shrink', '-basis'],
        'flex-flow':       ['flex-direction', 'flex-wrap'],

        // CSS Grid Layout Module Level 1: https://www.w3.org/TR/css-grid-1/
        'grid':            ['-template-rows', '-template-columns', '-template-areas', '-auto-rows', '-auto-columns', '-auto-flow'],
        'grid-template':   ['-rows', '-columns', '-areas'],
        'grid-row':        ['-start', '-end'],
        'grid-column':     ['-start', '-end'],
        'grid-area':       ['grid-row-start', 'grid-column-start', 'grid-row-end', 'grid-column-end'],
        'grid-gap':        ['grid-row-gap', 'grid-column-gap'],

        // CSS Masking Module Level 1: https://www.w3.org/TR/css-masking/
        'mask':            ['-image', '-mode', '-position', '-size', '-repeat', '-origin', '-clip'],
        'mask-border':     ['-source', '-slice', '-width', '-outset', '-repeat', '-mode'],

        // CSS Multi-column Layout Module: https://www.w3.org/TR/css3-multicol/
        'columns':         ['column-width', 'column-count'],
        'column-rule':     ['-width', '-style', '-color'],

        // CSS Scroll Snap Module Level 1: https://www.w3.org/TR/css-scroll-snap-1/
        'scroll-padding':            ['-top', '-right', '-bottom', '-left'],
        'scroll-padding-block':      ['-start', '-end'],
        'scroll-padding-inline':     ['-start', '-end'],
        'scroll-snap-margin':        ['-top', '-right', '-bottom', '-left'],
        'scroll-snap-margin-block':  ['-start', '-end'],
        'scroll-snap-margin-inline': ['-start', '-end'],

        // CSS Speech Module: https://www.w3.org/TR/css3-speech/
        'cue':             ['-before', '-after'],
        'pause':           ['-before', '-after'],
        'rest':            ['-before', '-after'],

        // CSS Text Decoration Module Level 3: https://www.w3.org/TR/css-text-decor-3/
        'text-decoration': ['-line', '-style', '-color'],
        'text-emphasis':   ['-style', '-color'],

        // CSS Animations (WD): https://www.w3.org/TR/css3-animations
        'animation':       ['-name', '-duration', '-timing-function', '-delay', '-iteration-count', '-direction', '-fill-mode', '-play-state'],

        // CSS Transitions (WD): https://www.w3.org/TR/css3-transitions/
        'transition':      ['-property', '-duration', '-timing-function', '-delay'],
    };

    /**
     * Check if a CSS property is a shorthand value
     * @param  {string} property CSS property name
     * @return {boolean} True if the property is a shorthand value
     */
    exports.isShorthand = function (property) {
        return props.hasOwnProperty(property);
    };

    /**
     * Expand a shorthand property into an array of longhand properties
     * @param  {string} property CSS property name
     * @param  {boolean} recurse Expand sub-properties, when applicable - default false
     * @return {array}           List of longhand properties, or the original property if it's not a shorthand
     */
    exports.expand = function (property, recurse) {
        if (!props.hasOwnProperty(property)) {
            return [property];
        }
        return props[property].map(function (p) {
            var longhand = p.substr(0, 1) === '-' ? property + p : p;
            return recurse ? exports.expand(longhand, recurse) : longhand;
        });
    };
})((function (root) {
    // CommonJS
    if (typeof module !== 'undefined' && module.exports !== undefined) return module.exports;
    // Global `cssShorthandProps`
    return (root.cssShorthandProps = {});
})(this));

},{}],32:[function(require,module,exports){
'use strict';

module.exports = function() {
  return /url\(.*?\)/ig;
}

},{}],33:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./parse"), exports);
var parse_1 = require("./parse");
Object.defineProperty(exports, "parse", { enumerable: true, get: function () { return parse_1.default; } });
var stringify_1 = require("./stringify");
Object.defineProperty(exports, "stringify", { enumerable: true, get: function () { return stringify_1.default; } });

},{"./parse":34,"./stringify":35}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parse;
var reName = /^[^\\]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/;
var reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
//modified version of https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L87
var reAttr = /^\s*((?:\\.|[\w\u00b0-\uFFFF-])+)\s*(?:(\S?)=\s*(?:(['"])([^]*?)\3|(#?(?:\\.|[\w\u00b0-\uFFFF-])*)|)|)\s*(i)?\]/;
var actionTypes = {
    undefined: "exists",
    "": "equals",
    "~": "element",
    "^": "start",
    $: "end",
    "*": "any",
    "!": "not",
    "|": "hyphen",
};
var Traversals = {
    ">": "child",
    "<": "parent",
    "~": "sibling",
    "+": "adjacent",
};
var attribSelectors = {
    "#": ["id", "equals"],
    ".": ["class", "element"],
};
//pseudos, whose data-property is parsed as well
var unpackPseudos = new Set(["has", "not", "matches"]);
var stripQuotesFromPseudos = new Set(["contains", "icontains"]);
var quotes = new Set(['"', "'"]);
//unescape function taken from https://github.com/jquery/sizzle/blob/master/src/sizzle.js#L152
function funescape(_, escaped, escapedWhitespace) {
    var high = parseInt(escaped, 16) - 0x10000;
    // NaN means non-codepoint
    return high !== high || escapedWhitespace
        ? escaped
        : high < 0
            ? // BMP codepoint
                String.fromCharCode(high + 0x10000)
            : // Supplemental Plane codepoint (surrogate pair)
                String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
}
function unescapeCSS(str) {
    return str.replace(reEscape, funescape);
}
function isWhitespace(c) {
    return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
}
function parse(selector, options) {
    var subselects = [];
    selector = parseSelector(subselects, "" + selector, options);
    if (selector !== "") {
        throw new Error("Unmatched selector: " + selector);
    }
    return subselects;
}
function parseSelector(subselects, selector, options) {
    var tokens = [];
    var sawWS = false;
    function getName() {
        var match = selector.match(reName);
        if (!match) {
            throw new Error("Expected name, found " + selector);
        }
        var sub = match[0];
        selector = selector.substr(sub.length);
        return unescapeCSS(sub);
    }
    function stripWhitespace(start) {
        while (isWhitespace(selector.charAt(start)))
            start++;
        selector = selector.substr(start);
    }
    function isEscaped(pos) {
        var slashCount = 0;
        while (selector.charAt(--pos) === "\\")
            slashCount++;
        return (slashCount & 1) === 1;
    }
    stripWhitespace(0);
    while (selector !== "") {
        var firstChar = selector.charAt(0);
        if (isWhitespace(firstChar)) {
            sawWS = true;
            stripWhitespace(1);
        }
        else if (firstChar in Traversals) {
            tokens.push({ type: Traversals[firstChar] });
            sawWS = false;
            stripWhitespace(1);
        }
        else if (firstChar === ",") {
            if (tokens.length === 0) {
                throw new Error("Empty sub-selector");
            }
            subselects.push(tokens);
            tokens = [];
            sawWS = false;
            stripWhitespace(1);
        }
        else {
            if (sawWS) {
                if (tokens.length > 0) {
                    tokens.push({ type: "descendant" });
                }
                sawWS = false;
            }
            if (firstChar === "*") {
                selector = selector.substr(1);
                tokens.push({ type: "universal" });
            }
            else if (firstChar in attribSelectors) {
                var _a = attribSelectors[firstChar], name_1 = _a[0], action = _a[1];
                selector = selector.substr(1);
                tokens.push({
                    type: "attribute",
                    name: name_1,
                    action: action,
                    value: getName(),
                    ignoreCase: false,
                });
            }
            else if (firstChar === "[") {
                selector = selector.substr(1);
                var data = selector.match(reAttr);
                if (!data) {
                    throw new Error("Malformed attribute selector: " + selector);
                }
                selector = selector.substr(data[0].length);
                var name_2 = unescapeCSS(data[1]);
                if (!options ||
                    ("lowerCaseAttributeNames" in options
                        ? options.lowerCaseAttributeNames
                        : !options.xmlMode)) {
                    name_2 = name_2.toLowerCase();
                }
                tokens.push({
                    type: "attribute",
                    name: name_2,
                    action: actionTypes[data[2]],
                    value: unescapeCSS(data[4] || data[5] || ""),
                    ignoreCase: !!data[6],
                });
            }
            else if (firstChar === ":") {
                if (selector.charAt(1) === ":") {
                    selector = selector.substr(2);
                    tokens.push({
                        type: "pseudo-element",
                        name: getName().toLowerCase(),
                    });
                    continue;
                }
                selector = selector.substr(1);
                var name_3 = getName().toLowerCase();
                var data = null;
                if (selector.charAt(0) === "(") {
                    if (unpackPseudos.has(name_3)) {
                        var quot = selector.charAt(1);
                        var quoted = quotes.has(quot);
                        selector = selector.substr(quoted ? 2 : 1);
                        data = [];
                        selector = parseSelector(data, selector, options);
                        if (quoted) {
                            if (selector.charAt(0) !== quot) {
                                throw new Error("Unmatched quotes in :" + name_3);
                            }
                            else {
                                selector = selector.substr(1);
                            }
                        }
                        if (selector.charAt(0) !== ")") {
                            throw new Error("Missing closing parenthesis in :" + name_3 + " (" + selector + ")");
                        }
                        selector = selector.substr(1);
                    }
                    else {
                        var pos = 1;
                        var counter = 1;
                        for (; counter > 0 && pos < selector.length; pos++) {
                            if (selector.charAt(pos) === "(" && !isEscaped(pos))
                                counter++;
                            else if (selector.charAt(pos) === ")" &&
                                !isEscaped(pos))
                                counter--;
                        }
                        if (counter) {
                            throw new Error("Parenthesis not matched");
                        }
                        data = selector.substr(1, pos - 2);
                        selector = selector.substr(pos);
                        if (stripQuotesFromPseudos.has(name_3)) {
                            var quot = data.charAt(0);
                            if (quot === data.slice(-1) && quotes.has(quot)) {
                                data = data.slice(1, -1);
                            }
                            data = unescapeCSS(data);
                        }
                    }
                }
                tokens.push({ type: "pseudo", name: name_3, data: data });
            }
            else if (reName.test(selector)) {
                var name_4 = getName();
                if (!options ||
                    ("lowerCaseTags" in options
                        ? options.lowerCaseTags
                        : !options.xmlMode)) {
                    name_4 = name_4.toLowerCase();
                }
                tokens.push({ type: "tag", name: name_4 });
            }
            else {
                if (tokens.length &&
                    tokens[tokens.length - 1].type === "descendant") {
                    tokens.pop();
                }
                addToken(subselects, tokens);
                return selector;
            }
        }
    }
    addToken(subselects, tokens);
    return selector;
}
function addToken(subselects, tokens) {
    if (subselects.length > 0 && tokens.length === 0) {
        throw new Error("Empty sub-selector");
    }
    subselects.push(tokens);
}

},{}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var actionTypes = {
    equals: "",
    element: "~",
    start: "^",
    end: "$",
    any: "*",
    not: "!",
    hyphen: "|",
};
function stringify(token) {
    return token.map(stringifySubselector).join(", ");
}
exports.default = stringify;
function stringifySubselector(token) {
    return token.map(stringifyToken).join("");
}
function stringifyToken(token) {
    switch (token.type) {
        // Simple types
        case "child":
            return " > ";
        case "parent":
            return " < ";
        case "sibling":
            return " ~ ";
        case "adjacent":
            return " + ";
        case "descendant":
            return " ";
        case "universal":
            return "*";
        case "tag":
            return escapeName(token.name);
        case "pseudo-element":
            return "::" + escapeName(token.name);
        case "pseudo":
            if (token.data === null)
                return ":" + escapeName(token.name);
            if (typeof token.data === "string") {
                return ":" + escapeName(token.name) + "(" + token.data + ")";
            }
            return ":" + escapeName(token.name) + "(" + stringify(token.data) + ")";
        case "attribute":
            if (token.action === "exists") {
                return "[" + escapeName(token.name) + "]";
            }
            if (token.name === "id" &&
                token.action === "equals" &&
                !token.ignoreCase) {
                return "#" + escapeName(token.value);
            }
            if (token.name === "class" &&
                token.action === "element" &&
                !token.ignoreCase) {
                return "." + escapeName(token.value);
            }
            return "[" + escapeName(token.name) + actionTypes[token.action] + "='" + escapeName(token.value) + "'" + (token.ignoreCase ? "i" : "") + "]";
        default:
            throw new Error("Unknown type");
    }
}
function escapeName(str) {
    //TODO
    return str;
}

},{}],36:[function(require,module,exports){
exports.parse = require('./lib/parse');
exports.stringify = require('./lib/stringify');

},{"./lib/parse":37,"./lib/stringify":41}],37:[function(require,module,exports){
// http://www.w3.org/TR/CSS21/grammar.html
// https://github.com/visionmedia/css-parse/pull/49#issuecomment-30088027
var commentre = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g

module.exports = function(css, options){
  options = options || {};

  /**
   * Positional.
   */

  var lineno = 1;
  var column = 1;

  /**
   * Update lineno and column based on `str`.
   */

  function updatePosition(str) {
    var lines = str.match(/\n/g);
    if (lines) lineno += lines.length;
    var i = str.lastIndexOf('\n');
    column = ~i ? str.length - i : column + str.length;
  }

  /**
   * Mark position and patch `node.position`.
   */

  function position() {
    var start = { line: lineno, column: column };
    return function(node){
      node.position = new Position(start);
      whitespace();
      return node;
    };
  }

  /**
   * Store position information for a node
   */

  function Position(start) {
    this.start = start;
    this.end = { line: lineno, column: column };
    this.source = options.source;
  }

  /**
   * Non-enumerable source string
   */

  Position.prototype.content = css;

  /**
   * Error `msg`.
   */

  var errorsList = [];

  function error(msg) {
    var err = new Error(options.source + ':' + lineno + ':' + column + ': ' + msg);
    err.reason = msg;
    err.filename = options.source;
    err.line = lineno;
    err.column = column;
    err.source = css;

    if (options.silent) {
      errorsList.push(err);
    } else {
      throw err;
    }
  }

  /**
   * Parse stylesheet.
   */

  function stylesheet() {
    var rulesList = rules();

    return {
      type: 'stylesheet',
      stylesheet: {
        source: options.source,
        rules: rulesList,
        parsingErrors: errorsList
      }
    };
  }

  /**
   * Opening brace.
   */

  function open() {
    return match(/^{\s*/);
  }

  /**
   * Closing brace.
   */

  function close() {
    return match(/^}/);
  }

  /**
   * Parse ruleset.
   */

  function rules() {
    var node;
    var rules = [];
    whitespace();
    comments(rules);
    while (css.length && css.charAt(0) != '}' && (node = atrule() || rule())) {
      if (node !== false) {
        rules.push(node);
        comments(rules);
      }
    }
    return rules;
  }

  /**
   * Match `re` and return captures.
   */

  function match(re) {
    var m = re.exec(css);
    if (!m) return;
    var str = m[0];
    updatePosition(str);
    css = css.slice(str.length);
    return m;
  }

  /**
   * Parse whitespace.
   */

  function whitespace() {
    match(/^\s*/);
  }

  /**
   * Parse comments;
   */

  function comments(rules) {
    var c;
    rules = rules || [];
    while (c = comment()) {
      if (c !== false) {
        rules.push(c);
      }
    }
    return rules;
  }

  /**
   * Parse comment.
   */

  function comment() {
    var pos = position();
    if ('/' != css.charAt(0) || '*' != css.charAt(1)) return;

    var i = 2;
    while ("" != css.charAt(i) && ('*' != css.charAt(i) || '/' != css.charAt(i + 1))) ++i;
    i += 2;

    if ("" === css.charAt(i-1)) {
      return error('End of comment missing');
    }

    var str = css.slice(2, i - 2);
    column += 2;
    updatePosition(str);
    css = css.slice(i);
    column += 2;

    return pos({
      type: 'comment',
      comment: str
    });
  }

  /**
   * Parse selector.
   */

  function selector() {
    var m = match(/^([^{]+)/);
    if (!m) return;
    /* @fix Remove all comments from selectors
     * http://ostermiller.org/findcomment.html */
    return trim(m[0])
      .replace(/\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*\/+/g, '')
      .replace(/"(?:\\"|[^"])*"|'(?:\\'|[^'])*'/g, function(m) {
        return m.replace(/,/g, '\u200C');
      })
      .split(/\s*(?![^(]*\)),\s*/)
      .map(function(s) {
        return s.replace(/\u200C/g, ',');
      });
  }

  /**
   * Parse declaration.
   */

  function declaration() {
    var pos = position();

    // prop
    var prop = match(/^(\*?[-#\/\*\\\w]+(\[[0-9a-z_-]+\])?)\s*/);
    if (!prop) return;
    prop = trim(prop[0]);

    // :
    if (!match(/^:\s*/)) return error("property missing ':'");

    // val
    var val = match(/^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^\)]*?\)|[^};])+)/);

    var ret = pos({
      type: 'declaration',
      property: prop.replace(commentre, ''),
      value: val ? trim(val[0]).replace(commentre, '') : ''
    });

    // ;
    match(/^[;\s]*/);

    return ret;
  }

  /**
   * Parse declarations.
   */

  function declarations() {
    var decls = [];

    if (!open()) return error("missing '{'");
    comments(decls);

    // declarations
    var decl;
    while (decl = declaration()) {
      if (decl !== false) {
        decls.push(decl);
        comments(decls);
      }
    }

    if (!close()) return error("missing '}'");
    return decls;
  }

  /**
   * Parse keyframe.
   */

  function keyframe() {
    var m;
    var vals = [];
    var pos = position();

    while (m = match(/^((\d+\.\d+|\.\d+|\d+)%?|[a-z]+)\s*/)) {
      vals.push(m[1]);
      match(/^,\s*/);
    }

    if (!vals.length) return;

    return pos({
      type: 'keyframe',
      values: vals,
      declarations: declarations()
    });
  }

  /**
   * Parse keyframes.
   */

  function atkeyframes() {
    var pos = position();
    var m = match(/^@([-\w]+)?keyframes\s*/);

    if (!m) return;
    var vendor = m[1];

    // identifier
    var m = match(/^([-\w]+)\s*/);
    if (!m) return error("@keyframes missing name");
    var name = m[1];

    if (!open()) return error("@keyframes missing '{'");

    var frame;
    var frames = comments();
    while (frame = keyframe()) {
      frames.push(frame);
      frames = frames.concat(comments());
    }

    if (!close()) return error("@keyframes missing '}'");

    return pos({
      type: 'keyframes',
      name: name,
      vendor: vendor,
      keyframes: frames
    });
  }

  /**
   * Parse supports.
   */

  function atsupports() {
    var pos = position();
    var m = match(/^@supports *([^{]+)/);

    if (!m) return;
    var supports = trim(m[1]);

    if (!open()) return error("@supports missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@supports missing '}'");

    return pos({
      type: 'supports',
      supports: supports,
      rules: style
    });
  }

  /**
   * Parse host.
   */

  function athost() {
    var pos = position();
    var m = match(/^@host\s*/);

    if (!m) return;

    if (!open()) return error("@host missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@host missing '}'");

    return pos({
      type: 'host',
      rules: style
    });
  }

  /**
   * Parse media.
   */

  function atmedia() {
    var pos = position();
    var m = match(/^@media *([^{]+)/);

    if (!m) return;
    var media = trim(m[1]);

    if (!open()) return error("@media missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@media missing '}'");

    return pos({
      type: 'media',
      media: media,
      rules: style
    });
  }


  /**
   * Parse custom-media.
   */

  function atcustommedia() {
    var pos = position();
    var m = match(/^@custom-media\s+(--[^\s]+)\s*([^{;]+);/);
    if (!m) return;

    return pos({
      type: 'custom-media',
      name: trim(m[1]),
      media: trim(m[2])
    });
  }

  /**
   * Parse paged media.
   */

  function atpage() {
    var pos = position();
    var m = match(/^@page */);
    if (!m) return;

    var sel = selector() || [];

    if (!open()) return error("@page missing '{'");
    var decls = comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error("@page missing '}'");

    return pos({
      type: 'page',
      selectors: sel,
      declarations: decls
    });
  }

  /**
   * Parse document.
   */

  function atdocument() {
    var pos = position();
    var m = match(/^@([-\w]+)?document *([^{]+)/);
    if (!m) return;

    var vendor = trim(m[1]);
    var doc = trim(m[2]);

    if (!open()) return error("@document missing '{'");

    var style = comments().concat(rules());

    if (!close()) return error("@document missing '}'");

    return pos({
      type: 'document',
      document: doc,
      vendor: vendor,
      rules: style
    });
  }

  /**
   * Parse font-face.
   */

  function atfontface() {
    var pos = position();
    var m = match(/^@font-face\s*/);
    if (!m) return;

    if (!open()) return error("@font-face missing '{'");
    var decls = comments();

    // declarations
    var decl;
    while (decl = declaration()) {
      decls.push(decl);
      decls = decls.concat(comments());
    }

    if (!close()) return error("@font-face missing '}'");

    return pos({
      type: 'font-face',
      declarations: decls
    });
  }

  /**
   * Parse import
   */

  var atimport = _compileAtrule('import');

  /**
   * Parse charset
   */

  var atcharset = _compileAtrule('charset');

  /**
   * Parse namespace
   */

  var atnamespace = _compileAtrule('namespace');

  /**
   * Parse non-block at-rules
   */


  function _compileAtrule(name) {
    var re = new RegExp('^@' + name + '\\s*([^;]+);');
    return function() {
      var pos = position();
      var m = match(re);
      if (!m) return;
      var ret = { type: name };
      ret[name] = m[1].trim();
      return pos(ret);
    }
  }

  /**
   * Parse at rule.
   */

  function atrule() {
    if (css[0] != '@') return;

    return atkeyframes()
      || atmedia()
      || atcustommedia()
      || atsupports()
      || atimport()
      || atcharset()
      || atnamespace()
      || atdocument()
      || atpage()
      || athost()
      || atfontface();
  }

  /**
   * Parse rule.
   */

  function rule() {
    var pos = position();
    var sel = selector();

    if (!sel) return error('selector missing');
    comments();

    return pos({
      type: 'rule',
      selectors: sel,
      declarations: declarations()
    });
  }

  return addParent(stylesheet());
};

/**
 * Trim `str`.
 */

function trim(str) {
  return str ? str.replace(/^\s+|\s+$/g, '') : '';
}

/**
 * Adds non-enumerable parent node reference to each node.
 */

function addParent(obj, parent) {
  var isNode = obj && typeof obj.type === 'string';
  var childParent = isNode ? obj : parent;

  for (var k in obj) {
    var value = obj[k];
    if (Array.isArray(value)) {
      value.forEach(function(v) { addParent(v, childParent); });
    } else if (value && typeof value === 'object') {
      addParent(value, childParent);
    }
  }

  if (isNode) {
    Object.defineProperty(obj, 'parent', {
      configurable: true,
      writable: true,
      enumerable: false,
      value: parent || null
    });
  }

  return obj;
}

},{}],38:[function(require,module,exports){

/**
 * Expose `Compiler`.
 */

module.exports = Compiler;

/**
 * Initialize a compiler.
 *
 * @param {Type} name
 * @return {Type}
 * @api public
 */

function Compiler(opts) {
  this.options = opts || {};
}

/**
 * Emit `str`
 */

Compiler.prototype.emit = function(str) {
  return str;
};

/**
 * Visit `node`.
 */

Compiler.prototype.visit = function(node){
  return this[node.type](node);
};

/**
 * Map visit over array of `nodes`, optionally using a `delim`
 */

Compiler.prototype.mapVisit = function(nodes, delim){
  var buf = '';
  delim = delim || '';

  for (var i = 0, length = nodes.length; i < length; i++) {
    buf += this.visit(nodes[i]);
    if (delim && i < length - 1) buf += this.emit(delim);
  }

  return buf;
};

},{}],39:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Base = require('./compiler');
var inherits = require('inherits');

/**
 * Expose compiler.
 */

module.exports = Compiler;

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  Base.call(this, options);
}

/**
 * Inherit from `Base.prototype`.
 */

inherits(Compiler, Base);

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return node.stylesheet
    .rules.map(this.visit, this)
    .join('');
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function(node){
  return this.emit('', node.position);
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function(node){
  return this.emit('@import ' + node.import + ';', node.position);
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function(node){
  return this.emit('@media ' + node.media, node.position)
    + this.emit('{')
    + this.mapVisit(node.rules)
    + this.emit('}');
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node){
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  return this.emit(doc, node.position)
    + this.emit('{')
    + this.mapVisit(node.rules)
    + this.emit('}');
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node){
  return this.emit('@charset ' + node.charset + ';', node.position);
};

/**
 * Visit namespace node.
 */

Compiler.prototype.namespace = function(node){
  return this.emit('@namespace ' + node.namespace + ';', node.position);
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node){
  return this.emit('@supports ' + node.supports, node.position)
    + this.emit('{')
    + this.mapVisit(node.rules)
    + this.emit('}');
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  return this.emit('@'
    + (node.vendor || '')
    + 'keyframes '
    + node.name, node.position)
    + this.emit('{')
    + this.mapVisit(node.keyframes)
    + this.emit('}');
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  var decls = node.declarations;

  return this.emit(node.values.join(','), node.position)
    + this.emit('{')
    + this.mapVisit(decls)
    + this.emit('}');
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  var sel = node.selectors.length
    ? node.selectors.join(', ')
    : '';

  return this.emit('@page ' + sel, node.position)
    + this.emit('{')
    + this.mapVisit(node.declarations)
    + this.emit('}');
};

/**
 * Visit font-face node.
 */

Compiler.prototype['font-face'] = function(node){
  return this.emit('@font-face', node.position)
    + this.emit('{')
    + this.mapVisit(node.declarations)
    + this.emit('}');
};

/**
 * Visit host node.
 */

Compiler.prototype.host = function(node){
  return this.emit('@host', node.position)
    + this.emit('{')
    + this.mapVisit(node.rules)
    + this.emit('}');
};

/**
 * Visit custom-media node.
 */

Compiler.prototype['custom-media'] = function(node){
  return this.emit('@custom-media ' + node.name + ' ' + node.media + ';', node.position);
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var decls = node.declarations;
  if (!decls.length) return '';

  return this.emit(node.selectors.join(','), node.position)
    + this.emit('{')
    + this.mapVisit(decls)
    + this.emit('}');
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  return this.emit(node.property + ':' + node.value, node.position) + this.emit(';');
};


},{"./compiler":38,"inherits":90}],40:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Base = require('./compiler');
var inherits = require('inherits');

/**
 * Expose compiler.
 */

module.exports = Compiler;

/**
 * Initialize a new `Compiler`.
 */

function Compiler(options) {
  options = options || {};
  Base.call(this, options);
  this.indentation = options.indent;
}

/**
 * Inherit from `Base.prototype`.
 */

inherits(Compiler, Base);

/**
 * Compile `node`.
 */

Compiler.prototype.compile = function(node){
  return this.stylesheet(node);
};

/**
 * Visit stylesheet node.
 */

Compiler.prototype.stylesheet = function(node){
  return this.mapVisit(node.stylesheet.rules, '\n\n');
};

/**
 * Visit comment node.
 */

Compiler.prototype.comment = function(node){
  return this.emit(this.indent() + '/*' + node.comment + '*/', node.position);
};

/**
 * Visit import node.
 */

Compiler.prototype.import = function(node){
  return this.emit('@import ' + node.import + ';', node.position);
};

/**
 * Visit media node.
 */

Compiler.prototype.media = function(node){
  return this.emit('@media ' + node.media, node.position)
    + this.emit(
        ' {\n'
        + this.indent(1))
    + this.mapVisit(node.rules, '\n\n')
    + this.emit(
        this.indent(-1)
        + '\n}');
};

/**
 * Visit document node.
 */

Compiler.prototype.document = function(node){
  var doc = '@' + (node.vendor || '') + 'document ' + node.document;

  return this.emit(doc, node.position)
    + this.emit(
        ' '
      + ' {\n'
      + this.indent(1))
    + this.mapVisit(node.rules, '\n\n')
    + this.emit(
        this.indent(-1)
        + '\n}');
};

/**
 * Visit charset node.
 */

Compiler.prototype.charset = function(node){
  return this.emit('@charset ' + node.charset + ';', node.position);
};

/**
 * Visit namespace node.
 */

Compiler.prototype.namespace = function(node){
  return this.emit('@namespace ' + node.namespace + ';', node.position);
};

/**
 * Visit supports node.
 */

Compiler.prototype.supports = function(node){
  return this.emit('@supports ' + node.supports, node.position)
    + this.emit(
      ' {\n'
      + this.indent(1))
    + this.mapVisit(node.rules, '\n\n')
    + this.emit(
        this.indent(-1)
        + '\n}');
};

/**
 * Visit keyframes node.
 */

Compiler.prototype.keyframes = function(node){
  return this.emit('@' + (node.vendor || '') + 'keyframes ' + node.name, node.position)
    + this.emit(
      ' {\n'
      + this.indent(1))
    + this.mapVisit(node.keyframes, '\n')
    + this.emit(
        this.indent(-1)
        + '}');
};

/**
 * Visit keyframe node.
 */

Compiler.prototype.keyframe = function(node){
  var decls = node.declarations;

  return this.emit(this.indent())
    + this.emit(node.values.join(', '), node.position)
    + this.emit(
      ' {\n'
      + this.indent(1))
    + this.mapVisit(decls, '\n')
    + this.emit(
      this.indent(-1)
      + '\n'
      + this.indent() + '}\n');
};

/**
 * Visit page node.
 */

Compiler.prototype.page = function(node){
  var sel = node.selectors.length
    ? node.selectors.join(', ') + ' '
    : '';

  return this.emit('@page ' + sel, node.position)
    + this.emit('{\n')
    + this.emit(this.indent(1))
    + this.mapVisit(node.declarations, '\n')
    + this.emit(this.indent(-1))
    + this.emit('\n}');
};

/**
 * Visit font-face node.
 */

Compiler.prototype['font-face'] = function(node){
  return this.emit('@font-face ', node.position)
    + this.emit('{\n')
    + this.emit(this.indent(1))
    + this.mapVisit(node.declarations, '\n')
    + this.emit(this.indent(-1))
    + this.emit('\n}');
};

/**
 * Visit host node.
 */

Compiler.prototype.host = function(node){
  return this.emit('@host', node.position)
    + this.emit(
        ' {\n'
        + this.indent(1))
    + this.mapVisit(node.rules, '\n\n')
    + this.emit(
        this.indent(-1)
        + '\n}');
};

/**
 * Visit custom-media node.
 */

Compiler.prototype['custom-media'] = function(node){
  return this.emit('@custom-media ' + node.name + ' ' + node.media + ';', node.position);
};

/**
 * Visit rule node.
 */

Compiler.prototype.rule = function(node){
  var indent = this.indent();
  var decls = node.declarations;
  if (!decls.length) return '';

  return this.emit(node.selectors.map(function(s){ return indent + s }).join(',\n'), node.position)
    + this.emit(' {\n')
    + this.emit(this.indent(1))
    + this.mapVisit(decls, '\n')
    + this.emit(this.indent(-1))
    + this.emit('\n' + this.indent() + '}');
};

/**
 * Visit declaration node.
 */

Compiler.prototype.declaration = function(node){
  return this.emit(this.indent())
    + this.emit(node.property + ': ' + node.value, node.position)
    + this.emit(';');
};

/**
 * Increase, decrease or return current indentation.
 */

Compiler.prototype.indent = function(level) {
  this.level = this.level || 1;

  if (null != level) {
    this.level += level;
    return '';
  }

  return Array(this.level).join(this.indentation || '  ');
};

},{"./compiler":38,"inherits":90}],41:[function(require,module,exports){

/**
 * Module dependencies.
 */

var Compressed = require('./compress');
var Identity = require('./identity');

/**
 * Stringfy the given AST `node`.
 *
 * Options:
 *
 *  - `compress` space-optimized output
 *  - `sourcemap` return an object with `.code` and `.map`
 *
 * @param {Object} node
 * @param {Object} [options]
 * @return {String}
 * @api public
 */

module.exports = function(node, options){
  options = options || {};

  var compiler = options.compress
    ? new Compressed(options)
    : new Identity(options);

  // source maps
  if (options.sourcemap) {
    var sourcemaps = require('./source-map-support');
    sourcemaps(compiler);

    var code = compiler.compile(node);
    compiler.applySourceMaps();

    var map = options.sourcemap === 'generator'
      ? compiler.map
      : compiler.map.toJSON();

    return { code: code, map: map };
  }

  var code = compiler.compile(node);
  return code;
};

},{"./compress":39,"./identity":40,"./source-map-support":42}],42:[function(require,module,exports){

/**
 * Module dependencies.
 */

var SourceMap = require('source-map').SourceMapGenerator;
var SourceMapConsumer = require('source-map').SourceMapConsumer;
var sourceMapResolve = require('source-map-resolve');
var fs = require('fs');
var path = require('path');

/**
 * Expose `mixin()`.
 */

module.exports = mixin;

/**
 * Ensure Windows-style paths are formatted properly
 */

const makeFriendlyPath = function(aPath) {
  return path.sep === "\\" ? aPath.replace(/\\/g, "/").replace(/^[a-z]:\/?/i, "/") : aPath;
}

/**
 * Mixin source map support into `compiler`.
 *
 * @param {Compiler} compiler
 * @api public
 */

function mixin(compiler) {
  compiler._comment = compiler.comment;
  compiler.map = new SourceMap();
  compiler.position = { line: 1, column: 1 };
  compiler.files = {};
  for (var k in exports) compiler[k] = exports[k];
}

/**
 * Update position.
 *
 * @param {String} str
 * @api private
 */

exports.updatePosition = function(str) {
  var lines = str.match(/\n/g);
  if (lines) this.position.line += lines.length;
  var i = str.lastIndexOf('\n');
  this.position.column = ~i ? str.length - i : this.position.column + str.length;
};

/**
 * Emit `str`.
 *
 * @param {String} str
 * @param {Object} [pos]
 * @return {String}
 * @api private
 */

exports.emit = function(str, pos) {
  if (pos) {
    var sourceFile = makeFriendlyPath(pos.source || 'source.css');

    this.map.addMapping({
      source: sourceFile,
      generated: {
        line: this.position.line,
        column: Math.max(this.position.column - 1, 0)
      },
      original: {
        line: pos.start.line,
        column: pos.start.column - 1
      }
    });

    this.addFile(sourceFile, pos);
  }

  this.updatePosition(str);

  return str;
};

/**
 * Adds a file to the source map output if it has not already been added
 * @param {String} file
 * @param {Object} pos
 */

exports.addFile = function(file, pos) {
  if (typeof pos.content !== 'string') return;
  if (Object.prototype.hasOwnProperty.call(this.files, file)) return;

  this.files[file] = pos.content;
};

/**
 * Applies any original source maps to the output and embeds the source file
 * contents in the source map.
 */

exports.applySourceMaps = function() {
  Object.keys(this.files).forEach(function(file) {
    var content = this.files[file];
    this.map.setSourceContent(file, content);

    if (this.options.inputSourcemaps !== false) {
      var originalMap = sourceMapResolve.resolveSync(
        content, file, fs.readFileSync);
      if (originalMap) {
        var map = new SourceMapConsumer(originalMap.map);
        var relativeTo = originalMap.sourcesRelativeTo;
        this.map.applySourceMap(map, file, makeFriendlyPath(path.dirname(relativeTo)));
      }
    }
  }, this);
};

/**
 * Process comments, drops sourceMap comments.
 * @param {Object} node
 */

exports.comment = function(node) {
  if (/^# sourceMappingURL=/.test(node.comment))
    return this.emit('', node.position);
  else
    return this._comment(node);
};

},{"fs":6,"path":101,"source-map":120,"source-map-resolve":109}],43:[function(require,module,exports){
'use strict';
var token = '%[a-f0-9]{2}';
var singleMatcher = new RegExp(token, 'gi');
var multiMatcher = new RegExp('(' + token + ')+', 'gi');

function decodeComponents(components, split) {
	try {
		// Try to decode the entire string first
		return decodeURIComponent(components.join(''));
	} catch (err) {
		// Do nothing
	}

	if (components.length === 1) {
		return components;
	}

	split = split || 1;

	// Split the array in 2 parts
	var left = components.slice(0, split);
	var right = components.slice(split);

	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
}

function decode(input) {
	try {
		return decodeURIComponent(input);
	} catch (err) {
		var tokens = input.match(singleMatcher);

		for (var i = 1; i < tokens.length; i++) {
			input = decodeComponents(tokens, i).join('');

			tokens = input.match(singleMatcher);
		}

		return input;
	}
}

function customDecodeURIComponent(input) {
	// Keep track of all the replacements and prefill the map with the `BOM`
	var replaceMap = {
		'%FE%FF': '\uFFFD\uFFFD',
		'%FF%FE': '\uFFFD\uFFFD'
	};

	var match = multiMatcher.exec(input);
	while (match) {
		try {
			// Decode as big chunks as possible
			replaceMap[match[0]] = decodeURIComponent(match[0]);
		} catch (err) {
			var result = decode(match[0]);

			if (result !== match[0]) {
				replaceMap[match[0]] = result;
			}
		}

		match = multiMatcher.exec(input);
	}

	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
	replaceMap['%C2'] = '\uFFFD';

	var entries = Object.keys(replaceMap);

	for (var i = 0; i < entries.length; i++) {
		// Replace all decoded components
		var key = entries[i];
		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
	}

	return input;
}

module.exports = function (encodedURI) {
	if (typeof encodedURI !== 'string') {
		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
	}

	try {
		encodedURI = encodedURI.replace(/\+/g, ' ');

		// Try the built in decoder first
		return decodeURIComponent(encodedURI);
	} catch (err) {
		// Fallback to a more advanced decoder
		return customDecodeURIComponent(encodedURI);
	}
};

},{}],44:[function(require,module,exports){
module.exports={
  "elementNames" : {
"altglyph" : "altGlyph",
"altglyphdef" : "altGlyphDef",
"altglyphitem" : "altGlyphItem",
"animatecolor" : "animateColor",
"animatemotion" : "animateMotion",
"animatetransform" : "animateTransform",
"clippath" : "clipPath",
"feblend" : "feBlend",
"fecolormatrix" : "feColorMatrix",
"fecomponenttransfer" : "feComponentTransfer",
"fecomposite" : "feComposite",
"feconvolvematrix" : "feConvolveMatrix",
"fediffuselighting" : "feDiffuseLighting",
"fedisplacementmap" : "feDisplacementMap",
"fedistantlight" : "feDistantLight",
"fedropshadow" : "feDropShadow",
"feflood" : "feFlood",
"fefunca" : "feFuncA",
"fefuncb" : "feFuncB",
"fefuncg" : "feFuncG",
"fefuncr" : "feFuncR",
"fegaussianblur" : "feGaussianBlur",
"feimage" : "feImage",
"femerge" : "feMerge",
"femergenode" : "feMergeNode",
"femorphology" : "feMorphology",
"feoffset" : "feOffset",
"fepointlight" : "fePointLight",
"fespecularlighting" : "feSpecularLighting",
"fespotlight" : "feSpotLight",
"fetile" : "feTile",
"feturbulence" : "feTurbulence",
"foreignobject" : "foreignObject",
"glyphref" : "glyphRef",
"lineargradient" : "linearGradient",
"radialgradient" : "radialGradient",
"textpath" : "textPath"
  },
  "attributeNames" : {
"definitionurl" : "definitionURL",
"attributename" : "attributeName",
"attributetype" : "attributeType",
"basefrequency" : "baseFrequency",
"baseprofile" : "baseProfile",
"calcmode" : "calcMode",
"clippathunits" : "clipPathUnits",
"diffuseconstant" : "diffuseConstant",
"edgemode" : "edgeMode",
"filterunits" : "filterUnits",
"glyphref" : "glyphRef",
"gradienttransform" : "gradientTransform",
"gradientunits" : "gradientUnits",
"kernelmatrix" : "kernelMatrix",
"kernelunitlength" : "kernelUnitLength",
"keypoints" : "keyPoints",
"keysplines" : "keySplines",
"keytimes" : "keyTimes",
"lengthadjust" : "lengthAdjust",
"limitingconeangle" : "limitingConeAngle",
"markerheight" : "markerHeight",
"markerunits" : "markerUnits",
"markerwidth" : "markerWidth",
"maskcontentunits" : "maskContentUnits",
"maskunits" : "maskUnits",
"numoctaves" : "numOctaves",
"pathlength" : "pathLength",
"patterncontentunits" : "patternContentUnits",
"patterntransform" : "patternTransform",
"patternunits" : "patternUnits",
"pointsatx" : "pointsAtX",
"pointsaty" : "pointsAtY",
"pointsatz" : "pointsAtZ",
"preservealpha" : "preserveAlpha",
"preserveaspectratio" : "preserveAspectRatio",
"primitiveunits" : "primitiveUnits",
"refx" : "refX",
"refy" : "refY",
"repeatcount" : "repeatCount",
"repeatdur" : "repeatDur",
"requiredextensions" : "requiredExtensions",
"requiredfeatures" : "requiredFeatures",
"specularconstant" : "specularConstant",
"specularexponent" : "specularExponent",
"spreadmethod" : "spreadMethod",
"startoffset" : "startOffset",
"stddeviation" : "stdDeviation",
"stitchtiles" : "stitchTiles",
"surfacescale" : "surfaceScale",
"systemlanguage" : "systemLanguage",
"tablevalues" : "tableValues",
"targetx" : "targetX",
"targety" : "targetY",
"textlength" : "textLength",
"viewbox" : "viewBox",
"viewtarget" : "viewTarget",
"xchannelselector" : "xChannelSelector",
"ychannelselector" : "yChannelSelector",
"zoomandpan" : "zoomAndPan"
  }
}

},{}],45:[function(require,module,exports){
/*
  Module dependencies
*/
var ElementType = require('domelementtype');
var entities = require('entities');

/* mixed-case SVG and MathML tags & attributes
   recognized by the HTML parser, see
   https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
*/
var foreignNames = require('./foreignNames.json');
foreignNames.elementNames.__proto__ = null; /* use as a simple dictionary */
foreignNames.attributeNames.__proto__ = null;

var unencodedElements = {
  __proto__: null,
  style: true,
  script: true,
  xmp: true,
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  noscript: true
};

/*
  Format attributes
*/
function formatAttrs(attributes, opts) {
  if (!attributes) return;

  var output = '';
  var value;

  // Loop through the attributes
  for (var key in attributes) {
    value = attributes[key];
    if (output) {
      output += ' ';
    }

    if (opts.xmlMode === 'foreign') {
      /* fix up mixed-case attribute names */
      key = foreignNames.attributeNames[key] || key;
    }
    output += key;
    if ((value !== null && value !== '') || opts.xmlMode) {
      output +=
        '="' +
        (opts.decodeEntities
          ? entities.encodeXML(value)
          : value.replace(/\"/g, '&quot;')) +
        '"';
    }
  }

  return output;
}

/*
  Self-enclosing tags (stolen from node-htmlparser)
*/
var singleTag = {
  __proto__: null,
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
};

var render = (module.exports = function(dom, opts) {
  if (!Array.isArray(dom) && !dom.cheerio) dom = [dom];
  opts = opts || {};

  var output = '';

  for (var i = 0; i < dom.length; i++) {
    var elem = dom[i];

    if (elem.type === 'root') output += render(elem.children, opts);
    else if (ElementType.isTag(elem)) output += renderTag(elem, opts);
    else if (elem.type === ElementType.Directive)
      output += renderDirective(elem);
    else if (elem.type === ElementType.Comment) output += renderComment(elem);
    else if (elem.type === ElementType.CDATA) output += renderCdata(elem);
    else output += renderText(elem, opts);
  }

  return output;
});

var foreignModeIntegrationPoints = [
  'mi',
  'mo',
  'mn',
  'ms',
  'mtext',
  'annotation-xml',
  'foreignObject',
  'desc',
  'title'
];

function renderTag(elem, opts) {
  // Handle SVG / MathML in HTML
  if (opts.xmlMode === 'foreign') {
    /* fix up mixed-case element names */
    elem.name = foreignNames.elementNames[elem.name] || elem.name;
    /* exit foreign mode at integration points */
    if (
      elem.parent &&
      foreignModeIntegrationPoints.indexOf(elem.parent.name) >= 0
    )
      opts = Object.assign({}, opts, { xmlMode: false });
  }
  if (!opts.xmlMode && ['svg', 'math'].indexOf(elem.name) >= 0) {
    opts = Object.assign({}, opts, { xmlMode: 'foreign' });
  }

  var tag = '<' + elem.name;
  var attribs = formatAttrs(elem.attribs, opts);

  if (attribs) {
    tag += ' ' + attribs;
  }

  if (opts.xmlMode && (!elem.children || elem.children.length === 0)) {
    tag += '/>';
  } else {
    tag += '>';
    if (elem.children) {
      tag += render(elem.children, opts);
    }

    if (!singleTag[elem.name] || opts.xmlMode) {
      tag += '</' + elem.name + '>';
    }
  }

  return tag;
}

function renderDirective(elem) {
  return '<' + elem.data + '>';
}

function renderText(elem, opts) {
  var data = elem.data || '';

  // if entities weren't decoded, no need to encode them back
  if (
    opts.decodeEntities &&
    !(elem.parent && elem.parent.name in unencodedElements)
  ) {
    data = entities.encodeXML(data);
  }

  return data;
}

function renderCdata(elem) {
  return '<![CDATA[' + elem.children[0].data + ']]>';
}

function renderComment(elem) {
  return '<!--' + elem.data + '-->';
}

},{"./foreignNames.json":44,"domelementtype":46,"entities":61}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Tests whether an element is a tag or not.
 *
 * @param elem Element to test
 */
function isTag(elem) {
    return (elem.type === "tag" /* Tag */ ||
        elem.type === "script" /* Script */ ||
        elem.type === "style" /* Style */);
}
exports.isTag = isTag;
// Exports for backwards compatibility
exports.Text = "text" /* Text */; //Text
exports.Directive = "directive" /* Directive */; //<? ... ?>
exports.Comment = "comment" /* Comment */; //<!-- ... -->
exports.Script = "script" /* Script */; //<script> tags
exports.Style = "style" /* Style */; //<style> tags
exports.Tag = "tag" /* Tag */; //Any tag
exports.CDATA = "cdata" /* CDATA */; //<![CDATA[ ... ]]>
exports.Doctype = "doctype" /* Doctype */;

},{}],47:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_1 = require("./node");
exports.Node = node_1.Node;
exports.Element = node_1.Element;
exports.DataNode = node_1.DataNode;
exports.NodeWithChildren = node_1.NodeWithChildren;
var reWhitespace = /\s+/g;
// Default options
var defaultOpts = {
    normalizeWhitespace: false,
    withStartIndices: false,
    withEndIndices: false
};
var DomHandler = /** @class */ (function () {
    /**
     * Initiate a new DomHandler.
     *
     * @param callback Called once parsing has completed.
     * @param options Settings for the handler.
     * @param elementCB Callback whenever a tag is closed.
     */
    function DomHandler(callback, options, elementCB) {
        /** The constructed DOM */
        this.dom = [];
        /** Indicated whether parsing has been completed. */
        this._done = false;
        /** Stack of open tags. */
        this._tagStack = [];
        /** A data node that is still being written to. */
        this._lastNode = null;
        /** Reference to the parser instance. Used for location information. */
        this._parser = null;
        // Make it possible to skip arguments, for backwards-compatibility
        if (typeof options === "function") {
            elementCB = options;
            options = defaultOpts;
        }
        if (typeof callback === "object") {
            options = callback;
            callback = undefined;
        }
        this._callback = callback || null;
        this._options = options || defaultOpts;
        this._elementCB = elementCB || null;
    }
    DomHandler.prototype.onparserinit = function (parser) {
        this._parser = parser;
    };
    // Resets the handler back to starting state
    DomHandler.prototype.onreset = function () {
        this.dom = [];
        this._done = false;
        this._tagStack = [];
        this._lastNode = null;
        this._parser = this._parser || null;
    };
    // Signals the handler that parsing is done
    DomHandler.prototype.onend = function () {
        if (this._done)
            return;
        this._done = true;
        this._parser = null;
        this.handleCallback(null);
    };
    DomHandler.prototype.onerror = function (error) {
        this.handleCallback(error);
    };
    DomHandler.prototype.onclosetag = function () {
        this._lastNode = null;
        // If(this._tagStack.pop().name !== name) this.handleCallback(Error("Tagname didn't match!"));
        var elem = this._tagStack.pop();
        if (!elem || !this._parser) {
            return;
        }
        if (this._options.withEndIndices) {
            elem.endIndex = this._parser.endIndex;
        }
        if (this._elementCB)
            this._elementCB(elem);
    };
    DomHandler.prototype.onopentag = function (name, attribs) {
        var element = new node_1.Element(name, attribs);
        this.addNode(element);
        this._tagStack.push(element);
    };
    DomHandler.prototype.ontext = function (data) {
        var normalize = this._options.normalizeWhitespace;
        var _lastNode = this._lastNode;
        if (_lastNode && _lastNode.type === "text" /* Text */) {
            if (normalize) {
                _lastNode.data = (_lastNode.data + data).replace(reWhitespace, " ");
            }
            else {
                _lastNode.data += data;
            }
        }
        else {
            if (normalize) {
                data = data.replace(reWhitespace, " ");
            }
            var node = new node_1.DataNode("text" /* Text */, data);
            this.addNode(node);
            this._lastNode = node;
        }
    };
    DomHandler.prototype.oncomment = function (data) {
        if (this._lastNode && this._lastNode.type === "comment" /* Comment */) {
            this._lastNode.data += data;
            return;
        }
        var node = new node_1.DataNode("comment" /* Comment */, data);
        this.addNode(node);
        this._lastNode = node;
    };
    DomHandler.prototype.oncommentend = function () {
        this._lastNode = null;
    };
    DomHandler.prototype.oncdatastart = function () {
        var text = new node_1.DataNode("text" /* Text */, "");
        var node = new node_1.NodeWithChildren("cdata" /* CDATA */, [text]);
        this.addNode(node);
        text.parent = node;
        this._lastNode = text;
    };
    DomHandler.prototype.oncdataend = function () {
        this._lastNode = null;
    };
    DomHandler.prototype.onprocessinginstruction = function (name, data) {
        var node = new node_1.ProcessingInstruction(name, data);
        this.addNode(node);
    };
    DomHandler.prototype.handleCallback = function (error) {
        if (typeof this._callback === "function") {
            this._callback(error, this.dom);
        }
        else if (error) {
            throw error;
        }
    };
    DomHandler.prototype.addNode = function (node) {
        var parent = this._tagStack[this._tagStack.length - 1];
        var siblings = parent ? parent.children : this.dom;
        var previousSibling = siblings[siblings.length - 1];
        if (this._parser) {
            if (this._options.withStartIndices) {
                node.startIndex = this._parser.startIndex;
            }
            if (this._options.withEndIndices) {
                node.endIndex = this._parser.endIndex;
            }
        }
        siblings.push(node);
        if (previousSibling) {
            node.prev = previousSibling;
            previousSibling.next = node;
        }
        if (parent) {
            node.parent = parent;
        }
        this._lastNode = null;
    };
    DomHandler.prototype.addDataNode = function (node) {
        this.addNode(node);
        this._lastNode = node;
    };
    return DomHandler;
}());
exports.DomHandler = DomHandler;
exports.default = DomHandler;

},{"./node":48}],48:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var nodeTypes = new Map([
    ["tag" /* Tag */, 1],
    ["script" /* Script */, 1],
    ["style" /* Style */, 1],
    ["directive" /* Directive */, 1],
    ["text" /* Text */, 3],
    ["cdata" /* CDATA */, 4],
    ["comment" /* Comment */, 8]
]);
// This object will be used as the prototype for Nodes when creating a
// DOM-Level-1-compliant structure.
var Node = /** @class */ (function () {
    /**
     *
     * @param type The type of the node.
     */
    function Node(type) {
        this.type = type;
        /** Parent of the node */
        this.parent = null;
        /** Previous sibling */
        this.prev = null;
        /** Next sibling */
        this.next = null;
        /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */
        this.startIndex = null;
        /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */
        this.endIndex = null;
    }
    Object.defineProperty(Node.prototype, "nodeType", {
        // Read-only aliases
        get: function () {
            return nodeTypes.get(this.type) || 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "parentNode", {
        // Read-write aliases for properties
        get: function () {
            return this.parent || null;
        },
        set: function (parent) {
            this.parent = parent;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "previousSibling", {
        get: function () {
            return this.prev || null;
        },
        set: function (prev) {
            this.prev = prev;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Node.prototype, "nextSibling", {
        get: function () {
            return this.next || null;
        },
        set: function (next) {
            this.next = next;
        },
        enumerable: true,
        configurable: true
    });
    return Node;
}());
exports.Node = Node;
var DataNode = /** @class */ (function (_super) {
    __extends(DataNode, _super);
    /**
     *
     * @param type The type of the node
     * @param data The content of the data node
     */
    function DataNode(type, data) {
        var _this = _super.call(this, type) || this;
        _this.data = data;
        return _this;
    }
    Object.defineProperty(DataNode.prototype, "nodeValue", {
        get: function () {
            return this.data;
        },
        set: function (data) {
            this.data = data;
        },
        enumerable: true,
        configurable: true
    });
    return DataNode;
}(Node));
exports.DataNode = DataNode;
var ProcessingInstruction = /** @class */ (function (_super) {
    __extends(ProcessingInstruction, _super);
    function ProcessingInstruction(name, data) {
        var _this = _super.call(this, "directive" /* Directive */, data) || this;
        _this.name = name;
        return _this;
    }
    return ProcessingInstruction;
}(DataNode));
exports.ProcessingInstruction = ProcessingInstruction;
var NodeWithChildren = /** @class */ (function (_super) {
    __extends(NodeWithChildren, _super);
    /**
     *
     * @param type Type of the node.
     * @param children Children of the node. Only certain node types can have children.
     */
    function NodeWithChildren(type, children) {
        var _this = _super.call(this, type) || this;
        _this.children = children;
        return _this;
    }
    Object.defineProperty(NodeWithChildren.prototype, "firstChild", {
        // Aliases
        get: function () {
            return this.children[0] || null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NodeWithChildren.prototype, "lastChild", {
        get: function () {
            return this.children[this.children.length - 1] || null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NodeWithChildren.prototype, "childNodes", {
        get: function () {
            return this.children;
        },
        set: function (children) {
            this.children = children;
        },
        enumerable: true,
        configurable: true
    });
    return NodeWithChildren;
}(Node));
exports.NodeWithChildren = NodeWithChildren;
var Element = /** @class */ (function (_super) {
    __extends(Element, _super);
    /**
     *
     * @param name Name of the tag, eg. `div`, `span`
     * @param attribs Object mapping attribute names to attribute values
     */
    function Element(name, attribs) {
        var _this = _super.call(this, name === "script"
            ? "script" /* Script */
            : name === "style"
                ? "style" /* Style */
                : "tag" /* Tag */, []) || this;
        _this.name = name;
        _this.attribs = attribs;
        _this.attribs = attribs;
        return _this;
    }
    Object.defineProperty(Element.prototype, "tagName", {
        // DOM Level 1 aliases
        get: function () {
            return this.name;
        },
        set: function (name) {
            this.name = name;
        },
        enumerable: true,
        configurable: true
    });
    return Element;
}(NodeWithChildren));
exports.Element = Element;

},{}],49:[function(require,module,exports){
var DomUtils = module.exports;

[
	require("./lib/stringify"),
	require("./lib/traversal"),
	require("./lib/manipulation"),
	require("./lib/querying"),
	require("./lib/legacy"),
	require("./lib/helpers")
].forEach(function(ext){
	Object.keys(ext).forEach(function(key){
		DomUtils[key] = ext[key].bind(DomUtils);
	});
});

},{"./lib/helpers":50,"./lib/legacy":51,"./lib/manipulation":52,"./lib/querying":53,"./lib/stringify":54,"./lib/traversal":55}],50:[function(require,module,exports){
// removeSubsets
// Given an array of nodes, remove any member that is contained by another.
exports.removeSubsets = function(nodes) {
	var idx = nodes.length, node, ancestor, replace;

	// Check if each node (or one of its ancestors) is already contained in the
	// array.
	while (--idx > -1) {
		node = ancestor = nodes[idx];

		// Temporarily remove the node under consideration
		nodes[idx] = null;
		replace = true;

		while (ancestor) {
			if (nodes.indexOf(ancestor) > -1) {
				replace = false;
				nodes.splice(idx, 1);
				break;
			}
			ancestor = ancestor.parent;
		}

		// If the node has been found to be unique, re-insert it.
		if (replace) {
			nodes[idx] = node;
		}
	}

	return nodes;
};

// Source: http://dom.spec.whatwg.org/#dom-node-comparedocumentposition
var POSITION = {
	DISCONNECTED: 1,
	PRECEDING: 2,
	FOLLOWING: 4,
	CONTAINS: 8,
	CONTAINED_BY: 16
};

// Compare the position of one node against another node in any other document.
// The return value is a bitmask with the following values:
//
// document order:
// > There is an ordering, document order, defined on all the nodes in the
// > document corresponding to the order in which the first character of the
// > XML representation of each node occurs in the XML representation of the
// > document after expansion of general entities. Thus, the document element
// > node will be the first node. Element nodes occur before their children.
// > Thus, document order orders element nodes in order of the occurrence of
// > their start-tag in the XML (after expansion of entities). The attribute
// > nodes of an element occur after the element and before its children. The
// > relative order of attribute nodes is implementation-dependent./
// Source:
// http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
//
// @argument {Node} nodaA The first node to use in the comparison
// @argument {Node} nodeB The second node to use in the comparison
//
// @return {Number} A bitmask describing the input nodes' relative position.
//         See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
//         a description of these values.
var comparePos = exports.compareDocumentPosition = function(nodeA, nodeB) {
	var aParents = [];
	var bParents = [];
	var current, sharedParent, siblings, aSibling, bSibling, idx;

	if (nodeA === nodeB) {
		return 0;
	}

	current = nodeA;
	while (current) {
		aParents.unshift(current);
		current = current.parent;
	}
	current = nodeB;
	while (current) {
		bParents.unshift(current);
		current = current.parent;
	}

	idx = 0;
	while (aParents[idx] === bParents[idx]) {
		idx++;
	}

	if (idx === 0) {
		return POSITION.DISCONNECTED;
	}

	sharedParent = aParents[idx - 1];
	siblings = sharedParent.children;
	aSibling = aParents[idx];
	bSibling = bParents[idx];

	if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
		if (sharedParent === nodeB) {
			return POSITION.FOLLOWING | POSITION.CONTAINED_BY;
		}
		return POSITION.FOLLOWING;
	} else {
		if (sharedParent === nodeA) {
			return POSITION.PRECEDING | POSITION.CONTAINS;
		}
		return POSITION.PRECEDING;
	}
};

// Sort an array of nodes based on their relative position in the document and
// remove any duplicate nodes. If the array contains nodes that do not belong
// to the same document, sort order is unspecified.
//
// @argument {Array} nodes Array of DOM nodes
//
// @returns {Array} collection of unique nodes, sorted in document order
exports.uniqueSort = function(nodes) {
	var idx = nodes.length, node, position;

	nodes = nodes.slice();

	while (--idx > -1) {
		node = nodes[idx];
		position = nodes.indexOf(node);
		if (position > -1 && position < idx) {
			nodes.splice(idx, 1);
		}
	}
	nodes.sort(function(a, b) {
		var relative = comparePos(a, b);
		if (relative & POSITION.PRECEDING) {
			return -1;
		} else if (relative & POSITION.FOLLOWING) {
			return 1;
		}
		return 0;
	});

	return nodes;
};

},{}],51:[function(require,module,exports){
var ElementType = require("domelementtype");
var isTag = exports.isTag = ElementType.isTag;

exports.testElement = function(options, element){
	for(var key in options){
		if(!options.hasOwnProperty(key));
		else if(key === "tag_name"){
			if(!isTag(element) || !options.tag_name(element.name)){
				return false;
			}
		} else if(key === "tag_type"){
			if(!options.tag_type(element.type)) return false;
		} else if(key === "tag_contains"){
			if(isTag(element) || !options.tag_contains(element.data)){
				return false;
			}
		} else if(!element.attribs || !options[key](element.attribs[key])){
			return false;
		}
	}
	return true;
};

var Checks = {
	tag_name: function(name){
		if(typeof name === "function"){
			return function(elem){ return isTag(elem) && name(elem.name); };
		} else if(name === "*"){
			return isTag;
		} else {
			return function(elem){ return isTag(elem) && elem.name === name; };
		}
	},
	tag_type: function(type){
		if(typeof type === "function"){
			return function(elem){ return type(elem.type); };
		} else {
			return function(elem){ return elem.type === type; };
		}
	},
	tag_contains: function(data){
		if(typeof data === "function"){
			return function(elem){ return !isTag(elem) && data(elem.data); };
		} else {
			return function(elem){ return !isTag(elem) && elem.data === data; };
		}
	}
};

function getAttribCheck(attrib, value){
	if(typeof value === "function"){
		return function(elem){ return elem.attribs && value(elem.attribs[attrib]); };
	} else {
		return function(elem){ return elem.attribs && elem.attribs[attrib] === value; };
	}
}

function combineFuncs(a, b){
	return function(elem){
		return a(elem) || b(elem);
	};
}

exports.getElements = function(options, element, recurse, limit){
	var funcs = Object.keys(options).map(function(key){
		var value = options[key];
		return key in Checks ? Checks[key](value) : getAttribCheck(key, value);
	});

	return funcs.length === 0 ? [] : this.filter(
		funcs.reduce(combineFuncs),
		element, recurse, limit
	);
};

exports.getElementById = function(id, element, recurse){
	if(!Array.isArray(element)) element = [element];
	return this.findOne(getAttribCheck("id", id), element, recurse !== false);
};

exports.getElementsByTagName = function(name, element, recurse, limit){
	return this.filter(Checks.tag_name(name), element, recurse, limit);
};

exports.getElementsByTagType = function(type, element, recurse, limit){
	return this.filter(Checks.tag_type(type), element, recurse, limit);
};

},{"domelementtype":56}],52:[function(require,module,exports){
exports.removeElement = function(elem){
	if(elem.prev) elem.prev.next = elem.next;
	if(elem.next) elem.next.prev = elem.prev;

	if(elem.parent){
		var childs = elem.parent.children;
		childs.splice(childs.lastIndexOf(elem), 1);
	}
};

exports.replaceElement = function(elem, replacement){
	var prev = replacement.prev = elem.prev;
	if(prev){
		prev.next = replacement;
	}

	var next = replacement.next = elem.next;
	if(next){
		next.prev = replacement;
	}

	var parent = replacement.parent = elem.parent;
	if(parent){
		var childs = parent.children;
		childs[childs.lastIndexOf(elem)] = replacement;
	}
};

exports.appendChild = function(elem, child){
	child.parent = elem;

	if(elem.children.push(child) !== 1){
		var sibling = elem.children[elem.children.length - 2];
		sibling.next = child;
		child.prev = sibling;
		child.next = null;
	}
};

exports.append = function(elem, next){
	var parent = elem.parent,
		currNext = elem.next;

	next.next = currNext;
	next.prev = elem;
	elem.next = next;
	next.parent = parent;

	if(currNext){
		currNext.prev = next;
		if(parent){
			var childs = parent.children;
			childs.splice(childs.lastIndexOf(currNext), 0, next);
		}
	} else if(parent){
		parent.children.push(next);
	}
};

exports.prepend = function(elem, prev){
	var parent = elem.parent;
	if(parent){
		var childs = parent.children;
		childs.splice(childs.lastIndexOf(elem), 0, prev);
	}

	if(elem.prev){
		elem.prev.next = prev;
	}
	
	prev.parent = parent;
	prev.prev = elem.prev;
	prev.next = elem;
	elem.prev = prev;
};



},{}],53:[function(require,module,exports){
var isTag = require("domelementtype").isTag;

module.exports = {
	filter: filter,
	find: find,
	findOneChild: findOneChild,
	findOne: findOne,
	existsOne: existsOne,
	findAll: findAll
};

function filter(test, element, recurse, limit){
	if(!Array.isArray(element)) element = [element];

	if(typeof limit !== "number" || !isFinite(limit)){
		limit = Infinity;
	}
	return find(test, element, recurse !== false, limit);
}

function find(test, elems, recurse, limit){
	var result = [], childs;

	for(var i = 0, j = elems.length; i < j; i++){
		if(test(elems[i])){
			result.push(elems[i]);
			if(--limit <= 0) break;
		}

		childs = elems[i].children;
		if(recurse && childs && childs.length > 0){
			childs = find(test, childs, recurse, limit);
			result = result.concat(childs);
			limit -= childs.length;
			if(limit <= 0) break;
		}
	}

	return result;
}

function findOneChild(test, elems){
	for(var i = 0, l = elems.length; i < l; i++){
		if(test(elems[i])) return elems[i];
	}

	return null;
}

function findOne(test, elems){
	var elem = null;

	for(var i = 0, l = elems.length; i < l && !elem; i++){
		if(!isTag(elems[i])){
			continue;
		} else if(test(elems[i])){
			elem = elems[i];
		} else if(elems[i].children.length > 0){
			elem = findOne(test, elems[i].children);
		}
	}

	return elem;
}

function existsOne(test, elems){
	for(var i = 0, l = elems.length; i < l; i++){
		if(
			isTag(elems[i]) && (
				test(elems[i]) || (
					elems[i].children.length > 0 &&
					existsOne(test, elems[i].children)
				)
			)
		){
			return true;
		}
	}

	return false;
}

function findAll(test, rootElems){
	var result = [];
	var stack = rootElems.slice();
	while(stack.length){
		var elem = stack.shift();
		if(!isTag(elem)) continue;
		if (elem.children && elem.children.length > 0) {
			stack.unshift.apply(stack, elem.children);
		}
		if(test(elem)) result.push(elem);
	}
	return result;
}

},{"domelementtype":56}],54:[function(require,module,exports){
var ElementType = require("domelementtype"),
    getOuterHTML = require("dom-serializer"),
    isTag = ElementType.isTag;

module.exports = {
	getInnerHTML: getInnerHTML,
	getOuterHTML: getOuterHTML,
	getText: getText
};

function getInnerHTML(elem, opts){
	return elem.children ? elem.children.map(function(elem){
		return getOuterHTML(elem, opts);
	}).join("") : "";
}

function getText(elem){
	if(Array.isArray(elem)) return elem.map(getText).join("");
	if(isTag(elem)) return elem.name === "br" ? "\n" : getText(elem.children);
	if(elem.type === ElementType.CDATA) return getText(elem.children);
	if(elem.type === ElementType.Text) return elem.data;
	return "";
}

},{"dom-serializer":45,"domelementtype":56}],55:[function(require,module,exports){
var getChildren = exports.getChildren = function(elem){
	return elem.children;
};

var getParent = exports.getParent = function(elem){
	return elem.parent;
};

exports.getSiblings = function(elem){
	var parent = getParent(elem);
	return parent ? getChildren(parent) : [elem];
};

exports.getAttributeValue = function(elem, name){
	return elem.attribs && elem.attribs[name];
};

exports.hasAttrib = function(elem, name){
	return !!elem.attribs && hasOwnProperty.call(elem.attribs, name);
};

exports.getName = function(elem){
	return elem.name;
};

},{}],56:[function(require,module,exports){
//Types of elements found in the DOM
module.exports = {
	Text: "text", //Text
	Directive: "directive", //<? ... ?>
	Comment: "comment", //<!-- ... -->
	Script: "script", //<script> tags
	Style: "style", //<style> tags
	Tag: "tag", //Any tag
	CDATA: "cdata", //<![CDATA[ ... ]]>
	Doctype: "doctype",

	isTag: function(elem){
		return elem.type === "tag" || elem.type === "script" || elem.type === "style";
	}
};

},{}],57:[function(require,module,exports){
'use strict';
const isObj = require('is-obj');

const disallowedKeys = [
	'__proto__',
	'prototype',
	'constructor'
];

const isValidPath = pathSegments => !pathSegments.some(segment => disallowedKeys.includes(segment));

function getPathSegments(path) {
	const pathArray = path.split('.');
	const parts = [];

	for (let i = 0; i < pathArray.length; i++) {
		let p = pathArray[i];

		while (p[p.length - 1] === '\\' && pathArray[i + 1] !== undefined) {
			p = p.slice(0, -1) + '.';
			p += pathArray[++i];
		}

		parts.push(p);
	}

	if (!isValidPath(parts)) {
		return [];
	}

	return parts;
}

module.exports = {
	get(object, path, value) {
		if (!isObj(object) || typeof path !== 'string') {
			return value === undefined ? object : value;
		}

		const pathArray = getPathSegments(path);
		if (pathArray.length === 0) {
			return;
		}

		for (let i = 0; i < pathArray.length; i++) {
			if (!Object.prototype.propertyIsEnumerable.call(object, pathArray[i])) {
				return value;
			}

			object = object[pathArray[i]];

			if (object === undefined || object === null) {
				// `object` is either `undefined` or `null` so we want to stop the loop, and
				// if this is not the last bit of the path, and
				// if it did't return `undefined`
				// it would return `null` if `object` is `null`
				// but we want `get({foo: null}, 'foo.bar')` to equal `undefined`, or the supplied value, not `null`
				if (i !== pathArray.length - 1) {
					return value;
				}

				break;
			}
		}

		return object;
	},

	set(object, path, value) {
		if (!isObj(object) || typeof path !== 'string') {
			return object;
		}

		const root = object;
		const pathArray = getPathSegments(path);

		for (let i = 0; i < pathArray.length; i++) {
			const p = pathArray[i];

			if (!isObj(object[p])) {
				object[p] = {};
			}

			if (i === pathArray.length - 1) {
				object[p] = value;
			}

			object = object[p];
		}

		return root;
	},

	delete(object, path) {
		if (!isObj(object) || typeof path !== 'string') {
			return false;
		}

		const pathArray = getPathSegments(path);

		for (let i = 0; i < pathArray.length; i++) {
			const p = pathArray[i];

			if (i === pathArray.length - 1) {
				delete object[p];
				return true;
			}

			object = object[p];

			if (!isObj(object)) {
				return false;
			}
		}
	},

	has(object, path) {
		if (!isObj(object) || typeof path !== 'string') {
			return false;
		}

		const pathArray = getPathSegments(path);
		if (pathArray.length === 0) {
			return false;
		}

		// eslint-disable-next-line unicorn/no-for-loop
		for (let i = 0; i < pathArray.length; i++) {
			if (isObj(object)) {
				if (!(pathArray[i] in object)) {
					return false;
				}

				object = object[pathArray[i]];
			} else {
				return false;
			}
		}

		return true;
	}
};

},{"is-obj":92}],58:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHTML = exports.decodeHTMLStrict = exports.decodeXML = void 0;
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var legacy_json_1 = __importDefault(require("./maps/legacy.json"));
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var decode_codepoint_1 = __importDefault(require("./decode_codepoint"));
exports.decodeXML = getStrictDecoder(xml_json_1.default);
exports.decodeHTMLStrict = getStrictDecoder(entities_json_1.default);
function getStrictDecoder(map) {
    var keys = Object.keys(map).join("|");
    var replace = getReplacer(map);
    keys += "|#[xX][\\da-fA-F]+|#\\d+";
    var re = new RegExp("&(?:" + keys + ");", "g");
    return function (str) { return String(str).replace(re, replace); };
}
var sorter = function (a, b) { return (a < b ? 1 : -1); };
exports.decodeHTML = (function () {
    var legacy = Object.keys(legacy_json_1.default).sort(sorter);
    var keys = Object.keys(entities_json_1.default).sort(sorter);
    for (var i = 0, j = 0; i < keys.length; i++) {
        if (legacy[j] === keys[i]) {
            keys[i] += ";?";
            j++;
        }
        else {
            keys[i] += ";";
        }
    }
    var re = new RegExp("&(?:" + keys.join("|") + "|#[xX][\\da-fA-F]+;?|#\\d+;?)", "g");
    var replace = getReplacer(entities_json_1.default);
    function replacer(str) {
        if (str.substr(-1) !== ";")
            str += ";";
        return replace(str);
    }
    //TODO consider creating a merged map
    return function (str) { return String(str).replace(re, replacer); };
})();
function getReplacer(map) {
    return function replace(str) {
        if (str.charAt(1) === "#") {
            var secondChar = str.charAt(2);
            if (secondChar === "X" || secondChar === "x") {
                return decode_codepoint_1.default(parseInt(str.substr(3), 16));
            }
            return decode_codepoint_1.default(parseInt(str.substr(2), 10));
        }
        return map[str.slice(1, -1)];
    };
}

},{"./decode_codepoint":59,"./maps/entities.json":63,"./maps/legacy.json":64,"./maps/xml.json":65}],59:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var decode_json_1 = __importDefault(require("./maps/decode.json"));
// modified version of https://github.com/mathiasbynens/he/blob/master/src/he.js#L94-L119
function decodeCodePoint(codePoint) {
    if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
        return "\uFFFD";
    }
    if (codePoint in decode_json_1.default) {
        codePoint = decode_json_1.default[codePoint];
    }
    var output = "";
    if (codePoint > 0xffff) {
        codePoint -= 0x10000;
        output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
        codePoint = 0xdc00 | (codePoint & 0x3ff);
    }
    output += String.fromCharCode(codePoint);
    return output;
}
exports.default = decodeCodePoint;

},{"./maps/decode.json":62}],60:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escape = exports.encodeHTML = exports.encodeXML = void 0;
var xml_json_1 = __importDefault(require("./maps/xml.json"));
var inverseXML = getInverseObj(xml_json_1.default);
var xmlReplacer = getInverseReplacer(inverseXML);
exports.encodeXML = getInverse(inverseXML, xmlReplacer);
var entities_json_1 = __importDefault(require("./maps/entities.json"));
var inverseHTML = getInverseObj(entities_json_1.default);
var htmlReplacer = getInverseReplacer(inverseHTML);
exports.encodeHTML = getInverse(inverseHTML, htmlReplacer);
function getInverseObj(obj) {
    return Object.keys(obj)
        .sort()
        .reduce(function (inverse, name) {
        inverse[obj[name]] = "&" + name + ";";
        return inverse;
    }, {});
}
function getInverseReplacer(inverse) {
    var single = [];
    var multiple = [];
    for (var _i = 0, _a = Object.keys(inverse); _i < _a.length; _i++) {
        var k = _a[_i];
        if (k.length === 1) {
            // Add value to single array
            single.push("\\" + k);
        }
        else {
            // Add value to multiple array
            multiple.push(k);
        }
    }
    // Add ranges to single characters.
    single.sort();
    for (var start = 0; start < single.length - 1; start++) {
        // Find the end of a run of characters
        var end = start;
        while (end < single.length - 1 &&
            single[end].charCodeAt(1) + 1 === single[end + 1].charCodeAt(1)) {
            end += 1;
        }
        var count = 1 + end - start;
        // We want to replace at least three characters
        if (count < 3)
            continue;
        single.splice(start, count, single[start] + "-" + single[end]);
    }
    multiple.unshift("[" + single.join("") + "]");
    return new RegExp(multiple.join("|"), "g");
}
var reNonASCII = /(?:[\x80-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])/g;
function singleCharReplacer(c) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return "&#x" + c.codePointAt(0).toString(16).toUpperCase() + ";";
}
function getInverse(inverse, re) {
    return function (data) {
        return data
            .replace(re, function (name) { return inverse[name]; })
            .replace(reNonASCII, singleCharReplacer);
    };
}
var reXmlChars = getInverseReplacer(inverseXML);
function escape(data) {
    return data
        .replace(reXmlChars, singleCharReplacer)
        .replace(reNonASCII, singleCharReplacer);
}
exports.escape = escape;

},{"./maps/entities.json":63,"./maps/xml.json":65}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encode = exports.decodeStrict = exports.decode = void 0;
var decode_1 = require("./decode");
var encode_1 = require("./encode");
/**
 * Decodes a string with entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 */
function decode(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTML)(data);
}
exports.decode = decode;
/**
 * Decodes a string with entities. Does not allow missing trailing semicolons for entities.
 *
 * @param data String to decode.
 * @param level Optional level to decode at. 0 = XML, 1 = HTML. Default is 0.
 */
function decodeStrict(data, level) {
    return (!level || level <= 0 ? decode_1.decodeXML : decode_1.decodeHTMLStrict)(data);
}
exports.decodeStrict = decodeStrict;
/**
 * Encodes a string with entities.
 *
 * @param data String to encode.
 * @param level Optional level to encode at. 0 = XML, 1 = HTML. Default is 0.
 */
function encode(data, level) {
    return (!level || level <= 0 ? encode_1.encodeXML : encode_1.encodeHTML)(data);
}
exports.encode = encode;
var encode_2 = require("./encode");
Object.defineProperty(exports, "encodeXML", { enumerable: true, get: function () { return encode_2.encodeXML; } });
Object.defineProperty(exports, "encodeHTML", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "escape", { enumerable: true, get: function () { return encode_2.escape; } });
// Legacy aliases
Object.defineProperty(exports, "encodeHTML4", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
Object.defineProperty(exports, "encodeHTML5", { enumerable: true, get: function () { return encode_2.encodeHTML; } });
var decode_2 = require("./decode");
Object.defineProperty(exports, "decodeXML", { enumerable: true, get: function () { return decode_2.decodeXML; } });
Object.defineProperty(exports, "decodeHTML", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTMLStrict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
// Legacy aliases
Object.defineProperty(exports, "decodeHTML4", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML5", { enumerable: true, get: function () { return decode_2.decodeHTML; } });
Object.defineProperty(exports, "decodeHTML4Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeHTML5Strict", { enumerable: true, get: function () { return decode_2.decodeHTMLStrict; } });
Object.defineProperty(exports, "decodeXMLStrict", { enumerable: true, get: function () { return decode_2.decodeXML; } });

},{"./decode":58,"./encode":60}],62:[function(require,module,exports){
module.exports={
    "0": 65533,
    "128": 8364,
    "130": 8218,
    "131": 402,
    "132": 8222,
    "133": 8230,
    "134": 8224,
    "135": 8225,
    "136": 710,
    "137": 8240,
    "138": 352,
    "139": 8249,
    "140": 338,
    "142": 381,
    "145": 8216,
    "146": 8217,
    "147": 8220,
    "148": 8221,
    "149": 8226,
    "150": 8211,
    "151": 8212,
    "152": 732,
    "153": 8482,
    "154": 353,
    "155": 8250,
    "156": 339,
    "158": 382,
    "159": 376
}

},{}],63:[function(require,module,exports){
module.exports={ "Aacute": "\u00C1", "aacute": "\u00E1", "Abreve": "\u0102", "abreve": "\u0103", "ac": "\u223E", "acd": "\u223F", "acE": "\u223E\u0333", "Acirc": "\u00C2", "acirc": "\u00E2", "acute": "\u00B4", "Acy": "\u0410", "acy": "\u0430", "AElig": "\u00C6", "aelig": "\u00E6", "af": "\u2061", "Afr": "\uD835\uDD04", "afr": "\uD835\uDD1E", "Agrave": "\u00C0", "agrave": "\u00E0", "alefsym": "\u2135", "aleph": "\u2135", "Alpha": "\u0391", "alpha": "\u03B1", "Amacr": "\u0100", "amacr": "\u0101", "amalg": "\u2A3F", "amp": "&", "AMP": "&", "andand": "\u2A55", "And": "\u2A53", "and": "\u2227", "andd": "\u2A5C", "andslope": "\u2A58", "andv": "\u2A5A", "ang": "\u2220", "ange": "\u29A4", "angle": "\u2220", "angmsdaa": "\u29A8", "angmsdab": "\u29A9", "angmsdac": "\u29AA", "angmsdad": "\u29AB", "angmsdae": "\u29AC", "angmsdaf": "\u29AD", "angmsdag": "\u29AE", "angmsdah": "\u29AF", "angmsd": "\u2221", "angrt": "\u221F", "angrtvb": "\u22BE", "angrtvbd": "\u299D", "angsph": "\u2222", "angst": "\u00C5", "angzarr": "\u237C", "Aogon": "\u0104", "aogon": "\u0105", "Aopf": "\uD835\uDD38", "aopf": "\uD835\uDD52", "apacir": "\u2A6F", "ap": "\u2248", "apE": "\u2A70", "ape": "\u224A", "apid": "\u224B", "apos": "'", "ApplyFunction": "\u2061", "approx": "\u2248", "approxeq": "\u224A", "Aring": "\u00C5", "aring": "\u00E5", "Ascr": "\uD835\uDC9C", "ascr": "\uD835\uDCB6", "Assign": "\u2254", "ast": "*", "asymp": "\u2248", "asympeq": "\u224D", "Atilde": "\u00C3", "atilde": "\u00E3", "Auml": "\u00C4", "auml": "\u00E4", "awconint": "\u2233", "awint": "\u2A11", "backcong": "\u224C", "backepsilon": "\u03F6", "backprime": "\u2035", "backsim": "\u223D", "backsimeq": "\u22CD", "Backslash": "\u2216", "Barv": "\u2AE7", "barvee": "\u22BD", "barwed": "\u2305", "Barwed": "\u2306", "barwedge": "\u2305", "bbrk": "\u23B5", "bbrktbrk": "\u23B6", "bcong": "\u224C", "Bcy": "\u0411", "bcy": "\u0431", "bdquo": "\u201E", "becaus": "\u2235", "because": "\u2235", "Because": "\u2235", "bemptyv": "\u29B0", "bepsi": "\u03F6", "bernou": "\u212C", "Bernoullis": "\u212C", "Beta": "\u0392", "beta": "\u03B2", "beth": "\u2136", "between": "\u226C", "Bfr": "\uD835\uDD05", "bfr": "\uD835\uDD1F", "bigcap": "\u22C2", "bigcirc": "\u25EF", "bigcup": "\u22C3", "bigodot": "\u2A00", "bigoplus": "\u2A01", "bigotimes": "\u2A02", "bigsqcup": "\u2A06", "bigstar": "\u2605", "bigtriangledown": "\u25BD", "bigtriangleup": "\u25B3", "biguplus": "\u2A04", "bigvee": "\u22C1", "bigwedge": "\u22C0", "bkarow": "\u290D", "blacklozenge": "\u29EB", "blacksquare": "\u25AA", "blacktriangle": "\u25B4", "blacktriangledown": "\u25BE", "blacktriangleleft": "\u25C2", "blacktriangleright": "\u25B8", "blank": "\u2423", "blk12": "\u2592", "blk14": "\u2591", "blk34": "\u2593", "block": "\u2588", "bne": "=\u20E5", "bnequiv": "\u2261\u20E5", "bNot": "\u2AED", "bnot": "\u2310", "Bopf": "\uD835\uDD39", "bopf": "\uD835\uDD53", "bot": "\u22A5", "bottom": "\u22A5", "bowtie": "\u22C8", "boxbox": "\u29C9", "boxdl": "\u2510", "boxdL": "\u2555", "boxDl": "\u2556", "boxDL": "\u2557", "boxdr": "\u250C", "boxdR": "\u2552", "boxDr": "\u2553", "boxDR": "\u2554", "boxh": "\u2500", "boxH": "\u2550", "boxhd": "\u252C", "boxHd": "\u2564", "boxhD": "\u2565", "boxHD": "\u2566", "boxhu": "\u2534", "boxHu": "\u2567", "boxhU": "\u2568", "boxHU": "\u2569", "boxminus": "\u229F", "boxplus": "\u229E", "boxtimes": "\u22A0", "boxul": "\u2518", "boxuL": "\u255B", "boxUl": "\u255C", "boxUL": "\u255D", "boxur": "\u2514", "boxuR": "\u2558", "boxUr": "\u2559", "boxUR": "\u255A", "boxv": "\u2502", "boxV": "\u2551", "boxvh": "\u253C", "boxvH": "\u256A", "boxVh": "\u256B", "boxVH": "\u256C", "boxvl": "\u2524", "boxvL": "\u2561", "boxVl": "\u2562", "boxVL": "\u2563", "boxvr": "\u251C", "boxvR": "\u255E", "boxVr": "\u255F", "boxVR": "\u2560", "bprime": "\u2035", "breve": "\u02D8", "Breve": "\u02D8", "brvbar": "\u00A6", "bscr": "\uD835\uDCB7", "Bscr": "\u212C", "bsemi": "\u204F", "bsim": "\u223D", "bsime": "\u22CD", "bsolb": "\u29C5", "bsol": "\\", "bsolhsub": "\u27C8", "bull": "\u2022", "bullet": "\u2022", "bump": "\u224E", "bumpE": "\u2AAE", "bumpe": "\u224F", "Bumpeq": "\u224E", "bumpeq": "\u224F", "Cacute": "\u0106", "cacute": "\u0107", "capand": "\u2A44", "capbrcup": "\u2A49", "capcap": "\u2A4B", "cap": "\u2229", "Cap": "\u22D2", "capcup": "\u2A47", "capdot": "\u2A40", "CapitalDifferentialD": "\u2145", "caps": "\u2229\uFE00", "caret": "\u2041", "caron": "\u02C7", "Cayleys": "\u212D", "ccaps": "\u2A4D", "Ccaron": "\u010C", "ccaron": "\u010D", "Ccedil": "\u00C7", "ccedil": "\u00E7", "Ccirc": "\u0108", "ccirc": "\u0109", "Cconint": "\u2230", "ccups": "\u2A4C", "ccupssm": "\u2A50", "Cdot": "\u010A", "cdot": "\u010B", "cedil": "\u00B8", "Cedilla": "\u00B8", "cemptyv": "\u29B2", "cent": "\u00A2", "centerdot": "\u00B7", "CenterDot": "\u00B7", "cfr": "\uD835\uDD20", "Cfr": "\u212D", "CHcy": "\u0427", "chcy": "\u0447", "check": "\u2713", "checkmark": "\u2713", "Chi": "\u03A7", "chi": "\u03C7", "circ": "\u02C6", "circeq": "\u2257", "circlearrowleft": "\u21BA", "circlearrowright": "\u21BB", "circledast": "\u229B", "circledcirc": "\u229A", "circleddash": "\u229D", "CircleDot": "\u2299", "circledR": "\u00AE", "circledS": "\u24C8", "CircleMinus": "\u2296", "CirclePlus": "\u2295", "CircleTimes": "\u2297", "cir": "\u25CB", "cirE": "\u29C3", "cire": "\u2257", "cirfnint": "\u2A10", "cirmid": "\u2AEF", "cirscir": "\u29C2", "ClockwiseContourIntegral": "\u2232", "CloseCurlyDoubleQuote": "\u201D", "CloseCurlyQuote": "\u2019", "clubs": "\u2663", "clubsuit": "\u2663", "colon": ":", "Colon": "\u2237", "Colone": "\u2A74", "colone": "\u2254", "coloneq": "\u2254", "comma": ",", "commat": "@", "comp": "\u2201", "compfn": "\u2218", "complement": "\u2201", "complexes": "\u2102", "cong": "\u2245", "congdot": "\u2A6D", "Congruent": "\u2261", "conint": "\u222E", "Conint": "\u222F", "ContourIntegral": "\u222E", "copf": "\uD835\uDD54", "Copf": "\u2102", "coprod": "\u2210", "Coproduct": "\u2210", "copy": "\u00A9", "COPY": "\u00A9", "copysr": "\u2117", "CounterClockwiseContourIntegral": "\u2233", "crarr": "\u21B5", "cross": "\u2717", "Cross": "\u2A2F", "Cscr": "\uD835\uDC9E", "cscr": "\uD835\uDCB8", "csub": "\u2ACF", "csube": "\u2AD1", "csup": "\u2AD0", "csupe": "\u2AD2", "ctdot": "\u22EF", "cudarrl": "\u2938", "cudarrr": "\u2935", "cuepr": "\u22DE", "cuesc": "\u22DF", "cularr": "\u21B6", "cularrp": "\u293D", "cupbrcap": "\u2A48", "cupcap": "\u2A46", "CupCap": "\u224D", "cup": "\u222A", "Cup": "\u22D3", "cupcup": "\u2A4A", "cupdot": "\u228D", "cupor": "\u2A45", "cups": "\u222A\uFE00", "curarr": "\u21B7", "curarrm": "\u293C", "curlyeqprec": "\u22DE", "curlyeqsucc": "\u22DF", "curlyvee": "\u22CE", "curlywedge": "\u22CF", "curren": "\u00A4", "curvearrowleft": "\u21B6", "curvearrowright": "\u21B7", "cuvee": "\u22CE", "cuwed": "\u22CF", "cwconint": "\u2232", "cwint": "\u2231", "cylcty": "\u232D", "dagger": "\u2020", "Dagger": "\u2021", "daleth": "\u2138", "darr": "\u2193", "Darr": "\u21A1", "dArr": "\u21D3", "dash": "\u2010", "Dashv": "\u2AE4", "dashv": "\u22A3", "dbkarow": "\u290F", "dblac": "\u02DD", "Dcaron": "\u010E", "dcaron": "\u010F", "Dcy": "\u0414", "dcy": "\u0434", "ddagger": "\u2021", "ddarr": "\u21CA", "DD": "\u2145", "dd": "\u2146", "DDotrahd": "\u2911", "ddotseq": "\u2A77", "deg": "\u00B0", "Del": "\u2207", "Delta": "\u0394", "delta": "\u03B4", "demptyv": "\u29B1", "dfisht": "\u297F", "Dfr": "\uD835\uDD07", "dfr": "\uD835\uDD21", "dHar": "\u2965", "dharl": "\u21C3", "dharr": "\u21C2", "DiacriticalAcute": "\u00B4", "DiacriticalDot": "\u02D9", "DiacriticalDoubleAcute": "\u02DD", "DiacriticalGrave": "`", "DiacriticalTilde": "\u02DC", "diam": "\u22C4", "diamond": "\u22C4", "Diamond": "\u22C4", "diamondsuit": "\u2666", "diams": "\u2666", "die": "\u00A8", "DifferentialD": "\u2146", "digamma": "\u03DD", "disin": "\u22F2", "div": "\u00F7", "divide": "\u00F7", "divideontimes": "\u22C7", "divonx": "\u22C7", "DJcy": "\u0402", "djcy": "\u0452", "dlcorn": "\u231E", "dlcrop": "\u230D", "dollar": "$", "Dopf": "\uD835\uDD3B", "dopf": "\uD835\uDD55", "Dot": "\u00A8", "dot": "\u02D9", "DotDot": "\u20DC", "doteq": "\u2250", "doteqdot": "\u2251", "DotEqual": "\u2250", "dotminus": "\u2238", "dotplus": "\u2214", "dotsquare": "\u22A1", "doublebarwedge": "\u2306", "DoubleContourIntegral": "\u222F", "DoubleDot": "\u00A8", "DoubleDownArrow": "\u21D3", "DoubleLeftArrow": "\u21D0", "DoubleLeftRightArrow": "\u21D4", "DoubleLeftTee": "\u2AE4", "DoubleLongLeftArrow": "\u27F8", "DoubleLongLeftRightArrow": "\u27FA", "DoubleLongRightArrow": "\u27F9", "DoubleRightArrow": "\u21D2", "DoubleRightTee": "\u22A8", "DoubleUpArrow": "\u21D1", "DoubleUpDownArrow": "\u21D5", "DoubleVerticalBar": "\u2225", "DownArrowBar": "\u2913", "downarrow": "\u2193", "DownArrow": "\u2193", "Downarrow": "\u21D3", "DownArrowUpArrow": "\u21F5", "DownBreve": "\u0311", "downdownarrows": "\u21CA", "downharpoonleft": "\u21C3", "downharpoonright": "\u21C2", "DownLeftRightVector": "\u2950", "DownLeftTeeVector": "\u295E", "DownLeftVectorBar": "\u2956", "DownLeftVector": "\u21BD", "DownRightTeeVector": "\u295F", "DownRightVectorBar": "\u2957", "DownRightVector": "\u21C1", "DownTeeArrow": "\u21A7", "DownTee": "\u22A4", "drbkarow": "\u2910", "drcorn": "\u231F", "drcrop": "\u230C", "Dscr": "\uD835\uDC9F", "dscr": "\uD835\uDCB9", "DScy": "\u0405", "dscy": "\u0455", "dsol": "\u29F6", "Dstrok": "\u0110", "dstrok": "\u0111", "dtdot": "\u22F1", "dtri": "\u25BF", "dtrif": "\u25BE", "duarr": "\u21F5", "duhar": "\u296F", "dwangle": "\u29A6", "DZcy": "\u040F", "dzcy": "\u045F", "dzigrarr": "\u27FF", "Eacute": "\u00C9", "eacute": "\u00E9", "easter": "\u2A6E", "Ecaron": "\u011A", "ecaron": "\u011B", "Ecirc": "\u00CA", "ecirc": "\u00EA", "ecir": "\u2256", "ecolon": "\u2255", "Ecy": "\u042D", "ecy": "\u044D", "eDDot": "\u2A77", "Edot": "\u0116", "edot": "\u0117", "eDot": "\u2251", "ee": "\u2147", "efDot": "\u2252", "Efr": "\uD835\uDD08", "efr": "\uD835\uDD22", "eg": "\u2A9A", "Egrave": "\u00C8", "egrave": "\u00E8", "egs": "\u2A96", "egsdot": "\u2A98", "el": "\u2A99", "Element": "\u2208", "elinters": "\u23E7", "ell": "\u2113", "els": "\u2A95", "elsdot": "\u2A97", "Emacr": "\u0112", "emacr": "\u0113", "empty": "\u2205", "emptyset": "\u2205", "EmptySmallSquare": "\u25FB", "emptyv": "\u2205", "EmptyVerySmallSquare": "\u25AB", "emsp13": "\u2004", "emsp14": "\u2005", "emsp": "\u2003", "ENG": "\u014A", "eng": "\u014B", "ensp": "\u2002", "Eogon": "\u0118", "eogon": "\u0119", "Eopf": "\uD835\uDD3C", "eopf": "\uD835\uDD56", "epar": "\u22D5", "eparsl": "\u29E3", "eplus": "\u2A71", "epsi": "\u03B5", "Epsilon": "\u0395", "epsilon": "\u03B5", "epsiv": "\u03F5", "eqcirc": "\u2256", "eqcolon": "\u2255", "eqsim": "\u2242", "eqslantgtr": "\u2A96", "eqslantless": "\u2A95", "Equal": "\u2A75", "equals": "=", "EqualTilde": "\u2242", "equest": "\u225F", "Equilibrium": "\u21CC", "equiv": "\u2261", "equivDD": "\u2A78", "eqvparsl": "\u29E5", "erarr": "\u2971", "erDot": "\u2253", "escr": "\u212F", "Escr": "\u2130", "esdot": "\u2250", "Esim": "\u2A73", "esim": "\u2242", "Eta": "\u0397", "eta": "\u03B7", "ETH": "\u00D0", "eth": "\u00F0", "Euml": "\u00CB", "euml": "\u00EB", "euro": "\u20AC", "excl": "!", "exist": "\u2203", "Exists": "\u2203", "expectation": "\u2130", "exponentiale": "\u2147", "ExponentialE": "\u2147", "fallingdotseq": "\u2252", "Fcy": "\u0424", "fcy": "\u0444", "female": "\u2640", "ffilig": "\uFB03", "fflig": "\uFB00", "ffllig": "\uFB04", "Ffr": "\uD835\uDD09", "ffr": "\uD835\uDD23", "filig": "\uFB01", "FilledSmallSquare": "\u25FC", "FilledVerySmallSquare": "\u25AA", "fjlig": "fj", "flat": "\u266D", "fllig": "\uFB02", "fltns": "\u25B1", "fnof": "\u0192", "Fopf": "\uD835\uDD3D", "fopf": "\uD835\uDD57", "forall": "\u2200", "ForAll": "\u2200", "fork": "\u22D4", "forkv": "\u2AD9", "Fouriertrf": "\u2131", "fpartint": "\u2A0D", "frac12": "\u00BD", "frac13": "\u2153", "frac14": "\u00BC", "frac15": "\u2155", "frac16": "\u2159", "frac18": "\u215B", "frac23": "\u2154", "frac25": "\u2156", "frac34": "\u00BE", "frac35": "\u2157", "frac38": "\u215C", "frac45": "\u2158", "frac56": "\u215A", "frac58": "\u215D", "frac78": "\u215E", "frasl": "\u2044", "frown": "\u2322", "fscr": "\uD835\uDCBB", "Fscr": "\u2131", "gacute": "\u01F5", "Gamma": "\u0393", "gamma": "\u03B3", "Gammad": "\u03DC", "gammad": "\u03DD", "gap": "\u2A86", "Gbreve": "\u011E", "gbreve": "\u011F", "Gcedil": "\u0122", "Gcirc": "\u011C", "gcirc": "\u011D", "Gcy": "\u0413", "gcy": "\u0433", "Gdot": "\u0120", "gdot": "\u0121", "ge": "\u2265", "gE": "\u2267", "gEl": "\u2A8C", "gel": "\u22DB", "geq": "\u2265", "geqq": "\u2267", "geqslant": "\u2A7E", "gescc": "\u2AA9", "ges": "\u2A7E", "gesdot": "\u2A80", "gesdoto": "\u2A82", "gesdotol": "\u2A84", "gesl": "\u22DB\uFE00", "gesles": "\u2A94", "Gfr": "\uD835\uDD0A", "gfr": "\uD835\uDD24", "gg": "\u226B", "Gg": "\u22D9", "ggg": "\u22D9", "gimel": "\u2137", "GJcy": "\u0403", "gjcy": "\u0453", "gla": "\u2AA5", "gl": "\u2277", "glE": "\u2A92", "glj": "\u2AA4", "gnap": "\u2A8A", "gnapprox": "\u2A8A", "gne": "\u2A88", "gnE": "\u2269", "gneq": "\u2A88", "gneqq": "\u2269", "gnsim": "\u22E7", "Gopf": "\uD835\uDD3E", "gopf": "\uD835\uDD58", "grave": "`", "GreaterEqual": "\u2265", "GreaterEqualLess": "\u22DB", "GreaterFullEqual": "\u2267", "GreaterGreater": "\u2AA2", "GreaterLess": "\u2277", "GreaterSlantEqual": "\u2A7E", "GreaterTilde": "\u2273", "Gscr": "\uD835\uDCA2", "gscr": "\u210A", "gsim": "\u2273", "gsime": "\u2A8E", "gsiml": "\u2A90", "gtcc": "\u2AA7", "gtcir": "\u2A7A", "gt": ">", "GT": ">", "Gt": "\u226B", "gtdot": "\u22D7", "gtlPar": "\u2995", "gtquest": "\u2A7C", "gtrapprox": "\u2A86", "gtrarr": "\u2978", "gtrdot": "\u22D7", "gtreqless": "\u22DB", "gtreqqless": "\u2A8C", "gtrless": "\u2277", "gtrsim": "\u2273", "gvertneqq": "\u2269\uFE00", "gvnE": "\u2269\uFE00", "Hacek": "\u02C7", "hairsp": "\u200A", "half": "\u00BD", "hamilt": "\u210B", "HARDcy": "\u042A", "hardcy": "\u044A", "harrcir": "\u2948", "harr": "\u2194", "hArr": "\u21D4", "harrw": "\u21AD", "Hat": "^", "hbar": "\u210F", "Hcirc": "\u0124", "hcirc": "\u0125", "hearts": "\u2665", "heartsuit": "\u2665", "hellip": "\u2026", "hercon": "\u22B9", "hfr": "\uD835\uDD25", "Hfr": "\u210C", "HilbertSpace": "\u210B", "hksearow": "\u2925", "hkswarow": "\u2926", "hoarr": "\u21FF", "homtht": "\u223B", "hookleftarrow": "\u21A9", "hookrightarrow": "\u21AA", "hopf": "\uD835\uDD59", "Hopf": "\u210D", "horbar": "\u2015", "HorizontalLine": "\u2500", "hscr": "\uD835\uDCBD", "Hscr": "\u210B", "hslash": "\u210F", "Hstrok": "\u0126", "hstrok": "\u0127", "HumpDownHump": "\u224E", "HumpEqual": "\u224F", "hybull": "\u2043", "hyphen": "\u2010", "Iacute": "\u00CD", "iacute": "\u00ED", "ic": "\u2063", "Icirc": "\u00CE", "icirc": "\u00EE", "Icy": "\u0418", "icy": "\u0438", "Idot": "\u0130", "IEcy": "\u0415", "iecy": "\u0435", "iexcl": "\u00A1", "iff": "\u21D4", "ifr": "\uD835\uDD26", "Ifr": "\u2111", "Igrave": "\u00CC", "igrave": "\u00EC", "ii": "\u2148", "iiiint": "\u2A0C", "iiint": "\u222D", "iinfin": "\u29DC", "iiota": "\u2129", "IJlig": "\u0132", "ijlig": "\u0133", "Imacr": "\u012A", "imacr": "\u012B", "image": "\u2111", "ImaginaryI": "\u2148", "imagline": "\u2110", "imagpart": "\u2111", "imath": "\u0131", "Im": "\u2111", "imof": "\u22B7", "imped": "\u01B5", "Implies": "\u21D2", "incare": "\u2105", "in": "\u2208", "infin": "\u221E", "infintie": "\u29DD", "inodot": "\u0131", "intcal": "\u22BA", "int": "\u222B", "Int": "\u222C", "integers": "\u2124", "Integral": "\u222B", "intercal": "\u22BA", "Intersection": "\u22C2", "intlarhk": "\u2A17", "intprod": "\u2A3C", "InvisibleComma": "\u2063", "InvisibleTimes": "\u2062", "IOcy": "\u0401", "iocy": "\u0451", "Iogon": "\u012E", "iogon": "\u012F", "Iopf": "\uD835\uDD40", "iopf": "\uD835\uDD5A", "Iota": "\u0399", "iota": "\u03B9", "iprod": "\u2A3C", "iquest": "\u00BF", "iscr": "\uD835\uDCBE", "Iscr": "\u2110", "isin": "\u2208", "isindot": "\u22F5", "isinE": "\u22F9", "isins": "\u22F4", "isinsv": "\u22F3", "isinv": "\u2208", "it": "\u2062", "Itilde": "\u0128", "itilde": "\u0129", "Iukcy": "\u0406", "iukcy": "\u0456", "Iuml": "\u00CF", "iuml": "\u00EF", "Jcirc": "\u0134", "jcirc": "\u0135", "Jcy": "\u0419", "jcy": "\u0439", "Jfr": "\uD835\uDD0D", "jfr": "\uD835\uDD27", "jmath": "\u0237", "Jopf": "\uD835\uDD41", "jopf": "\uD835\uDD5B", "Jscr": "\uD835\uDCA5", "jscr": "\uD835\uDCBF", "Jsercy": "\u0408", "jsercy": "\u0458", "Jukcy": "\u0404", "jukcy": "\u0454", "Kappa": "\u039A", "kappa": "\u03BA", "kappav": "\u03F0", "Kcedil": "\u0136", "kcedil": "\u0137", "Kcy": "\u041A", "kcy": "\u043A", "Kfr": "\uD835\uDD0E", "kfr": "\uD835\uDD28", "kgreen": "\u0138", "KHcy": "\u0425", "khcy": "\u0445", "KJcy": "\u040C", "kjcy": "\u045C", "Kopf": "\uD835\uDD42", "kopf": "\uD835\uDD5C", "Kscr": "\uD835\uDCA6", "kscr": "\uD835\uDCC0", "lAarr": "\u21DA", "Lacute": "\u0139", "lacute": "\u013A", "laemptyv": "\u29B4", "lagran": "\u2112", "Lambda": "\u039B", "lambda": "\u03BB", "lang": "\u27E8", "Lang": "\u27EA", "langd": "\u2991", "langle": "\u27E8", "lap": "\u2A85", "Laplacetrf": "\u2112", "laquo": "\u00AB", "larrb": "\u21E4", "larrbfs": "\u291F", "larr": "\u2190", "Larr": "\u219E", "lArr": "\u21D0", "larrfs": "\u291D", "larrhk": "\u21A9", "larrlp": "\u21AB", "larrpl": "\u2939", "larrsim": "\u2973", "larrtl": "\u21A2", "latail": "\u2919", "lAtail": "\u291B", "lat": "\u2AAB", "late": "\u2AAD", "lates": "\u2AAD\uFE00", "lbarr": "\u290C", "lBarr": "\u290E", "lbbrk": "\u2772", "lbrace": "{", "lbrack": "[", "lbrke": "\u298B", "lbrksld": "\u298F", "lbrkslu": "\u298D", "Lcaron": "\u013D", "lcaron": "\u013E", "Lcedil": "\u013B", "lcedil": "\u013C", "lceil": "\u2308", "lcub": "{", "Lcy": "\u041B", "lcy": "\u043B", "ldca": "\u2936", "ldquo": "\u201C", "ldquor": "\u201E", "ldrdhar": "\u2967", "ldrushar": "\u294B", "ldsh": "\u21B2", "le": "\u2264", "lE": "\u2266", "LeftAngleBracket": "\u27E8", "LeftArrowBar": "\u21E4", "leftarrow": "\u2190", "LeftArrow": "\u2190", "Leftarrow": "\u21D0", "LeftArrowRightArrow": "\u21C6", "leftarrowtail": "\u21A2", "LeftCeiling": "\u2308", "LeftDoubleBracket": "\u27E6", "LeftDownTeeVector": "\u2961", "LeftDownVectorBar": "\u2959", "LeftDownVector": "\u21C3", "LeftFloor": "\u230A", "leftharpoondown": "\u21BD", "leftharpoonup": "\u21BC", "leftleftarrows": "\u21C7", "leftrightarrow": "\u2194", "LeftRightArrow": "\u2194", "Leftrightarrow": "\u21D4", "leftrightarrows": "\u21C6", "leftrightharpoons": "\u21CB", "leftrightsquigarrow": "\u21AD", "LeftRightVector": "\u294E", "LeftTeeArrow": "\u21A4", "LeftTee": "\u22A3", "LeftTeeVector": "\u295A", "leftthreetimes": "\u22CB", "LeftTriangleBar": "\u29CF", "LeftTriangle": "\u22B2", "LeftTriangleEqual": "\u22B4", "LeftUpDownVector": "\u2951", "LeftUpTeeVector": "\u2960", "LeftUpVectorBar": "\u2958", "LeftUpVector": "\u21BF", "LeftVectorBar": "\u2952", "LeftVector": "\u21BC", "lEg": "\u2A8B", "leg": "\u22DA", "leq": "\u2264", "leqq": "\u2266", "leqslant": "\u2A7D", "lescc": "\u2AA8", "les": "\u2A7D", "lesdot": "\u2A7F", "lesdoto": "\u2A81", "lesdotor": "\u2A83", "lesg": "\u22DA\uFE00", "lesges": "\u2A93", "lessapprox": "\u2A85", "lessdot": "\u22D6", "lesseqgtr": "\u22DA", "lesseqqgtr": "\u2A8B", "LessEqualGreater": "\u22DA", "LessFullEqual": "\u2266", "LessGreater": "\u2276", "lessgtr": "\u2276", "LessLess": "\u2AA1", "lesssim": "\u2272", "LessSlantEqual": "\u2A7D", "LessTilde": "\u2272", "lfisht": "\u297C", "lfloor": "\u230A", "Lfr": "\uD835\uDD0F", "lfr": "\uD835\uDD29", "lg": "\u2276", "lgE": "\u2A91", "lHar": "\u2962", "lhard": "\u21BD", "lharu": "\u21BC", "lharul": "\u296A", "lhblk": "\u2584", "LJcy": "\u0409", "ljcy": "\u0459", "llarr": "\u21C7", "ll": "\u226A", "Ll": "\u22D8", "llcorner": "\u231E", "Lleftarrow": "\u21DA", "llhard": "\u296B", "lltri": "\u25FA", "Lmidot": "\u013F", "lmidot": "\u0140", "lmoustache": "\u23B0", "lmoust": "\u23B0", "lnap": "\u2A89", "lnapprox": "\u2A89", "lne": "\u2A87", "lnE": "\u2268", "lneq": "\u2A87", "lneqq": "\u2268", "lnsim": "\u22E6", "loang": "\u27EC", "loarr": "\u21FD", "lobrk": "\u27E6", "longleftarrow": "\u27F5", "LongLeftArrow": "\u27F5", "Longleftarrow": "\u27F8", "longleftrightarrow": "\u27F7", "LongLeftRightArrow": "\u27F7", "Longleftrightarrow": "\u27FA", "longmapsto": "\u27FC", "longrightarrow": "\u27F6", "LongRightArrow": "\u27F6", "Longrightarrow": "\u27F9", "looparrowleft": "\u21AB", "looparrowright": "\u21AC", "lopar": "\u2985", "Lopf": "\uD835\uDD43", "lopf": "\uD835\uDD5D", "loplus": "\u2A2D", "lotimes": "\u2A34", "lowast": "\u2217", "lowbar": "_", "LowerLeftArrow": "\u2199", "LowerRightArrow": "\u2198", "loz": "\u25CA", "lozenge": "\u25CA", "lozf": "\u29EB", "lpar": "(", "lparlt": "\u2993", "lrarr": "\u21C6", "lrcorner": "\u231F", "lrhar": "\u21CB", "lrhard": "\u296D", "lrm": "\u200E", "lrtri": "\u22BF", "lsaquo": "\u2039", "lscr": "\uD835\uDCC1", "Lscr": "\u2112", "lsh": "\u21B0", "Lsh": "\u21B0", "lsim": "\u2272", "lsime": "\u2A8D", "lsimg": "\u2A8F", "lsqb": "[", "lsquo": "\u2018", "lsquor": "\u201A", "Lstrok": "\u0141", "lstrok": "\u0142", "ltcc": "\u2AA6", "ltcir": "\u2A79", "lt": "<", "LT": "<", "Lt": "\u226A", "ltdot": "\u22D6", "lthree": "\u22CB", "ltimes": "\u22C9", "ltlarr": "\u2976", "ltquest": "\u2A7B", "ltri": "\u25C3", "ltrie": "\u22B4", "ltrif": "\u25C2", "ltrPar": "\u2996", "lurdshar": "\u294A", "luruhar": "\u2966", "lvertneqq": "\u2268\uFE00", "lvnE": "\u2268\uFE00", "macr": "\u00AF", "male": "\u2642", "malt": "\u2720", "maltese": "\u2720", "Map": "\u2905", "map": "\u21A6", "mapsto": "\u21A6", "mapstodown": "\u21A7", "mapstoleft": "\u21A4", "mapstoup": "\u21A5", "marker": "\u25AE", "mcomma": "\u2A29", "Mcy": "\u041C", "mcy": "\u043C", "mdash": "\u2014", "mDDot": "\u223A", "measuredangle": "\u2221", "MediumSpace": "\u205F", "Mellintrf": "\u2133", "Mfr": "\uD835\uDD10", "mfr": "\uD835\uDD2A", "mho": "\u2127", "micro": "\u00B5", "midast": "*", "midcir": "\u2AF0", "mid": "\u2223", "middot": "\u00B7", "minusb": "\u229F", "minus": "\u2212", "minusd": "\u2238", "minusdu": "\u2A2A", "MinusPlus": "\u2213", "mlcp": "\u2ADB", "mldr": "\u2026", "mnplus": "\u2213", "models": "\u22A7", "Mopf": "\uD835\uDD44", "mopf": "\uD835\uDD5E", "mp": "\u2213", "mscr": "\uD835\uDCC2", "Mscr": "\u2133", "mstpos": "\u223E", "Mu": "\u039C", "mu": "\u03BC", "multimap": "\u22B8", "mumap": "\u22B8", "nabla": "\u2207", "Nacute": "\u0143", "nacute": "\u0144", "nang": "\u2220\u20D2", "nap": "\u2249", "napE": "\u2A70\u0338", "napid": "\u224B\u0338", "napos": "\u0149", "napprox": "\u2249", "natural": "\u266E", "naturals": "\u2115", "natur": "\u266E", "nbsp": "\u00A0", "nbump": "\u224E\u0338", "nbumpe": "\u224F\u0338", "ncap": "\u2A43", "Ncaron": "\u0147", "ncaron": "\u0148", "Ncedil": "\u0145", "ncedil": "\u0146", "ncong": "\u2247", "ncongdot": "\u2A6D\u0338", "ncup": "\u2A42", "Ncy": "\u041D", "ncy": "\u043D", "ndash": "\u2013", "nearhk": "\u2924", "nearr": "\u2197", "neArr": "\u21D7", "nearrow": "\u2197", "ne": "\u2260", "nedot": "\u2250\u0338", "NegativeMediumSpace": "\u200B", "NegativeThickSpace": "\u200B", "NegativeThinSpace": "\u200B", "NegativeVeryThinSpace": "\u200B", "nequiv": "\u2262", "nesear": "\u2928", "nesim": "\u2242\u0338", "NestedGreaterGreater": "\u226B", "NestedLessLess": "\u226A", "NewLine": "\n", "nexist": "\u2204", "nexists": "\u2204", "Nfr": "\uD835\uDD11", "nfr": "\uD835\uDD2B", "ngE": "\u2267\u0338", "nge": "\u2271", "ngeq": "\u2271", "ngeqq": "\u2267\u0338", "ngeqslant": "\u2A7E\u0338", "nges": "\u2A7E\u0338", "nGg": "\u22D9\u0338", "ngsim": "\u2275", "nGt": "\u226B\u20D2", "ngt": "\u226F", "ngtr": "\u226F", "nGtv": "\u226B\u0338", "nharr": "\u21AE", "nhArr": "\u21CE", "nhpar": "\u2AF2", "ni": "\u220B", "nis": "\u22FC", "nisd": "\u22FA", "niv": "\u220B", "NJcy": "\u040A", "njcy": "\u045A", "nlarr": "\u219A", "nlArr": "\u21CD", "nldr": "\u2025", "nlE": "\u2266\u0338", "nle": "\u2270", "nleftarrow": "\u219A", "nLeftarrow": "\u21CD", "nleftrightarrow": "\u21AE", "nLeftrightarrow": "\u21CE", "nleq": "\u2270", "nleqq": "\u2266\u0338", "nleqslant": "\u2A7D\u0338", "nles": "\u2A7D\u0338", "nless": "\u226E", "nLl": "\u22D8\u0338", "nlsim": "\u2274", "nLt": "\u226A\u20D2", "nlt": "\u226E", "nltri": "\u22EA", "nltrie": "\u22EC", "nLtv": "\u226A\u0338", "nmid": "\u2224", "NoBreak": "\u2060", "NonBreakingSpace": "\u00A0", "nopf": "\uD835\uDD5F", "Nopf": "\u2115", "Not": "\u2AEC", "not": "\u00AC", "NotCongruent": "\u2262", "NotCupCap": "\u226D", "NotDoubleVerticalBar": "\u2226", "NotElement": "\u2209", "NotEqual": "\u2260", "NotEqualTilde": "\u2242\u0338", "NotExists": "\u2204", "NotGreater": "\u226F", "NotGreaterEqual": "\u2271", "NotGreaterFullEqual": "\u2267\u0338", "NotGreaterGreater": "\u226B\u0338", "NotGreaterLess": "\u2279", "NotGreaterSlantEqual": "\u2A7E\u0338", "NotGreaterTilde": "\u2275", "NotHumpDownHump": "\u224E\u0338", "NotHumpEqual": "\u224F\u0338", "notin": "\u2209", "notindot": "\u22F5\u0338", "notinE": "\u22F9\u0338", "notinva": "\u2209", "notinvb": "\u22F7", "notinvc": "\u22F6", "NotLeftTriangleBar": "\u29CF\u0338", "NotLeftTriangle": "\u22EA", "NotLeftTriangleEqual": "\u22EC", "NotLess": "\u226E", "NotLessEqual": "\u2270", "NotLessGreater": "\u2278", "NotLessLess": "\u226A\u0338", "NotLessSlantEqual": "\u2A7D\u0338", "NotLessTilde": "\u2274", "NotNestedGreaterGreater": "\u2AA2\u0338", "NotNestedLessLess": "\u2AA1\u0338", "notni": "\u220C", "notniva": "\u220C", "notnivb": "\u22FE", "notnivc": "\u22FD", "NotPrecedes": "\u2280", "NotPrecedesEqual": "\u2AAF\u0338", "NotPrecedesSlantEqual": "\u22E0", "NotReverseElement": "\u220C", "NotRightTriangleBar": "\u29D0\u0338", "NotRightTriangle": "\u22EB", "NotRightTriangleEqual": "\u22ED", "NotSquareSubset": "\u228F\u0338", "NotSquareSubsetEqual": "\u22E2", "NotSquareSuperset": "\u2290\u0338", "NotSquareSupersetEqual": "\u22E3", "NotSubset": "\u2282\u20D2", "NotSubsetEqual": "\u2288", "NotSucceeds": "\u2281", "NotSucceedsEqual": "\u2AB0\u0338", "NotSucceedsSlantEqual": "\u22E1", "NotSucceedsTilde": "\u227F\u0338", "NotSuperset": "\u2283\u20D2", "NotSupersetEqual": "\u2289", "NotTilde": "\u2241", "NotTildeEqual": "\u2244", "NotTildeFullEqual": "\u2247", "NotTildeTilde": "\u2249", "NotVerticalBar": "\u2224", "nparallel": "\u2226", "npar": "\u2226", "nparsl": "\u2AFD\u20E5", "npart": "\u2202\u0338", "npolint": "\u2A14", "npr": "\u2280", "nprcue": "\u22E0", "nprec": "\u2280", "npreceq": "\u2AAF\u0338", "npre": "\u2AAF\u0338", "nrarrc": "\u2933\u0338", "nrarr": "\u219B", "nrArr": "\u21CF", "nrarrw": "\u219D\u0338", "nrightarrow": "\u219B", "nRightarrow": "\u21CF", "nrtri": "\u22EB", "nrtrie": "\u22ED", "nsc": "\u2281", "nsccue": "\u22E1", "nsce": "\u2AB0\u0338", "Nscr": "\uD835\uDCA9", "nscr": "\uD835\uDCC3", "nshortmid": "\u2224", "nshortparallel": "\u2226", "nsim": "\u2241", "nsime": "\u2244", "nsimeq": "\u2244", "nsmid": "\u2224", "nspar": "\u2226", "nsqsube": "\u22E2", "nsqsupe": "\u22E3", "nsub": "\u2284", "nsubE": "\u2AC5\u0338", "nsube": "\u2288", "nsubset": "\u2282\u20D2", "nsubseteq": "\u2288", "nsubseteqq": "\u2AC5\u0338", "nsucc": "\u2281", "nsucceq": "\u2AB0\u0338", "nsup": "\u2285", "nsupE": "\u2AC6\u0338", "nsupe": "\u2289", "nsupset": "\u2283\u20D2", "nsupseteq": "\u2289", "nsupseteqq": "\u2AC6\u0338", "ntgl": "\u2279", "Ntilde": "\u00D1", "ntilde": "\u00F1", "ntlg": "\u2278", "ntriangleleft": "\u22EA", "ntrianglelefteq": "\u22EC", "ntriangleright": "\u22EB", "ntrianglerighteq": "\u22ED", "Nu": "\u039D", "nu": "\u03BD", "num": "#", "numero": "\u2116", "numsp": "\u2007", "nvap": "\u224D\u20D2", "nvdash": "\u22AC", "nvDash": "\u22AD", "nVdash": "\u22AE", "nVDash": "\u22AF", "nvge": "\u2265\u20D2", "nvgt": ">\u20D2", "nvHarr": "\u2904", "nvinfin": "\u29DE", "nvlArr": "\u2902", "nvle": "\u2264\u20D2", "nvlt": "<\u20D2", "nvltrie": "\u22B4\u20D2", "nvrArr": "\u2903", "nvrtrie": "\u22B5\u20D2", "nvsim": "\u223C\u20D2", "nwarhk": "\u2923", "nwarr": "\u2196", "nwArr": "\u21D6", "nwarrow": "\u2196", "nwnear": "\u2927", "Oacute": "\u00D3", "oacute": "\u00F3", "oast": "\u229B", "Ocirc": "\u00D4", "ocirc": "\u00F4", "ocir": "\u229A", "Ocy": "\u041E", "ocy": "\u043E", "odash": "\u229D", "Odblac": "\u0150", "odblac": "\u0151", "odiv": "\u2A38", "odot": "\u2299", "odsold": "\u29BC", "OElig": "\u0152", "oelig": "\u0153", "ofcir": "\u29BF", "Ofr": "\uD835\uDD12", "ofr": "\uD835\uDD2C", "ogon": "\u02DB", "Ograve": "\u00D2", "ograve": "\u00F2", "ogt": "\u29C1", "ohbar": "\u29B5", "ohm": "\u03A9", "oint": "\u222E", "olarr": "\u21BA", "olcir": "\u29BE", "olcross": "\u29BB", "oline": "\u203E", "olt": "\u29C0", "Omacr": "\u014C", "omacr": "\u014D", "Omega": "\u03A9", "omega": "\u03C9", "Omicron": "\u039F", "omicron": "\u03BF", "omid": "\u29B6", "ominus": "\u2296", "Oopf": "\uD835\uDD46", "oopf": "\uD835\uDD60", "opar": "\u29B7", "OpenCurlyDoubleQuote": "\u201C", "OpenCurlyQuote": "\u2018", "operp": "\u29B9", "oplus": "\u2295", "orarr": "\u21BB", "Or": "\u2A54", "or": "\u2228", "ord": "\u2A5D", "order": "\u2134", "orderof": "\u2134", "ordf": "\u00AA", "ordm": "\u00BA", "origof": "\u22B6", "oror": "\u2A56", "orslope": "\u2A57", "orv": "\u2A5B", "oS": "\u24C8", "Oscr": "\uD835\uDCAA", "oscr": "\u2134", "Oslash": "\u00D8", "oslash": "\u00F8", "osol": "\u2298", "Otilde": "\u00D5", "otilde": "\u00F5", "otimesas": "\u2A36", "Otimes": "\u2A37", "otimes": "\u2297", "Ouml": "\u00D6", "ouml": "\u00F6", "ovbar": "\u233D", "OverBar": "\u203E", "OverBrace": "\u23DE", "OverBracket": "\u23B4", "OverParenthesis": "\u23DC", "para": "\u00B6", "parallel": "\u2225", "par": "\u2225", "parsim": "\u2AF3", "parsl": "\u2AFD", "part": "\u2202", "PartialD": "\u2202", "Pcy": "\u041F", "pcy": "\u043F", "percnt": "%", "period": ".", "permil": "\u2030", "perp": "\u22A5", "pertenk": "\u2031", "Pfr": "\uD835\uDD13", "pfr": "\uD835\uDD2D", "Phi": "\u03A6", "phi": "\u03C6", "phiv": "\u03D5", "phmmat": "\u2133", "phone": "\u260E", "Pi": "\u03A0", "pi": "\u03C0", "pitchfork": "\u22D4", "piv": "\u03D6", "planck": "\u210F", "planckh": "\u210E", "plankv": "\u210F", "plusacir": "\u2A23", "plusb": "\u229E", "pluscir": "\u2A22", "plus": "+", "plusdo": "\u2214", "plusdu": "\u2A25", "pluse": "\u2A72", "PlusMinus": "\u00B1", "plusmn": "\u00B1", "plussim": "\u2A26", "plustwo": "\u2A27", "pm": "\u00B1", "Poincareplane": "\u210C", "pointint": "\u2A15", "popf": "\uD835\uDD61", "Popf": "\u2119", "pound": "\u00A3", "prap": "\u2AB7", "Pr": "\u2ABB", "pr": "\u227A", "prcue": "\u227C", "precapprox": "\u2AB7", "prec": "\u227A", "preccurlyeq": "\u227C", "Precedes": "\u227A", "PrecedesEqual": "\u2AAF", "PrecedesSlantEqual": "\u227C", "PrecedesTilde": "\u227E", "preceq": "\u2AAF", "precnapprox": "\u2AB9", "precneqq": "\u2AB5", "precnsim": "\u22E8", "pre": "\u2AAF", "prE": "\u2AB3", "precsim": "\u227E", "prime": "\u2032", "Prime": "\u2033", "primes": "\u2119", "prnap": "\u2AB9", "prnE": "\u2AB5", "prnsim": "\u22E8", "prod": "\u220F", "Product": "\u220F", "profalar": "\u232E", "profline": "\u2312", "profsurf": "\u2313", "prop": "\u221D", "Proportional": "\u221D", "Proportion": "\u2237", "propto": "\u221D", "prsim": "\u227E", "prurel": "\u22B0", "Pscr": "\uD835\uDCAB", "pscr": "\uD835\uDCC5", "Psi": "\u03A8", "psi": "\u03C8", "puncsp": "\u2008", "Qfr": "\uD835\uDD14", "qfr": "\uD835\uDD2E", "qint": "\u2A0C", "qopf": "\uD835\uDD62", "Qopf": "\u211A", "qprime": "\u2057", "Qscr": "\uD835\uDCAC", "qscr": "\uD835\uDCC6", "quaternions": "\u210D", "quatint": "\u2A16", "quest": "?", "questeq": "\u225F", "quot": "\"", "QUOT": "\"", "rAarr": "\u21DB", "race": "\u223D\u0331", "Racute": "\u0154", "racute": "\u0155", "radic": "\u221A", "raemptyv": "\u29B3", "rang": "\u27E9", "Rang": "\u27EB", "rangd": "\u2992", "range": "\u29A5", "rangle": "\u27E9", "raquo": "\u00BB", "rarrap": "\u2975", "rarrb": "\u21E5", "rarrbfs": "\u2920", "rarrc": "\u2933", "rarr": "\u2192", "Rarr": "\u21A0", "rArr": "\u21D2", "rarrfs": "\u291E", "rarrhk": "\u21AA", "rarrlp": "\u21AC", "rarrpl": "\u2945", "rarrsim": "\u2974", "Rarrtl": "\u2916", "rarrtl": "\u21A3", "rarrw": "\u219D", "ratail": "\u291A", "rAtail": "\u291C", "ratio": "\u2236", "rationals": "\u211A", "rbarr": "\u290D", "rBarr": "\u290F", "RBarr": "\u2910", "rbbrk": "\u2773", "rbrace": "}", "rbrack": "]", "rbrke": "\u298C", "rbrksld": "\u298E", "rbrkslu": "\u2990", "Rcaron": "\u0158", "rcaron": "\u0159", "Rcedil": "\u0156", "rcedil": "\u0157", "rceil": "\u2309", "rcub": "}", "Rcy": "\u0420", "rcy": "\u0440", "rdca": "\u2937", "rdldhar": "\u2969", "rdquo": "\u201D", "rdquor": "\u201D", "rdsh": "\u21B3", "real": "\u211C", "realine": "\u211B", "realpart": "\u211C", "reals": "\u211D", "Re": "\u211C", "rect": "\u25AD", "reg": "\u00AE", "REG": "\u00AE", "ReverseElement": "\u220B", "ReverseEquilibrium": "\u21CB", "ReverseUpEquilibrium": "\u296F", "rfisht": "\u297D", "rfloor": "\u230B", "rfr": "\uD835\uDD2F", "Rfr": "\u211C", "rHar": "\u2964", "rhard": "\u21C1", "rharu": "\u21C0", "rharul": "\u296C", "Rho": "\u03A1", "rho": "\u03C1", "rhov": "\u03F1", "RightAngleBracket": "\u27E9", "RightArrowBar": "\u21E5", "rightarrow": "\u2192", "RightArrow": "\u2192", "Rightarrow": "\u21D2", "RightArrowLeftArrow": "\u21C4", "rightarrowtail": "\u21A3", "RightCeiling": "\u2309", "RightDoubleBracket": "\u27E7", "RightDownTeeVector": "\u295D", "RightDownVectorBar": "\u2955", "RightDownVector": "\u21C2", "RightFloor": "\u230B", "rightharpoondown": "\u21C1", "rightharpoonup": "\u21C0", "rightleftarrows": "\u21C4", "rightleftharpoons": "\u21CC", "rightrightarrows": "\u21C9", "rightsquigarrow": "\u219D", "RightTeeArrow": "\u21A6", "RightTee": "\u22A2", "RightTeeVector": "\u295B", "rightthreetimes": "\u22CC", "RightTriangleBar": "\u29D0", "RightTriangle": "\u22B3", "RightTriangleEqual": "\u22B5", "RightUpDownVector": "\u294F", "RightUpTeeVector": "\u295C", "RightUpVectorBar": "\u2954", "RightUpVector": "\u21BE", "RightVectorBar": "\u2953", "RightVector": "\u21C0", "ring": "\u02DA", "risingdotseq": "\u2253", "rlarr": "\u21C4", "rlhar": "\u21CC", "rlm": "\u200F", "rmoustache": "\u23B1", "rmoust": "\u23B1", "rnmid": "\u2AEE", "roang": "\u27ED", "roarr": "\u21FE", "robrk": "\u27E7", "ropar": "\u2986", "ropf": "\uD835\uDD63", "Ropf": "\u211D", "roplus": "\u2A2E", "rotimes": "\u2A35", "RoundImplies": "\u2970", "rpar": ")", "rpargt": "\u2994", "rppolint": "\u2A12", "rrarr": "\u21C9", "Rrightarrow": "\u21DB", "rsaquo": "\u203A", "rscr": "\uD835\uDCC7", "Rscr": "\u211B", "rsh": "\u21B1", "Rsh": "\u21B1", "rsqb": "]", "rsquo": "\u2019", "rsquor": "\u2019", "rthree": "\u22CC", "rtimes": "\u22CA", "rtri": "\u25B9", "rtrie": "\u22B5", "rtrif": "\u25B8", "rtriltri": "\u29CE", "RuleDelayed": "\u29F4", "ruluhar": "\u2968", "rx": "\u211E", "Sacute": "\u015A", "sacute": "\u015B", "sbquo": "\u201A", "scap": "\u2AB8", "Scaron": "\u0160", "scaron": "\u0161", "Sc": "\u2ABC", "sc": "\u227B", "sccue": "\u227D", "sce": "\u2AB0", "scE": "\u2AB4", "Scedil": "\u015E", "scedil": "\u015F", "Scirc": "\u015C", "scirc": "\u015D", "scnap": "\u2ABA", "scnE": "\u2AB6", "scnsim": "\u22E9", "scpolint": "\u2A13", "scsim": "\u227F", "Scy": "\u0421", "scy": "\u0441", "sdotb": "\u22A1", "sdot": "\u22C5", "sdote": "\u2A66", "searhk": "\u2925", "searr": "\u2198", "seArr": "\u21D8", "searrow": "\u2198", "sect": "\u00A7", "semi": ";", "seswar": "\u2929", "setminus": "\u2216", "setmn": "\u2216", "sext": "\u2736", "Sfr": "\uD835\uDD16", "sfr": "\uD835\uDD30", "sfrown": "\u2322", "sharp": "\u266F", "SHCHcy": "\u0429", "shchcy": "\u0449", "SHcy": "\u0428", "shcy": "\u0448", "ShortDownArrow": "\u2193", "ShortLeftArrow": "\u2190", "shortmid": "\u2223", "shortparallel": "\u2225", "ShortRightArrow": "\u2192", "ShortUpArrow": "\u2191", "shy": "\u00AD", "Sigma": "\u03A3", "sigma": "\u03C3", "sigmaf": "\u03C2", "sigmav": "\u03C2", "sim": "\u223C", "simdot": "\u2A6A", "sime": "\u2243", "simeq": "\u2243", "simg": "\u2A9E", "simgE": "\u2AA0", "siml": "\u2A9D", "simlE": "\u2A9F", "simne": "\u2246", "simplus": "\u2A24", "simrarr": "\u2972", "slarr": "\u2190", "SmallCircle": "\u2218", "smallsetminus": "\u2216", "smashp": "\u2A33", "smeparsl": "\u29E4", "smid": "\u2223", "smile": "\u2323", "smt": "\u2AAA", "smte": "\u2AAC", "smtes": "\u2AAC\uFE00", "SOFTcy": "\u042C", "softcy": "\u044C", "solbar": "\u233F", "solb": "\u29C4", "sol": "/", "Sopf": "\uD835\uDD4A", "sopf": "\uD835\uDD64", "spades": "\u2660", "spadesuit": "\u2660", "spar": "\u2225", "sqcap": "\u2293", "sqcaps": "\u2293\uFE00", "sqcup": "\u2294", "sqcups": "\u2294\uFE00", "Sqrt": "\u221A", "sqsub": "\u228F", "sqsube": "\u2291", "sqsubset": "\u228F", "sqsubseteq": "\u2291", "sqsup": "\u2290", "sqsupe": "\u2292", "sqsupset": "\u2290", "sqsupseteq": "\u2292", "square": "\u25A1", "Square": "\u25A1", "SquareIntersection": "\u2293", "SquareSubset": "\u228F", "SquareSubsetEqual": "\u2291", "SquareSuperset": "\u2290", "SquareSupersetEqual": "\u2292", "SquareUnion": "\u2294", "squarf": "\u25AA", "squ": "\u25A1", "squf": "\u25AA", "srarr": "\u2192", "Sscr": "\uD835\uDCAE", "sscr": "\uD835\uDCC8", "ssetmn": "\u2216", "ssmile": "\u2323", "sstarf": "\u22C6", "Star": "\u22C6", "star": "\u2606", "starf": "\u2605", "straightepsilon": "\u03F5", "straightphi": "\u03D5", "strns": "\u00AF", "sub": "\u2282", "Sub": "\u22D0", "subdot": "\u2ABD", "subE": "\u2AC5", "sube": "\u2286", "subedot": "\u2AC3", "submult": "\u2AC1", "subnE": "\u2ACB", "subne": "\u228A", "subplus": "\u2ABF", "subrarr": "\u2979", "subset": "\u2282", "Subset": "\u22D0", "subseteq": "\u2286", "subseteqq": "\u2AC5", "SubsetEqual": "\u2286", "subsetneq": "\u228A", "subsetneqq": "\u2ACB", "subsim": "\u2AC7", "subsub": "\u2AD5", "subsup": "\u2AD3", "succapprox": "\u2AB8", "succ": "\u227B", "succcurlyeq": "\u227D", "Succeeds": "\u227B", "SucceedsEqual": "\u2AB0", "SucceedsSlantEqual": "\u227D", "SucceedsTilde": "\u227F", "succeq": "\u2AB0", "succnapprox": "\u2ABA", "succneqq": "\u2AB6", "succnsim": "\u22E9", "succsim": "\u227F", "SuchThat": "\u220B", "sum": "\u2211", "Sum": "\u2211", "sung": "\u266A", "sup1": "\u00B9", "sup2": "\u00B2", "sup3": "\u00B3", "sup": "\u2283", "Sup": "\u22D1", "supdot": "\u2ABE", "supdsub": "\u2AD8", "supE": "\u2AC6", "supe": "\u2287", "supedot": "\u2AC4", "Superset": "\u2283", "SupersetEqual": "\u2287", "suphsol": "\u27C9", "suphsub": "\u2AD7", "suplarr": "\u297B", "supmult": "\u2AC2", "supnE": "\u2ACC", "supne": "\u228B", "supplus": "\u2AC0", "supset": "\u2283", "Supset": "\u22D1", "supseteq": "\u2287", "supseteqq": "\u2AC6", "supsetneq": "\u228B", "supsetneqq": "\u2ACC", "supsim": "\u2AC8", "supsub": "\u2AD4", "supsup": "\u2AD6", "swarhk": "\u2926", "swarr": "\u2199", "swArr": "\u21D9", "swarrow": "\u2199", "swnwar": "\u292A", "szlig": "\u00DF", "Tab": "\t", "target": "\u2316", "Tau": "\u03A4", "tau": "\u03C4", "tbrk": "\u23B4", "Tcaron": "\u0164", "tcaron": "\u0165", "Tcedil": "\u0162", "tcedil": "\u0163", "Tcy": "\u0422", "tcy": "\u0442", "tdot": "\u20DB", "telrec": "\u2315", "Tfr": "\uD835\uDD17", "tfr": "\uD835\uDD31", "there4": "\u2234", "therefore": "\u2234", "Therefore": "\u2234", "Theta": "\u0398", "theta": "\u03B8", "thetasym": "\u03D1", "thetav": "\u03D1", "thickapprox": "\u2248", "thicksim": "\u223C", "ThickSpace": "\u205F\u200A", "ThinSpace": "\u2009", "thinsp": "\u2009", "thkap": "\u2248", "thksim": "\u223C", "THORN": "\u00DE", "thorn": "\u00FE", "tilde": "\u02DC", "Tilde": "\u223C", "TildeEqual": "\u2243", "TildeFullEqual": "\u2245", "TildeTilde": "\u2248", "timesbar": "\u2A31", "timesb": "\u22A0", "times": "\u00D7", "timesd": "\u2A30", "tint": "\u222D", "toea": "\u2928", "topbot": "\u2336", "topcir": "\u2AF1", "top": "\u22A4", "Topf": "\uD835\uDD4B", "topf": "\uD835\uDD65", "topfork": "\u2ADA", "tosa": "\u2929", "tprime": "\u2034", "trade": "\u2122", "TRADE": "\u2122", "triangle": "\u25B5", "triangledown": "\u25BF", "triangleleft": "\u25C3", "trianglelefteq": "\u22B4", "triangleq": "\u225C", "triangleright": "\u25B9", "trianglerighteq": "\u22B5", "tridot": "\u25EC", "trie": "\u225C", "triminus": "\u2A3A", "TripleDot": "\u20DB", "triplus": "\u2A39", "trisb": "\u29CD", "tritime": "\u2A3B", "trpezium": "\u23E2", "Tscr": "\uD835\uDCAF", "tscr": "\uD835\uDCC9", "TScy": "\u0426", "tscy": "\u0446", "TSHcy": "\u040B", "tshcy": "\u045B", "Tstrok": "\u0166", "tstrok": "\u0167", "twixt": "\u226C", "twoheadleftarrow": "\u219E", "twoheadrightarrow": "\u21A0", "Uacute": "\u00DA", "uacute": "\u00FA", "uarr": "\u2191", "Uarr": "\u219F", "uArr": "\u21D1", "Uarrocir": "\u2949", "Ubrcy": "\u040E", "ubrcy": "\u045E", "Ubreve": "\u016C", "ubreve": "\u016D", "Ucirc": "\u00DB", "ucirc": "\u00FB", "Ucy": "\u0423", "ucy": "\u0443", "udarr": "\u21C5", "Udblac": "\u0170", "udblac": "\u0171", "udhar": "\u296E", "ufisht": "\u297E", "Ufr": "\uD835\uDD18", "ufr": "\uD835\uDD32", "Ugrave": "\u00D9", "ugrave": "\u00F9", "uHar": "\u2963", "uharl": "\u21BF", "uharr": "\u21BE", "uhblk": "\u2580", "ulcorn": "\u231C", "ulcorner": "\u231C", "ulcrop": "\u230F", "ultri": "\u25F8", "Umacr": "\u016A", "umacr": "\u016B", "uml": "\u00A8", "UnderBar": "_", "UnderBrace": "\u23DF", "UnderBracket": "\u23B5", "UnderParenthesis": "\u23DD", "Union": "\u22C3", "UnionPlus": "\u228E", "Uogon": "\u0172", "uogon": "\u0173", "Uopf": "\uD835\uDD4C", "uopf": "\uD835\uDD66", "UpArrowBar": "\u2912", "uparrow": "\u2191", "UpArrow": "\u2191", "Uparrow": "\u21D1", "UpArrowDownArrow": "\u21C5", "updownarrow": "\u2195", "UpDownArrow": "\u2195", "Updownarrow": "\u21D5", "UpEquilibrium": "\u296E", "upharpoonleft": "\u21BF", "upharpoonright": "\u21BE", "uplus": "\u228E", "UpperLeftArrow": "\u2196", "UpperRightArrow": "\u2197", "upsi": "\u03C5", "Upsi": "\u03D2", "upsih": "\u03D2", "Upsilon": "\u03A5", "upsilon": "\u03C5", "UpTeeArrow": "\u21A5", "UpTee": "\u22A5", "upuparrows": "\u21C8", "urcorn": "\u231D", "urcorner": "\u231D", "urcrop": "\u230E", "Uring": "\u016E", "uring": "\u016F", "urtri": "\u25F9", "Uscr": "\uD835\uDCB0", "uscr": "\uD835\uDCCA", "utdot": "\u22F0", "Utilde": "\u0168", "utilde": "\u0169", "utri": "\u25B5", "utrif": "\u25B4", "uuarr": "\u21C8", "Uuml": "\u00DC", "uuml": "\u00FC", "uwangle": "\u29A7", "vangrt": "\u299C", "varepsilon": "\u03F5", "varkappa": "\u03F0", "varnothing": "\u2205", "varphi": "\u03D5", "varpi": "\u03D6", "varpropto": "\u221D", "varr": "\u2195", "vArr": "\u21D5", "varrho": "\u03F1", "varsigma": "\u03C2", "varsubsetneq": "\u228A\uFE00", "varsubsetneqq": "\u2ACB\uFE00", "varsupsetneq": "\u228B\uFE00", "varsupsetneqq": "\u2ACC\uFE00", "vartheta": "\u03D1", "vartriangleleft": "\u22B2", "vartriangleright": "\u22B3", "vBar": "\u2AE8", "Vbar": "\u2AEB", "vBarv": "\u2AE9", "Vcy": "\u0412", "vcy": "\u0432", "vdash": "\u22A2", "vDash": "\u22A8", "Vdash": "\u22A9", "VDash": "\u22AB", "Vdashl": "\u2AE6", "veebar": "\u22BB", "vee": "\u2228", "Vee": "\u22C1", "veeeq": "\u225A", "vellip": "\u22EE", "verbar": "|", "Verbar": "\u2016", "vert": "|", "Vert": "\u2016", "VerticalBar": "\u2223", "VerticalLine": "|", "VerticalSeparator": "\u2758", "VerticalTilde": "\u2240", "VeryThinSpace": "\u200A", "Vfr": "\uD835\uDD19", "vfr": "\uD835\uDD33", "vltri": "\u22B2", "vnsub": "\u2282\u20D2", "vnsup": "\u2283\u20D2", "Vopf": "\uD835\uDD4D", "vopf": "\uD835\uDD67", "vprop": "\u221D", "vrtri": "\u22B3", "Vscr": "\uD835\uDCB1", "vscr": "\uD835\uDCCB", "vsubnE": "\u2ACB\uFE00", "vsubne": "\u228A\uFE00", "vsupnE": "\u2ACC\uFE00", "vsupne": "\u228B\uFE00", "Vvdash": "\u22AA", "vzigzag": "\u299A", "Wcirc": "\u0174", "wcirc": "\u0175", "wedbar": "\u2A5F", "wedge": "\u2227", "Wedge": "\u22C0", "wedgeq": "\u2259", "weierp": "\u2118", "Wfr": "\uD835\uDD1A", "wfr": "\uD835\uDD34", "Wopf": "\uD835\uDD4E", "wopf": "\uD835\uDD68", "wp": "\u2118", "wr": "\u2240", "wreath": "\u2240", "Wscr": "\uD835\uDCB2", "wscr": "\uD835\uDCCC", "xcap": "\u22C2", "xcirc": "\u25EF", "xcup": "\u22C3", "xdtri": "\u25BD", "Xfr": "\uD835\uDD1B", "xfr": "\uD835\uDD35", "xharr": "\u27F7", "xhArr": "\u27FA", "Xi": "\u039E", "xi": "\u03BE", "xlarr": "\u27F5", "xlArr": "\u27F8", "xmap": "\u27FC", "xnis": "\u22FB", "xodot": "\u2A00", "Xopf": "\uD835\uDD4F", "xopf": "\uD835\uDD69", "xoplus": "\u2A01", "xotime": "\u2A02", "xrarr": "\u27F6", "xrArr": "\u27F9", "Xscr": "\uD835\uDCB3", "xscr": "\uD835\uDCCD", "xsqcup": "\u2A06", "xuplus": "\u2A04", "xutri": "\u25B3", "xvee": "\u22C1", "xwedge": "\u22C0", "Yacute": "\u00DD", "yacute": "\u00FD", "YAcy": "\u042F", "yacy": "\u044F", "Ycirc": "\u0176", "ycirc": "\u0177", "Ycy": "\u042B", "ycy": "\u044B", "yen": "\u00A5", "Yfr": "\uD835\uDD1C", "yfr": "\uD835\uDD36", "YIcy": "\u0407", "yicy": "\u0457", "Yopf": "\uD835\uDD50", "yopf": "\uD835\uDD6A", "Yscr": "\uD835\uDCB4", "yscr": "\uD835\uDCCE", "YUcy": "\u042E", "yucy": "\u044E", "yuml": "\u00FF", "Yuml": "\u0178", "Zacute": "\u0179", "zacute": "\u017A", "Zcaron": "\u017D", "zcaron": "\u017E", "Zcy": "\u0417", "zcy": "\u0437", "Zdot": "\u017B", "zdot": "\u017C", "zeetrf": "\u2128", "ZeroWidthSpace": "\u200B", "Zeta": "\u0396", "zeta": "\u03B6", "zfr": "\uD835\uDD37", "Zfr": "\u2128", "ZHcy": "\u0416", "zhcy": "\u0436", "zigrarr": "\u21DD", "zopf": "\uD835\uDD6B", "Zopf": "\u2124", "Zscr": "\uD835\uDCB5", "zscr": "\uD835\uDCCF", "zwj": "\u200D", "zwnj": "\u200C" }

},{}],64:[function(require,module,exports){
module.exports={ "Aacute": "\u00C1", "aacute": "\u00E1", "Acirc": "\u00C2", "acirc": "\u00E2", "acute": "\u00B4", "AElig": "\u00C6", "aelig": "\u00E6", "Agrave": "\u00C0", "agrave": "\u00E0", "amp": "&", "AMP": "&", "Aring": "\u00C5", "aring": "\u00E5", "Atilde": "\u00C3", "atilde": "\u00E3", "Auml": "\u00C4", "auml": "\u00E4", "brvbar": "\u00A6", "Ccedil": "\u00C7", "ccedil": "\u00E7", "cedil": "\u00B8", "cent": "\u00A2", "copy": "\u00A9", "COPY": "\u00A9", "curren": "\u00A4", "deg": "\u00B0", "divide": "\u00F7", "Eacute": "\u00C9", "eacute": "\u00E9", "Ecirc": "\u00CA", "ecirc": "\u00EA", "Egrave": "\u00C8", "egrave": "\u00E8", "ETH": "\u00D0", "eth": "\u00F0", "Euml": "\u00CB", "euml": "\u00EB", "frac12": "\u00BD", "frac14": "\u00BC", "frac34": "\u00BE", "gt": ">", "GT": ">", "Iacute": "\u00CD", "iacute": "\u00ED", "Icirc": "\u00CE", "icirc": "\u00EE", "iexcl": "\u00A1", "Igrave": "\u00CC", "igrave": "\u00EC", "iquest": "\u00BF", "Iuml": "\u00CF", "iuml": "\u00EF", "laquo": "\u00AB", "lt": "<", "LT": "<", "macr": "\u00AF", "micro": "\u00B5", "middot": "\u00B7", "nbsp": "\u00A0", "not": "\u00AC", "Ntilde": "\u00D1", "ntilde": "\u00F1", "Oacute": "\u00D3", "oacute": "\u00F3", "Ocirc": "\u00D4", "ocirc": "\u00F4", "Ograve": "\u00D2", "ograve": "\u00F2", "ordf": "\u00AA", "ordm": "\u00BA", "Oslash": "\u00D8", "oslash": "\u00F8", "Otilde": "\u00D5", "otilde": "\u00F5", "Ouml": "\u00D6", "ouml": "\u00F6", "para": "\u00B6", "plusmn": "\u00B1", "pound": "\u00A3", "quot": "\"", "QUOT": "\"", "raquo": "\u00BB", "reg": "\u00AE", "REG": "\u00AE", "sect": "\u00A7", "shy": "\u00AD", "sup1": "\u00B9", "sup2": "\u00B2", "sup3": "\u00B3", "szlig": "\u00DF", "THORN": "\u00DE", "thorn": "\u00FE", "times": "\u00D7", "Uacute": "\u00DA", "uacute": "\u00FA", "Ucirc": "\u00DB", "ucirc": "\u00FB", "Ugrave": "\u00D9", "ugrave": "\u00F9", "uml": "\u00A8", "Uuml": "\u00DC", "uuml": "\u00FC", "Yacute": "\u00DD", "yacute": "\u00FD", "yen": "\u00A5", "yuml": "\u00FF" }

},{}],65:[function(require,module,exports){
module.exports={ "amp": "&", "apos": "'", "gt": ">", "lt": "<", "quot": "\"" }

},{}],66:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],67:[function(require,module,exports){
module.exports = function flatten(list, depth) {
  depth = (typeof depth == 'number') ? depth : Infinity;

  if (!depth) {
    if (Array.isArray(list)) {
      return list.map(function(i) { return i; });
    }
    return list;
  }

  return _flatten(list, 1);

  function _flatten(list, d) {
    return list.reduce(function (acc, item) {
      if (Array.isArray(item) && d < depth) {
        return acc.concat(_flatten(item, d + 1));
      }
      else {
        return acc.concat(item);
      }
    }, []);
  }
};

},{}],68:[function(require,module,exports){
(function (global){
var win;

if (typeof window !== "undefined") {
    win = window;
} else if (typeof global !== "undefined") {
    win = global;
} else if (typeof self !== "undefined"){
    win = self;
} else {
    win = {};
}

module.exports = win;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],69:[function(require,module,exports){
(function (global){
/*! https://mths.be/he v1.2.0 by @mathias | MIT license */
;(function(root) {

	// Detect free variables `exports`.
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`.
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`.
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	// All astral symbols.
	var regexAstralSymbols = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	// All ASCII symbols (not just printable ASCII) except those listed in the
	// first column of the overrides table.
	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides
	var regexAsciiWhitelist = /[\x01-\x7F]/g;
	// All BMP symbols that are not ASCII newlines, printable ASCII symbols, or
	// code points listed in the first column of the overrides table on
	// https://html.spec.whatwg.org/multipage/syntax.html#table-charref-overrides.
	var regexBmpWhitelist = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;

	var regexEncodeNonAscii = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g;
	var encodeMap = {'\xAD':'shy','\u200C':'zwnj','\u200D':'zwj','\u200E':'lrm','\u2063':'ic','\u2062':'it','\u2061':'af','\u200F':'rlm','\u200B':'ZeroWidthSpace','\u2060':'NoBreak','\u0311':'DownBreve','\u20DB':'tdot','\u20DC':'DotDot','\t':'Tab','\n':'NewLine','\u2008':'puncsp','\u205F':'MediumSpace','\u2009':'thinsp','\u200A':'hairsp','\u2004':'emsp13','\u2002':'ensp','\u2005':'emsp14','\u2003':'emsp','\u2007':'numsp','\xA0':'nbsp','\u205F\u200A':'ThickSpace','\u203E':'oline','_':'lowbar','\u2010':'dash','\u2013':'ndash','\u2014':'mdash','\u2015':'horbar',',':'comma',';':'semi','\u204F':'bsemi',':':'colon','\u2A74':'Colone','!':'excl','\xA1':'iexcl','?':'quest','\xBF':'iquest','.':'period','\u2025':'nldr','\u2026':'mldr','\xB7':'middot','\'':'apos','\u2018':'lsquo','\u2019':'rsquo','\u201A':'sbquo','\u2039':'lsaquo','\u203A':'rsaquo','"':'quot','\u201C':'ldquo','\u201D':'rdquo','\u201E':'bdquo','\xAB':'laquo','\xBB':'raquo','(':'lpar',')':'rpar','[':'lsqb',']':'rsqb','{':'lcub','}':'rcub','\u2308':'lceil','\u2309':'rceil','\u230A':'lfloor','\u230B':'rfloor','\u2985':'lopar','\u2986':'ropar','\u298B':'lbrke','\u298C':'rbrke','\u298D':'lbrkslu','\u298E':'rbrksld','\u298F':'lbrksld','\u2990':'rbrkslu','\u2991':'langd','\u2992':'rangd','\u2993':'lparlt','\u2994':'rpargt','\u2995':'gtlPar','\u2996':'ltrPar','\u27E6':'lobrk','\u27E7':'robrk','\u27E8':'lang','\u27E9':'rang','\u27EA':'Lang','\u27EB':'Rang','\u27EC':'loang','\u27ED':'roang','\u2772':'lbbrk','\u2773':'rbbrk','\u2016':'Vert','\xA7':'sect','\xB6':'para','@':'commat','*':'ast','/':'sol','undefined':null,'&':'amp','#':'num','%':'percnt','\u2030':'permil','\u2031':'pertenk','\u2020':'dagger','\u2021':'Dagger','\u2022':'bull','\u2043':'hybull','\u2032':'prime','\u2033':'Prime','\u2034':'tprime','\u2057':'qprime','\u2035':'bprime','\u2041':'caret','`':'grave','\xB4':'acute','\u02DC':'tilde','^':'Hat','\xAF':'macr','\u02D8':'breve','\u02D9':'dot','\xA8':'die','\u02DA':'ring','\u02DD':'dblac','\xB8':'cedil','\u02DB':'ogon','\u02C6':'circ','\u02C7':'caron','\xB0':'deg','\xA9':'copy','\xAE':'reg','\u2117':'copysr','\u2118':'wp','\u211E':'rx','\u2127':'mho','\u2129':'iiota','\u2190':'larr','\u219A':'nlarr','\u2192':'rarr','\u219B':'nrarr','\u2191':'uarr','\u2193':'darr','\u2194':'harr','\u21AE':'nharr','\u2195':'varr','\u2196':'nwarr','\u2197':'nearr','\u2198':'searr','\u2199':'swarr','\u219D':'rarrw','\u219D\u0338':'nrarrw','\u219E':'Larr','\u219F':'Uarr','\u21A0':'Rarr','\u21A1':'Darr','\u21A2':'larrtl','\u21A3':'rarrtl','\u21A4':'mapstoleft','\u21A5':'mapstoup','\u21A6':'map','\u21A7':'mapstodown','\u21A9':'larrhk','\u21AA':'rarrhk','\u21AB':'larrlp','\u21AC':'rarrlp','\u21AD':'harrw','\u21B0':'lsh','\u21B1':'rsh','\u21B2':'ldsh','\u21B3':'rdsh','\u21B5':'crarr','\u21B6':'cularr','\u21B7':'curarr','\u21BA':'olarr','\u21BB':'orarr','\u21BC':'lharu','\u21BD':'lhard','\u21BE':'uharr','\u21BF':'uharl','\u21C0':'rharu','\u21C1':'rhard','\u21C2':'dharr','\u21C3':'dharl','\u21C4':'rlarr','\u21C5':'udarr','\u21C6':'lrarr','\u21C7':'llarr','\u21C8':'uuarr','\u21C9':'rrarr','\u21CA':'ddarr','\u21CB':'lrhar','\u21CC':'rlhar','\u21D0':'lArr','\u21CD':'nlArr','\u21D1':'uArr','\u21D2':'rArr','\u21CF':'nrArr','\u21D3':'dArr','\u21D4':'iff','\u21CE':'nhArr','\u21D5':'vArr','\u21D6':'nwArr','\u21D7':'neArr','\u21D8':'seArr','\u21D9':'swArr','\u21DA':'lAarr','\u21DB':'rAarr','\u21DD':'zigrarr','\u21E4':'larrb','\u21E5':'rarrb','\u21F5':'duarr','\u21FD':'loarr','\u21FE':'roarr','\u21FF':'hoarr','\u2200':'forall','\u2201':'comp','\u2202':'part','\u2202\u0338':'npart','\u2203':'exist','\u2204':'nexist','\u2205':'empty','\u2207':'Del','\u2208':'in','\u2209':'notin','\u220B':'ni','\u220C':'notni','\u03F6':'bepsi','\u220F':'prod','\u2210':'coprod','\u2211':'sum','+':'plus','\xB1':'pm','\xF7':'div','\xD7':'times','<':'lt','\u226E':'nlt','<\u20D2':'nvlt','=':'equals','\u2260':'ne','=\u20E5':'bne','\u2A75':'Equal','>':'gt','\u226F':'ngt','>\u20D2':'nvgt','\xAC':'not','|':'vert','\xA6':'brvbar','\u2212':'minus','\u2213':'mp','\u2214':'plusdo','\u2044':'frasl','\u2216':'setmn','\u2217':'lowast','\u2218':'compfn','\u221A':'Sqrt','\u221D':'prop','\u221E':'infin','\u221F':'angrt','\u2220':'ang','\u2220\u20D2':'nang','\u2221':'angmsd','\u2222':'angsph','\u2223':'mid','\u2224':'nmid','\u2225':'par','\u2226':'npar','\u2227':'and','\u2228':'or','\u2229':'cap','\u2229\uFE00':'caps','\u222A':'cup','\u222A\uFE00':'cups','\u222B':'int','\u222C':'Int','\u222D':'tint','\u2A0C':'qint','\u222E':'oint','\u222F':'Conint','\u2230':'Cconint','\u2231':'cwint','\u2232':'cwconint','\u2233':'awconint','\u2234':'there4','\u2235':'becaus','\u2236':'ratio','\u2237':'Colon','\u2238':'minusd','\u223A':'mDDot','\u223B':'homtht','\u223C':'sim','\u2241':'nsim','\u223C\u20D2':'nvsim','\u223D':'bsim','\u223D\u0331':'race','\u223E':'ac','\u223E\u0333':'acE','\u223F':'acd','\u2240':'wr','\u2242':'esim','\u2242\u0338':'nesim','\u2243':'sime','\u2244':'nsime','\u2245':'cong','\u2247':'ncong','\u2246':'simne','\u2248':'ap','\u2249':'nap','\u224A':'ape','\u224B':'apid','\u224B\u0338':'napid','\u224C':'bcong','\u224D':'CupCap','\u226D':'NotCupCap','\u224D\u20D2':'nvap','\u224E':'bump','\u224E\u0338':'nbump','\u224F':'bumpe','\u224F\u0338':'nbumpe','\u2250':'doteq','\u2250\u0338':'nedot','\u2251':'eDot','\u2252':'efDot','\u2253':'erDot','\u2254':'colone','\u2255':'ecolon','\u2256':'ecir','\u2257':'cire','\u2259':'wedgeq','\u225A':'veeeq','\u225C':'trie','\u225F':'equest','\u2261':'equiv','\u2262':'nequiv','\u2261\u20E5':'bnequiv','\u2264':'le','\u2270':'nle','\u2264\u20D2':'nvle','\u2265':'ge','\u2271':'nge','\u2265\u20D2':'nvge','\u2266':'lE','\u2266\u0338':'nlE','\u2267':'gE','\u2267\u0338':'ngE','\u2268\uFE00':'lvnE','\u2268':'lnE','\u2269':'gnE','\u2269\uFE00':'gvnE','\u226A':'ll','\u226A\u0338':'nLtv','\u226A\u20D2':'nLt','\u226B':'gg','\u226B\u0338':'nGtv','\u226B\u20D2':'nGt','\u226C':'twixt','\u2272':'lsim','\u2274':'nlsim','\u2273':'gsim','\u2275':'ngsim','\u2276':'lg','\u2278':'ntlg','\u2277':'gl','\u2279':'ntgl','\u227A':'pr','\u2280':'npr','\u227B':'sc','\u2281':'nsc','\u227C':'prcue','\u22E0':'nprcue','\u227D':'sccue','\u22E1':'nsccue','\u227E':'prsim','\u227F':'scsim','\u227F\u0338':'NotSucceedsTilde','\u2282':'sub','\u2284':'nsub','\u2282\u20D2':'vnsub','\u2283':'sup','\u2285':'nsup','\u2283\u20D2':'vnsup','\u2286':'sube','\u2288':'nsube','\u2287':'supe','\u2289':'nsupe','\u228A\uFE00':'vsubne','\u228A':'subne','\u228B\uFE00':'vsupne','\u228B':'supne','\u228D':'cupdot','\u228E':'uplus','\u228F':'sqsub','\u228F\u0338':'NotSquareSubset','\u2290':'sqsup','\u2290\u0338':'NotSquareSuperset','\u2291':'sqsube','\u22E2':'nsqsube','\u2292':'sqsupe','\u22E3':'nsqsupe','\u2293':'sqcap','\u2293\uFE00':'sqcaps','\u2294':'sqcup','\u2294\uFE00':'sqcups','\u2295':'oplus','\u2296':'ominus','\u2297':'otimes','\u2298':'osol','\u2299':'odot','\u229A':'ocir','\u229B':'oast','\u229D':'odash','\u229E':'plusb','\u229F':'minusb','\u22A0':'timesb','\u22A1':'sdotb','\u22A2':'vdash','\u22AC':'nvdash','\u22A3':'dashv','\u22A4':'top','\u22A5':'bot','\u22A7':'models','\u22A8':'vDash','\u22AD':'nvDash','\u22A9':'Vdash','\u22AE':'nVdash','\u22AA':'Vvdash','\u22AB':'VDash','\u22AF':'nVDash','\u22B0':'prurel','\u22B2':'vltri','\u22EA':'nltri','\u22B3':'vrtri','\u22EB':'nrtri','\u22B4':'ltrie','\u22EC':'nltrie','\u22B4\u20D2':'nvltrie','\u22B5':'rtrie','\u22ED':'nrtrie','\u22B5\u20D2':'nvrtrie','\u22B6':'origof','\u22B7':'imof','\u22B8':'mumap','\u22B9':'hercon','\u22BA':'intcal','\u22BB':'veebar','\u22BD':'barvee','\u22BE':'angrtvb','\u22BF':'lrtri','\u22C0':'Wedge','\u22C1':'Vee','\u22C2':'xcap','\u22C3':'xcup','\u22C4':'diam','\u22C5':'sdot','\u22C6':'Star','\u22C7':'divonx','\u22C8':'bowtie','\u22C9':'ltimes','\u22CA':'rtimes','\u22CB':'lthree','\u22CC':'rthree','\u22CD':'bsime','\u22CE':'cuvee','\u22CF':'cuwed','\u22D0':'Sub','\u22D1':'Sup','\u22D2':'Cap','\u22D3':'Cup','\u22D4':'fork','\u22D5':'epar','\u22D6':'ltdot','\u22D7':'gtdot','\u22D8':'Ll','\u22D8\u0338':'nLl','\u22D9':'Gg','\u22D9\u0338':'nGg','\u22DA\uFE00':'lesg','\u22DA':'leg','\u22DB':'gel','\u22DB\uFE00':'gesl','\u22DE':'cuepr','\u22DF':'cuesc','\u22E6':'lnsim','\u22E7':'gnsim','\u22E8':'prnsim','\u22E9':'scnsim','\u22EE':'vellip','\u22EF':'ctdot','\u22F0':'utdot','\u22F1':'dtdot','\u22F2':'disin','\u22F3':'isinsv','\u22F4':'isins','\u22F5':'isindot','\u22F5\u0338':'notindot','\u22F6':'notinvc','\u22F7':'notinvb','\u22F9':'isinE','\u22F9\u0338':'notinE','\u22FA':'nisd','\u22FB':'xnis','\u22FC':'nis','\u22FD':'notnivc','\u22FE':'notnivb','\u2305':'barwed','\u2306':'Barwed','\u230C':'drcrop','\u230D':'dlcrop','\u230E':'urcrop','\u230F':'ulcrop','\u2310':'bnot','\u2312':'profline','\u2313':'profsurf','\u2315':'telrec','\u2316':'target','\u231C':'ulcorn','\u231D':'urcorn','\u231E':'dlcorn','\u231F':'drcorn','\u2322':'frown','\u2323':'smile','\u232D':'cylcty','\u232E':'profalar','\u2336':'topbot','\u233D':'ovbar','\u233F':'solbar','\u237C':'angzarr','\u23B0':'lmoust','\u23B1':'rmoust','\u23B4':'tbrk','\u23B5':'bbrk','\u23B6':'bbrktbrk','\u23DC':'OverParenthesis','\u23DD':'UnderParenthesis','\u23DE':'OverBrace','\u23DF':'UnderBrace','\u23E2':'trpezium','\u23E7':'elinters','\u2423':'blank','\u2500':'boxh','\u2502':'boxv','\u250C':'boxdr','\u2510':'boxdl','\u2514':'boxur','\u2518':'boxul','\u251C':'boxvr','\u2524':'boxvl','\u252C':'boxhd','\u2534':'boxhu','\u253C':'boxvh','\u2550':'boxH','\u2551':'boxV','\u2552':'boxdR','\u2553':'boxDr','\u2554':'boxDR','\u2555':'boxdL','\u2556':'boxDl','\u2557':'boxDL','\u2558':'boxuR','\u2559':'boxUr','\u255A':'boxUR','\u255B':'boxuL','\u255C':'boxUl','\u255D':'boxUL','\u255E':'boxvR','\u255F':'boxVr','\u2560':'boxVR','\u2561':'boxvL','\u2562':'boxVl','\u2563':'boxVL','\u2564':'boxHd','\u2565':'boxhD','\u2566':'boxHD','\u2567':'boxHu','\u2568':'boxhU','\u2569':'boxHU','\u256A':'boxvH','\u256B':'boxVh','\u256C':'boxVH','\u2580':'uhblk','\u2584':'lhblk','\u2588':'block','\u2591':'blk14','\u2592':'blk12','\u2593':'blk34','\u25A1':'squ','\u25AA':'squf','\u25AB':'EmptyVerySmallSquare','\u25AD':'rect','\u25AE':'marker','\u25B1':'fltns','\u25B3':'xutri','\u25B4':'utrif','\u25B5':'utri','\u25B8':'rtrif','\u25B9':'rtri','\u25BD':'xdtri','\u25BE':'dtrif','\u25BF':'dtri','\u25C2':'ltrif','\u25C3':'ltri','\u25CA':'loz','\u25CB':'cir','\u25EC':'tridot','\u25EF':'xcirc','\u25F8':'ultri','\u25F9':'urtri','\u25FA':'lltri','\u25FB':'EmptySmallSquare','\u25FC':'FilledSmallSquare','\u2605':'starf','\u2606':'star','\u260E':'phone','\u2640':'female','\u2642':'male','\u2660':'spades','\u2663':'clubs','\u2665':'hearts','\u2666':'diams','\u266A':'sung','\u2713':'check','\u2717':'cross','\u2720':'malt','\u2736':'sext','\u2758':'VerticalSeparator','\u27C8':'bsolhsub','\u27C9':'suphsol','\u27F5':'xlarr','\u27F6':'xrarr','\u27F7':'xharr','\u27F8':'xlArr','\u27F9':'xrArr','\u27FA':'xhArr','\u27FC':'xmap','\u27FF':'dzigrarr','\u2902':'nvlArr','\u2903':'nvrArr','\u2904':'nvHarr','\u2905':'Map','\u290C':'lbarr','\u290D':'rbarr','\u290E':'lBarr','\u290F':'rBarr','\u2910':'RBarr','\u2911':'DDotrahd','\u2912':'UpArrowBar','\u2913':'DownArrowBar','\u2916':'Rarrtl','\u2919':'latail','\u291A':'ratail','\u291B':'lAtail','\u291C':'rAtail','\u291D':'larrfs','\u291E':'rarrfs','\u291F':'larrbfs','\u2920':'rarrbfs','\u2923':'nwarhk','\u2924':'nearhk','\u2925':'searhk','\u2926':'swarhk','\u2927':'nwnear','\u2928':'toea','\u2929':'tosa','\u292A':'swnwar','\u2933':'rarrc','\u2933\u0338':'nrarrc','\u2935':'cudarrr','\u2936':'ldca','\u2937':'rdca','\u2938':'cudarrl','\u2939':'larrpl','\u293C':'curarrm','\u293D':'cularrp','\u2945':'rarrpl','\u2948':'harrcir','\u2949':'Uarrocir','\u294A':'lurdshar','\u294B':'ldrushar','\u294E':'LeftRightVector','\u294F':'RightUpDownVector','\u2950':'DownLeftRightVector','\u2951':'LeftUpDownVector','\u2952':'LeftVectorBar','\u2953':'RightVectorBar','\u2954':'RightUpVectorBar','\u2955':'RightDownVectorBar','\u2956':'DownLeftVectorBar','\u2957':'DownRightVectorBar','\u2958':'LeftUpVectorBar','\u2959':'LeftDownVectorBar','\u295A':'LeftTeeVector','\u295B':'RightTeeVector','\u295C':'RightUpTeeVector','\u295D':'RightDownTeeVector','\u295E':'DownLeftTeeVector','\u295F':'DownRightTeeVector','\u2960':'LeftUpTeeVector','\u2961':'LeftDownTeeVector','\u2962':'lHar','\u2963':'uHar','\u2964':'rHar','\u2965':'dHar','\u2966':'luruhar','\u2967':'ldrdhar','\u2968':'ruluhar','\u2969':'rdldhar','\u296A':'lharul','\u296B':'llhard','\u296C':'rharul','\u296D':'lrhard','\u296E':'udhar','\u296F':'duhar','\u2970':'RoundImplies','\u2971':'erarr','\u2972':'simrarr','\u2973':'larrsim','\u2974':'rarrsim','\u2975':'rarrap','\u2976':'ltlarr','\u2978':'gtrarr','\u2979':'subrarr','\u297B':'suplarr','\u297C':'lfisht','\u297D':'rfisht','\u297E':'ufisht','\u297F':'dfisht','\u299A':'vzigzag','\u299C':'vangrt','\u299D':'angrtvbd','\u29A4':'ange','\u29A5':'range','\u29A6':'dwangle','\u29A7':'uwangle','\u29A8':'angmsdaa','\u29A9':'angmsdab','\u29AA':'angmsdac','\u29AB':'angmsdad','\u29AC':'angmsdae','\u29AD':'angmsdaf','\u29AE':'angmsdag','\u29AF':'angmsdah','\u29B0':'bemptyv','\u29B1':'demptyv','\u29B2':'cemptyv','\u29B3':'raemptyv','\u29B4':'laemptyv','\u29B5':'ohbar','\u29B6':'omid','\u29B7':'opar','\u29B9':'operp','\u29BB':'olcross','\u29BC':'odsold','\u29BE':'olcir','\u29BF':'ofcir','\u29C0':'olt','\u29C1':'ogt','\u29C2':'cirscir','\u29C3':'cirE','\u29C4':'solb','\u29C5':'bsolb','\u29C9':'boxbox','\u29CD':'trisb','\u29CE':'rtriltri','\u29CF':'LeftTriangleBar','\u29CF\u0338':'NotLeftTriangleBar','\u29D0':'RightTriangleBar','\u29D0\u0338':'NotRightTriangleBar','\u29DC':'iinfin','\u29DD':'infintie','\u29DE':'nvinfin','\u29E3':'eparsl','\u29E4':'smeparsl','\u29E5':'eqvparsl','\u29EB':'lozf','\u29F4':'RuleDelayed','\u29F6':'dsol','\u2A00':'xodot','\u2A01':'xoplus','\u2A02':'xotime','\u2A04':'xuplus','\u2A06':'xsqcup','\u2A0D':'fpartint','\u2A10':'cirfnint','\u2A11':'awint','\u2A12':'rppolint','\u2A13':'scpolint','\u2A14':'npolint','\u2A15':'pointint','\u2A16':'quatint','\u2A17':'intlarhk','\u2A22':'pluscir','\u2A23':'plusacir','\u2A24':'simplus','\u2A25':'plusdu','\u2A26':'plussim','\u2A27':'plustwo','\u2A29':'mcomma','\u2A2A':'minusdu','\u2A2D':'loplus','\u2A2E':'roplus','\u2A2F':'Cross','\u2A30':'timesd','\u2A31':'timesbar','\u2A33':'smashp','\u2A34':'lotimes','\u2A35':'rotimes','\u2A36':'otimesas','\u2A37':'Otimes','\u2A38':'odiv','\u2A39':'triplus','\u2A3A':'triminus','\u2A3B':'tritime','\u2A3C':'iprod','\u2A3F':'amalg','\u2A40':'capdot','\u2A42':'ncup','\u2A43':'ncap','\u2A44':'capand','\u2A45':'cupor','\u2A46':'cupcap','\u2A47':'capcup','\u2A48':'cupbrcap','\u2A49':'capbrcup','\u2A4A':'cupcup','\u2A4B':'capcap','\u2A4C':'ccups','\u2A4D':'ccaps','\u2A50':'ccupssm','\u2A53':'And','\u2A54':'Or','\u2A55':'andand','\u2A56':'oror','\u2A57':'orslope','\u2A58':'andslope','\u2A5A':'andv','\u2A5B':'orv','\u2A5C':'andd','\u2A5D':'ord','\u2A5F':'wedbar','\u2A66':'sdote','\u2A6A':'simdot','\u2A6D':'congdot','\u2A6D\u0338':'ncongdot','\u2A6E':'easter','\u2A6F':'apacir','\u2A70':'apE','\u2A70\u0338':'napE','\u2A71':'eplus','\u2A72':'pluse','\u2A73':'Esim','\u2A77':'eDDot','\u2A78':'equivDD','\u2A79':'ltcir','\u2A7A':'gtcir','\u2A7B':'ltquest','\u2A7C':'gtquest','\u2A7D':'les','\u2A7D\u0338':'nles','\u2A7E':'ges','\u2A7E\u0338':'nges','\u2A7F':'lesdot','\u2A80':'gesdot','\u2A81':'lesdoto','\u2A82':'gesdoto','\u2A83':'lesdotor','\u2A84':'gesdotol','\u2A85':'lap','\u2A86':'gap','\u2A87':'lne','\u2A88':'gne','\u2A89':'lnap','\u2A8A':'gnap','\u2A8B':'lEg','\u2A8C':'gEl','\u2A8D':'lsime','\u2A8E':'gsime','\u2A8F':'lsimg','\u2A90':'gsiml','\u2A91':'lgE','\u2A92':'glE','\u2A93':'lesges','\u2A94':'gesles','\u2A95':'els','\u2A96':'egs','\u2A97':'elsdot','\u2A98':'egsdot','\u2A99':'el','\u2A9A':'eg','\u2A9D':'siml','\u2A9E':'simg','\u2A9F':'simlE','\u2AA0':'simgE','\u2AA1':'LessLess','\u2AA1\u0338':'NotNestedLessLess','\u2AA2':'GreaterGreater','\u2AA2\u0338':'NotNestedGreaterGreater','\u2AA4':'glj','\u2AA5':'gla','\u2AA6':'ltcc','\u2AA7':'gtcc','\u2AA8':'lescc','\u2AA9':'gescc','\u2AAA':'smt','\u2AAB':'lat','\u2AAC':'smte','\u2AAC\uFE00':'smtes','\u2AAD':'late','\u2AAD\uFE00':'lates','\u2AAE':'bumpE','\u2AAF':'pre','\u2AAF\u0338':'npre','\u2AB0':'sce','\u2AB0\u0338':'nsce','\u2AB3':'prE','\u2AB4':'scE','\u2AB5':'prnE','\u2AB6':'scnE','\u2AB7':'prap','\u2AB8':'scap','\u2AB9':'prnap','\u2ABA':'scnap','\u2ABB':'Pr','\u2ABC':'Sc','\u2ABD':'subdot','\u2ABE':'supdot','\u2ABF':'subplus','\u2AC0':'supplus','\u2AC1':'submult','\u2AC2':'supmult','\u2AC3':'subedot','\u2AC4':'supedot','\u2AC5':'subE','\u2AC5\u0338':'nsubE','\u2AC6':'supE','\u2AC6\u0338':'nsupE','\u2AC7':'subsim','\u2AC8':'supsim','\u2ACB\uFE00':'vsubnE','\u2ACB':'subnE','\u2ACC\uFE00':'vsupnE','\u2ACC':'supnE','\u2ACF':'csub','\u2AD0':'csup','\u2AD1':'csube','\u2AD2':'csupe','\u2AD3':'subsup','\u2AD4':'supsub','\u2AD5':'subsub','\u2AD6':'supsup','\u2AD7':'suphsub','\u2AD8':'supdsub','\u2AD9':'forkv','\u2ADA':'topfork','\u2ADB':'mlcp','\u2AE4':'Dashv','\u2AE6':'Vdashl','\u2AE7':'Barv','\u2AE8':'vBar','\u2AE9':'vBarv','\u2AEB':'Vbar','\u2AEC':'Not','\u2AED':'bNot','\u2AEE':'rnmid','\u2AEF':'cirmid','\u2AF0':'midcir','\u2AF1':'topcir','\u2AF2':'nhpar','\u2AF3':'parsim','\u2AFD':'parsl','\u2AFD\u20E5':'nparsl','\u266D':'flat','\u266E':'natur','\u266F':'sharp','\xA4':'curren','\xA2':'cent','$':'dollar','\xA3':'pound','\xA5':'yen','\u20AC':'euro','\xB9':'sup1','\xBD':'half','\u2153':'frac13','\xBC':'frac14','\u2155':'frac15','\u2159':'frac16','\u215B':'frac18','\xB2':'sup2','\u2154':'frac23','\u2156':'frac25','\xB3':'sup3','\xBE':'frac34','\u2157':'frac35','\u215C':'frac38','\u2158':'frac45','\u215A':'frac56','\u215D':'frac58','\u215E':'frac78','\uD835\uDCB6':'ascr','\uD835\uDD52':'aopf','\uD835\uDD1E':'afr','\uD835\uDD38':'Aopf','\uD835\uDD04':'Afr','\uD835\uDC9C':'Ascr','\xAA':'ordf','\xE1':'aacute','\xC1':'Aacute','\xE0':'agrave','\xC0':'Agrave','\u0103':'abreve','\u0102':'Abreve','\xE2':'acirc','\xC2':'Acirc','\xE5':'aring','\xC5':'angst','\xE4':'auml','\xC4':'Auml','\xE3':'atilde','\xC3':'Atilde','\u0105':'aogon','\u0104':'Aogon','\u0101':'amacr','\u0100':'Amacr','\xE6':'aelig','\xC6':'AElig','\uD835\uDCB7':'bscr','\uD835\uDD53':'bopf','\uD835\uDD1F':'bfr','\uD835\uDD39':'Bopf','\u212C':'Bscr','\uD835\uDD05':'Bfr','\uD835\uDD20':'cfr','\uD835\uDCB8':'cscr','\uD835\uDD54':'copf','\u212D':'Cfr','\uD835\uDC9E':'Cscr','\u2102':'Copf','\u0107':'cacute','\u0106':'Cacute','\u0109':'ccirc','\u0108':'Ccirc','\u010D':'ccaron','\u010C':'Ccaron','\u010B':'cdot','\u010A':'Cdot','\xE7':'ccedil','\xC7':'Ccedil','\u2105':'incare','\uD835\uDD21':'dfr','\u2146':'dd','\uD835\uDD55':'dopf','\uD835\uDCB9':'dscr','\uD835\uDC9F':'Dscr','\uD835\uDD07':'Dfr','\u2145':'DD','\uD835\uDD3B':'Dopf','\u010F':'dcaron','\u010E':'Dcaron','\u0111':'dstrok','\u0110':'Dstrok','\xF0':'eth','\xD0':'ETH','\u2147':'ee','\u212F':'escr','\uD835\uDD22':'efr','\uD835\uDD56':'eopf','\u2130':'Escr','\uD835\uDD08':'Efr','\uD835\uDD3C':'Eopf','\xE9':'eacute','\xC9':'Eacute','\xE8':'egrave','\xC8':'Egrave','\xEA':'ecirc','\xCA':'Ecirc','\u011B':'ecaron','\u011A':'Ecaron','\xEB':'euml','\xCB':'Euml','\u0117':'edot','\u0116':'Edot','\u0119':'eogon','\u0118':'Eogon','\u0113':'emacr','\u0112':'Emacr','\uD835\uDD23':'ffr','\uD835\uDD57':'fopf','\uD835\uDCBB':'fscr','\uD835\uDD09':'Ffr','\uD835\uDD3D':'Fopf','\u2131':'Fscr','\uFB00':'fflig','\uFB03':'ffilig','\uFB04':'ffllig','\uFB01':'filig','fj':'fjlig','\uFB02':'fllig','\u0192':'fnof','\u210A':'gscr','\uD835\uDD58':'gopf','\uD835\uDD24':'gfr','\uD835\uDCA2':'Gscr','\uD835\uDD3E':'Gopf','\uD835\uDD0A':'Gfr','\u01F5':'gacute','\u011F':'gbreve','\u011E':'Gbreve','\u011D':'gcirc','\u011C':'Gcirc','\u0121':'gdot','\u0120':'Gdot','\u0122':'Gcedil','\uD835\uDD25':'hfr','\u210E':'planckh','\uD835\uDCBD':'hscr','\uD835\uDD59':'hopf','\u210B':'Hscr','\u210C':'Hfr','\u210D':'Hopf','\u0125':'hcirc','\u0124':'Hcirc','\u210F':'hbar','\u0127':'hstrok','\u0126':'Hstrok','\uD835\uDD5A':'iopf','\uD835\uDD26':'ifr','\uD835\uDCBE':'iscr','\u2148':'ii','\uD835\uDD40':'Iopf','\u2110':'Iscr','\u2111':'Im','\xED':'iacute','\xCD':'Iacute','\xEC':'igrave','\xCC':'Igrave','\xEE':'icirc','\xCE':'Icirc','\xEF':'iuml','\xCF':'Iuml','\u0129':'itilde','\u0128':'Itilde','\u0130':'Idot','\u012F':'iogon','\u012E':'Iogon','\u012B':'imacr','\u012A':'Imacr','\u0133':'ijlig','\u0132':'IJlig','\u0131':'imath','\uD835\uDCBF':'jscr','\uD835\uDD5B':'jopf','\uD835\uDD27':'jfr','\uD835\uDCA5':'Jscr','\uD835\uDD0D':'Jfr','\uD835\uDD41':'Jopf','\u0135':'jcirc','\u0134':'Jcirc','\u0237':'jmath','\uD835\uDD5C':'kopf','\uD835\uDCC0':'kscr','\uD835\uDD28':'kfr','\uD835\uDCA6':'Kscr','\uD835\uDD42':'Kopf','\uD835\uDD0E':'Kfr','\u0137':'kcedil','\u0136':'Kcedil','\uD835\uDD29':'lfr','\uD835\uDCC1':'lscr','\u2113':'ell','\uD835\uDD5D':'lopf','\u2112':'Lscr','\uD835\uDD0F':'Lfr','\uD835\uDD43':'Lopf','\u013A':'lacute','\u0139':'Lacute','\u013E':'lcaron','\u013D':'Lcaron','\u013C':'lcedil','\u013B':'Lcedil','\u0142':'lstrok','\u0141':'Lstrok','\u0140':'lmidot','\u013F':'Lmidot','\uD835\uDD2A':'mfr','\uD835\uDD5E':'mopf','\uD835\uDCC2':'mscr','\uD835\uDD10':'Mfr','\uD835\uDD44':'Mopf','\u2133':'Mscr','\uD835\uDD2B':'nfr','\uD835\uDD5F':'nopf','\uD835\uDCC3':'nscr','\u2115':'Nopf','\uD835\uDCA9':'Nscr','\uD835\uDD11':'Nfr','\u0144':'nacute','\u0143':'Nacute','\u0148':'ncaron','\u0147':'Ncaron','\xF1':'ntilde','\xD1':'Ntilde','\u0146':'ncedil','\u0145':'Ncedil','\u2116':'numero','\u014B':'eng','\u014A':'ENG','\uD835\uDD60':'oopf','\uD835\uDD2C':'ofr','\u2134':'oscr','\uD835\uDCAA':'Oscr','\uD835\uDD12':'Ofr','\uD835\uDD46':'Oopf','\xBA':'ordm','\xF3':'oacute','\xD3':'Oacute','\xF2':'ograve','\xD2':'Ograve','\xF4':'ocirc','\xD4':'Ocirc','\xF6':'ouml','\xD6':'Ouml','\u0151':'odblac','\u0150':'Odblac','\xF5':'otilde','\xD5':'Otilde','\xF8':'oslash','\xD8':'Oslash','\u014D':'omacr','\u014C':'Omacr','\u0153':'oelig','\u0152':'OElig','\uD835\uDD2D':'pfr','\uD835\uDCC5':'pscr','\uD835\uDD61':'popf','\u2119':'Popf','\uD835\uDD13':'Pfr','\uD835\uDCAB':'Pscr','\uD835\uDD62':'qopf','\uD835\uDD2E':'qfr','\uD835\uDCC6':'qscr','\uD835\uDCAC':'Qscr','\uD835\uDD14':'Qfr','\u211A':'Qopf','\u0138':'kgreen','\uD835\uDD2F':'rfr','\uD835\uDD63':'ropf','\uD835\uDCC7':'rscr','\u211B':'Rscr','\u211C':'Re','\u211D':'Ropf','\u0155':'racute','\u0154':'Racute','\u0159':'rcaron','\u0158':'Rcaron','\u0157':'rcedil','\u0156':'Rcedil','\uD835\uDD64':'sopf','\uD835\uDCC8':'sscr','\uD835\uDD30':'sfr','\uD835\uDD4A':'Sopf','\uD835\uDD16':'Sfr','\uD835\uDCAE':'Sscr','\u24C8':'oS','\u015B':'sacute','\u015A':'Sacute','\u015D':'scirc','\u015C':'Scirc','\u0161':'scaron','\u0160':'Scaron','\u015F':'scedil','\u015E':'Scedil','\xDF':'szlig','\uD835\uDD31':'tfr','\uD835\uDCC9':'tscr','\uD835\uDD65':'topf','\uD835\uDCAF':'Tscr','\uD835\uDD17':'Tfr','\uD835\uDD4B':'Topf','\u0165':'tcaron','\u0164':'Tcaron','\u0163':'tcedil','\u0162':'Tcedil','\u2122':'trade','\u0167':'tstrok','\u0166':'Tstrok','\uD835\uDCCA':'uscr','\uD835\uDD66':'uopf','\uD835\uDD32':'ufr','\uD835\uDD4C':'Uopf','\uD835\uDD18':'Ufr','\uD835\uDCB0':'Uscr','\xFA':'uacute','\xDA':'Uacute','\xF9':'ugrave','\xD9':'Ugrave','\u016D':'ubreve','\u016C':'Ubreve','\xFB':'ucirc','\xDB':'Ucirc','\u016F':'uring','\u016E':'Uring','\xFC':'uuml','\xDC':'Uuml','\u0171':'udblac','\u0170':'Udblac','\u0169':'utilde','\u0168':'Utilde','\u0173':'uogon','\u0172':'Uogon','\u016B':'umacr','\u016A':'Umacr','\uD835\uDD33':'vfr','\uD835\uDD67':'vopf','\uD835\uDCCB':'vscr','\uD835\uDD19':'Vfr','\uD835\uDD4D':'Vopf','\uD835\uDCB1':'Vscr','\uD835\uDD68':'wopf','\uD835\uDCCC':'wscr','\uD835\uDD34':'wfr','\uD835\uDCB2':'Wscr','\uD835\uDD4E':'Wopf','\uD835\uDD1A':'Wfr','\u0175':'wcirc','\u0174':'Wcirc','\uD835\uDD35':'xfr','\uD835\uDCCD':'xscr','\uD835\uDD69':'xopf','\uD835\uDD4F':'Xopf','\uD835\uDD1B':'Xfr','\uD835\uDCB3':'Xscr','\uD835\uDD36':'yfr','\uD835\uDCCE':'yscr','\uD835\uDD6A':'yopf','\uD835\uDCB4':'Yscr','\uD835\uDD1C':'Yfr','\uD835\uDD50':'Yopf','\xFD':'yacute','\xDD':'Yacute','\u0177':'ycirc','\u0176':'Ycirc','\xFF':'yuml','\u0178':'Yuml','\uD835\uDCCF':'zscr','\uD835\uDD37':'zfr','\uD835\uDD6B':'zopf','\u2128':'Zfr','\u2124':'Zopf','\uD835\uDCB5':'Zscr','\u017A':'zacute','\u0179':'Zacute','\u017E':'zcaron','\u017D':'Zcaron','\u017C':'zdot','\u017B':'Zdot','\u01B5':'imped','\xFE':'thorn','\xDE':'THORN','\u0149':'napos','\u03B1':'alpha','\u0391':'Alpha','\u03B2':'beta','\u0392':'Beta','\u03B3':'gamma','\u0393':'Gamma','\u03B4':'delta','\u0394':'Delta','\u03B5':'epsi','\u03F5':'epsiv','\u0395':'Epsilon','\u03DD':'gammad','\u03DC':'Gammad','\u03B6':'zeta','\u0396':'Zeta','\u03B7':'eta','\u0397':'Eta','\u03B8':'theta','\u03D1':'thetav','\u0398':'Theta','\u03B9':'iota','\u0399':'Iota','\u03BA':'kappa','\u03F0':'kappav','\u039A':'Kappa','\u03BB':'lambda','\u039B':'Lambda','\u03BC':'mu','\xB5':'micro','\u039C':'Mu','\u03BD':'nu','\u039D':'Nu','\u03BE':'xi','\u039E':'Xi','\u03BF':'omicron','\u039F':'Omicron','\u03C0':'pi','\u03D6':'piv','\u03A0':'Pi','\u03C1':'rho','\u03F1':'rhov','\u03A1':'Rho','\u03C3':'sigma','\u03A3':'Sigma','\u03C2':'sigmaf','\u03C4':'tau','\u03A4':'Tau','\u03C5':'upsi','\u03A5':'Upsilon','\u03D2':'Upsi','\u03C6':'phi','\u03D5':'phiv','\u03A6':'Phi','\u03C7':'chi','\u03A7':'Chi','\u03C8':'psi','\u03A8':'Psi','\u03C9':'omega','\u03A9':'ohm','\u0430':'acy','\u0410':'Acy','\u0431':'bcy','\u0411':'Bcy','\u0432':'vcy','\u0412':'Vcy','\u0433':'gcy','\u0413':'Gcy','\u0453':'gjcy','\u0403':'GJcy','\u0434':'dcy','\u0414':'Dcy','\u0452':'djcy','\u0402':'DJcy','\u0435':'iecy','\u0415':'IEcy','\u0451':'iocy','\u0401':'IOcy','\u0454':'jukcy','\u0404':'Jukcy','\u0436':'zhcy','\u0416':'ZHcy','\u0437':'zcy','\u0417':'Zcy','\u0455':'dscy','\u0405':'DScy','\u0438':'icy','\u0418':'Icy','\u0456':'iukcy','\u0406':'Iukcy','\u0457':'yicy','\u0407':'YIcy','\u0439':'jcy','\u0419':'Jcy','\u0458':'jsercy','\u0408':'Jsercy','\u043A':'kcy','\u041A':'Kcy','\u045C':'kjcy','\u040C':'KJcy','\u043B':'lcy','\u041B':'Lcy','\u0459':'ljcy','\u0409':'LJcy','\u043C':'mcy','\u041C':'Mcy','\u043D':'ncy','\u041D':'Ncy','\u045A':'njcy','\u040A':'NJcy','\u043E':'ocy','\u041E':'Ocy','\u043F':'pcy','\u041F':'Pcy','\u0440':'rcy','\u0420':'Rcy','\u0441':'scy','\u0421':'Scy','\u0442':'tcy','\u0422':'Tcy','\u045B':'tshcy','\u040B':'TSHcy','\u0443':'ucy','\u0423':'Ucy','\u045E':'ubrcy','\u040E':'Ubrcy','\u0444':'fcy','\u0424':'Fcy','\u0445':'khcy','\u0425':'KHcy','\u0446':'tscy','\u0426':'TScy','\u0447':'chcy','\u0427':'CHcy','\u045F':'dzcy','\u040F':'DZcy','\u0448':'shcy','\u0428':'SHcy','\u0449':'shchcy','\u0429':'SHCHcy','\u044A':'hardcy','\u042A':'HARDcy','\u044B':'ycy','\u042B':'Ycy','\u044C':'softcy','\u042C':'SOFTcy','\u044D':'ecy','\u042D':'Ecy','\u044E':'yucy','\u042E':'YUcy','\u044F':'yacy','\u042F':'YAcy','\u2135':'aleph','\u2136':'beth','\u2137':'gimel','\u2138':'daleth'};

	var regexEscape = /["&'<>`]/g;
	var escapeMap = {
		'"': '&quot;',
		'&': '&amp;',
		'\'': '&#x27;',
		'<': '&lt;',
		// See https://mathiasbynens.be/notes/ambiguous-ampersands: in HTML, the
		// following is not strictly necessary unless it’s part of a tag or an
		// unquoted attribute value. We’re only escaping it to support those
		// situations, and for XML support.
		'>': '&gt;',
		// In Internet Explorer ≤ 8, the backtick character can be used
		// to break out of (un)quoted attribute values or HTML comments.
		// See http://html5sec.org/#102, http://html5sec.org/#108, and
		// http://html5sec.org/#133.
		'`': '&#x60;'
	};

	var regexInvalidEntity = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/;
	var regexInvalidRawCodePoint = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
	var regexDecode = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g;
	var decodeMap = {'aacute':'\xE1','Aacute':'\xC1','abreve':'\u0103','Abreve':'\u0102','ac':'\u223E','acd':'\u223F','acE':'\u223E\u0333','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','acy':'\u0430','Acy':'\u0410','aelig':'\xE6','AElig':'\xC6','af':'\u2061','afr':'\uD835\uDD1E','Afr':'\uD835\uDD04','agrave':'\xE0','Agrave':'\xC0','alefsym':'\u2135','aleph':'\u2135','alpha':'\u03B1','Alpha':'\u0391','amacr':'\u0101','Amacr':'\u0100','amalg':'\u2A3F','amp':'&','AMP':'&','and':'\u2227','And':'\u2A53','andand':'\u2A55','andd':'\u2A5C','andslope':'\u2A58','andv':'\u2A5A','ang':'\u2220','ange':'\u29A4','angle':'\u2220','angmsd':'\u2221','angmsdaa':'\u29A8','angmsdab':'\u29A9','angmsdac':'\u29AA','angmsdad':'\u29AB','angmsdae':'\u29AC','angmsdaf':'\u29AD','angmsdag':'\u29AE','angmsdah':'\u29AF','angrt':'\u221F','angrtvb':'\u22BE','angrtvbd':'\u299D','angsph':'\u2222','angst':'\xC5','angzarr':'\u237C','aogon':'\u0105','Aogon':'\u0104','aopf':'\uD835\uDD52','Aopf':'\uD835\uDD38','ap':'\u2248','apacir':'\u2A6F','ape':'\u224A','apE':'\u2A70','apid':'\u224B','apos':'\'','ApplyFunction':'\u2061','approx':'\u2248','approxeq':'\u224A','aring':'\xE5','Aring':'\xC5','ascr':'\uD835\uDCB6','Ascr':'\uD835\uDC9C','Assign':'\u2254','ast':'*','asymp':'\u2248','asympeq':'\u224D','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','awconint':'\u2233','awint':'\u2A11','backcong':'\u224C','backepsilon':'\u03F6','backprime':'\u2035','backsim':'\u223D','backsimeq':'\u22CD','Backslash':'\u2216','Barv':'\u2AE7','barvee':'\u22BD','barwed':'\u2305','Barwed':'\u2306','barwedge':'\u2305','bbrk':'\u23B5','bbrktbrk':'\u23B6','bcong':'\u224C','bcy':'\u0431','Bcy':'\u0411','bdquo':'\u201E','becaus':'\u2235','because':'\u2235','Because':'\u2235','bemptyv':'\u29B0','bepsi':'\u03F6','bernou':'\u212C','Bernoullis':'\u212C','beta':'\u03B2','Beta':'\u0392','beth':'\u2136','between':'\u226C','bfr':'\uD835\uDD1F','Bfr':'\uD835\uDD05','bigcap':'\u22C2','bigcirc':'\u25EF','bigcup':'\u22C3','bigodot':'\u2A00','bigoplus':'\u2A01','bigotimes':'\u2A02','bigsqcup':'\u2A06','bigstar':'\u2605','bigtriangledown':'\u25BD','bigtriangleup':'\u25B3','biguplus':'\u2A04','bigvee':'\u22C1','bigwedge':'\u22C0','bkarow':'\u290D','blacklozenge':'\u29EB','blacksquare':'\u25AA','blacktriangle':'\u25B4','blacktriangledown':'\u25BE','blacktriangleleft':'\u25C2','blacktriangleright':'\u25B8','blank':'\u2423','blk12':'\u2592','blk14':'\u2591','blk34':'\u2593','block':'\u2588','bne':'=\u20E5','bnequiv':'\u2261\u20E5','bnot':'\u2310','bNot':'\u2AED','bopf':'\uD835\uDD53','Bopf':'\uD835\uDD39','bot':'\u22A5','bottom':'\u22A5','bowtie':'\u22C8','boxbox':'\u29C9','boxdl':'\u2510','boxdL':'\u2555','boxDl':'\u2556','boxDL':'\u2557','boxdr':'\u250C','boxdR':'\u2552','boxDr':'\u2553','boxDR':'\u2554','boxh':'\u2500','boxH':'\u2550','boxhd':'\u252C','boxhD':'\u2565','boxHd':'\u2564','boxHD':'\u2566','boxhu':'\u2534','boxhU':'\u2568','boxHu':'\u2567','boxHU':'\u2569','boxminus':'\u229F','boxplus':'\u229E','boxtimes':'\u22A0','boxul':'\u2518','boxuL':'\u255B','boxUl':'\u255C','boxUL':'\u255D','boxur':'\u2514','boxuR':'\u2558','boxUr':'\u2559','boxUR':'\u255A','boxv':'\u2502','boxV':'\u2551','boxvh':'\u253C','boxvH':'\u256A','boxVh':'\u256B','boxVH':'\u256C','boxvl':'\u2524','boxvL':'\u2561','boxVl':'\u2562','boxVL':'\u2563','boxvr':'\u251C','boxvR':'\u255E','boxVr':'\u255F','boxVR':'\u2560','bprime':'\u2035','breve':'\u02D8','Breve':'\u02D8','brvbar':'\xA6','bscr':'\uD835\uDCB7','Bscr':'\u212C','bsemi':'\u204F','bsim':'\u223D','bsime':'\u22CD','bsol':'\\','bsolb':'\u29C5','bsolhsub':'\u27C8','bull':'\u2022','bullet':'\u2022','bump':'\u224E','bumpe':'\u224F','bumpE':'\u2AAE','bumpeq':'\u224F','Bumpeq':'\u224E','cacute':'\u0107','Cacute':'\u0106','cap':'\u2229','Cap':'\u22D2','capand':'\u2A44','capbrcup':'\u2A49','capcap':'\u2A4B','capcup':'\u2A47','capdot':'\u2A40','CapitalDifferentialD':'\u2145','caps':'\u2229\uFE00','caret':'\u2041','caron':'\u02C7','Cayleys':'\u212D','ccaps':'\u2A4D','ccaron':'\u010D','Ccaron':'\u010C','ccedil':'\xE7','Ccedil':'\xC7','ccirc':'\u0109','Ccirc':'\u0108','Cconint':'\u2230','ccups':'\u2A4C','ccupssm':'\u2A50','cdot':'\u010B','Cdot':'\u010A','cedil':'\xB8','Cedilla':'\xB8','cemptyv':'\u29B2','cent':'\xA2','centerdot':'\xB7','CenterDot':'\xB7','cfr':'\uD835\uDD20','Cfr':'\u212D','chcy':'\u0447','CHcy':'\u0427','check':'\u2713','checkmark':'\u2713','chi':'\u03C7','Chi':'\u03A7','cir':'\u25CB','circ':'\u02C6','circeq':'\u2257','circlearrowleft':'\u21BA','circlearrowright':'\u21BB','circledast':'\u229B','circledcirc':'\u229A','circleddash':'\u229D','CircleDot':'\u2299','circledR':'\xAE','circledS':'\u24C8','CircleMinus':'\u2296','CirclePlus':'\u2295','CircleTimes':'\u2297','cire':'\u2257','cirE':'\u29C3','cirfnint':'\u2A10','cirmid':'\u2AEF','cirscir':'\u29C2','ClockwiseContourIntegral':'\u2232','CloseCurlyDoubleQuote':'\u201D','CloseCurlyQuote':'\u2019','clubs':'\u2663','clubsuit':'\u2663','colon':':','Colon':'\u2237','colone':'\u2254','Colone':'\u2A74','coloneq':'\u2254','comma':',','commat':'@','comp':'\u2201','compfn':'\u2218','complement':'\u2201','complexes':'\u2102','cong':'\u2245','congdot':'\u2A6D','Congruent':'\u2261','conint':'\u222E','Conint':'\u222F','ContourIntegral':'\u222E','copf':'\uD835\uDD54','Copf':'\u2102','coprod':'\u2210','Coproduct':'\u2210','copy':'\xA9','COPY':'\xA9','copysr':'\u2117','CounterClockwiseContourIntegral':'\u2233','crarr':'\u21B5','cross':'\u2717','Cross':'\u2A2F','cscr':'\uD835\uDCB8','Cscr':'\uD835\uDC9E','csub':'\u2ACF','csube':'\u2AD1','csup':'\u2AD0','csupe':'\u2AD2','ctdot':'\u22EF','cudarrl':'\u2938','cudarrr':'\u2935','cuepr':'\u22DE','cuesc':'\u22DF','cularr':'\u21B6','cularrp':'\u293D','cup':'\u222A','Cup':'\u22D3','cupbrcap':'\u2A48','cupcap':'\u2A46','CupCap':'\u224D','cupcup':'\u2A4A','cupdot':'\u228D','cupor':'\u2A45','cups':'\u222A\uFE00','curarr':'\u21B7','curarrm':'\u293C','curlyeqprec':'\u22DE','curlyeqsucc':'\u22DF','curlyvee':'\u22CE','curlywedge':'\u22CF','curren':'\xA4','curvearrowleft':'\u21B6','curvearrowright':'\u21B7','cuvee':'\u22CE','cuwed':'\u22CF','cwconint':'\u2232','cwint':'\u2231','cylcty':'\u232D','dagger':'\u2020','Dagger':'\u2021','daleth':'\u2138','darr':'\u2193','dArr':'\u21D3','Darr':'\u21A1','dash':'\u2010','dashv':'\u22A3','Dashv':'\u2AE4','dbkarow':'\u290F','dblac':'\u02DD','dcaron':'\u010F','Dcaron':'\u010E','dcy':'\u0434','Dcy':'\u0414','dd':'\u2146','DD':'\u2145','ddagger':'\u2021','ddarr':'\u21CA','DDotrahd':'\u2911','ddotseq':'\u2A77','deg':'\xB0','Del':'\u2207','delta':'\u03B4','Delta':'\u0394','demptyv':'\u29B1','dfisht':'\u297F','dfr':'\uD835\uDD21','Dfr':'\uD835\uDD07','dHar':'\u2965','dharl':'\u21C3','dharr':'\u21C2','DiacriticalAcute':'\xB4','DiacriticalDot':'\u02D9','DiacriticalDoubleAcute':'\u02DD','DiacriticalGrave':'`','DiacriticalTilde':'\u02DC','diam':'\u22C4','diamond':'\u22C4','Diamond':'\u22C4','diamondsuit':'\u2666','diams':'\u2666','die':'\xA8','DifferentialD':'\u2146','digamma':'\u03DD','disin':'\u22F2','div':'\xF7','divide':'\xF7','divideontimes':'\u22C7','divonx':'\u22C7','djcy':'\u0452','DJcy':'\u0402','dlcorn':'\u231E','dlcrop':'\u230D','dollar':'$','dopf':'\uD835\uDD55','Dopf':'\uD835\uDD3B','dot':'\u02D9','Dot':'\xA8','DotDot':'\u20DC','doteq':'\u2250','doteqdot':'\u2251','DotEqual':'\u2250','dotminus':'\u2238','dotplus':'\u2214','dotsquare':'\u22A1','doublebarwedge':'\u2306','DoubleContourIntegral':'\u222F','DoubleDot':'\xA8','DoubleDownArrow':'\u21D3','DoubleLeftArrow':'\u21D0','DoubleLeftRightArrow':'\u21D4','DoubleLeftTee':'\u2AE4','DoubleLongLeftArrow':'\u27F8','DoubleLongLeftRightArrow':'\u27FA','DoubleLongRightArrow':'\u27F9','DoubleRightArrow':'\u21D2','DoubleRightTee':'\u22A8','DoubleUpArrow':'\u21D1','DoubleUpDownArrow':'\u21D5','DoubleVerticalBar':'\u2225','downarrow':'\u2193','Downarrow':'\u21D3','DownArrow':'\u2193','DownArrowBar':'\u2913','DownArrowUpArrow':'\u21F5','DownBreve':'\u0311','downdownarrows':'\u21CA','downharpoonleft':'\u21C3','downharpoonright':'\u21C2','DownLeftRightVector':'\u2950','DownLeftTeeVector':'\u295E','DownLeftVector':'\u21BD','DownLeftVectorBar':'\u2956','DownRightTeeVector':'\u295F','DownRightVector':'\u21C1','DownRightVectorBar':'\u2957','DownTee':'\u22A4','DownTeeArrow':'\u21A7','drbkarow':'\u2910','drcorn':'\u231F','drcrop':'\u230C','dscr':'\uD835\uDCB9','Dscr':'\uD835\uDC9F','dscy':'\u0455','DScy':'\u0405','dsol':'\u29F6','dstrok':'\u0111','Dstrok':'\u0110','dtdot':'\u22F1','dtri':'\u25BF','dtrif':'\u25BE','duarr':'\u21F5','duhar':'\u296F','dwangle':'\u29A6','dzcy':'\u045F','DZcy':'\u040F','dzigrarr':'\u27FF','eacute':'\xE9','Eacute':'\xC9','easter':'\u2A6E','ecaron':'\u011B','Ecaron':'\u011A','ecir':'\u2256','ecirc':'\xEA','Ecirc':'\xCA','ecolon':'\u2255','ecy':'\u044D','Ecy':'\u042D','eDDot':'\u2A77','edot':'\u0117','eDot':'\u2251','Edot':'\u0116','ee':'\u2147','efDot':'\u2252','efr':'\uD835\uDD22','Efr':'\uD835\uDD08','eg':'\u2A9A','egrave':'\xE8','Egrave':'\xC8','egs':'\u2A96','egsdot':'\u2A98','el':'\u2A99','Element':'\u2208','elinters':'\u23E7','ell':'\u2113','els':'\u2A95','elsdot':'\u2A97','emacr':'\u0113','Emacr':'\u0112','empty':'\u2205','emptyset':'\u2205','EmptySmallSquare':'\u25FB','emptyv':'\u2205','EmptyVerySmallSquare':'\u25AB','emsp':'\u2003','emsp13':'\u2004','emsp14':'\u2005','eng':'\u014B','ENG':'\u014A','ensp':'\u2002','eogon':'\u0119','Eogon':'\u0118','eopf':'\uD835\uDD56','Eopf':'\uD835\uDD3C','epar':'\u22D5','eparsl':'\u29E3','eplus':'\u2A71','epsi':'\u03B5','epsilon':'\u03B5','Epsilon':'\u0395','epsiv':'\u03F5','eqcirc':'\u2256','eqcolon':'\u2255','eqsim':'\u2242','eqslantgtr':'\u2A96','eqslantless':'\u2A95','Equal':'\u2A75','equals':'=','EqualTilde':'\u2242','equest':'\u225F','Equilibrium':'\u21CC','equiv':'\u2261','equivDD':'\u2A78','eqvparsl':'\u29E5','erarr':'\u2971','erDot':'\u2253','escr':'\u212F','Escr':'\u2130','esdot':'\u2250','esim':'\u2242','Esim':'\u2A73','eta':'\u03B7','Eta':'\u0397','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','euro':'\u20AC','excl':'!','exist':'\u2203','Exists':'\u2203','expectation':'\u2130','exponentiale':'\u2147','ExponentialE':'\u2147','fallingdotseq':'\u2252','fcy':'\u0444','Fcy':'\u0424','female':'\u2640','ffilig':'\uFB03','fflig':'\uFB00','ffllig':'\uFB04','ffr':'\uD835\uDD23','Ffr':'\uD835\uDD09','filig':'\uFB01','FilledSmallSquare':'\u25FC','FilledVerySmallSquare':'\u25AA','fjlig':'fj','flat':'\u266D','fllig':'\uFB02','fltns':'\u25B1','fnof':'\u0192','fopf':'\uD835\uDD57','Fopf':'\uD835\uDD3D','forall':'\u2200','ForAll':'\u2200','fork':'\u22D4','forkv':'\u2AD9','Fouriertrf':'\u2131','fpartint':'\u2A0D','frac12':'\xBD','frac13':'\u2153','frac14':'\xBC','frac15':'\u2155','frac16':'\u2159','frac18':'\u215B','frac23':'\u2154','frac25':'\u2156','frac34':'\xBE','frac35':'\u2157','frac38':'\u215C','frac45':'\u2158','frac56':'\u215A','frac58':'\u215D','frac78':'\u215E','frasl':'\u2044','frown':'\u2322','fscr':'\uD835\uDCBB','Fscr':'\u2131','gacute':'\u01F5','gamma':'\u03B3','Gamma':'\u0393','gammad':'\u03DD','Gammad':'\u03DC','gap':'\u2A86','gbreve':'\u011F','Gbreve':'\u011E','Gcedil':'\u0122','gcirc':'\u011D','Gcirc':'\u011C','gcy':'\u0433','Gcy':'\u0413','gdot':'\u0121','Gdot':'\u0120','ge':'\u2265','gE':'\u2267','gel':'\u22DB','gEl':'\u2A8C','geq':'\u2265','geqq':'\u2267','geqslant':'\u2A7E','ges':'\u2A7E','gescc':'\u2AA9','gesdot':'\u2A80','gesdoto':'\u2A82','gesdotol':'\u2A84','gesl':'\u22DB\uFE00','gesles':'\u2A94','gfr':'\uD835\uDD24','Gfr':'\uD835\uDD0A','gg':'\u226B','Gg':'\u22D9','ggg':'\u22D9','gimel':'\u2137','gjcy':'\u0453','GJcy':'\u0403','gl':'\u2277','gla':'\u2AA5','glE':'\u2A92','glj':'\u2AA4','gnap':'\u2A8A','gnapprox':'\u2A8A','gne':'\u2A88','gnE':'\u2269','gneq':'\u2A88','gneqq':'\u2269','gnsim':'\u22E7','gopf':'\uD835\uDD58','Gopf':'\uD835\uDD3E','grave':'`','GreaterEqual':'\u2265','GreaterEqualLess':'\u22DB','GreaterFullEqual':'\u2267','GreaterGreater':'\u2AA2','GreaterLess':'\u2277','GreaterSlantEqual':'\u2A7E','GreaterTilde':'\u2273','gscr':'\u210A','Gscr':'\uD835\uDCA2','gsim':'\u2273','gsime':'\u2A8E','gsiml':'\u2A90','gt':'>','Gt':'\u226B','GT':'>','gtcc':'\u2AA7','gtcir':'\u2A7A','gtdot':'\u22D7','gtlPar':'\u2995','gtquest':'\u2A7C','gtrapprox':'\u2A86','gtrarr':'\u2978','gtrdot':'\u22D7','gtreqless':'\u22DB','gtreqqless':'\u2A8C','gtrless':'\u2277','gtrsim':'\u2273','gvertneqq':'\u2269\uFE00','gvnE':'\u2269\uFE00','Hacek':'\u02C7','hairsp':'\u200A','half':'\xBD','hamilt':'\u210B','hardcy':'\u044A','HARDcy':'\u042A','harr':'\u2194','hArr':'\u21D4','harrcir':'\u2948','harrw':'\u21AD','Hat':'^','hbar':'\u210F','hcirc':'\u0125','Hcirc':'\u0124','hearts':'\u2665','heartsuit':'\u2665','hellip':'\u2026','hercon':'\u22B9','hfr':'\uD835\uDD25','Hfr':'\u210C','HilbertSpace':'\u210B','hksearow':'\u2925','hkswarow':'\u2926','hoarr':'\u21FF','homtht':'\u223B','hookleftarrow':'\u21A9','hookrightarrow':'\u21AA','hopf':'\uD835\uDD59','Hopf':'\u210D','horbar':'\u2015','HorizontalLine':'\u2500','hscr':'\uD835\uDCBD','Hscr':'\u210B','hslash':'\u210F','hstrok':'\u0127','Hstrok':'\u0126','HumpDownHump':'\u224E','HumpEqual':'\u224F','hybull':'\u2043','hyphen':'\u2010','iacute':'\xED','Iacute':'\xCD','ic':'\u2063','icirc':'\xEE','Icirc':'\xCE','icy':'\u0438','Icy':'\u0418','Idot':'\u0130','iecy':'\u0435','IEcy':'\u0415','iexcl':'\xA1','iff':'\u21D4','ifr':'\uD835\uDD26','Ifr':'\u2111','igrave':'\xEC','Igrave':'\xCC','ii':'\u2148','iiiint':'\u2A0C','iiint':'\u222D','iinfin':'\u29DC','iiota':'\u2129','ijlig':'\u0133','IJlig':'\u0132','Im':'\u2111','imacr':'\u012B','Imacr':'\u012A','image':'\u2111','ImaginaryI':'\u2148','imagline':'\u2110','imagpart':'\u2111','imath':'\u0131','imof':'\u22B7','imped':'\u01B5','Implies':'\u21D2','in':'\u2208','incare':'\u2105','infin':'\u221E','infintie':'\u29DD','inodot':'\u0131','int':'\u222B','Int':'\u222C','intcal':'\u22BA','integers':'\u2124','Integral':'\u222B','intercal':'\u22BA','Intersection':'\u22C2','intlarhk':'\u2A17','intprod':'\u2A3C','InvisibleComma':'\u2063','InvisibleTimes':'\u2062','iocy':'\u0451','IOcy':'\u0401','iogon':'\u012F','Iogon':'\u012E','iopf':'\uD835\uDD5A','Iopf':'\uD835\uDD40','iota':'\u03B9','Iota':'\u0399','iprod':'\u2A3C','iquest':'\xBF','iscr':'\uD835\uDCBE','Iscr':'\u2110','isin':'\u2208','isindot':'\u22F5','isinE':'\u22F9','isins':'\u22F4','isinsv':'\u22F3','isinv':'\u2208','it':'\u2062','itilde':'\u0129','Itilde':'\u0128','iukcy':'\u0456','Iukcy':'\u0406','iuml':'\xEF','Iuml':'\xCF','jcirc':'\u0135','Jcirc':'\u0134','jcy':'\u0439','Jcy':'\u0419','jfr':'\uD835\uDD27','Jfr':'\uD835\uDD0D','jmath':'\u0237','jopf':'\uD835\uDD5B','Jopf':'\uD835\uDD41','jscr':'\uD835\uDCBF','Jscr':'\uD835\uDCA5','jsercy':'\u0458','Jsercy':'\u0408','jukcy':'\u0454','Jukcy':'\u0404','kappa':'\u03BA','Kappa':'\u039A','kappav':'\u03F0','kcedil':'\u0137','Kcedil':'\u0136','kcy':'\u043A','Kcy':'\u041A','kfr':'\uD835\uDD28','Kfr':'\uD835\uDD0E','kgreen':'\u0138','khcy':'\u0445','KHcy':'\u0425','kjcy':'\u045C','KJcy':'\u040C','kopf':'\uD835\uDD5C','Kopf':'\uD835\uDD42','kscr':'\uD835\uDCC0','Kscr':'\uD835\uDCA6','lAarr':'\u21DA','lacute':'\u013A','Lacute':'\u0139','laemptyv':'\u29B4','lagran':'\u2112','lambda':'\u03BB','Lambda':'\u039B','lang':'\u27E8','Lang':'\u27EA','langd':'\u2991','langle':'\u27E8','lap':'\u2A85','Laplacetrf':'\u2112','laquo':'\xAB','larr':'\u2190','lArr':'\u21D0','Larr':'\u219E','larrb':'\u21E4','larrbfs':'\u291F','larrfs':'\u291D','larrhk':'\u21A9','larrlp':'\u21AB','larrpl':'\u2939','larrsim':'\u2973','larrtl':'\u21A2','lat':'\u2AAB','latail':'\u2919','lAtail':'\u291B','late':'\u2AAD','lates':'\u2AAD\uFE00','lbarr':'\u290C','lBarr':'\u290E','lbbrk':'\u2772','lbrace':'{','lbrack':'[','lbrke':'\u298B','lbrksld':'\u298F','lbrkslu':'\u298D','lcaron':'\u013E','Lcaron':'\u013D','lcedil':'\u013C','Lcedil':'\u013B','lceil':'\u2308','lcub':'{','lcy':'\u043B','Lcy':'\u041B','ldca':'\u2936','ldquo':'\u201C','ldquor':'\u201E','ldrdhar':'\u2967','ldrushar':'\u294B','ldsh':'\u21B2','le':'\u2264','lE':'\u2266','LeftAngleBracket':'\u27E8','leftarrow':'\u2190','Leftarrow':'\u21D0','LeftArrow':'\u2190','LeftArrowBar':'\u21E4','LeftArrowRightArrow':'\u21C6','leftarrowtail':'\u21A2','LeftCeiling':'\u2308','LeftDoubleBracket':'\u27E6','LeftDownTeeVector':'\u2961','LeftDownVector':'\u21C3','LeftDownVectorBar':'\u2959','LeftFloor':'\u230A','leftharpoondown':'\u21BD','leftharpoonup':'\u21BC','leftleftarrows':'\u21C7','leftrightarrow':'\u2194','Leftrightarrow':'\u21D4','LeftRightArrow':'\u2194','leftrightarrows':'\u21C6','leftrightharpoons':'\u21CB','leftrightsquigarrow':'\u21AD','LeftRightVector':'\u294E','LeftTee':'\u22A3','LeftTeeArrow':'\u21A4','LeftTeeVector':'\u295A','leftthreetimes':'\u22CB','LeftTriangle':'\u22B2','LeftTriangleBar':'\u29CF','LeftTriangleEqual':'\u22B4','LeftUpDownVector':'\u2951','LeftUpTeeVector':'\u2960','LeftUpVector':'\u21BF','LeftUpVectorBar':'\u2958','LeftVector':'\u21BC','LeftVectorBar':'\u2952','leg':'\u22DA','lEg':'\u2A8B','leq':'\u2264','leqq':'\u2266','leqslant':'\u2A7D','les':'\u2A7D','lescc':'\u2AA8','lesdot':'\u2A7F','lesdoto':'\u2A81','lesdotor':'\u2A83','lesg':'\u22DA\uFE00','lesges':'\u2A93','lessapprox':'\u2A85','lessdot':'\u22D6','lesseqgtr':'\u22DA','lesseqqgtr':'\u2A8B','LessEqualGreater':'\u22DA','LessFullEqual':'\u2266','LessGreater':'\u2276','lessgtr':'\u2276','LessLess':'\u2AA1','lesssim':'\u2272','LessSlantEqual':'\u2A7D','LessTilde':'\u2272','lfisht':'\u297C','lfloor':'\u230A','lfr':'\uD835\uDD29','Lfr':'\uD835\uDD0F','lg':'\u2276','lgE':'\u2A91','lHar':'\u2962','lhard':'\u21BD','lharu':'\u21BC','lharul':'\u296A','lhblk':'\u2584','ljcy':'\u0459','LJcy':'\u0409','ll':'\u226A','Ll':'\u22D8','llarr':'\u21C7','llcorner':'\u231E','Lleftarrow':'\u21DA','llhard':'\u296B','lltri':'\u25FA','lmidot':'\u0140','Lmidot':'\u013F','lmoust':'\u23B0','lmoustache':'\u23B0','lnap':'\u2A89','lnapprox':'\u2A89','lne':'\u2A87','lnE':'\u2268','lneq':'\u2A87','lneqq':'\u2268','lnsim':'\u22E6','loang':'\u27EC','loarr':'\u21FD','lobrk':'\u27E6','longleftarrow':'\u27F5','Longleftarrow':'\u27F8','LongLeftArrow':'\u27F5','longleftrightarrow':'\u27F7','Longleftrightarrow':'\u27FA','LongLeftRightArrow':'\u27F7','longmapsto':'\u27FC','longrightarrow':'\u27F6','Longrightarrow':'\u27F9','LongRightArrow':'\u27F6','looparrowleft':'\u21AB','looparrowright':'\u21AC','lopar':'\u2985','lopf':'\uD835\uDD5D','Lopf':'\uD835\uDD43','loplus':'\u2A2D','lotimes':'\u2A34','lowast':'\u2217','lowbar':'_','LowerLeftArrow':'\u2199','LowerRightArrow':'\u2198','loz':'\u25CA','lozenge':'\u25CA','lozf':'\u29EB','lpar':'(','lparlt':'\u2993','lrarr':'\u21C6','lrcorner':'\u231F','lrhar':'\u21CB','lrhard':'\u296D','lrm':'\u200E','lrtri':'\u22BF','lsaquo':'\u2039','lscr':'\uD835\uDCC1','Lscr':'\u2112','lsh':'\u21B0','Lsh':'\u21B0','lsim':'\u2272','lsime':'\u2A8D','lsimg':'\u2A8F','lsqb':'[','lsquo':'\u2018','lsquor':'\u201A','lstrok':'\u0142','Lstrok':'\u0141','lt':'<','Lt':'\u226A','LT':'<','ltcc':'\u2AA6','ltcir':'\u2A79','ltdot':'\u22D6','lthree':'\u22CB','ltimes':'\u22C9','ltlarr':'\u2976','ltquest':'\u2A7B','ltri':'\u25C3','ltrie':'\u22B4','ltrif':'\u25C2','ltrPar':'\u2996','lurdshar':'\u294A','luruhar':'\u2966','lvertneqq':'\u2268\uFE00','lvnE':'\u2268\uFE00','macr':'\xAF','male':'\u2642','malt':'\u2720','maltese':'\u2720','map':'\u21A6','Map':'\u2905','mapsto':'\u21A6','mapstodown':'\u21A7','mapstoleft':'\u21A4','mapstoup':'\u21A5','marker':'\u25AE','mcomma':'\u2A29','mcy':'\u043C','Mcy':'\u041C','mdash':'\u2014','mDDot':'\u223A','measuredangle':'\u2221','MediumSpace':'\u205F','Mellintrf':'\u2133','mfr':'\uD835\uDD2A','Mfr':'\uD835\uDD10','mho':'\u2127','micro':'\xB5','mid':'\u2223','midast':'*','midcir':'\u2AF0','middot':'\xB7','minus':'\u2212','minusb':'\u229F','minusd':'\u2238','minusdu':'\u2A2A','MinusPlus':'\u2213','mlcp':'\u2ADB','mldr':'\u2026','mnplus':'\u2213','models':'\u22A7','mopf':'\uD835\uDD5E','Mopf':'\uD835\uDD44','mp':'\u2213','mscr':'\uD835\uDCC2','Mscr':'\u2133','mstpos':'\u223E','mu':'\u03BC','Mu':'\u039C','multimap':'\u22B8','mumap':'\u22B8','nabla':'\u2207','nacute':'\u0144','Nacute':'\u0143','nang':'\u2220\u20D2','nap':'\u2249','napE':'\u2A70\u0338','napid':'\u224B\u0338','napos':'\u0149','napprox':'\u2249','natur':'\u266E','natural':'\u266E','naturals':'\u2115','nbsp':'\xA0','nbump':'\u224E\u0338','nbumpe':'\u224F\u0338','ncap':'\u2A43','ncaron':'\u0148','Ncaron':'\u0147','ncedil':'\u0146','Ncedil':'\u0145','ncong':'\u2247','ncongdot':'\u2A6D\u0338','ncup':'\u2A42','ncy':'\u043D','Ncy':'\u041D','ndash':'\u2013','ne':'\u2260','nearhk':'\u2924','nearr':'\u2197','neArr':'\u21D7','nearrow':'\u2197','nedot':'\u2250\u0338','NegativeMediumSpace':'\u200B','NegativeThickSpace':'\u200B','NegativeThinSpace':'\u200B','NegativeVeryThinSpace':'\u200B','nequiv':'\u2262','nesear':'\u2928','nesim':'\u2242\u0338','NestedGreaterGreater':'\u226B','NestedLessLess':'\u226A','NewLine':'\n','nexist':'\u2204','nexists':'\u2204','nfr':'\uD835\uDD2B','Nfr':'\uD835\uDD11','nge':'\u2271','ngE':'\u2267\u0338','ngeq':'\u2271','ngeqq':'\u2267\u0338','ngeqslant':'\u2A7E\u0338','nges':'\u2A7E\u0338','nGg':'\u22D9\u0338','ngsim':'\u2275','ngt':'\u226F','nGt':'\u226B\u20D2','ngtr':'\u226F','nGtv':'\u226B\u0338','nharr':'\u21AE','nhArr':'\u21CE','nhpar':'\u2AF2','ni':'\u220B','nis':'\u22FC','nisd':'\u22FA','niv':'\u220B','njcy':'\u045A','NJcy':'\u040A','nlarr':'\u219A','nlArr':'\u21CD','nldr':'\u2025','nle':'\u2270','nlE':'\u2266\u0338','nleftarrow':'\u219A','nLeftarrow':'\u21CD','nleftrightarrow':'\u21AE','nLeftrightarrow':'\u21CE','nleq':'\u2270','nleqq':'\u2266\u0338','nleqslant':'\u2A7D\u0338','nles':'\u2A7D\u0338','nless':'\u226E','nLl':'\u22D8\u0338','nlsim':'\u2274','nlt':'\u226E','nLt':'\u226A\u20D2','nltri':'\u22EA','nltrie':'\u22EC','nLtv':'\u226A\u0338','nmid':'\u2224','NoBreak':'\u2060','NonBreakingSpace':'\xA0','nopf':'\uD835\uDD5F','Nopf':'\u2115','not':'\xAC','Not':'\u2AEC','NotCongruent':'\u2262','NotCupCap':'\u226D','NotDoubleVerticalBar':'\u2226','NotElement':'\u2209','NotEqual':'\u2260','NotEqualTilde':'\u2242\u0338','NotExists':'\u2204','NotGreater':'\u226F','NotGreaterEqual':'\u2271','NotGreaterFullEqual':'\u2267\u0338','NotGreaterGreater':'\u226B\u0338','NotGreaterLess':'\u2279','NotGreaterSlantEqual':'\u2A7E\u0338','NotGreaterTilde':'\u2275','NotHumpDownHump':'\u224E\u0338','NotHumpEqual':'\u224F\u0338','notin':'\u2209','notindot':'\u22F5\u0338','notinE':'\u22F9\u0338','notinva':'\u2209','notinvb':'\u22F7','notinvc':'\u22F6','NotLeftTriangle':'\u22EA','NotLeftTriangleBar':'\u29CF\u0338','NotLeftTriangleEqual':'\u22EC','NotLess':'\u226E','NotLessEqual':'\u2270','NotLessGreater':'\u2278','NotLessLess':'\u226A\u0338','NotLessSlantEqual':'\u2A7D\u0338','NotLessTilde':'\u2274','NotNestedGreaterGreater':'\u2AA2\u0338','NotNestedLessLess':'\u2AA1\u0338','notni':'\u220C','notniva':'\u220C','notnivb':'\u22FE','notnivc':'\u22FD','NotPrecedes':'\u2280','NotPrecedesEqual':'\u2AAF\u0338','NotPrecedesSlantEqual':'\u22E0','NotReverseElement':'\u220C','NotRightTriangle':'\u22EB','NotRightTriangleBar':'\u29D0\u0338','NotRightTriangleEqual':'\u22ED','NotSquareSubset':'\u228F\u0338','NotSquareSubsetEqual':'\u22E2','NotSquareSuperset':'\u2290\u0338','NotSquareSupersetEqual':'\u22E3','NotSubset':'\u2282\u20D2','NotSubsetEqual':'\u2288','NotSucceeds':'\u2281','NotSucceedsEqual':'\u2AB0\u0338','NotSucceedsSlantEqual':'\u22E1','NotSucceedsTilde':'\u227F\u0338','NotSuperset':'\u2283\u20D2','NotSupersetEqual':'\u2289','NotTilde':'\u2241','NotTildeEqual':'\u2244','NotTildeFullEqual':'\u2247','NotTildeTilde':'\u2249','NotVerticalBar':'\u2224','npar':'\u2226','nparallel':'\u2226','nparsl':'\u2AFD\u20E5','npart':'\u2202\u0338','npolint':'\u2A14','npr':'\u2280','nprcue':'\u22E0','npre':'\u2AAF\u0338','nprec':'\u2280','npreceq':'\u2AAF\u0338','nrarr':'\u219B','nrArr':'\u21CF','nrarrc':'\u2933\u0338','nrarrw':'\u219D\u0338','nrightarrow':'\u219B','nRightarrow':'\u21CF','nrtri':'\u22EB','nrtrie':'\u22ED','nsc':'\u2281','nsccue':'\u22E1','nsce':'\u2AB0\u0338','nscr':'\uD835\uDCC3','Nscr':'\uD835\uDCA9','nshortmid':'\u2224','nshortparallel':'\u2226','nsim':'\u2241','nsime':'\u2244','nsimeq':'\u2244','nsmid':'\u2224','nspar':'\u2226','nsqsube':'\u22E2','nsqsupe':'\u22E3','nsub':'\u2284','nsube':'\u2288','nsubE':'\u2AC5\u0338','nsubset':'\u2282\u20D2','nsubseteq':'\u2288','nsubseteqq':'\u2AC5\u0338','nsucc':'\u2281','nsucceq':'\u2AB0\u0338','nsup':'\u2285','nsupe':'\u2289','nsupE':'\u2AC6\u0338','nsupset':'\u2283\u20D2','nsupseteq':'\u2289','nsupseteqq':'\u2AC6\u0338','ntgl':'\u2279','ntilde':'\xF1','Ntilde':'\xD1','ntlg':'\u2278','ntriangleleft':'\u22EA','ntrianglelefteq':'\u22EC','ntriangleright':'\u22EB','ntrianglerighteq':'\u22ED','nu':'\u03BD','Nu':'\u039D','num':'#','numero':'\u2116','numsp':'\u2007','nvap':'\u224D\u20D2','nvdash':'\u22AC','nvDash':'\u22AD','nVdash':'\u22AE','nVDash':'\u22AF','nvge':'\u2265\u20D2','nvgt':'>\u20D2','nvHarr':'\u2904','nvinfin':'\u29DE','nvlArr':'\u2902','nvle':'\u2264\u20D2','nvlt':'<\u20D2','nvltrie':'\u22B4\u20D2','nvrArr':'\u2903','nvrtrie':'\u22B5\u20D2','nvsim':'\u223C\u20D2','nwarhk':'\u2923','nwarr':'\u2196','nwArr':'\u21D6','nwarrow':'\u2196','nwnear':'\u2927','oacute':'\xF3','Oacute':'\xD3','oast':'\u229B','ocir':'\u229A','ocirc':'\xF4','Ocirc':'\xD4','ocy':'\u043E','Ocy':'\u041E','odash':'\u229D','odblac':'\u0151','Odblac':'\u0150','odiv':'\u2A38','odot':'\u2299','odsold':'\u29BC','oelig':'\u0153','OElig':'\u0152','ofcir':'\u29BF','ofr':'\uD835\uDD2C','Ofr':'\uD835\uDD12','ogon':'\u02DB','ograve':'\xF2','Ograve':'\xD2','ogt':'\u29C1','ohbar':'\u29B5','ohm':'\u03A9','oint':'\u222E','olarr':'\u21BA','olcir':'\u29BE','olcross':'\u29BB','oline':'\u203E','olt':'\u29C0','omacr':'\u014D','Omacr':'\u014C','omega':'\u03C9','Omega':'\u03A9','omicron':'\u03BF','Omicron':'\u039F','omid':'\u29B6','ominus':'\u2296','oopf':'\uD835\uDD60','Oopf':'\uD835\uDD46','opar':'\u29B7','OpenCurlyDoubleQuote':'\u201C','OpenCurlyQuote':'\u2018','operp':'\u29B9','oplus':'\u2295','or':'\u2228','Or':'\u2A54','orarr':'\u21BB','ord':'\u2A5D','order':'\u2134','orderof':'\u2134','ordf':'\xAA','ordm':'\xBA','origof':'\u22B6','oror':'\u2A56','orslope':'\u2A57','orv':'\u2A5B','oS':'\u24C8','oscr':'\u2134','Oscr':'\uD835\uDCAA','oslash':'\xF8','Oslash':'\xD8','osol':'\u2298','otilde':'\xF5','Otilde':'\xD5','otimes':'\u2297','Otimes':'\u2A37','otimesas':'\u2A36','ouml':'\xF6','Ouml':'\xD6','ovbar':'\u233D','OverBar':'\u203E','OverBrace':'\u23DE','OverBracket':'\u23B4','OverParenthesis':'\u23DC','par':'\u2225','para':'\xB6','parallel':'\u2225','parsim':'\u2AF3','parsl':'\u2AFD','part':'\u2202','PartialD':'\u2202','pcy':'\u043F','Pcy':'\u041F','percnt':'%','period':'.','permil':'\u2030','perp':'\u22A5','pertenk':'\u2031','pfr':'\uD835\uDD2D','Pfr':'\uD835\uDD13','phi':'\u03C6','Phi':'\u03A6','phiv':'\u03D5','phmmat':'\u2133','phone':'\u260E','pi':'\u03C0','Pi':'\u03A0','pitchfork':'\u22D4','piv':'\u03D6','planck':'\u210F','planckh':'\u210E','plankv':'\u210F','plus':'+','plusacir':'\u2A23','plusb':'\u229E','pluscir':'\u2A22','plusdo':'\u2214','plusdu':'\u2A25','pluse':'\u2A72','PlusMinus':'\xB1','plusmn':'\xB1','plussim':'\u2A26','plustwo':'\u2A27','pm':'\xB1','Poincareplane':'\u210C','pointint':'\u2A15','popf':'\uD835\uDD61','Popf':'\u2119','pound':'\xA3','pr':'\u227A','Pr':'\u2ABB','prap':'\u2AB7','prcue':'\u227C','pre':'\u2AAF','prE':'\u2AB3','prec':'\u227A','precapprox':'\u2AB7','preccurlyeq':'\u227C','Precedes':'\u227A','PrecedesEqual':'\u2AAF','PrecedesSlantEqual':'\u227C','PrecedesTilde':'\u227E','preceq':'\u2AAF','precnapprox':'\u2AB9','precneqq':'\u2AB5','precnsim':'\u22E8','precsim':'\u227E','prime':'\u2032','Prime':'\u2033','primes':'\u2119','prnap':'\u2AB9','prnE':'\u2AB5','prnsim':'\u22E8','prod':'\u220F','Product':'\u220F','profalar':'\u232E','profline':'\u2312','profsurf':'\u2313','prop':'\u221D','Proportion':'\u2237','Proportional':'\u221D','propto':'\u221D','prsim':'\u227E','prurel':'\u22B0','pscr':'\uD835\uDCC5','Pscr':'\uD835\uDCAB','psi':'\u03C8','Psi':'\u03A8','puncsp':'\u2008','qfr':'\uD835\uDD2E','Qfr':'\uD835\uDD14','qint':'\u2A0C','qopf':'\uD835\uDD62','Qopf':'\u211A','qprime':'\u2057','qscr':'\uD835\uDCC6','Qscr':'\uD835\uDCAC','quaternions':'\u210D','quatint':'\u2A16','quest':'?','questeq':'\u225F','quot':'"','QUOT':'"','rAarr':'\u21DB','race':'\u223D\u0331','racute':'\u0155','Racute':'\u0154','radic':'\u221A','raemptyv':'\u29B3','rang':'\u27E9','Rang':'\u27EB','rangd':'\u2992','range':'\u29A5','rangle':'\u27E9','raquo':'\xBB','rarr':'\u2192','rArr':'\u21D2','Rarr':'\u21A0','rarrap':'\u2975','rarrb':'\u21E5','rarrbfs':'\u2920','rarrc':'\u2933','rarrfs':'\u291E','rarrhk':'\u21AA','rarrlp':'\u21AC','rarrpl':'\u2945','rarrsim':'\u2974','rarrtl':'\u21A3','Rarrtl':'\u2916','rarrw':'\u219D','ratail':'\u291A','rAtail':'\u291C','ratio':'\u2236','rationals':'\u211A','rbarr':'\u290D','rBarr':'\u290F','RBarr':'\u2910','rbbrk':'\u2773','rbrace':'}','rbrack':']','rbrke':'\u298C','rbrksld':'\u298E','rbrkslu':'\u2990','rcaron':'\u0159','Rcaron':'\u0158','rcedil':'\u0157','Rcedil':'\u0156','rceil':'\u2309','rcub':'}','rcy':'\u0440','Rcy':'\u0420','rdca':'\u2937','rdldhar':'\u2969','rdquo':'\u201D','rdquor':'\u201D','rdsh':'\u21B3','Re':'\u211C','real':'\u211C','realine':'\u211B','realpart':'\u211C','reals':'\u211D','rect':'\u25AD','reg':'\xAE','REG':'\xAE','ReverseElement':'\u220B','ReverseEquilibrium':'\u21CB','ReverseUpEquilibrium':'\u296F','rfisht':'\u297D','rfloor':'\u230B','rfr':'\uD835\uDD2F','Rfr':'\u211C','rHar':'\u2964','rhard':'\u21C1','rharu':'\u21C0','rharul':'\u296C','rho':'\u03C1','Rho':'\u03A1','rhov':'\u03F1','RightAngleBracket':'\u27E9','rightarrow':'\u2192','Rightarrow':'\u21D2','RightArrow':'\u2192','RightArrowBar':'\u21E5','RightArrowLeftArrow':'\u21C4','rightarrowtail':'\u21A3','RightCeiling':'\u2309','RightDoubleBracket':'\u27E7','RightDownTeeVector':'\u295D','RightDownVector':'\u21C2','RightDownVectorBar':'\u2955','RightFloor':'\u230B','rightharpoondown':'\u21C1','rightharpoonup':'\u21C0','rightleftarrows':'\u21C4','rightleftharpoons':'\u21CC','rightrightarrows':'\u21C9','rightsquigarrow':'\u219D','RightTee':'\u22A2','RightTeeArrow':'\u21A6','RightTeeVector':'\u295B','rightthreetimes':'\u22CC','RightTriangle':'\u22B3','RightTriangleBar':'\u29D0','RightTriangleEqual':'\u22B5','RightUpDownVector':'\u294F','RightUpTeeVector':'\u295C','RightUpVector':'\u21BE','RightUpVectorBar':'\u2954','RightVector':'\u21C0','RightVectorBar':'\u2953','ring':'\u02DA','risingdotseq':'\u2253','rlarr':'\u21C4','rlhar':'\u21CC','rlm':'\u200F','rmoust':'\u23B1','rmoustache':'\u23B1','rnmid':'\u2AEE','roang':'\u27ED','roarr':'\u21FE','robrk':'\u27E7','ropar':'\u2986','ropf':'\uD835\uDD63','Ropf':'\u211D','roplus':'\u2A2E','rotimes':'\u2A35','RoundImplies':'\u2970','rpar':')','rpargt':'\u2994','rppolint':'\u2A12','rrarr':'\u21C9','Rrightarrow':'\u21DB','rsaquo':'\u203A','rscr':'\uD835\uDCC7','Rscr':'\u211B','rsh':'\u21B1','Rsh':'\u21B1','rsqb':']','rsquo':'\u2019','rsquor':'\u2019','rthree':'\u22CC','rtimes':'\u22CA','rtri':'\u25B9','rtrie':'\u22B5','rtrif':'\u25B8','rtriltri':'\u29CE','RuleDelayed':'\u29F4','ruluhar':'\u2968','rx':'\u211E','sacute':'\u015B','Sacute':'\u015A','sbquo':'\u201A','sc':'\u227B','Sc':'\u2ABC','scap':'\u2AB8','scaron':'\u0161','Scaron':'\u0160','sccue':'\u227D','sce':'\u2AB0','scE':'\u2AB4','scedil':'\u015F','Scedil':'\u015E','scirc':'\u015D','Scirc':'\u015C','scnap':'\u2ABA','scnE':'\u2AB6','scnsim':'\u22E9','scpolint':'\u2A13','scsim':'\u227F','scy':'\u0441','Scy':'\u0421','sdot':'\u22C5','sdotb':'\u22A1','sdote':'\u2A66','searhk':'\u2925','searr':'\u2198','seArr':'\u21D8','searrow':'\u2198','sect':'\xA7','semi':';','seswar':'\u2929','setminus':'\u2216','setmn':'\u2216','sext':'\u2736','sfr':'\uD835\uDD30','Sfr':'\uD835\uDD16','sfrown':'\u2322','sharp':'\u266F','shchcy':'\u0449','SHCHcy':'\u0429','shcy':'\u0448','SHcy':'\u0428','ShortDownArrow':'\u2193','ShortLeftArrow':'\u2190','shortmid':'\u2223','shortparallel':'\u2225','ShortRightArrow':'\u2192','ShortUpArrow':'\u2191','shy':'\xAD','sigma':'\u03C3','Sigma':'\u03A3','sigmaf':'\u03C2','sigmav':'\u03C2','sim':'\u223C','simdot':'\u2A6A','sime':'\u2243','simeq':'\u2243','simg':'\u2A9E','simgE':'\u2AA0','siml':'\u2A9D','simlE':'\u2A9F','simne':'\u2246','simplus':'\u2A24','simrarr':'\u2972','slarr':'\u2190','SmallCircle':'\u2218','smallsetminus':'\u2216','smashp':'\u2A33','smeparsl':'\u29E4','smid':'\u2223','smile':'\u2323','smt':'\u2AAA','smte':'\u2AAC','smtes':'\u2AAC\uFE00','softcy':'\u044C','SOFTcy':'\u042C','sol':'/','solb':'\u29C4','solbar':'\u233F','sopf':'\uD835\uDD64','Sopf':'\uD835\uDD4A','spades':'\u2660','spadesuit':'\u2660','spar':'\u2225','sqcap':'\u2293','sqcaps':'\u2293\uFE00','sqcup':'\u2294','sqcups':'\u2294\uFE00','Sqrt':'\u221A','sqsub':'\u228F','sqsube':'\u2291','sqsubset':'\u228F','sqsubseteq':'\u2291','sqsup':'\u2290','sqsupe':'\u2292','sqsupset':'\u2290','sqsupseteq':'\u2292','squ':'\u25A1','square':'\u25A1','Square':'\u25A1','SquareIntersection':'\u2293','SquareSubset':'\u228F','SquareSubsetEqual':'\u2291','SquareSuperset':'\u2290','SquareSupersetEqual':'\u2292','SquareUnion':'\u2294','squarf':'\u25AA','squf':'\u25AA','srarr':'\u2192','sscr':'\uD835\uDCC8','Sscr':'\uD835\uDCAE','ssetmn':'\u2216','ssmile':'\u2323','sstarf':'\u22C6','star':'\u2606','Star':'\u22C6','starf':'\u2605','straightepsilon':'\u03F5','straightphi':'\u03D5','strns':'\xAF','sub':'\u2282','Sub':'\u22D0','subdot':'\u2ABD','sube':'\u2286','subE':'\u2AC5','subedot':'\u2AC3','submult':'\u2AC1','subne':'\u228A','subnE':'\u2ACB','subplus':'\u2ABF','subrarr':'\u2979','subset':'\u2282','Subset':'\u22D0','subseteq':'\u2286','subseteqq':'\u2AC5','SubsetEqual':'\u2286','subsetneq':'\u228A','subsetneqq':'\u2ACB','subsim':'\u2AC7','subsub':'\u2AD5','subsup':'\u2AD3','succ':'\u227B','succapprox':'\u2AB8','succcurlyeq':'\u227D','Succeeds':'\u227B','SucceedsEqual':'\u2AB0','SucceedsSlantEqual':'\u227D','SucceedsTilde':'\u227F','succeq':'\u2AB0','succnapprox':'\u2ABA','succneqq':'\u2AB6','succnsim':'\u22E9','succsim':'\u227F','SuchThat':'\u220B','sum':'\u2211','Sum':'\u2211','sung':'\u266A','sup':'\u2283','Sup':'\u22D1','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','supdot':'\u2ABE','supdsub':'\u2AD8','supe':'\u2287','supE':'\u2AC6','supedot':'\u2AC4','Superset':'\u2283','SupersetEqual':'\u2287','suphsol':'\u27C9','suphsub':'\u2AD7','suplarr':'\u297B','supmult':'\u2AC2','supne':'\u228B','supnE':'\u2ACC','supplus':'\u2AC0','supset':'\u2283','Supset':'\u22D1','supseteq':'\u2287','supseteqq':'\u2AC6','supsetneq':'\u228B','supsetneqq':'\u2ACC','supsim':'\u2AC8','supsub':'\u2AD4','supsup':'\u2AD6','swarhk':'\u2926','swarr':'\u2199','swArr':'\u21D9','swarrow':'\u2199','swnwar':'\u292A','szlig':'\xDF','Tab':'\t','target':'\u2316','tau':'\u03C4','Tau':'\u03A4','tbrk':'\u23B4','tcaron':'\u0165','Tcaron':'\u0164','tcedil':'\u0163','Tcedil':'\u0162','tcy':'\u0442','Tcy':'\u0422','tdot':'\u20DB','telrec':'\u2315','tfr':'\uD835\uDD31','Tfr':'\uD835\uDD17','there4':'\u2234','therefore':'\u2234','Therefore':'\u2234','theta':'\u03B8','Theta':'\u0398','thetasym':'\u03D1','thetav':'\u03D1','thickapprox':'\u2248','thicksim':'\u223C','ThickSpace':'\u205F\u200A','thinsp':'\u2009','ThinSpace':'\u2009','thkap':'\u2248','thksim':'\u223C','thorn':'\xFE','THORN':'\xDE','tilde':'\u02DC','Tilde':'\u223C','TildeEqual':'\u2243','TildeFullEqual':'\u2245','TildeTilde':'\u2248','times':'\xD7','timesb':'\u22A0','timesbar':'\u2A31','timesd':'\u2A30','tint':'\u222D','toea':'\u2928','top':'\u22A4','topbot':'\u2336','topcir':'\u2AF1','topf':'\uD835\uDD65','Topf':'\uD835\uDD4B','topfork':'\u2ADA','tosa':'\u2929','tprime':'\u2034','trade':'\u2122','TRADE':'\u2122','triangle':'\u25B5','triangledown':'\u25BF','triangleleft':'\u25C3','trianglelefteq':'\u22B4','triangleq':'\u225C','triangleright':'\u25B9','trianglerighteq':'\u22B5','tridot':'\u25EC','trie':'\u225C','triminus':'\u2A3A','TripleDot':'\u20DB','triplus':'\u2A39','trisb':'\u29CD','tritime':'\u2A3B','trpezium':'\u23E2','tscr':'\uD835\uDCC9','Tscr':'\uD835\uDCAF','tscy':'\u0446','TScy':'\u0426','tshcy':'\u045B','TSHcy':'\u040B','tstrok':'\u0167','Tstrok':'\u0166','twixt':'\u226C','twoheadleftarrow':'\u219E','twoheadrightarrow':'\u21A0','uacute':'\xFA','Uacute':'\xDA','uarr':'\u2191','uArr':'\u21D1','Uarr':'\u219F','Uarrocir':'\u2949','ubrcy':'\u045E','Ubrcy':'\u040E','ubreve':'\u016D','Ubreve':'\u016C','ucirc':'\xFB','Ucirc':'\xDB','ucy':'\u0443','Ucy':'\u0423','udarr':'\u21C5','udblac':'\u0171','Udblac':'\u0170','udhar':'\u296E','ufisht':'\u297E','ufr':'\uD835\uDD32','Ufr':'\uD835\uDD18','ugrave':'\xF9','Ugrave':'\xD9','uHar':'\u2963','uharl':'\u21BF','uharr':'\u21BE','uhblk':'\u2580','ulcorn':'\u231C','ulcorner':'\u231C','ulcrop':'\u230F','ultri':'\u25F8','umacr':'\u016B','Umacr':'\u016A','uml':'\xA8','UnderBar':'_','UnderBrace':'\u23DF','UnderBracket':'\u23B5','UnderParenthesis':'\u23DD','Union':'\u22C3','UnionPlus':'\u228E','uogon':'\u0173','Uogon':'\u0172','uopf':'\uD835\uDD66','Uopf':'\uD835\uDD4C','uparrow':'\u2191','Uparrow':'\u21D1','UpArrow':'\u2191','UpArrowBar':'\u2912','UpArrowDownArrow':'\u21C5','updownarrow':'\u2195','Updownarrow':'\u21D5','UpDownArrow':'\u2195','UpEquilibrium':'\u296E','upharpoonleft':'\u21BF','upharpoonright':'\u21BE','uplus':'\u228E','UpperLeftArrow':'\u2196','UpperRightArrow':'\u2197','upsi':'\u03C5','Upsi':'\u03D2','upsih':'\u03D2','upsilon':'\u03C5','Upsilon':'\u03A5','UpTee':'\u22A5','UpTeeArrow':'\u21A5','upuparrows':'\u21C8','urcorn':'\u231D','urcorner':'\u231D','urcrop':'\u230E','uring':'\u016F','Uring':'\u016E','urtri':'\u25F9','uscr':'\uD835\uDCCA','Uscr':'\uD835\uDCB0','utdot':'\u22F0','utilde':'\u0169','Utilde':'\u0168','utri':'\u25B5','utrif':'\u25B4','uuarr':'\u21C8','uuml':'\xFC','Uuml':'\xDC','uwangle':'\u29A7','vangrt':'\u299C','varepsilon':'\u03F5','varkappa':'\u03F0','varnothing':'\u2205','varphi':'\u03D5','varpi':'\u03D6','varpropto':'\u221D','varr':'\u2195','vArr':'\u21D5','varrho':'\u03F1','varsigma':'\u03C2','varsubsetneq':'\u228A\uFE00','varsubsetneqq':'\u2ACB\uFE00','varsupsetneq':'\u228B\uFE00','varsupsetneqq':'\u2ACC\uFE00','vartheta':'\u03D1','vartriangleleft':'\u22B2','vartriangleright':'\u22B3','vBar':'\u2AE8','Vbar':'\u2AEB','vBarv':'\u2AE9','vcy':'\u0432','Vcy':'\u0412','vdash':'\u22A2','vDash':'\u22A8','Vdash':'\u22A9','VDash':'\u22AB','Vdashl':'\u2AE6','vee':'\u2228','Vee':'\u22C1','veebar':'\u22BB','veeeq':'\u225A','vellip':'\u22EE','verbar':'|','Verbar':'\u2016','vert':'|','Vert':'\u2016','VerticalBar':'\u2223','VerticalLine':'|','VerticalSeparator':'\u2758','VerticalTilde':'\u2240','VeryThinSpace':'\u200A','vfr':'\uD835\uDD33','Vfr':'\uD835\uDD19','vltri':'\u22B2','vnsub':'\u2282\u20D2','vnsup':'\u2283\u20D2','vopf':'\uD835\uDD67','Vopf':'\uD835\uDD4D','vprop':'\u221D','vrtri':'\u22B3','vscr':'\uD835\uDCCB','Vscr':'\uD835\uDCB1','vsubne':'\u228A\uFE00','vsubnE':'\u2ACB\uFE00','vsupne':'\u228B\uFE00','vsupnE':'\u2ACC\uFE00','Vvdash':'\u22AA','vzigzag':'\u299A','wcirc':'\u0175','Wcirc':'\u0174','wedbar':'\u2A5F','wedge':'\u2227','Wedge':'\u22C0','wedgeq':'\u2259','weierp':'\u2118','wfr':'\uD835\uDD34','Wfr':'\uD835\uDD1A','wopf':'\uD835\uDD68','Wopf':'\uD835\uDD4E','wp':'\u2118','wr':'\u2240','wreath':'\u2240','wscr':'\uD835\uDCCC','Wscr':'\uD835\uDCB2','xcap':'\u22C2','xcirc':'\u25EF','xcup':'\u22C3','xdtri':'\u25BD','xfr':'\uD835\uDD35','Xfr':'\uD835\uDD1B','xharr':'\u27F7','xhArr':'\u27FA','xi':'\u03BE','Xi':'\u039E','xlarr':'\u27F5','xlArr':'\u27F8','xmap':'\u27FC','xnis':'\u22FB','xodot':'\u2A00','xopf':'\uD835\uDD69','Xopf':'\uD835\uDD4F','xoplus':'\u2A01','xotime':'\u2A02','xrarr':'\u27F6','xrArr':'\u27F9','xscr':'\uD835\uDCCD','Xscr':'\uD835\uDCB3','xsqcup':'\u2A06','xuplus':'\u2A04','xutri':'\u25B3','xvee':'\u22C1','xwedge':'\u22C0','yacute':'\xFD','Yacute':'\xDD','yacy':'\u044F','YAcy':'\u042F','ycirc':'\u0177','Ycirc':'\u0176','ycy':'\u044B','Ycy':'\u042B','yen':'\xA5','yfr':'\uD835\uDD36','Yfr':'\uD835\uDD1C','yicy':'\u0457','YIcy':'\u0407','yopf':'\uD835\uDD6A','Yopf':'\uD835\uDD50','yscr':'\uD835\uDCCE','Yscr':'\uD835\uDCB4','yucy':'\u044E','YUcy':'\u042E','yuml':'\xFF','Yuml':'\u0178','zacute':'\u017A','Zacute':'\u0179','zcaron':'\u017E','Zcaron':'\u017D','zcy':'\u0437','Zcy':'\u0417','zdot':'\u017C','Zdot':'\u017B','zeetrf':'\u2128','ZeroWidthSpace':'\u200B','zeta':'\u03B6','Zeta':'\u0396','zfr':'\uD835\uDD37','Zfr':'\u2128','zhcy':'\u0436','ZHcy':'\u0416','zigrarr':'\u21DD','zopf':'\uD835\uDD6B','Zopf':'\u2124','zscr':'\uD835\uDCCF','Zscr':'\uD835\uDCB5','zwj':'\u200D','zwnj':'\u200C'};
	var decodeMapLegacy = {'aacute':'\xE1','Aacute':'\xC1','acirc':'\xE2','Acirc':'\xC2','acute':'\xB4','aelig':'\xE6','AElig':'\xC6','agrave':'\xE0','Agrave':'\xC0','amp':'&','AMP':'&','aring':'\xE5','Aring':'\xC5','atilde':'\xE3','Atilde':'\xC3','auml':'\xE4','Auml':'\xC4','brvbar':'\xA6','ccedil':'\xE7','Ccedil':'\xC7','cedil':'\xB8','cent':'\xA2','copy':'\xA9','COPY':'\xA9','curren':'\xA4','deg':'\xB0','divide':'\xF7','eacute':'\xE9','Eacute':'\xC9','ecirc':'\xEA','Ecirc':'\xCA','egrave':'\xE8','Egrave':'\xC8','eth':'\xF0','ETH':'\xD0','euml':'\xEB','Euml':'\xCB','frac12':'\xBD','frac14':'\xBC','frac34':'\xBE','gt':'>','GT':'>','iacute':'\xED','Iacute':'\xCD','icirc':'\xEE','Icirc':'\xCE','iexcl':'\xA1','igrave':'\xEC','Igrave':'\xCC','iquest':'\xBF','iuml':'\xEF','Iuml':'\xCF','laquo':'\xAB','lt':'<','LT':'<','macr':'\xAF','micro':'\xB5','middot':'\xB7','nbsp':'\xA0','not':'\xAC','ntilde':'\xF1','Ntilde':'\xD1','oacute':'\xF3','Oacute':'\xD3','ocirc':'\xF4','Ocirc':'\xD4','ograve':'\xF2','Ograve':'\xD2','ordf':'\xAA','ordm':'\xBA','oslash':'\xF8','Oslash':'\xD8','otilde':'\xF5','Otilde':'\xD5','ouml':'\xF6','Ouml':'\xD6','para':'\xB6','plusmn':'\xB1','pound':'\xA3','quot':'"','QUOT':'"','raquo':'\xBB','reg':'\xAE','REG':'\xAE','sect':'\xA7','shy':'\xAD','sup1':'\xB9','sup2':'\xB2','sup3':'\xB3','szlig':'\xDF','thorn':'\xFE','THORN':'\xDE','times':'\xD7','uacute':'\xFA','Uacute':'\xDA','ucirc':'\xFB','Ucirc':'\xDB','ugrave':'\xF9','Ugrave':'\xD9','uml':'\xA8','uuml':'\xFC','Uuml':'\xDC','yacute':'\xFD','Yacute':'\xDD','yen':'\xA5','yuml':'\xFF'};
	var decodeMapNumeric = {'0':'\uFFFD','128':'\u20AC','130':'\u201A','131':'\u0192','132':'\u201E','133':'\u2026','134':'\u2020','135':'\u2021','136':'\u02C6','137':'\u2030','138':'\u0160','139':'\u2039','140':'\u0152','142':'\u017D','145':'\u2018','146':'\u2019','147':'\u201C','148':'\u201D','149':'\u2022','150':'\u2013','151':'\u2014','152':'\u02DC','153':'\u2122','154':'\u0161','155':'\u203A','156':'\u0153','158':'\u017E','159':'\u0178'};
	var invalidReferenceCodePoints = [1,2,3,4,5,6,7,8,11,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,64976,64977,64978,64979,64980,64981,64982,64983,64984,64985,64986,64987,64988,64989,64990,64991,64992,64993,64994,64995,64996,64997,64998,64999,65000,65001,65002,65003,65004,65005,65006,65007,65534,65535,131070,131071,196606,196607,262142,262143,327678,327679,393214,393215,458750,458751,524286,524287,589822,589823,655358,655359,720894,720895,786430,786431,851966,851967,917502,917503,983038,983039,1048574,1048575,1114110,1114111];

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	var object = {};
	var hasOwnProperty = object.hasOwnProperty;
	var has = function(object, propertyName) {
		return hasOwnProperty.call(object, propertyName);
	};

	var contains = function(array, value) {
		var index = -1;
		var length = array.length;
		while (++index < length) {
			if (array[index] == value) {
				return true;
			}
		}
		return false;
	};

	var merge = function(options, defaults) {
		if (!options) {
			return defaults;
		}
		var result = {};
		var key;
		for (key in defaults) {
			// A `hasOwnProperty` check is not needed here, since only recognized
			// option names are used anyway. Any others are ignored.
			result[key] = has(options, key) ? options[key] : defaults[key];
		}
		return result;
	};

	// Modified version of `ucs2encode`; see https://mths.be/punycode.
	var codePointToSymbol = function(codePoint, strict) {
		var output = '';
		if ((codePoint >= 0xD800 && codePoint <= 0xDFFF) || codePoint > 0x10FFFF) {
			// See issue #4:
			// “Otherwise, if the number is in the range 0xD800 to 0xDFFF or is
			// greater than 0x10FFFF, then this is a parse error. Return a U+FFFD
			// REPLACEMENT CHARACTER.”
			if (strict) {
				parseError('character reference outside the permissible Unicode range');
			}
			return '\uFFFD';
		}
		if (has(decodeMapNumeric, codePoint)) {
			if (strict) {
				parseError('disallowed character reference');
			}
			return decodeMapNumeric[codePoint];
		}
		if (strict && contains(invalidReferenceCodePoints, codePoint)) {
			parseError('disallowed character reference');
		}
		if (codePoint > 0xFFFF) {
			codePoint -= 0x10000;
			output += stringFromCharCode(codePoint >>> 10 & 0x3FF | 0xD800);
			codePoint = 0xDC00 | codePoint & 0x3FF;
		}
		output += stringFromCharCode(codePoint);
		return output;
	};

	var hexEscape = function(codePoint) {
		return '&#x' + codePoint.toString(16).toUpperCase() + ';';
	};

	var decEscape = function(codePoint) {
		return '&#' + codePoint + ';';
	};

	var parseError = function(message) {
		throw Error('Parse error: ' + message);
	};

	/*--------------------------------------------------------------------------*/

	var encode = function(string, options) {
		options = merge(options, encode.options);
		var strict = options.strict;
		if (strict && regexInvalidRawCodePoint.test(string)) {
			parseError('forbidden code point');
		}
		var encodeEverything = options.encodeEverything;
		var useNamedReferences = options.useNamedReferences;
		var allowUnsafeSymbols = options.allowUnsafeSymbols;
		var escapeCodePoint = options.decimal ? decEscape : hexEscape;

		var escapeBmpSymbol = function(symbol) {
			return escapeCodePoint(symbol.charCodeAt(0));
		};

		if (encodeEverything) {
			// Encode ASCII symbols.
			string = string.replace(regexAsciiWhitelist, function(symbol) {
				// Use named references if requested & possible.
				if (useNamedReferences && has(encodeMap, symbol)) {
					return '&' + encodeMap[symbol] + ';';
				}
				return escapeBmpSymbol(symbol);
			});
			// Shorten a few escapes that represent two symbols, of which at least one
			// is within the ASCII range.
			if (useNamedReferences) {
				string = string
					.replace(/&gt;\u20D2/g, '&nvgt;')
					.replace(/&lt;\u20D2/g, '&nvlt;')
					.replace(/&#x66;&#x6A;/g, '&fjlig;');
			}
			// Encode non-ASCII symbols.
			if (useNamedReferences) {
				// Encode non-ASCII symbols that can be replaced with a named reference.
				string = string.replace(regexEncodeNonAscii, function(string) {
					// Note: there is no need to check `has(encodeMap, string)` here.
					return '&' + encodeMap[string] + ';';
				});
			}
			// Note: any remaining non-ASCII symbols are handled outside of the `if`.
		} else if (useNamedReferences) {
			// Apply named character references.
			// Encode `<>"'&` using named character references.
			if (!allowUnsafeSymbols) {
				string = string.replace(regexEscape, function(string) {
					return '&' + encodeMap[string] + ';'; // no need to check `has()` here
				});
			}
			// Shorten escapes that represent two symbols, of which at least one is
			// `<>"'&`.
			string = string
				.replace(/&gt;\u20D2/g, '&nvgt;')
				.replace(/&lt;\u20D2/g, '&nvlt;');
			// Encode non-ASCII symbols that can be replaced with a named reference.
			string = string.replace(regexEncodeNonAscii, function(string) {
				// Note: there is no need to check `has(encodeMap, string)` here.
				return '&' + encodeMap[string] + ';';
			});
		} else if (!allowUnsafeSymbols) {
			// Encode `<>"'&` using hexadecimal escapes, now that they’re not handled
			// using named character references.
			string = string.replace(regexEscape, escapeBmpSymbol);
		}
		return string
			// Encode astral symbols.
			.replace(regexAstralSymbols, function($0) {
				// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
				var high = $0.charCodeAt(0);
				var low = $0.charCodeAt(1);
				var codePoint = (high - 0xD800) * 0x400 + low - 0xDC00 + 0x10000;
				return escapeCodePoint(codePoint);
			})
			// Encode any remaining BMP symbols that are not printable ASCII symbols
			// using a hexadecimal escape.
			.replace(regexBmpWhitelist, escapeBmpSymbol);
	};
	// Expose default options (so they can be overridden globally).
	encode.options = {
		'allowUnsafeSymbols': false,
		'encodeEverything': false,
		'strict': false,
		'useNamedReferences': false,
		'decimal' : false
	};

	var decode = function(html, options) {
		options = merge(options, decode.options);
		var strict = options.strict;
		if (strict && regexInvalidEntity.test(html)) {
			parseError('malformed character reference');
		}
		return html.replace(regexDecode, function($0, $1, $2, $3, $4, $5, $6, $7, $8) {
			var codePoint;
			var semicolon;
			var decDigits;
			var hexDigits;
			var reference;
			var next;

			if ($1) {
				reference = $1;
				// Note: there is no need to check `has(decodeMap, reference)`.
				return decodeMap[reference];
			}

			if ($2) {
				// Decode named character references without trailing `;`, e.g. `&amp`.
				// This is only a parse error if it gets converted to `&`, or if it is
				// followed by `=` in an attribute context.
				reference = $2;
				next = $3;
				if (next && options.isAttributeValue) {
					if (strict && next == '=') {
						parseError('`&` did not start a character reference');
					}
					return $0;
				} else {
					if (strict) {
						parseError(
							'named character reference was not terminated by a semicolon'
						);
					}
					// Note: there is no need to check `has(decodeMapLegacy, reference)`.
					return decodeMapLegacy[reference] + (next || '');
				}
			}

			if ($4) {
				// Decode decimal escapes, e.g. `&#119558;`.
				decDigits = $4;
				semicolon = $5;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(decDigits, 10);
				return codePointToSymbol(codePoint, strict);
			}

			if ($6) {
				// Decode hexadecimal escapes, e.g. `&#x1D306;`.
				hexDigits = $6;
				semicolon = $7;
				if (strict && !semicolon) {
					parseError('character reference was not terminated by a semicolon');
				}
				codePoint = parseInt(hexDigits, 16);
				return codePointToSymbol(codePoint, strict);
			}

			// If we’re still here, `if ($7)` is implied; it’s an ambiguous
			// ampersand for sure. https://mths.be/notes/ambiguous-ampersands
			if (strict) {
				parseError(
					'named character reference was not terminated by a semicolon'
				);
			}
			return $0;
		});
	};
	// Expose default options (so they can be overridden globally).
	decode.options = {
		'isAttributeValue': false,
		'strict': false
	};

	var escape = function(string) {
		return string.replace(regexEscape, function($0) {
			// Note: there is no need to check `has(escapeMap, $0)` here.
			return escapeMap[$0];
		});
	};

	/*--------------------------------------------------------------------------*/

	var he = {
		'version': '1.2.0',
		'encode': encode,
		'decode': decode,
		'escape': escape,
		'unescape': decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return he;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = he;
		} else { // in Narwhal or RingoJS v0.7.0-
			for (var key in he) {
				has(he, key) && (freeExports[key] = he[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.he = he;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],70:[function(require,module,exports){
/*!
 * hex-color-regex <https://github.com/regexps/hex-color-regex>
 *
 * Copyright (c) 2015 Charlike Mike Reagent <@tunnckoCore> (http://www.tunnckocore.tk)
 * Released under the MIT license.
 */

'use strict'

module.exports = function hexColorRegex(opts) {
  opts = opts && typeof opts === 'object' ? opts : {}

  return opts.strict
    ? /^#([a-f0-9]{3,4}|[a-f0-9]{4}(?:[a-f0-9]{2}){1,2})\b$/i
    : /#([a-f0-9]{3}|[a-f0-9]{4}(?:[a-f0-9]{2}){0,2})\b/gi
}

},{}],71:[function(require,module,exports){
'use strict';

module.exports = function hslRegex(options) {
  options = options || {};

  return options.exact ?
    /^hsl\(\s*(\d+)\s*,\s*(\d*(?:\.\d+)?%)\s*,\s*(\d*(?:\.\d+)?%)\)$/ :
    /hsl\(\s*(\d+)\s*,\s*(\d*(?:\.\d+)?%)\s*,\s*(\d*(?:\.\d+)?%)\)/ig;
}

},{}],72:[function(require,module,exports){
'use strict';

module.exports = function hslaRegex(options) {
  options = options || {};

  return options.exact ?
    /^hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*(\d*(?:\.\d+)?)\)$/ :
    /hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*(\d*(?:\.\d+)?)\)/ig;
}

},{}],73:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var MultiplexHandler_1 = __importDefault(require("./MultiplexHandler"));
var CollectingHandler = /** @class */ (function (_super) {
    __extends(CollectingHandler, _super);
    function CollectingHandler(cbs) {
        if (cbs === void 0) { cbs = {}; }
        var _this = _super.call(this, function (name) {
            var _a;
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            _this.events.push([name].concat(args));
            // @ts-ignore
            if (_this._cbs[name])
                (_a = _this._cbs)[name].apply(_a, args);
        }) || this;
        _this._cbs = cbs;
        _this.events = [];
        return _this;
    }
    CollectingHandler.prototype.onreset = function () {
        this.events = [];
        if (this._cbs.onreset)
            this._cbs.onreset();
    };
    CollectingHandler.prototype.restart = function () {
        var _a;
        if (this._cbs.onreset)
            this._cbs.onreset();
        for (var i = 0; i < this.events.length; i++) {
            var _b = this.events[i], name_1 = _b[0], args = _b.slice(1);
            if (!this._cbs[name_1]) {
                continue;
            }
            // @ts-ignore
            (_a = this._cbs)[name_1].apply(_a, args);
        }
    };
    return CollectingHandler;
}(MultiplexHandler_1.default));
exports.CollectingHandler = CollectingHandler;

},{"./MultiplexHandler":75}],74:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var domhandler_1 = __importDefault(require("domhandler"));
var DomUtils = __importStar(require("domutils"));
var Parser_1 = require("./Parser");
//TODO: Consume data as it is coming in
var FeedHandler = /** @class */ (function (_super) {
    __extends(FeedHandler, _super);
    /**
     *
     * @param callback
     * @param options
     */
    function FeedHandler(callback, options) {
        var _this = this;
        if (typeof callback === "object" && callback !== null) {
            callback = undefined;
            options = callback;
        }
        _this = _super.call(this, callback, options) || this;
        return _this;
    }
    FeedHandler.prototype.onend = function () {
        var feed = {};
        var feedRoot = getOneElement(isValidFeed, this.dom);
        if (feedRoot) {
            if (feedRoot.name === "feed") {
                var childs = feedRoot.children;
                feed.type = "atom";
                addConditionally(feed, "id", "id", childs);
                addConditionally(feed, "title", "title", childs);
                var href = getAttribute("href", getOneElement("link", childs));
                if (href) {
                    feed.link = href;
                }
                addConditionally(feed, "description", "subtitle", childs);
                var updated = fetch("updated", childs);
                if (updated) {
                    feed.updated = new Date(updated);
                }
                addConditionally(feed, "author", "email", childs, true);
                feed.items = getElements("entry", childs).map(function (item) {
                    var entry = {};
                    var children = item.children;
                    addConditionally(entry, "id", "id", children);
                    addConditionally(entry, "title", "title", children);
                    var href = getAttribute("href", getOneElement("link", children));
                    if (href) {
                        entry.link = href;
                    }
                    var description = fetch("summary", children) ||
                        fetch("content", children);
                    if (description) {
                        entry.description = description;
                    }
                    var pubDate = fetch("updated", children);
                    if (pubDate) {
                        entry.pubDate = new Date(pubDate);
                    }
                    return entry;
                });
            }
            else {
                var childs = getOneElement("channel", feedRoot.children)
                    .children;
                feed.type = feedRoot.name.substr(0, 3);
                feed.id = "";
                addConditionally(feed, "title", "title", childs);
                addConditionally(feed, "link", "link", childs);
                addConditionally(feed, "description", "description", childs);
                var updated = fetch("lastBuildDate", childs);
                if (updated) {
                    feed.updated = new Date(updated);
                }
                addConditionally(feed, "author", "managingEditor", childs, true);
                feed.items = getElements("item", feedRoot.children).map(function (item) {
                    var entry = {};
                    var children = item.children;
                    addConditionally(entry, "id", "guid", children);
                    addConditionally(entry, "title", "title", children);
                    addConditionally(entry, "link", "link", children);
                    addConditionally(entry, "description", "description", children);
                    var pubDate = fetch("pubDate", children);
                    if (pubDate)
                        entry.pubDate = new Date(pubDate);
                    return entry;
                });
            }
        }
        this.feed = feed;
        this.handleCallback(feedRoot ? null : Error("couldn't find root of feed"));
    };
    return FeedHandler;
}(domhandler_1.default));
exports.FeedHandler = FeedHandler;
function getElements(what, where) {
    return DomUtils.getElementsByTagName(what, where, true);
}
function getOneElement(what, where) {
    return DomUtils.getElementsByTagName(what, where, true, 1)[0];
}
function fetch(what, where, recurse) {
    if (recurse === void 0) { recurse = false; }
    return DomUtils.getText(DomUtils.getElementsByTagName(what, where, recurse, 1)).trim();
}
function getAttribute(name, elem) {
    if (!elem) {
        return null;
    }
    var attribs = elem.attribs;
    return attribs[name];
}
function addConditionally(obj, prop, what, where, recurse) {
    if (recurse === void 0) { recurse = false; }
    var tmp = fetch(what, where, recurse);
    // @ts-ignore
    if (tmp)
        obj[prop] = tmp;
}
function isValidFeed(value) {
    return value === "rss" || value === "feed" || value === "rdf:RDF";
}
var defaultOptions = { xmlMode: true };
/**
 * Parse a feed.
 *
 * @param feed The feed that should be parsed, as a string.
 * @param options Optionally, options for parsing. When using this option, you probably want to set `xmlMode` to `true`.
 */
function parseFeed(feed, options) {
    if (options === void 0) { options = defaultOptions; }
    var handler = new FeedHandler(options);
    new Parser_1.Parser(handler, options).end(feed);
    return handler.feed;
}
exports.parseFeed = parseFeed;

},{"./Parser":76,"domhandler":47,"domutils":82}],75:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Calls a specific handler function for all events that are encountered.
 *
 * @param func — The function to multiplex all events to.
 */
var MultiplexHandler = /** @class */ (function () {
    function MultiplexHandler(func) {
        this._func = func;
    }
    /* Format: eventname: number of arguments */
    MultiplexHandler.prototype.onattribute = function (name, value) {
        this._func("onattribute", name, value);
    };
    MultiplexHandler.prototype.oncdatastart = function () {
        this._func("oncdatastart");
    };
    MultiplexHandler.prototype.oncdataend = function () {
        this._func("oncdataend");
    };
    MultiplexHandler.prototype.ontext = function (text) {
        this._func("ontext", text);
    };
    MultiplexHandler.prototype.onprocessinginstruction = function (name, value) {
        this._func("onprocessinginstruction", name, value);
    };
    MultiplexHandler.prototype.oncomment = function (comment) {
        this._func("oncomment", comment);
    };
    MultiplexHandler.prototype.oncommentend = function () {
        this._func("oncommentend");
    };
    MultiplexHandler.prototype.onclosetag = function (name) {
        this._func("onclosetag", name);
    };
    MultiplexHandler.prototype.onopentag = function (name, attribs) {
        this._func("onopentag", name, attribs);
    };
    MultiplexHandler.prototype.onopentagname = function (name) {
        this._func("onopentagname", name);
    };
    MultiplexHandler.prototype.onerror = function (error) {
        this._func("onerror", error);
    };
    MultiplexHandler.prototype.onend = function () {
        this._func("onend");
    };
    MultiplexHandler.prototype.onparserinit = function (parser) {
        this._func("onparserinit", parser);
    };
    MultiplexHandler.prototype.onreset = function () {
        this._func("onreset");
    };
    return MultiplexHandler;
}());
exports.default = MultiplexHandler;

},{}],76:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Tokenizer_1 = __importDefault(require("./Tokenizer"));
var events_1 = require("events");
var formTags = new Set([
    "input",
    "option",
    "optgroup",
    "select",
    "button",
    "datalist",
    "textarea"
]);
var pTag = new Set(["p"]);
var openImpliesClose = {
    tr: new Set(["tr", "th", "td"]),
    th: new Set(["th"]),
    td: new Set(["thead", "th", "td"]),
    body: new Set(["head", "link", "script"]),
    li: new Set(["li"]),
    p: pTag,
    h1: pTag,
    h2: pTag,
    h3: pTag,
    h4: pTag,
    h5: pTag,
    h6: pTag,
    select: formTags,
    input: formTags,
    output: formTags,
    button: formTags,
    datalist: formTags,
    textarea: formTags,
    option: new Set(["option"]),
    optgroup: new Set(["optgroup", "option"]),
    dd: new Set(["dt", "dd"]),
    dt: new Set(["dt", "dd"]),
    address: pTag,
    article: pTag,
    aside: pTag,
    blockquote: pTag,
    details: pTag,
    div: pTag,
    dl: pTag,
    fieldset: pTag,
    figcaption: pTag,
    figure: pTag,
    footer: pTag,
    form: pTag,
    header: pTag,
    hr: pTag,
    main: pTag,
    nav: pTag,
    ol: pTag,
    pre: pTag,
    section: pTag,
    table: pTag,
    ul: pTag,
    rt: new Set(["rt", "rp"]),
    rp: new Set(["rt", "rp"]),
    tbody: new Set(["thead", "tbody"]),
    tfoot: new Set(["thead", "tbody"])
};
var voidElements = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);
var foreignContextElements = new Set(["math", "svg"]);
var htmlIntegrationElements = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignObject",
    "desc",
    "title"
]);
var reNameEnd = /\s|\//;
var Parser = /** @class */ (function (_super) {
    __extends(Parser, _super);
    function Parser(cbs, options) {
        var _this = _super.call(this) || this;
        _this._tagname = "";
        _this._attribname = "";
        _this._attribvalue = "";
        _this._attribs = null;
        _this._stack = [];
        _this._foreignContext = [];
        _this.startIndex = 0;
        _this.endIndex = null;
        // Aliases for backwards compatibility
        _this.parseChunk = Parser.prototype.write;
        _this.done = Parser.prototype.end;
        _this._options = options || {};
        _this._cbs = cbs || {};
        _this._tagname = "";
        _this._attribname = "";
        _this._attribvalue = "";
        _this._attribs = null;
        _this._stack = [];
        _this._foreignContext = [];
        _this.startIndex = 0;
        _this.endIndex = null;
        _this._lowerCaseTagNames =
            "lowerCaseTags" in _this._options
                ? !!_this._options.lowerCaseTags
                : !_this._options.xmlMode;
        _this._lowerCaseAttributeNames =
            "lowerCaseAttributeNames" in _this._options
                ? !!_this._options.lowerCaseAttributeNames
                : !_this._options.xmlMode;
        _this._tokenizer = new (_this._options.Tokenizer || Tokenizer_1.default)(_this._options, _this);
        if (_this._cbs.onparserinit)
            _this._cbs.onparserinit(_this);
        return _this;
    }
    Parser.prototype._updatePosition = function (initialOffset) {
        if (this.endIndex === null) {
            if (this._tokenizer._sectionStart <= initialOffset) {
                this.startIndex = 0;
            }
            else {
                this.startIndex = this._tokenizer._sectionStart - initialOffset;
            }
        }
        else
            this.startIndex = this.endIndex + 1;
        this.endIndex = this._tokenizer.getAbsoluteIndex();
    };
    //Tokenizer event handlers
    Parser.prototype.ontext = function (data) {
        this._updatePosition(1);
        // @ts-ignore
        this.endIndex--;
        if (this._cbs.ontext)
            this._cbs.ontext(data);
    };
    Parser.prototype.onopentagname = function (name) {
        if (this._lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        this._tagname = name;
        if (!this._options.xmlMode &&
            Object.prototype.hasOwnProperty.call(openImpliesClose, name)) {
            for (var el = void 0; 
            // @ts-ignore
            openImpliesClose[name].has((el = this._stack[this._stack.length - 1])); this.onclosetag(el))
                ;
        }
        if (this._options.xmlMode || !voidElements.has(name)) {
            this._stack.push(name);
            if (foreignContextElements.has(name)) {
                this._foreignContext.push(true);
            }
            else if (htmlIntegrationElements.has(name)) {
                this._foreignContext.push(false);
            }
        }
        if (this._cbs.onopentagname)
            this._cbs.onopentagname(name);
        if (this._cbs.onopentag)
            this._attribs = {};
    };
    Parser.prototype.onopentagend = function () {
        this._updatePosition(1);
        if (this._attribs) {
            if (this._cbs.onopentag) {
                this._cbs.onopentag(this._tagname, this._attribs);
            }
            this._attribs = null;
        }
        if (!this._options.xmlMode &&
            this._cbs.onclosetag &&
            voidElements.has(this._tagname)) {
            this._cbs.onclosetag(this._tagname);
        }
        this._tagname = "";
    };
    Parser.prototype.onclosetag = function (name) {
        this._updatePosition(1);
        if (this._lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        if (foreignContextElements.has(name) ||
            htmlIntegrationElements.has(name)) {
            this._foreignContext.pop();
        }
        if (this._stack.length &&
            (this._options.xmlMode || !voidElements.has(name))) {
            var pos = this._stack.lastIndexOf(name);
            if (pos !== -1) {
                if (this._cbs.onclosetag) {
                    pos = this._stack.length - pos;
                    // @ts-ignore
                    while (pos--)
                        this._cbs.onclosetag(this._stack.pop());
                }
                else
                    this._stack.length = pos;
            }
            else if (name === "p" && !this._options.xmlMode) {
                this.onopentagname(name);
                this._closeCurrentTag();
            }
        }
        else if (!this._options.xmlMode && (name === "br" || name === "p")) {
            this.onopentagname(name);
            this._closeCurrentTag();
        }
    };
    Parser.prototype.onselfclosingtag = function () {
        if (this._options.xmlMode ||
            this._options.recognizeSelfClosing ||
            this._foreignContext[this._foreignContext.length - 1]) {
            this._closeCurrentTag();
        }
        else {
            this.onopentagend();
        }
    };
    Parser.prototype._closeCurrentTag = function () {
        var name = this._tagname;
        this.onopentagend();
        //self-closing tags will be on the top of the stack
        //(cheaper check than in onclosetag)
        if (this._stack[this._stack.length - 1] === name) {
            if (this._cbs.onclosetag) {
                this._cbs.onclosetag(name);
            }
            this._stack.pop();
        }
    };
    Parser.prototype.onattribname = function (name) {
        if (this._lowerCaseAttributeNames) {
            name = name.toLowerCase();
        }
        this._attribname = name;
    };
    Parser.prototype.onattribdata = function (value) {
        this._attribvalue += value;
    };
    Parser.prototype.onattribend = function () {
        if (this._cbs.onattribute)
            this._cbs.onattribute(this._attribname, this._attribvalue);
        if (this._attribs &&
            !Object.prototype.hasOwnProperty.call(this._attribs, this._attribname)) {
            this._attribs[this._attribname] = this._attribvalue;
        }
        this._attribname = "";
        this._attribvalue = "";
    };
    Parser.prototype._getInstructionName = function (value) {
        var idx = value.search(reNameEnd);
        var name = idx < 0 ? value : value.substr(0, idx);
        if (this._lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        return name;
    };
    Parser.prototype.ondeclaration = function (value) {
        if (this._cbs.onprocessinginstruction) {
            var name_1 = this._getInstructionName(value);
            this._cbs.onprocessinginstruction("!" + name_1, "!" + value);
        }
    };
    Parser.prototype.onprocessinginstruction = function (value) {
        if (this._cbs.onprocessinginstruction) {
            var name_2 = this._getInstructionName(value);
            this._cbs.onprocessinginstruction("?" + name_2, "?" + value);
        }
    };
    Parser.prototype.oncomment = function (value) {
        this._updatePosition(4);
        if (this._cbs.oncomment)
            this._cbs.oncomment(value);
        if (this._cbs.oncommentend)
            this._cbs.oncommentend();
    };
    Parser.prototype.oncdata = function (value) {
        this._updatePosition(1);
        if (this._options.xmlMode || this._options.recognizeCDATA) {
            if (this._cbs.oncdatastart)
                this._cbs.oncdatastart();
            if (this._cbs.ontext)
                this._cbs.ontext(value);
            if (this._cbs.oncdataend)
                this._cbs.oncdataend();
        }
        else {
            this.oncomment("[CDATA[" + value + "]]");
        }
    };
    Parser.prototype.onerror = function (err) {
        if (this._cbs.onerror)
            this._cbs.onerror(err);
    };
    Parser.prototype.onend = function () {
        if (this._cbs.onclosetag) {
            for (var i = this._stack.length; i > 0; this._cbs.onclosetag(this._stack[--i]))
                ;
        }
        if (this._cbs.onend)
            this._cbs.onend();
    };
    //Resets the parser to a blank state, ready to parse a new HTML document
    Parser.prototype.reset = function () {
        if (this._cbs.onreset)
            this._cbs.onreset();
        this._tokenizer.reset();
        this._tagname = "";
        this._attribname = "";
        this._attribs = null;
        this._stack = [];
        if (this._cbs.onparserinit)
            this._cbs.onparserinit(this);
    };
    //Parses a complete HTML document and pushes it to the handler
    Parser.prototype.parseComplete = function (data) {
        this.reset();
        this.end(data);
    };
    Parser.prototype.write = function (chunk) {
        this._tokenizer.write(chunk);
    };
    Parser.prototype.end = function (chunk) {
        this._tokenizer.end(chunk);
    };
    Parser.prototype.pause = function () {
        this._tokenizer.pause();
    };
    Parser.prototype.resume = function () {
        this._tokenizer.resume();
    };
    return Parser;
}(events_1.EventEmitter));
exports.Parser = Parser;

},{"./Tokenizer":77,"events":66}],77:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var decode_codepoint_1 = __importDefault(require("entities/lib/decode_codepoint"));
var entities_json_1 = __importDefault(require("entities/lib/maps/entities.json"));
var legacy_json_1 = __importDefault(require("entities/lib/maps/legacy.json"));
var xml_json_1 = __importDefault(require("entities/lib/maps/xml.json"));
function whitespace(c) {
    return c === " " || c === "\n" || c === "\t" || c === "\f" || c === "\r";
}
function ifElseState(upper, SUCCESS, FAILURE) {
    var lower = upper.toLowerCase();
    if (upper === lower) {
        return function (t, c) {
            if (c === lower) {
                t._state = SUCCESS;
            }
            else {
                t._state = FAILURE;
                t._index--;
            }
        };
    }
    else {
        return function (t, c) {
            if (c === lower || c === upper) {
                t._state = SUCCESS;
            }
            else {
                t._state = FAILURE;
                t._index--;
            }
        };
    }
}
function consumeSpecialNameChar(upper, NEXT_STATE) {
    var lower = upper.toLowerCase();
    return function (t, c) {
        if (c === lower || c === upper) {
            t._state = NEXT_STATE;
        }
        else {
            t._state = 3 /* InTagName */;
            t._index--; //consume the token again
        }
    };
}
var stateBeforeCdata1 = ifElseState("C", 23 /* BeforeCdata2 */, 16 /* InDeclaration */);
var stateBeforeCdata2 = ifElseState("D", 24 /* BeforeCdata3 */, 16 /* InDeclaration */);
var stateBeforeCdata3 = ifElseState("A", 25 /* BeforeCdata4 */, 16 /* InDeclaration */);
var stateBeforeCdata4 = ifElseState("T", 26 /* BeforeCdata5 */, 16 /* InDeclaration */);
var stateBeforeCdata5 = ifElseState("A", 27 /* BeforeCdata6 */, 16 /* InDeclaration */);
var stateBeforeScript1 = consumeSpecialNameChar("R", 34 /* BeforeScript2 */);
var stateBeforeScript2 = consumeSpecialNameChar("I", 35 /* BeforeScript3 */);
var stateBeforeScript3 = consumeSpecialNameChar("P", 36 /* BeforeScript4 */);
var stateBeforeScript4 = consumeSpecialNameChar("T", 37 /* BeforeScript5 */);
var stateAfterScript1 = ifElseState("R", 39 /* AfterScript2 */, 1 /* Text */);
var stateAfterScript2 = ifElseState("I", 40 /* AfterScript3 */, 1 /* Text */);
var stateAfterScript3 = ifElseState("P", 41 /* AfterScript4 */, 1 /* Text */);
var stateAfterScript4 = ifElseState("T", 42 /* AfterScript5 */, 1 /* Text */);
var stateBeforeStyle1 = consumeSpecialNameChar("Y", 44 /* BeforeStyle2 */);
var stateBeforeStyle2 = consumeSpecialNameChar("L", 45 /* BeforeStyle3 */);
var stateBeforeStyle3 = consumeSpecialNameChar("E", 46 /* BeforeStyle4 */);
var stateAfterStyle1 = ifElseState("Y", 48 /* AfterStyle2 */, 1 /* Text */);
var stateAfterStyle2 = ifElseState("L", 49 /* AfterStyle3 */, 1 /* Text */);
var stateAfterStyle3 = ifElseState("E", 50 /* AfterStyle4 */, 1 /* Text */);
var stateBeforeEntity = ifElseState("#", 52 /* BeforeNumericEntity */, 53 /* InNamedEntity */);
var stateBeforeNumericEntity = ifElseState("X", 55 /* InHexEntity */, 54 /* InNumericEntity */);
var Tokenizer = /** @class */ (function () {
    function Tokenizer(options, cbs) {
        /** The current state the tokenizer is in. */
        this._state = 1 /* Text */;
        /** The read buffer. */
        this._buffer = "";
        /** The beginning of the section that is currently being read. */
        this._sectionStart = 0;
        /** The index within the buffer that we are currently looking at. */
        this._index = 0;
        /**
         * Data that has already been processed will be removed from the buffer occasionally.
         * `_bufferOffset` keeps track of how many characters have been removed, to make sure position information is accurate.
         */
        this._bufferOffset = 0;
        /** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */
        this._baseState = 1 /* Text */;
        /** For special parsing behavior inside of script and style tags. */
        this._special = 1 /* None */;
        /** Indicates whether the tokenizer has been paused. */
        this._running = true;
        /** Indicates whether the tokenizer has finished running / `.end` has been called. */
        this._ended = false;
        this._cbs = cbs;
        this._xmlMode = !!(options && options.xmlMode);
        this._decodeEntities = !!(options && options.decodeEntities);
    }
    Tokenizer.prototype.reset = function () {
        this._state = 1 /* Text */;
        this._buffer = "";
        this._sectionStart = 0;
        this._index = 0;
        this._bufferOffset = 0;
        this._baseState = 1 /* Text */;
        this._special = 1 /* None */;
        this._running = true;
        this._ended = false;
    };
    Tokenizer.prototype._stateText = function (c) {
        if (c === "<") {
            if (this._index > this._sectionStart) {
                this._cbs.ontext(this._getSection());
            }
            this._state = 2 /* BeforeTagName */;
            this._sectionStart = this._index;
        }
        else if (this._decodeEntities &&
            this._special === 1 /* None */ &&
            c === "&") {
            if (this._index > this._sectionStart) {
                this._cbs.ontext(this._getSection());
            }
            this._baseState = 1 /* Text */;
            this._state = 51 /* BeforeEntity */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateBeforeTagName = function (c) {
        if (c === "/") {
            this._state = 5 /* BeforeClosingTagName */;
        }
        else if (c === "<") {
            this._cbs.ontext(this._getSection());
            this._sectionStart = this._index;
        }
        else if (c === ">" ||
            this._special !== 1 /* None */ ||
            whitespace(c)) {
            this._state = 1 /* Text */;
        }
        else if (c === "!") {
            this._state = 15 /* BeforeDeclaration */;
            this._sectionStart = this._index + 1;
        }
        else if (c === "?") {
            this._state = 17 /* InProcessingInstruction */;
            this._sectionStart = this._index + 1;
        }
        else {
            this._state =
                !this._xmlMode && (c === "s" || c === "S")
                    ? 31 /* BeforeSpecial */
                    : 3 /* InTagName */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInTagName = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
            this._emitToken("onopentagname");
            this._state = 8 /* BeforeAttributeName */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateBeforeClosingTagName = function (c) {
        if (whitespace(c)) {
            // ignore
        }
        else if (c === ">") {
            this._state = 1 /* Text */;
        }
        else if (this._special !== 1 /* None */) {
            if (c === "s" || c === "S") {
                this._state = 32 /* BeforeSpecialEnd */;
            }
            else {
                this._state = 1 /* Text */;
                this._index--;
            }
        }
        else {
            this._state = 6 /* InClosingTagName */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInClosingTagName = function (c) {
        if (c === ">" || whitespace(c)) {
            this._emitToken("onclosetag");
            this._state = 7 /* AfterClosingTagName */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateAfterClosingTagName = function (c) {
        //skip everything until ">"
        if (c === ">") {
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
    };
    Tokenizer.prototype._stateBeforeAttributeName = function (c) {
        if (c === ">") {
            this._cbs.onopentagend();
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
        else if (c === "/") {
            this._state = 4 /* InSelfClosingTag */;
        }
        else if (!whitespace(c)) {
            this._state = 9 /* InAttributeName */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInSelfClosingTag = function (c) {
        if (c === ">") {
            this._cbs.onselfclosingtag();
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
        else if (!whitespace(c)) {
            this._state = 8 /* BeforeAttributeName */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateInAttributeName = function (c) {
        if (c === "=" || c === "/" || c === ">" || whitespace(c)) {
            this._cbs.onattribname(this._getSection());
            this._sectionStart = -1;
            this._state = 10 /* AfterAttributeName */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateAfterAttributeName = function (c) {
        if (c === "=") {
            this._state = 11 /* BeforeAttributeValue */;
        }
        else if (c === "/" || c === ">") {
            this._cbs.onattribend();
            this._state = 8 /* BeforeAttributeName */;
            this._index--;
        }
        else if (!whitespace(c)) {
            this._cbs.onattribend();
            this._state = 9 /* InAttributeName */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateBeforeAttributeValue = function (c) {
        if (c === '"') {
            this._state = 12 /* InAttributeValueDq */;
            this._sectionStart = this._index + 1;
        }
        else if (c === "'") {
            this._state = 13 /* InAttributeValueSq */;
            this._sectionStart = this._index + 1;
        }
        else if (!whitespace(c)) {
            this._state = 14 /* InAttributeValueNq */;
            this._sectionStart = this._index;
            this._index--; //reconsume token
        }
    };
    Tokenizer.prototype._stateInAttributeValueDoubleQuotes = function (c) {
        if (c === '"') {
            this._emitToken("onattribdata");
            this._cbs.onattribend();
            this._state = 8 /* BeforeAttributeName */;
        }
        else if (this._decodeEntities && c === "&") {
            this._emitToken("onattribdata");
            this._baseState = this._state;
            this._state = 51 /* BeforeEntity */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInAttributeValueSingleQuotes = function (c) {
        if (c === "'") {
            this._emitToken("onattribdata");
            this._cbs.onattribend();
            this._state = 8 /* BeforeAttributeName */;
        }
        else if (this._decodeEntities && c === "&") {
            this._emitToken("onattribdata");
            this._baseState = this._state;
            this._state = 51 /* BeforeEntity */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateInAttributeValueNoQuotes = function (c) {
        if (whitespace(c) || c === ">") {
            this._emitToken("onattribdata");
            this._cbs.onattribend();
            this._state = 8 /* BeforeAttributeName */;
            this._index--;
        }
        else if (this._decodeEntities && c === "&") {
            this._emitToken("onattribdata");
            this._baseState = this._state;
            this._state = 51 /* BeforeEntity */;
            this._sectionStart = this._index;
        }
    };
    Tokenizer.prototype._stateBeforeDeclaration = function (c) {
        this._state =
            c === "["
                ? 22 /* BeforeCdata1 */
                : c === "-"
                    ? 18 /* BeforeComment */
                    : 16 /* InDeclaration */;
    };
    Tokenizer.prototype._stateInDeclaration = function (c) {
        if (c === ">") {
            this._cbs.ondeclaration(this._getSection());
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
    };
    Tokenizer.prototype._stateInProcessingInstruction = function (c) {
        if (c === ">") {
            this._cbs.onprocessinginstruction(this._getSection());
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
    };
    Tokenizer.prototype._stateBeforeComment = function (c) {
        if (c === "-") {
            this._state = 19 /* InComment */;
            this._sectionStart = this._index + 1;
        }
        else {
            this._state = 16 /* InDeclaration */;
        }
    };
    Tokenizer.prototype._stateInComment = function (c) {
        if (c === "-")
            this._state = 20 /* AfterComment1 */;
    };
    Tokenizer.prototype._stateAfterComment1 = function (c) {
        if (c === "-") {
            this._state = 21 /* AfterComment2 */;
        }
        else {
            this._state = 19 /* InComment */;
        }
    };
    Tokenizer.prototype._stateAfterComment2 = function (c) {
        if (c === ">") {
            //remove 2 trailing chars
            this._cbs.oncomment(this._buffer.substring(this._sectionStart, this._index - 2));
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
        else if (c !== "-") {
            this._state = 19 /* InComment */;
        }
        // else: stay in AFTER_COMMENT_2 (`--->`)
    };
    Tokenizer.prototype._stateBeforeCdata6 = function (c) {
        if (c === "[") {
            this._state = 28 /* InCdata */;
            this._sectionStart = this._index + 1;
        }
        else {
            this._state = 16 /* InDeclaration */;
            this._index--;
        }
    };
    Tokenizer.prototype._stateInCdata = function (c) {
        if (c === "]")
            this._state = 29 /* AfterCdata1 */;
    };
    Tokenizer.prototype._stateAfterCdata1 = function (c) {
        if (c === "]")
            this._state = 30 /* AfterCdata2 */;
        else
            this._state = 28 /* InCdata */;
    };
    Tokenizer.prototype._stateAfterCdata2 = function (c) {
        if (c === ">") {
            //remove 2 trailing chars
            this._cbs.oncdata(this._buffer.substring(this._sectionStart, this._index - 2));
            this._state = 1 /* Text */;
            this._sectionStart = this._index + 1;
        }
        else if (c !== "]") {
            this._state = 28 /* InCdata */;
        }
        //else: stay in AFTER_CDATA_2 (`]]]>`)
    };
    Tokenizer.prototype._stateBeforeSpecial = function (c) {
        if (c === "c" || c === "C") {
            this._state = 33 /* BeforeScript1 */;
        }
        else if (c === "t" || c === "T") {
            this._state = 43 /* BeforeStyle1 */;
        }
        else {
            this._state = 3 /* InTagName */;
            this._index--; //consume the token again
        }
    };
    Tokenizer.prototype._stateBeforeSpecialEnd = function (c) {
        if (this._special === 2 /* Script */ && (c === "c" || c === "C")) {
            this._state = 38 /* AfterScript1 */;
        }
        else if (this._special === 3 /* Style */ &&
            (c === "t" || c === "T")) {
            this._state = 47 /* AfterStyle1 */;
        }
        else
            this._state = 1 /* Text */;
    };
    Tokenizer.prototype._stateBeforeScript5 = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
            this._special = 2 /* Script */;
        }
        this._state = 3 /* InTagName */;
        this._index--; //consume the token again
    };
    Tokenizer.prototype._stateAfterScript5 = function (c) {
        if (c === ">" || whitespace(c)) {
            this._special = 1 /* None */;
            this._state = 6 /* InClosingTagName */;
            this._sectionStart = this._index - 6;
            this._index--; //reconsume the token
        }
        else
            this._state = 1 /* Text */;
    };
    Tokenizer.prototype._stateBeforeStyle4 = function (c) {
        if (c === "/" || c === ">" || whitespace(c)) {
            this._special = 3 /* Style */;
        }
        this._state = 3 /* InTagName */;
        this._index--; //consume the token again
    };
    Tokenizer.prototype._stateAfterStyle4 = function (c) {
        if (c === ">" || whitespace(c)) {
            this._special = 1 /* None */;
            this._state = 6 /* InClosingTagName */;
            this._sectionStart = this._index - 5;
            this._index--; //reconsume the token
        }
        else
            this._state = 1 /* Text */;
    };
    //for entities terminated with a semicolon
    Tokenizer.prototype._parseNamedEntityStrict = function () {
        //offset = 1
        if (this._sectionStart + 1 < this._index) {
            var entity = this._buffer.substring(this._sectionStart + 1, this._index), map = this._xmlMode ? xml_json_1.default : entities_json_1.default;
            if (Object.prototype.hasOwnProperty.call(map, entity)) {
                // @ts-ignore
                this._emitPartial(map[entity]);
                this._sectionStart = this._index + 1;
            }
        }
    };
    //parses legacy entities (without trailing semicolon)
    Tokenizer.prototype._parseLegacyEntity = function () {
        var start = this._sectionStart + 1;
        var limit = this._index - start;
        if (limit > 6)
            limit = 6; // The max length of legacy entities is 6
        while (limit >= 2) {
            // The min length of legacy entities is 2
            var entity = this._buffer.substr(start, limit);
            if (Object.prototype.hasOwnProperty.call(legacy_json_1.default, entity)) {
                // @ts-ignore
                this._emitPartial(legacy_json_1.default[entity]);
                this._sectionStart += limit + 1;
                return;
            }
            else {
                limit--;
            }
        }
    };
    Tokenizer.prototype._stateInNamedEntity = function (c) {
        if (c === ";") {
            this._parseNamedEntityStrict();
            if (this._sectionStart + 1 < this._index && !this._xmlMode) {
                this._parseLegacyEntity();
            }
            this._state = this._baseState;
        }
        else if ((c < "a" || c > "z") &&
            (c < "A" || c > "Z") &&
            (c < "0" || c > "9")) {
            if (this._xmlMode || this._sectionStart + 1 === this._index) {
                // ignore
            }
            else if (this._baseState !== 1 /* Text */) {
                if (c !== "=") {
                    this._parseNamedEntityStrict();
                }
            }
            else {
                this._parseLegacyEntity();
            }
            this._state = this._baseState;
            this._index--;
        }
    };
    Tokenizer.prototype._decodeNumericEntity = function (offset, base) {
        var sectionStart = this._sectionStart + offset;
        if (sectionStart !== this._index) {
            //parse entity
            var entity = this._buffer.substring(sectionStart, this._index);
            var parsed = parseInt(entity, base);
            this._emitPartial(decode_codepoint_1.default(parsed));
            this._sectionStart = this._index;
        }
        else {
            this._sectionStart--;
        }
        this._state = this._baseState;
    };
    Tokenizer.prototype._stateInNumericEntity = function (c) {
        if (c === ";") {
            this._decodeNumericEntity(2, 10);
            this._sectionStart++;
        }
        else if (c < "0" || c > "9") {
            if (!this._xmlMode) {
                this._decodeNumericEntity(2, 10);
            }
            else {
                this._state = this._baseState;
            }
            this._index--;
        }
    };
    Tokenizer.prototype._stateInHexEntity = function (c) {
        if (c === ";") {
            this._decodeNumericEntity(3, 16);
            this._sectionStart++;
        }
        else if ((c < "a" || c > "f") &&
            (c < "A" || c > "F") &&
            (c < "0" || c > "9")) {
            if (!this._xmlMode) {
                this._decodeNumericEntity(3, 16);
            }
            else {
                this._state = this._baseState;
            }
            this._index--;
        }
    };
    Tokenizer.prototype._cleanup = function () {
        if (this._sectionStart < 0) {
            this._buffer = "";
            this._bufferOffset += this._index;
            this._index = 0;
        }
        else if (this._running) {
            if (this._state === 1 /* Text */) {
                if (this._sectionStart !== this._index) {
                    this._cbs.ontext(this._buffer.substr(this._sectionStart));
                }
                this._buffer = "";
                this._bufferOffset += this._index;
                this._index = 0;
            }
            else if (this._sectionStart === this._index) {
                //the section just started
                this._buffer = "";
                this._bufferOffset += this._index;
                this._index = 0;
            }
            else {
                //remove everything unnecessary
                this._buffer = this._buffer.substr(this._sectionStart);
                this._index -= this._sectionStart;
                this._bufferOffset += this._sectionStart;
            }
            this._sectionStart = 0;
        }
    };
    //TODO make events conditional
    Tokenizer.prototype.write = function (chunk) {
        if (this._ended)
            this._cbs.onerror(Error(".write() after done!"));
        this._buffer += chunk;
        this._parse();
    };
    // Iterates through the buffer, calling the function corresponding to the current state.
    // States that are more likely to be hit are higher up, as a performance improvement.
    Tokenizer.prototype._parse = function () {
        while (this._index < this._buffer.length && this._running) {
            var c = this._buffer.charAt(this._index);
            if (this._state === 1 /* Text */) {
                this._stateText(c);
            }
            else if (this._state === 12 /* InAttributeValueDq */) {
                this._stateInAttributeValueDoubleQuotes(c);
            }
            else if (this._state === 9 /* InAttributeName */) {
                this._stateInAttributeName(c);
            }
            else if (this._state === 19 /* InComment */) {
                this._stateInComment(c);
            }
            else if (this._state === 8 /* BeforeAttributeName */) {
                this._stateBeforeAttributeName(c);
            }
            else if (this._state === 3 /* InTagName */) {
                this._stateInTagName(c);
            }
            else if (this._state === 6 /* InClosingTagName */) {
                this._stateInClosingTagName(c);
            }
            else if (this._state === 2 /* BeforeTagName */) {
                this._stateBeforeTagName(c);
            }
            else if (this._state === 10 /* AfterAttributeName */) {
                this._stateAfterAttributeName(c);
            }
            else if (this._state === 13 /* InAttributeValueSq */) {
                this._stateInAttributeValueSingleQuotes(c);
            }
            else if (this._state === 11 /* BeforeAttributeValue */) {
                this._stateBeforeAttributeValue(c);
            }
            else if (this._state === 5 /* BeforeClosingTagName */) {
                this._stateBeforeClosingTagName(c);
            }
            else if (this._state === 7 /* AfterClosingTagName */) {
                this._stateAfterClosingTagName(c);
            }
            else if (this._state === 31 /* BeforeSpecial */) {
                this._stateBeforeSpecial(c);
            }
            else if (this._state === 20 /* AfterComment1 */) {
                this._stateAfterComment1(c);
            }
            else if (this._state === 14 /* InAttributeValueNq */) {
                this._stateInAttributeValueNoQuotes(c);
            }
            else if (this._state === 4 /* InSelfClosingTag */) {
                this._stateInSelfClosingTag(c);
            }
            else if (this._state === 16 /* InDeclaration */) {
                this._stateInDeclaration(c);
            }
            else if (this._state === 15 /* BeforeDeclaration */) {
                this._stateBeforeDeclaration(c);
            }
            else if (this._state === 21 /* AfterComment2 */) {
                this._stateAfterComment2(c);
            }
            else if (this._state === 18 /* BeforeComment */) {
                this._stateBeforeComment(c);
            }
            else if (this._state === 32 /* BeforeSpecialEnd */) {
                this._stateBeforeSpecialEnd(c);
            }
            else if (this._state === 38 /* AfterScript1 */) {
                stateAfterScript1(this, c);
            }
            else if (this._state === 39 /* AfterScript2 */) {
                stateAfterScript2(this, c);
            }
            else if (this._state === 40 /* AfterScript3 */) {
                stateAfterScript3(this, c);
            }
            else if (this._state === 33 /* BeforeScript1 */) {
                stateBeforeScript1(this, c);
            }
            else if (this._state === 34 /* BeforeScript2 */) {
                stateBeforeScript2(this, c);
            }
            else if (this._state === 35 /* BeforeScript3 */) {
                stateBeforeScript3(this, c);
            }
            else if (this._state === 36 /* BeforeScript4 */) {
                stateBeforeScript4(this, c);
            }
            else if (this._state === 37 /* BeforeScript5 */) {
                this._stateBeforeScript5(c);
            }
            else if (this._state === 41 /* AfterScript4 */) {
                stateAfterScript4(this, c);
            }
            else if (this._state === 42 /* AfterScript5 */) {
                this._stateAfterScript5(c);
            }
            else if (this._state === 43 /* BeforeStyle1 */) {
                stateBeforeStyle1(this, c);
            }
            else if (this._state === 28 /* InCdata */) {
                this._stateInCdata(c);
            }
            else if (this._state === 44 /* BeforeStyle2 */) {
                stateBeforeStyle2(this, c);
            }
            else if (this._state === 45 /* BeforeStyle3 */) {
                stateBeforeStyle3(this, c);
            }
            else if (this._state === 46 /* BeforeStyle4 */) {
                this._stateBeforeStyle4(c);
            }
            else if (this._state === 47 /* AfterStyle1 */) {
                stateAfterStyle1(this, c);
            }
            else if (this._state === 48 /* AfterStyle2 */) {
                stateAfterStyle2(this, c);
            }
            else if (this._state === 49 /* AfterStyle3 */) {
                stateAfterStyle3(this, c);
            }
            else if (this._state === 50 /* AfterStyle4 */) {
                this._stateAfterStyle4(c);
            }
            else if (this._state === 17 /* InProcessingInstruction */) {
                this._stateInProcessingInstruction(c);
            }
            else if (this._state === 53 /* InNamedEntity */) {
                this._stateInNamedEntity(c);
            }
            else if (this._state === 22 /* BeforeCdata1 */) {
                stateBeforeCdata1(this, c);
            }
            else if (this._state === 51 /* BeforeEntity */) {
                stateBeforeEntity(this, c);
            }
            else if (this._state === 23 /* BeforeCdata2 */) {
                stateBeforeCdata2(this, c);
            }
            else if (this._state === 24 /* BeforeCdata3 */) {
                stateBeforeCdata3(this, c);
            }
            else if (this._state === 29 /* AfterCdata1 */) {
                this._stateAfterCdata1(c);
            }
            else if (this._state === 30 /* AfterCdata2 */) {
                this._stateAfterCdata2(c);
            }
            else if (this._state === 25 /* BeforeCdata4 */) {
                stateBeforeCdata4(this, c);
            }
            else if (this._state === 26 /* BeforeCdata5 */) {
                stateBeforeCdata5(this, c);
            }
            else if (this._state === 27 /* BeforeCdata6 */) {
                this._stateBeforeCdata6(c);
            }
            else if (this._state === 55 /* InHexEntity */) {
                this._stateInHexEntity(c);
            }
            else if (this._state === 54 /* InNumericEntity */) {
                this._stateInNumericEntity(c);
            }
            else if (this._state === 52 /* BeforeNumericEntity */) {
                stateBeforeNumericEntity(this, c);
            }
            else {
                this._cbs.onerror(Error("unknown _state"), this._state);
            }
            this._index++;
        }
        this._cleanup();
    };
    Tokenizer.prototype.pause = function () {
        this._running = false;
    };
    Tokenizer.prototype.resume = function () {
        this._running = true;
        if (this._index < this._buffer.length) {
            this._parse();
        }
        if (this._ended) {
            this._finish();
        }
    };
    Tokenizer.prototype.end = function (chunk) {
        if (this._ended)
            this._cbs.onerror(Error(".end() after done!"));
        if (chunk)
            this.write(chunk);
        this._ended = true;
        if (this._running)
            this._finish();
    };
    Tokenizer.prototype._finish = function () {
        //if there is remaining data, emit it in a reasonable way
        if (this._sectionStart < this._index) {
            this._handleTrailingData();
        }
        this._cbs.onend();
    };
    Tokenizer.prototype._handleTrailingData = function () {
        var data = this._buffer.substr(this._sectionStart);
        if (this._state === 28 /* InCdata */ ||
            this._state === 29 /* AfterCdata1 */ ||
            this._state === 30 /* AfterCdata2 */) {
            this._cbs.oncdata(data);
        }
        else if (this._state === 19 /* InComment */ ||
            this._state === 20 /* AfterComment1 */ ||
            this._state === 21 /* AfterComment2 */) {
            this._cbs.oncomment(data);
        }
        else if (this._state === 53 /* InNamedEntity */ && !this._xmlMode) {
            this._parseLegacyEntity();
            if (this._sectionStart < this._index) {
                this._state = this._baseState;
                this._handleTrailingData();
            }
        }
        else if (this._state === 54 /* InNumericEntity */ && !this._xmlMode) {
            this._decodeNumericEntity(2, 10);
            if (this._sectionStart < this._index) {
                this._state = this._baseState;
                this._handleTrailingData();
            }
        }
        else if (this._state === 55 /* InHexEntity */ && !this._xmlMode) {
            this._decodeNumericEntity(3, 16);
            if (this._sectionStart < this._index) {
                this._state = this._baseState;
                this._handleTrailingData();
            }
        }
        else if (this._state !== 3 /* InTagName */ &&
            this._state !== 8 /* BeforeAttributeName */ &&
            this._state !== 11 /* BeforeAttributeValue */ &&
            this._state !== 10 /* AfterAttributeName */ &&
            this._state !== 9 /* InAttributeName */ &&
            this._state !== 13 /* InAttributeValueSq */ &&
            this._state !== 12 /* InAttributeValueDq */ &&
            this._state !== 14 /* InAttributeValueNq */ &&
            this._state !== 6 /* InClosingTagName */) {
            this._cbs.ontext(data);
        }
        //else, ignore remaining data
        //TODO add a way to remove current tag
    };
    Tokenizer.prototype.getAbsoluteIndex = function () {
        return this._bufferOffset + this._index;
    };
    Tokenizer.prototype._getSection = function () {
        return this._buffer.substring(this._sectionStart, this._index);
    };
    Tokenizer.prototype._emitToken = function (name) {
        this._cbs[name](this._getSection());
        this._sectionStart = -1;
    };
    Tokenizer.prototype._emitPartial = function (value) {
        if (this._baseState !== 1 /* Text */) {
            this._cbs.onattribdata(value); //TODO implement the new event
        }
        else {
            this._cbs.ontext(value);
        }
    };
    return Tokenizer;
}());
exports.default = Tokenizer;

},{"entities/lib/decode_codepoint":59,"entities/lib/maps/entities.json":63,"entities/lib/maps/legacy.json":64,"entities/lib/maps/xml.json":65}],78:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var Parser_1 = require("./Parser");
exports.Parser = Parser_1.Parser;
var domhandler_1 = require("domhandler");
exports.DomHandler = domhandler_1.DomHandler;
exports.DefaultHandler = domhandler_1.DomHandler;
// Helper methods
/**
 * Parses data, returns the resulting DOM.
 *
 * @param data The data that should be parsed.
 * @param options Optional options for the parser and DOM builder.
 */
function parseDOM(data, options) {
    var handler = new domhandler_1.DomHandler(void 0, options);
    new Parser_1.Parser(handler, options).end(data);
    return handler.dom;
}
exports.parseDOM = parseDOM;
/**
 * Creates a parser instance, with an attached DOM handler.
 *
 * @param cb A callback that will be called once parsing has been completed.
 * @param options Optional options for the parser and DOM builder.
 * @param elementCb An optional callback that will be called every time a tag has been completed inside of the DOM.
 */
function createDomStream(cb, options, elementCb) {
    var handler = new domhandler_1.DomHandler(cb, options, elementCb);
    return new Parser_1.Parser(handler, options);
}
exports.createDomStream = createDomStream;
var Tokenizer_1 = require("./Tokenizer");
exports.Tokenizer = Tokenizer_1.default;
var ElementType = __importStar(require("domelementtype"));
exports.ElementType = ElementType;
/**
 * List of all events that the parser emits.
 *
 * Format: eventname: number of arguments.
 */
exports.EVENTS = {
    attribute: 2,
    cdatastart: 0,
    cdataend: 0,
    text: 1,
    processinginstruction: 2,
    comment: 1,
    commentend: 0,
    closetag: 1,
    opentag: 2,
    opentagname: 1,
    error: 1,
    end: 0
};
/*
    All of the following exports exist for backwards-compatibility.
    They should probably be removed eventually.
*/
__export(require("./FeedHandler"));
__export(require("./WritableStream"));
__export(require("./CollectingHandler"));
var DomUtils = __importStar(require("domutils"));
exports.DomUtils = DomUtils;
var FeedHandler_1 = require("./FeedHandler");
exports.RssHandler = FeedHandler_1.FeedHandler;

},{"./CollectingHandler":73,"./FeedHandler":74,"./Parser":76,"./Tokenizer":77,"./WritableStream":5,"domelementtype":46,"domhandler":47,"domutils":82}],79:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elementNames = new Map([
    ["altglyph", "altGlyph"],
    ["altglyphdef", "altGlyphDef"],
    ["altglyphitem", "altGlyphItem"],
    ["animatecolor", "animateColor"],
    ["animatemotion", "animateMotion"],
    ["animatetransform", "animateTransform"],
    ["clippath", "clipPath"],
    ["feblend", "feBlend"],
    ["fecolormatrix", "feColorMatrix"],
    ["fecomponenttransfer", "feComponentTransfer"],
    ["fecomposite", "feComposite"],
    ["feconvolvematrix", "feConvolveMatrix"],
    ["fediffuselighting", "feDiffuseLighting"],
    ["fedisplacementmap", "feDisplacementMap"],
    ["fedistantlight", "feDistantLight"],
    ["fedropshadow", "feDropShadow"],
    ["feflood", "feFlood"],
    ["fefunca", "feFuncA"],
    ["fefuncb", "feFuncB"],
    ["fefuncg", "feFuncG"],
    ["fefuncr", "feFuncR"],
    ["fegaussianblur", "feGaussianBlur"],
    ["feimage", "feImage"],
    ["femerge", "feMerge"],
    ["femergenode", "feMergeNode"],
    ["femorphology", "feMorphology"],
    ["feoffset", "feOffset"],
    ["fepointlight", "fePointLight"],
    ["fespecularlighting", "feSpecularLighting"],
    ["fespotlight", "feSpotLight"],
    ["fetile", "feTile"],
    ["feturbulence", "feTurbulence"],
    ["foreignobject", "foreignObject"],
    ["glyphref", "glyphRef"],
    ["lineargradient", "linearGradient"],
    ["radialgradient", "radialGradient"],
    ["textpath", "textPath"],
]);
exports.attributeNames = new Map([
    ["definitionurl", "definitionURL"],
    ["attributename", "attributeName"],
    ["attributetype", "attributeType"],
    ["basefrequency", "baseFrequency"],
    ["baseprofile", "baseProfile"],
    ["calcmode", "calcMode"],
    ["clippathunits", "clipPathUnits"],
    ["diffuseconstant", "diffuseConstant"],
    ["edgemode", "edgeMode"],
    ["filterunits", "filterUnits"],
    ["glyphref", "glyphRef"],
    ["gradienttransform", "gradientTransform"],
    ["gradientunits", "gradientUnits"],
    ["kernelmatrix", "kernelMatrix"],
    ["kernelunitlength", "kernelUnitLength"],
    ["keypoints", "keyPoints"],
    ["keysplines", "keySplines"],
    ["keytimes", "keyTimes"],
    ["lengthadjust", "lengthAdjust"],
    ["limitingconeangle", "limitingConeAngle"],
    ["markerheight", "markerHeight"],
    ["markerunits", "markerUnits"],
    ["markerwidth", "markerWidth"],
    ["maskcontentunits", "maskContentUnits"],
    ["maskunits", "maskUnits"],
    ["numoctaves", "numOctaves"],
    ["pathlength", "pathLength"],
    ["patterncontentunits", "patternContentUnits"],
    ["patterntransform", "patternTransform"],
    ["patternunits", "patternUnits"],
    ["pointsatx", "pointsAtX"],
    ["pointsaty", "pointsAtY"],
    ["pointsatz", "pointsAtZ"],
    ["preservealpha", "preserveAlpha"],
    ["preserveaspectratio", "preserveAspectRatio"],
    ["primitiveunits", "primitiveUnits"],
    ["refx", "refX"],
    ["refy", "refY"],
    ["repeatcount", "repeatCount"],
    ["repeatdur", "repeatDur"],
    ["requiredextensions", "requiredExtensions"],
    ["requiredfeatures", "requiredFeatures"],
    ["specularconstant", "specularConstant"],
    ["specularexponent", "specularExponent"],
    ["spreadmethod", "spreadMethod"],
    ["startoffset", "startOffset"],
    ["stddeviation", "stdDeviation"],
    ["stitchtiles", "stitchTiles"],
    ["surfacescale", "surfaceScale"],
    ["systemlanguage", "systemLanguage"],
    ["tablevalues", "tableValues"],
    ["targetx", "targetX"],
    ["targety", "targetY"],
    ["textlength", "textLength"],
    ["viewbox", "viewBox"],
    ["viewtarget", "viewTarget"],
    ["xchannelselector", "xChannelSelector"],
    ["ychannelselector", "yChannelSelector"],
    ["zoomandpan", "zoomAndPan"],
]);

},{}],80:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
  Module dependencies
*/
var ElementType = __importStar(require("domelementtype"));
var entities = __importStar(require("entities"));
/* mixed-case SVG and MathML tags & attributes
   recognized by the HTML parser, see
   https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
*/
var foreignNames_1 = require("./foreignNames");
var unencodedElements = new Set([
    "style",
    "script",
    "xmp",
    "iframe",
    "noembed",
    "noframes",
    "plaintext",
    "noscript",
]);
/*
  Format attributes
*/
function formatAttributes(attributes, opts) {
    if (!attributes)
        return;
    return Object.keys(attributes)
        .map(function (key) {
        var _a;
        var value = attributes[key];
        if (opts.xmlMode === "foreign") {
            /* fix up mixed-case attribute names */
            key = (_a = foreignNames_1.attributeNames.get(key)) !== null && _a !== void 0 ? _a : key;
        }
        if (!opts.emptyAttrs &&
            !opts.xmlMode &&
            (value === null || value === "")) {
            return key;
        }
        return key + "=\"" + (opts.decodeEntities
            ? entities.encodeXML(value)
            : value.replace(/"/g, "&quot;")) + "\"";
    })
        .join(" ");
}
/*
  Self-enclosing tags
*/
var singleTag = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
]);
/**
 * Renders a DOM node or an array of DOM nodes to a string.
 *
 * Can be thought of as the equivalent of the `outerHTML` of the passed node(s).
 *
 * @param node Node to be rendered.
 * @param options Changes serialization behavior
 */
function render(node, options) {
    if (options === void 0) { options = {}; }
    // TODO: This is a bit hacky.
    var nodes = Array.isArray(node) || node.cheerio ? node : [node];
    var output = "";
    for (var i = 0; i < nodes.length; i++) {
        output += renderNode(nodes[i], options);
    }
    return output;
}
exports.default = render;
function renderNode(node, options) {
    switch (node.type) {
        case "root":
            return render(node.children, options);
        case ElementType.Directive:
            return renderDirective(node);
        case ElementType.Comment:
            return renderComment(node);
        case ElementType.CDATA:
            return renderCdata(node);
        default:
            return ElementType.isTag(node)
                ? renderTag(node, options)
                : renderText(node, options);
    }
}
var foreignModeIntegrationPoints = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignObject",
    "desc",
    "title",
]);
var foreignElements = new Set(["svg", "math"]);
function renderTag(elem, opts) {
    var _a;
    // Handle SVG / MathML in HTML
    if (opts.xmlMode === "foreign") {
        /* fix up mixed-case element names */
        elem.name = (_a = foreignNames_1.elementNames.get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
        /* exit foreign mode at integration points */
        if (elem.parent &&
            foreignModeIntegrationPoints.has(elem.parent.name))
            opts = __assign(__assign({}, opts), { xmlMode: false });
    }
    if (!opts.xmlMode && foreignElements.has(elem.name)) {
        opts = __assign(__assign({}, opts), { xmlMode: "foreign" });
    }
    var tag = "<" + elem.name;
    var attribs = formatAttributes(elem.attribs, opts);
    if (attribs) {
        tag += " " + attribs;
    }
    if ((!elem.children || elem.children.length === 0) &&
        (opts.xmlMode
            ? // in XML mode or foreign mode, and user hasn't explicitly turned off self-closing tags
                opts.selfClosingTags !== false
            : // user explicitly asked for self-closing tags, even in HTML mode
                opts.selfClosingTags && singleTag.has(elem.name))) {
        if (!opts.xmlMode)
            tag += " ";
        tag += "/>";
    }
    else {
        tag += ">";
        if (elem.children) {
            tag += render(elem.children, opts);
        }
        if (opts.xmlMode || !singleTag.has(elem.name)) {
            tag += "</" + elem.name + ">";
        }
    }
    return tag;
}
function renderDirective(elem) {
    return "<" + elem.data + ">";
}
function renderText(elem, opts) {
    var data = elem.data || "";
    // if entities weren't decoded, no need to encode them back
    if (opts.decodeEntities &&
        !(elem.parent && unencodedElements.has(elem.parent.name))) {
        data = entities.encodeXML(data);
    }
    return data;
}
function renderCdata(elem) {
    return "<![CDATA[" + elem.children[0].data + "]]>";
}
function renderComment(elem) {
    return "<!--" + elem.data + "-->";
}

},{"./foreignNames":79,"domelementtype":46,"entities":61}],81:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueSort = exports.compareDocumentPosition = exports.removeSubsets = void 0;
var tagtypes_1 = require("./tagtypes");
/**
 * Given an array of nodes, remove any member that is contained by another.
 *
 * @param nodes Nodes to filter.
 */
function removeSubsets(nodes) {
    var idx = nodes.length;
    // Check if each node (or one of its ancestors) is already contained in the
    // array.
    while (--idx >= 0) {
        var node = nodes[idx];
        // Remove the node if it is not unique.
        // We are going through the array from the end, so we only
        // have to check nodes that preceed the node under consideration in the array.
        if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
            nodes.splice(idx, 1);
            continue;
        }
        for (var ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
            if (nodes.indexOf(ancestor) > -1) {
                nodes.splice(idx, 1);
                break;
            }
        }
    }
    return nodes;
}
exports.removeSubsets = removeSubsets;
/***
 * Compare the position of one node against another node in any other document.
 * The return value is a bitmask with the following values:
 *
 * document order:
 * > There is an ordering, document order, defined on all the nodes in the
 * > document corresponding to the order in which the first character of the
 * > XML representation of each node occurs in the XML representation of the
 * > document after expansion of general entities. Thus, the document element
 * > node will be the first node. Element nodes occur before their children.
 * > Thus, document order orders element nodes in order of the occurrence of
 * > their start-tag in the XML (after expansion of entities). The attribute
 * > nodes of an element occur after the element and before its children. The
 * > relative order of attribute nodes is implementation-dependent./
 *
 * Source:
 * http://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-document-order
 * @param nodaA The first node to use in the comparison
 * @param nodeB The second node to use in the comparison
 *
 * @return A bitmask describing the input nodes' relative position.
 *
 *        See http://dom.spec.whatwg.org/#dom-node-comparedocumentposition for
 *        a description of these values.
 */
function compareDocumentPosition(nodeA, nodeB) {
    var aParents = [];
    var bParents = [];
    if (nodeA === nodeB) {
        return 0;
    }
    var current = tagtypes_1.hasChildren(nodeA) ? nodeA : nodeA.parent;
    while (current) {
        aParents.unshift(current);
        current = current.parent;
    }
    current = tagtypes_1.hasChildren(nodeB) ? nodeB : nodeB.parent;
    while (current) {
        bParents.unshift(current);
        current = current.parent;
    }
    var idx = 0;
    while (aParents[idx] === bParents[idx]) {
        idx++;
    }
    if (idx === 0) {
        return 1 /* DISCONNECTED */;
    }
    var sharedParent = aParents[idx - 1];
    var siblings = sharedParent.children;
    var aSibling = aParents[idx];
    var bSibling = bParents[idx];
    if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
        if (sharedParent === nodeB) {
            return 4 /* FOLLOWING */ | 16 /* CONTAINED_BY */;
        }
        return 4 /* FOLLOWING */;
    }
    else {
        if (sharedParent === nodeA) {
            return 2 /* PRECEDING */ | 8 /* CONTAINS */;
        }
        return 2 /* PRECEDING */;
    }
}
exports.compareDocumentPosition = compareDocumentPosition;
/***
 * Sort an array of nodes based on their relative position in the document and
 * remove any duplicate nodes. If the array contains nodes that do not belong
 * to the same document, sort order is unspecified.
 *
 * @param nodes Array of DOM nodes
 * @returns collection of unique nodes, sorted in document order
 */
function uniqueSort(nodes) {
    nodes = nodes.filter(function (node, i, arr) { return !arr.includes(node, i + 1); });
    nodes.sort(function (a, b) {
        var relative = compareDocumentPosition(a, b);
        if (relative & 2 /* PRECEDING */) {
            return -1;
        }
        else if (relative & 4 /* FOLLOWING */) {
            return 1;
        }
        return 0;
    });
    return nodes;
}
exports.uniqueSort = uniqueSort;

},{"./tagtypes":87}],82:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./stringify"), exports);
__exportStar(require("./traversal"), exports);
__exportStar(require("./manipulation"), exports);
__exportStar(require("./querying"), exports);
__exportStar(require("./legacy"), exports);
__exportStar(require("./helpers"), exports);
__exportStar(require("./tagtypes"), exports);

},{"./helpers":81,"./legacy":83,"./manipulation":84,"./querying":85,"./stringify":86,"./tagtypes":87,"./traversal":88}],83:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getElementsByTagType = exports.getElementsByTagName = exports.getElementById = exports.getElements = exports.testElement = void 0;
var querying_1 = require("./querying");
var tagtypes_1 = require("./tagtypes");
function isTextNode(node) {
    return node.type === "text" /* Text */;
}
/* eslint-disable @typescript-eslint/camelcase */
var Checks = {
    tag_name: function (name) {
        if (typeof name === "function") {
            return function (elem) { return tagtypes_1.isTag(elem) && name(elem.name); };
        }
        else if (name === "*") {
            return tagtypes_1.isTag;
        }
        else {
            return function (elem) { return tagtypes_1.isTag(elem) && elem.name === name; };
        }
    },
    tag_type: function (type) {
        if (typeof type === "function") {
            return function (elem) { return type(elem.type); };
        }
        else {
            return function (elem) { return elem.type === type; };
        }
    },
    tag_contains: function (data) {
        if (typeof data === "function") {
            return function (elem) { return isTextNode(elem) && data(elem.data); };
        }
        else {
            return function (elem) { return isTextNode(elem) && elem.data === data; };
        }
    },
};
/* eslint-enable @typescript-eslint/camelcase */
function getAttribCheck(attrib, value) {
    if (typeof value === "function") {
        return function (elem) { return tagtypes_1.isTag(elem) && value(elem.attribs[attrib]); };
    }
    else {
        return function (elem) { return tagtypes_1.isTag(elem) && elem.attribs[attrib] === value; };
    }
}
function combineFuncs(a, b) {
    return function (elem) { return a(elem) || b(elem); };
}
function compileTest(options) {
    var funcs = Object.keys(options).map(function (key) {
        var value = options[key];
        return key in Checks
            ? Checks[key](value)
            : getAttribCheck(key, value);
    });
    return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
function testElement(options, element) {
    var test = compileTest(options);
    return test ? test(element) : true;
}
exports.testElement = testElement;
function getElements(options, element, recurse, limit) {
    if (limit === void 0) { limit = Infinity; }
    var test = compileTest(options);
    return test ? querying_1.filter(test, element, recurse, limit) : [];
}
exports.getElements = getElements;
function getElementById(id, element, recurse) {
    if (recurse === void 0) { recurse = true; }
    if (!Array.isArray(element))
        element = [element];
    return querying_1.findOne(getAttribCheck("id", id), element, recurse);
}
exports.getElementById = getElementById;
function getElementsByTagName(name, element, recurse, limit) {
    if (limit === void 0) { limit = Infinity; }
    return querying_1.filter(Checks.tag_name(name), element, recurse, limit);
}
exports.getElementsByTagName = getElementsByTagName;
function getElementsByTagType(type, element, recurse, limit) {
    if (recurse === void 0) { recurse = true; }
    if (limit === void 0) { limit = Infinity; }
    return querying_1.filter(Checks.tag_type(type), element, recurse, limit);
}
exports.getElementsByTagType = getElementsByTagType;

},{"./querying":85,"./tagtypes":87}],84:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prepend = exports.append = exports.appendChild = exports.replaceElement = exports.removeElement = void 0;
/***
 * Remove an element from the dom
 *
 * @param elem The element to be removed
 */
function removeElement(elem) {
    if (elem.prev)
        elem.prev.next = elem.next;
    if (elem.next)
        elem.next.prev = elem.prev;
    if (elem.parent) {
        var childs = elem.parent.children;
        childs.splice(childs.lastIndexOf(elem), 1);
    }
}
exports.removeElement = removeElement;
/***
 * Replace an element in the dom
 *
 * @param elem The element to be replaced
 * @param replacement The element to be added
 */
function replaceElement(elem, replacement) {
    var prev = (replacement.prev = elem.prev);
    if (prev) {
        prev.next = replacement;
    }
    var next = (replacement.next = elem.next);
    if (next) {
        next.prev = replacement;
    }
    var parent = (replacement.parent = elem.parent);
    if (parent) {
        var childs = parent.children;
        childs[childs.lastIndexOf(elem)] = replacement;
    }
}
exports.replaceElement = replaceElement;
/***
 * Append a child to an element
 *
 * @param elem The element to append to
 * @param child The element to be added as a child
 */
function appendChild(elem, child) {
    removeElement(child);
    child.parent = elem;
    if (elem.children.push(child) !== 1) {
        var sibling = elem.children[elem.children.length - 2];
        sibling.next = child;
        child.prev = sibling;
        child.next = null;
    }
}
exports.appendChild = appendChild;
/***
 * Append an element after another
 *
 * @param elem The element to append to
 * @param next The element be added
 */
function append(elem, next) {
    removeElement(next);
    var parent = elem.parent;
    var currNext = elem.next;
    next.next = currNext;
    next.prev = elem;
    elem.next = next;
    next.parent = parent;
    if (currNext) {
        currNext.prev = next;
        if (parent) {
            var childs = parent.children;
            childs.splice(childs.lastIndexOf(currNext), 0, next);
        }
    }
    else if (parent) {
        parent.children.push(next);
    }
}
exports.append = append;
/***
 * Prepend an element before another
 *
 * @param elem The element to append to
 * @param prev The element be added
 */
function prepend(elem, prev) {
    var parent = elem.parent;
    if (parent) {
        var childs = parent.children;
        childs.splice(childs.lastIndexOf(elem), 0, prev);
    }
    if (elem.prev) {
        elem.prev.next = prev;
    }
    prev.parent = parent;
    prev.prev = elem.prev;
    prev.next = elem;
    elem.prev = prev;
}
exports.prepend = prepend;

},{}],85:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAll = exports.existsOne = exports.findOne = exports.findOneChild = exports.find = exports.filter = void 0;
var tagtypes_1 = require("./tagtypes");
/**
 * Search a node and its children for nodes passing a test function.
 *
 * @param test Function to test nodes on.
 * @param element Element to search. Will be included in the result set if it matches.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 */
function filter(test, node, recurse, limit) {
    if (recurse === void 0) { recurse = true; }
    if (limit === void 0) { limit = Infinity; }
    if (!Array.isArray(node))
        node = [node];
    return find(test, node, recurse, limit);
}
exports.filter = filter;
/**
 * Like `filter`, but only works on an array of nodes.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @param recurse Also consider child nodes.
 * @param limit Maximum number of nodes to return.
 */
function find(test, nodes, recurse, limit) {
    var result = [];
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var elem = nodes_1[_i];
        if (test(elem)) {
            result.push(elem);
            if (--limit <= 0)
                break;
        }
        if (recurse && tagtypes_1.hasChildren(elem) && elem.children.length > 0) {
            var children = find(test, elem.children, recurse, limit);
            result.push.apply(result, children);
            limit -= children.length;
            if (limit <= 0)
                break;
        }
    }
    return result;
}
exports.find = find;
/**
 * Finds the first element inside of an array that matches a test function.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 */
function findOneChild(test, nodes) {
    return nodes.find(test);
}
exports.findOneChild = findOneChild;
/**
 * Finds one element in a tree that passes a test.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 * @param recurse Also consider child nodes.
 */
function findOne(test, nodes, recurse) {
    if (recurse === void 0) { recurse = true; }
    var elem = null;
    for (var i = 0; i < nodes.length && !elem; i++) {
        var checked = nodes[i];
        if (!tagtypes_1.isTag(checked)) {
            continue;
        }
        else if (test(checked)) {
            elem = checked;
        }
        else if (recurse && checked.children.length > 0) {
            elem = findOne(test, checked.children);
        }
    }
    return elem;
}
exports.findOne = findOne;
/**
 * Returns whether a tree of nodes contains at least one node passing a test.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 */
function existsOne(test, nodes) {
    return nodes.some(function (checked) {
        return tagtypes_1.isTag(checked) &&
            (test(checked) ||
                (checked.children.length > 0 &&
                    existsOne(test, checked.children)));
    });
}
exports.existsOne = existsOne;
/**
 * Search and array of nodes and its children for nodes passing a test function.
 *
 * Same as `find`, only with less options, leading to reduced complexity.
 *
 * @param test Function to test nodes on.
 * @param nodes Array of nodes to search.
 */
function findAll(test, nodes) {
    var _a;
    var result = [];
    var stack = nodes.filter(tagtypes_1.isTag);
    var elem;
    while ((elem = stack.shift())) {
        var children = (_a = elem.children) === null || _a === void 0 ? void 0 : _a.filter(tagtypes_1.isTag);
        if (children && children.length > 0) {
            stack.unshift.apply(stack, children);
        }
        if (test(elem))
            result.push(elem);
    }
    return result;
}
exports.findAll = findAll;

},{"./tagtypes":87}],86:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getText = exports.getInnerHTML = exports.getOuterHTML = void 0;
var tagtypes_1 = require("./tagtypes");
var dom_serializer_1 = __importDefault(require("dom-serializer"));
function getOuterHTML(node, options) {
    return dom_serializer_1.default(node, options);
}
exports.getOuterHTML = getOuterHTML;
function getInnerHTML(node, options) {
    return tagtypes_1.hasChildren(node)
        ? node.children.map(function (node) { return getOuterHTML(node, options); }).join("")
        : "";
}
exports.getInnerHTML = getInnerHTML;
function getText(node) {
    if (Array.isArray(node))
        return node.map(getText).join("");
    if (tagtypes_1.isTag(node))
        return node.name === "br" ? "\n" : getText(node.children);
    if (tagtypes_1.isCDATA(node))
        return getText(node.children);
    if (tagtypes_1.isText(node))
        return node.data;
    return "";
}
exports.getText = getText;

},{"./tagtypes":87,"dom-serializer":80}],87:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasChildren = exports.isComment = exports.isText = exports.isCDATA = exports.isTag = void 0;
var domelementtype_1 = require("domelementtype");
function isTag(node) {
    return domelementtype_1.isTag(node);
}
exports.isTag = isTag;
function isCDATA(node) {
    return node.type === "cdata" /* CDATA */;
}
exports.isCDATA = isCDATA;
function isText(node) {
    return node.type === "text" /* Text */;
}
exports.isText = isText;
function isComment(node) {
    return node.type === "comment" /* Comment */;
}
exports.isComment = isComment;
function hasChildren(node) {
    return Object.prototype.hasOwnProperty.call(node, "children");
}
exports.hasChildren = hasChildren;

},{"domelementtype":46}],88:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextElementSibling = exports.getName = exports.hasAttrib = exports.getAttributeValue = exports.getSiblings = exports.getParent = exports.getChildren = void 0;
function getChildren(elem) {
    return elem.children || null;
}
exports.getChildren = getChildren;
function getParent(elem) {
    return elem.parent || null;
}
exports.getParent = getParent;
function getSiblings(elem) {
    var parent = getParent(elem);
    return parent ? getChildren(parent) : [elem];
}
exports.getSiblings = getSiblings;
function getAttributeValue(elem, name) {
    var _a;
    return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
}
exports.getAttributeValue = getAttributeValue;
function hasAttrib(elem, name) {
    return (!!elem.attribs &&
        Object.prototype.hasOwnProperty.call(elem.attribs, name) &&
        elem.attribs[name] != null);
}
exports.hasAttrib = hasAttrib;
/***
 * Returns the name property of an element
 *
 * @param elem The element to get the name for
 */
function getName(elem) {
    return elem.name;
}
exports.getName = getName;
function nextElementSibling(elem) {
    var node = elem.next;
    while (node !== null && node.type !== "tag")
        node = node.next;
    return node;
}
exports.nextElementSibling = nextElementSibling;

},{}],89:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],90:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],91:[function(require,module,exports){
module.exports = isFunction

var toString = Object.prototype.toString

function isFunction (fn) {
  if (!fn) {
    return false
  }
  var string = toString.call(fn)
  return string === '[object Function]' ||
    (typeof fn === 'function' && string !== '[object RegExp]') ||
    (typeof window !== 'undefined' &&
     // IE8 and below
     (fn === window.setTimeout ||
      fn === window.alert ||
      fn === window.confirm ||
      fn === window.prompt))
};

},{}],92:[function(require,module,exports){
'use strict';

module.exports = value => {
	const type = typeof value;
	return value !== null && (type === 'object' || type === 'function');
};

},{}],93:[function(require,module,exports){
'use strict';
module.exports = function (obj, cb) {
	var ret = {};
	var keys = Object.keys(obj);

	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		var res = cb(key, obj[key], obj);
		ret[res[0]] = res[1];
	}

	return ret;
};

},{}],94:[function(require,module,exports){
module.exports = compile;

var BaseFuncs = require("boolbase"),
    trueFunc  = BaseFuncs.trueFunc,
    falseFunc = BaseFuncs.falseFunc;

/*
	returns a function that checks if an elements index matches the given rule
	highly optimized to return the fastest solution
*/
function compile(parsed){
	var a = parsed[0],
	    b = parsed[1] - 1;

	//when b <= 0, a*n won't be possible for any matches when a < 0
	//besides, the specification says that no element is matched when a and b are 0
	if(b < 0 && a <= 0) return falseFunc;

	//when a is in the range -1..1, it matches any element (so only b is checked)
	if(a ===-1) return function(pos){ return pos <= b; };
	if(a === 0) return function(pos){ return pos === b; };
	//when b <= 0 and a === 1, they match any element
	if(a === 1) return b < 0 ? trueFunc : function(pos){ return pos >= b; };

	//when a > 0, modulo can be used to check if there is a match
	var bMod = b % a;
	if(bMod < 0) bMod += a;

	if(a > 1){
		return function(pos){
			return pos >= b && pos % a === bMod;
		};
	}

	a *= -1; //make `a` positive

	return function(pos){
		return pos <= b && pos % a === bMod;
	};
}
},{"boolbase":4}],95:[function(require,module,exports){
var parse = require("./parse.js"),
    compile = require("./compile.js");

module.exports = function nthCheck(formula){
	return compile(parse(formula));
};

module.exports.parse = parse;
module.exports.compile = compile;
},{"./compile.js":94,"./parse.js":96}],96:[function(require,module,exports){
module.exports = parse;

//following http://www.w3.org/TR/css3-selectors/#nth-child-pseudo

//[ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]?
var re_nthElement = /^([+\-]?\d*n)?\s*(?:([+\-]?)\s*(\d+))?$/;

/*
	parses a nth-check formula, returns an array of two numbers
*/
function parse(formula){
	formula = formula.trim().toLowerCase();

	if(formula === "even"){
		return [2, 0];
	} else if(formula === "odd"){
		return [2, 1];
	} else {
		var parsed = formula.match(re_nthElement);

		if(!parsed){
			throw new SyntaxError("n-th rule couldn't be parsed ('" + formula + "')");
		}

		var a;

		if(parsed[1]){
			a = parseInt(parsed[1], 10);
			if(isNaN(a)){
				if(parsed[1].charAt(0) === "-") a = -1;
				else a = 1;
			}
		} else a = 0;

		return [
			a,
			parsed[3] ? parseInt((parsed[2] || "") + parsed[3], 10) : 0
		];
	}
}

},{}],97:[function(require,module,exports){
var wrappy = require('wrappy')
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}

},{"wrappy":132}],98:[function(require,module,exports){
var convert = require('color-convert');

module.exports = function (cstr) {
    var m, conv, parts, alpha;
    if (m = /^((?:rgb|hs[lv]|cmyk|xyz|lab)a?)\s*\(([^\)]*)\)/.exec(cstr)) {
        var name = m[1];
        var base = name.replace(/a$/, '');
        var size = base === 'cmyk' ? 4 : 3;
        conv = convert[base];
        
        parts = m[2].replace(/^\s+|\s+$/g, '')
            .split(/\s*,\s*/)
            .map(function (x, i) {
                if (/%$/.test(x) && i === size) {
                    return parseFloat(x) / 100;
                }
                else if (/%$/.test(x)) {
                    return parseFloat(x);
                }
                return parseFloat(x);
            })
        ;
        if (name === base) parts.push(1);
        alpha = parts[size] === undefined ? 1 : parts[size];
        parts = parts.slice(0, size);
        
        conv[base] = function () { return parts };
    }
    else if (/^#[A-Fa-f0-9]+$/.test(cstr)) {
        var base = cstr.replace(/^#/,'');
        var size = base.length;
        conv = convert.rgb;
        parts = base.split(size === 3 ? /(.)/ : /(..)/);
        parts = parts.filter(Boolean)
            .map(function (x) {
                if (size === 3) {
                    return parseInt(x + x, 16);
                }
                else {
                    return parseInt(x, 16)
                }
            })
        ;
        alpha = 1;
        conv.rgb = function () { return parts };
        if (!parts[0]) parts[0] = 0;
        if (!parts[1]) parts[1] = 0;
        if (!parts[2]) parts[2] = 0;
    }
    else {
        conv = convert.keyword;
        conv.keyword = function () { return cstr };
        parts = cstr;
        alpha = 1;
    }
    
    var res = {
        rgb: undefined,
        hsl: undefined,
        hsv: undefined,
        cmyk: undefined,
        keyword: undefined,
        hex: undefined
    };
    try { res.rgb = conv.rgb(parts) } catch (e) {}
    try { res.hsl = conv.hsl(parts) } catch (e) {}
    try { res.hsv = conv.hsv(parts) } catch (e) {}
    try { res.cmyk = conv.cmyk(parts) } catch (e) {}
    try { res.keyword = conv.keyword(parts) } catch (e) {}
    
    if (res.rgb) res.hex = '#' + res.rgb.map(function (x) {
        var s = x.toString(16);
        if (s.length === 1) return '0' + s;
        return s;
    }).join('');
    
    if (res.rgb) res.rgba = res.rgb.concat(alpha);
    if (res.hsl) res.hsla = res.hsl.concat(alpha);
    if (res.hsv) res.hsva = res.hsv.concat(alpha);
    if (res.cmyk) res.cmyka = res.cmyk.concat(alpha);
    
    return res;
};

},{"color-convert":12}],99:[function(require,module,exports){
var trim = function(string) {
  return string.replace(/^\s+|\s+$/g, '');
}
  , isArray = function(arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    }

module.exports = function (headers) {
  if (!headers)
    return {}

  var result = {}

  var headersArr = trim(headers).split('\n')

  for (var i = 0; i < headersArr.length; i++) {
    var row = headersArr[i]
    var index = row.indexOf(':')
    , key = trim(row.slice(0, index)).toLowerCase()
    , value = trim(row.slice(index + 1))

    if (typeof(result[key]) === 'undefined') {
      result[key] = value
    } else if (isArray(result[key])) {
      result[key].push(value)
    } else {
      result[key] = [ result[key], value ]
    }
  }

  return result
}

},{}],100:[function(require,module,exports){
module.exports = function parseUnit(str, out) {
    if (!out)
        out = [ 0, '' ]

    str = String(str)
    var num = parseFloat(str, 10)
    out[0] = num
    out[1] = str.match(/[\d.\-\+]*\s*(.*)/)[1] || ''
    return out
}
},{}],101:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":7}],102:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],103:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],104:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],105:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":103,"./encode":104}],106:[function(require,module,exports){
/*!
 * repeat-element <https://github.com/jonschlinkert/repeat-element>
 *
 * Copyright (c) 2015-present, Jon Schlinkert.
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function repeat(ele, num) {
  var arr = new Array(num);

  for (var i = 0; i < num; i++) {
    arr[i] = ele;
  }

  return arr;
};

},{}],107:[function(require,module,exports){
'use strict';

module.exports = function rgbRegex(options) {
  options = options || {};

  return options.exact ?
    /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/ :
    /rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/ig;
}

},{}],108:[function(require,module,exports){
'use strict';

module.exports = function rgbaRegex(options) {
  options = options || {};

  return options.exact ?
    /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)$/ :
    /rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)/ig;
}

},{}],109:[function(require,module,exports){
(function (setImmediate){
var atob = require("atob")
var urlLib = require("url")
var pathLib = require("path")
var decodeUriComponentLib = require("decode-uri-component")



function resolveUrl(/* ...urls */) {
  return Array.prototype.reduce.call(arguments, function(resolved, nextUrl) {
    return urlLib.resolve(resolved, nextUrl)
  })
}

function convertWindowsPath(aPath) {
  return pathLib.sep === "\\" ? aPath.replace(/\\/g, "/").replace(/^[a-z]:\/?/i, "/") : aPath
}

function customDecodeUriComponent(string) {
  // `decodeUriComponentLib` turns `+` into ` `, but that's not wanted.
  return decodeUriComponentLib(string.replace(/\+/g, "%2B"))
}

function callbackAsync(callback, error, result) {
  setImmediate(function() { callback(error, result) })
}

function parseMapToJSON(string, data) {
  try {
    return JSON.parse(string.replace(/^\)\]\}'/, ""))
  } catch (error) {
    error.sourceMapData = data
    throw error
  }
}

function readSync(read, url, data) {
  var readUrl = customDecodeUriComponent(url)
  try {
    return String(read(readUrl))
  } catch (error) {
    error.sourceMapData = data
    throw error
  }
}



var innerRegex = /[#@] sourceMappingURL=([^\s'"]*)/

var sourceMappingURLRegex = RegExp(
  "(?:" +
    "/\\*" +
    "(?:\\s*\r?\n(?://)?)?" +
    "(?:" + innerRegex.source + ")" +
    "\\s*" +
    "\\*/" +
    "|" +
    "//(?:" + innerRegex.source + ")" +
  ")" +
  "\\s*"
)

function getSourceMappingUrl(code) {
  var match = code.match(sourceMappingURLRegex)
  return match ? match[1] || match[2] || "" : null
}



function resolveSourceMap(code, codeUrl, read, callback) {
  var mapData
  try {
    mapData = resolveSourceMapHelper(code, codeUrl)
  } catch (error) {
    return callbackAsync(callback, error)
  }
  if (!mapData || mapData.map) {
    return callbackAsync(callback, null, mapData)
  }
  var readUrl = customDecodeUriComponent(mapData.url)
  read(readUrl, function(error, result) {
    if (error) {
      error.sourceMapData = mapData
      return callback(error)
    }
    mapData.map = String(result)
    try {
      mapData.map = parseMapToJSON(mapData.map, mapData)
    } catch (error) {
      return callback(error)
    }
    callback(null, mapData)
  })
}

function resolveSourceMapSync(code, codeUrl, read) {
  var mapData = resolveSourceMapHelper(code, codeUrl)
  if (!mapData || mapData.map) {
    return mapData
  }
  mapData.map = readSync(read, mapData.url, mapData)
  mapData.map = parseMapToJSON(mapData.map, mapData)
  return mapData
}

var dataUriRegex = /^data:([^,;]*)(;[^,;]*)*(?:,(.*))?$/

/**
 * The media type for JSON text is application/json.
 *
 * {@link https://tools.ietf.org/html/rfc8259#section-11 | IANA Considerations }
 *
 * `text/json` is non-standard media type
 */
var jsonMimeTypeRegex = /^(?:application|text)\/json$/

/**
 * JSON text exchanged between systems that are not part of a closed ecosystem
 * MUST be encoded using UTF-8.
 *
 * {@link https://tools.ietf.org/html/rfc8259#section-8.1 | Character Encoding}
 */
var jsonCharacterEncoding = "utf-8"

function base64ToBuf(b64) {
  var binStr = atob(b64)
  var len = binStr.length
  var arr = new Uint8Array(len)
  for (var i = 0; i < len; i++) {
    arr[i] = binStr.charCodeAt(i)
  }
  return arr
}

function decodeBase64String(b64) {
  if (typeof TextDecoder === "undefined" || typeof Uint8Array === "undefined") {
    return atob(b64)
  }
  var buf = base64ToBuf(b64);
  // Note: `decoder.decode` method will throw a `DOMException` with the
  // `"EncodingError"` value when an coding error is found.
  var decoder = new TextDecoder(jsonCharacterEncoding, {fatal: true})
  return decoder.decode(buf);
}

function resolveSourceMapHelper(code, codeUrl) {
  codeUrl = convertWindowsPath(codeUrl)

  var url = getSourceMappingUrl(code)
  if (!url) {
    return null
  }

  var dataUri = url.match(dataUriRegex)
  if (dataUri) {
    var mimeType = dataUri[1] || "text/plain"
    var lastParameter = dataUri[2] || ""
    var encoded = dataUri[3] || ""
    var data = {
      sourceMappingURL: url,
      url: null,
      sourcesRelativeTo: codeUrl,
      map: encoded
    }
    if (!jsonMimeTypeRegex.test(mimeType)) {
      var error = new Error("Unuseful data uri mime type: " + mimeType)
      error.sourceMapData = data
      throw error
    }
    try {
      data.map = parseMapToJSON(
        lastParameter === ";base64" ? decodeBase64String(encoded) : decodeURIComponent(encoded),
        data
      )
    } catch (error) {
      error.sourceMapData = data
      throw error
    }
    return data
  }

  var mapUrl = resolveUrl(codeUrl, url)
  return {
    sourceMappingURL: url,
    url: mapUrl,
    sourcesRelativeTo: mapUrl,
    map: null
  }
}



function resolveSources(map, mapUrl, read, options, callback) {
  if (typeof options === "function") {
    callback = options
    options = {}
  }
  var pending = map.sources ? map.sources.length : 0
  var result = {
    sourcesResolved: [],
    sourcesContent:  []
  }

  if (pending === 0) {
    callbackAsync(callback, null, result)
    return
  }

  var done = function() {
    pending--
    if (pending === 0) {
      callback(null, result)
    }
  }

  resolveSourcesHelper(map, mapUrl, options, function(fullUrl, sourceContent, index) {
    result.sourcesResolved[index] = fullUrl
    if (typeof sourceContent === "string") {
      result.sourcesContent[index] = sourceContent
      callbackAsync(done, null)
    } else {
      var readUrl = customDecodeUriComponent(fullUrl)
      read(readUrl, function(error, source) {
        result.sourcesContent[index] = error ? error : String(source)
        done()
      })
    }
  })
}

function resolveSourcesSync(map, mapUrl, read, options) {
  var result = {
    sourcesResolved: [],
    sourcesContent:  []
  }

  if (!map.sources || map.sources.length === 0) {
    return result
  }

  resolveSourcesHelper(map, mapUrl, options, function(fullUrl, sourceContent, index) {
    result.sourcesResolved[index] = fullUrl
    if (read !== null) {
      if (typeof sourceContent === "string") {
        result.sourcesContent[index] = sourceContent
      } else {
        var readUrl = customDecodeUriComponent(fullUrl)
        try {
          result.sourcesContent[index] = String(read(readUrl))
        } catch (error) {
          result.sourcesContent[index] = error
        }
      }
    }
  })

  return result
}

var endingSlash = /\/?$/

function resolveSourcesHelper(map, mapUrl, options, fn) {
  options = options || {}
  mapUrl = convertWindowsPath(mapUrl)
  var fullUrl
  var sourceContent
  var sourceRoot
  for (var index = 0, len = map.sources.length; index < len; index++) {
    sourceRoot = null
    if (typeof options.sourceRoot === "string") {
      sourceRoot = options.sourceRoot
    } else if (typeof map.sourceRoot === "string" && options.sourceRoot !== false) {
      sourceRoot = map.sourceRoot
    }
    // If the sourceRoot is the empty string, it is equivalent to not setting
    // the property at all.
    if (sourceRoot === null || sourceRoot === '') {
      fullUrl = resolveUrl(mapUrl, map.sources[index])
    } else {
      // Make sure that the sourceRoot ends with a slash, so that `/scripts/subdir` becomes
      // `/scripts/subdir/<source>`, not `/scripts/<source>`. Pointing to a file as source root
      // does not make sense.
      fullUrl = resolveUrl(mapUrl, sourceRoot.replace(endingSlash, "/"), map.sources[index])
    }
    sourceContent = (map.sourcesContent || [])[index]
    fn(fullUrl, sourceContent, index)
  }
}



function resolve(code, codeUrl, read, options, callback) {
  if (typeof options === "function") {
    callback = options
    options = {}
  }
  if (code === null) {
    var mapUrl = codeUrl
    var data = {
      sourceMappingURL: null,
      url: mapUrl,
      sourcesRelativeTo: mapUrl,
      map: null
    }
    var readUrl = customDecodeUriComponent(mapUrl)
    read(readUrl, function(error, result) {
      if (error) {
        error.sourceMapData = data
        return callback(error)
      }
      data.map = String(result)
      try {
        data.map = parseMapToJSON(data.map, data)
      } catch (error) {
        return callback(error)
      }
      _resolveSources(data)
    })
  } else {
    resolveSourceMap(code, codeUrl, read, function(error, mapData) {
      if (error) {
        return callback(error)
      }
      if (!mapData) {
        return callback(null, null)
      }
      _resolveSources(mapData)
    })
  }

  function _resolveSources(mapData) {
    resolveSources(mapData.map, mapData.sourcesRelativeTo, read, options, function(error, result) {
      if (error) {
        return callback(error)
      }
      mapData.sourcesResolved = result.sourcesResolved
      mapData.sourcesContent  = result.sourcesContent
      callback(null, mapData)
    })
  }
}

function resolveSync(code, codeUrl, read, options) {
  var mapData
  if (code === null) {
    var mapUrl = codeUrl
    mapData = {
      sourceMappingURL: null,
      url: mapUrl,
      sourcesRelativeTo: mapUrl,
      map: null
    }
    mapData.map = readSync(read, mapUrl, mapData)
    mapData.map = parseMapToJSON(mapData.map, mapData)
  } else {
    mapData = resolveSourceMapSync(code, codeUrl, read)
    if (!mapData) {
      return null
    }
  }
  var result = resolveSourcesSync(mapData.map, mapData.sourcesRelativeTo, read, options)
  mapData.sourcesResolved = result.sourcesResolved
  mapData.sourcesContent  = result.sourcesContent
  return mapData
}



module.exports = {
  resolveSourceMap:     resolveSourceMap,
  resolveSourceMapSync: resolveSourceMapSync,
  resolveSources:       resolveSources,
  resolveSourcesSync:   resolveSourcesSync,
  resolve:              resolve,
  resolveSync:          resolveSync,
  parseMapToJSON:       parseMapToJSON
}

}).call(this,require("timers").setImmediate)
},{"atob":2,"decode-uri-component":43,"path":101,"timers":124,"url":127}],110:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

exports.ArraySet = ArraySet;

},{"./util":119}],111:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = require('./base64');

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
exports.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

},{"./base64":112}],112:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
exports.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
exports.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

},{}],113:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};

},{}],114:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

exports.MappingList = MappingList;

},{"./util":119}],115:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
exports.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

},{}],116:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util = require('./util');
var binarySearch = require('./binary-search');
var ArraySet = require('./array-set').ArraySet;
var base64VLQ = require('./base64-vlq');
var quickSort = require('./quick-sort').quickSort;

function SourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
}

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer.GENERATED_ORDER = 1;
SourceMapConsumer.ORIGINAL_ORDER = 2;

SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util.getArg(mapping, 'generatedLine', null),
            column: util.getArg(mapping, 'generatedColumn', null),
            lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

exports.SourceMapConsumer = SourceMapConsumer;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sources = util.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util.getArg(sourceMap, 'names', []);
  var sourceRoot = util.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util.getArg(sourceMap, 'mappings');
  var file = util.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source)
        ? util.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util.compareByGeneratedPositionsDeflated,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util.getArg(mapping, 'originalLine', null),
          column: util.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util.getArg(aArgs, 'line'),
      originalColumn: util.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util.compareByOriginalPositions,
      util.getArg(aArgs, 'bias', SourceMapConsumer.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util.getArg(mapping, 'generatedLine', null),
          column: util.getArg(mapping, 'generatedColumn', null),
          lastColumn: util.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

exports.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util.parseSourceMapInput(aSourceMap);
  }

  var version = util.getArg(sourceMap, 'version');
  var sections = util.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util.getArg(s, 'offset');
    var offsetLine = util.getArg(offset, 'line');
    var offsetColumn = util.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer(util.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util.getArg(aArgs, 'line'),
      generatedColumn: util.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util.compareByOriginalPositions);
  };

exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

},{"./array-set":110,"./base64-vlq":111,"./binary-search":113,"./quick-sort":115,"./util":119}],117:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ = require('./base64-vlq');
var util = require('./util');
var ArraySet = require('./array-set').ArraySet;
var MappingList = require('./mapping-list').MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util.getArg(aArgs, 'file', null);
  this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet();
  this._names = new ArraySet();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util.getArg(aArgs, 'generated');
    var original = util.getArg(aArgs, 'original', null);
    var source = util.getArg(aArgs, 'source', null);
    var name = util.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet();
    var newNames = new ArraySet();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util.join(aSourceMapPath, mapping.source)
          }
          if (sourceRoot != null) {
            mapping.source = util.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = ''

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util.relative(aSourceRoot, source);
      }
      var key = util.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

exports.SourceMapGenerator = SourceMapGenerator;

},{"./array-set":110,"./base64-vlq":111,"./mapping-list":114,"./util":119}],118:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = require('./source-map-generator').SourceMapGenerator;
var util = require('./util');

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex] || '';
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || '';
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

exports.SourceNode = SourceNode;

},{"./source-map-generator":117,"./util":119}],119:[function(require,module,exports){
/* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || '';

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
      sourceRoot += '/';
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    var parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      var index = parsed.path.lastIndexOf('/');
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;

},{}],120:[function(require,module,exports){
/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
exports.SourceMapGenerator = require('./lib/source-map-generator').SourceMapGenerator;
exports.SourceMapConsumer = require('./lib/source-map-consumer').SourceMapConsumer;
exports.SourceNode = require('./lib/source-node').SourceNode;

},{"./lib/source-map-consumer":116,"./lib/source-map-generator":117,"./lib/source-node":118}],121:[function(require,module,exports){
/**
 * Calculates the specificity of CSS selectors
 * http://www.w3.org/TR/css3-selectors/#specificity
 *
 * Returns an array of objects with the following properties:
 *  - selector: the input
 *  - specificity: e.g. 0,1,0,0
 *  - parts: array with details about each part of the selector that counts towards the specificity
 */
var SPECIFICITY = (function() {
	var calculate,
		calculateSingle;

	calculate = function(input) {
		var selectors,
			selector,
			i,
			len,
			results = [];

		// Separate input by commas
		selectors = input.split(',');

		for (i = 0, len = selectors.length; i < len; i += 1) {
			selector = selectors[i];
			if (selector.length > 0) {
				results.push(calculateSingle(selector));
			}
		}

		return results;
	};

	// Calculate the specificity for a selector by dividing it into simple selectors and counting them
	calculateSingle = function(input) {
		var selector = input,
			findMatch,
			typeCount = {
				'a': 0,
				'b': 0,
				'c': 0
			},
			parts = [],
			// The following regular expressions assume that selectors matching the preceding regular expressions have been removed
			attributeRegex = /(\[[^\]]+\])/g,
			idRegex = /(#[^\s\+>~\.\[:]+)/g,
			classRegex = /(\.[^\s\+>~\.\[:]+)/g,
			pseudoElementRegex = /(::[^\s\+>~\.\[:]+|:first-line|:first-letter|:before|:after)/gi,
			// A regex for pseudo classes with brackets - :nth-child(), :nth-last-child(), :nth-of-type(), :nth-last-type(), :lang()
			pseudoClassWithBracketsRegex = /(:[\w-]+\([^\)]*\))/gi,
			// A regex for other pseudo classes, which don't have brackets
			pseudoClassRegex = /(:[^\s\+>~\.\[:]+)/g,
			elementRegex = /([^\s\+>~\.\[:]+)/g;

		// Find matches for a regular expression in a string and push their details to parts
		// Type is "a" for IDs, "b" for classes, attributes and pseudo-classes and "c" for elements and pseudo-elements
		findMatch = function(regex, type) {
			var matches, i, len, match, index, length;
			if (regex.test(selector)) {
				matches = selector.match(regex);
				for (i = 0, len = matches.length; i < len; i += 1) {
					typeCount[type] += 1;
					match = matches[i];
					index = selector.indexOf(match);
					length = match.length;
					parts.push({
						selector: input.substr(index, length),
						type: type,
						index: index,
						length: length
					});
					// Replace this simple selector with whitespace so it won't be counted in further simple selectors
					selector = selector.replace(match, Array(length + 1).join(' '));
				}
			}
		};

		// Replace escaped characters with plain text, using the "A" character
		// https://www.w3.org/TR/CSS21/syndata.html#characters
		(function() {
			var replaceWithPlainText = function(regex) {
					var matches, i, len, match;
					if (regex.test(selector)) {
						matches = selector.match(regex);
						for (i = 0, len = matches.length; i < len; i += 1) {
							match = matches[i];
							selector = selector.replace(match, Array(match.length + 1).join('A'));
						}
					}
				},
				// Matches a backslash followed by six hexadecimal digits followed by an optional single whitespace character
				escapeHexadecimalRegex = /\\[0-9A-Fa-f]{6}\s?/g,
				// Matches a backslash followed by fewer than six hexadecimal digits followed by a mandatory single whitespace character
				escapeHexadecimalRegex2 = /\\[0-9A-Fa-f]{1,5}\s/g,
				// Matches a backslash followed by any character
				escapeSpecialCharacter = /\\./g;

			replaceWithPlainText(escapeHexadecimalRegex);
			replaceWithPlainText(escapeHexadecimalRegex2);
			replaceWithPlainText(escapeSpecialCharacter);
		}());

		// Remove the negation psuedo-class (:not) but leave its argument because specificity is calculated on its argument
		(function() {
			var regex = /:not\(([^\)]*)\)/g;
			if (regex.test(selector)) {
				selector = selector.replace(regex, '     $1 ');
			}
		}());

		// Remove anything after a left brace in case a user has pasted in a rule, not just a selector
		(function() {
			var regex = /{[^]*/gm,
				matches, i, len, match;
			if (regex.test(selector)) {
				matches = selector.match(regex);
				for (i = 0, len = matches.length; i < len; i += 1) {
					match = matches[i];
					selector = selector.replace(match, Array(match.length + 1).join(' '));
				}
			}
		}());

		// Add attribute selectors to parts collection (type b)
		findMatch(attributeRegex, 'b');

		// Add ID selectors to parts collection (type a)
		findMatch(idRegex, 'a');

		// Add class selectors to parts collection (type b)
		findMatch(classRegex, 'b');

		// Add pseudo-element selectors to parts collection (type c)
		findMatch(pseudoElementRegex, 'c');

		// Add pseudo-class selectors to parts collection (type b)
		findMatch(pseudoClassWithBracketsRegex, 'b');
		findMatch(pseudoClassRegex, 'b');

		// Remove universal selector and separator characters
		selector = selector.replace(/[\*\s\+>~]/g, ' ');

		// Remove any stray dots or hashes which aren't attached to words
		// These may be present if the user is live-editing this selector
		selector = selector.replace(/[#\.]/g, ' ');

		// The only things left should be element selectors (type c)
		findMatch(elementRegex, 'c');

		// Order the parts in the order they appear in the original selector
		// This is neater for external apps to deal with
		parts.sort(function(a, b) {
			return a.index - b.index;
		});

		return {
			selector: input,
			specificity: '0,' + typeCount.a.toString() + ',' + typeCount.b.toString() + ',' + typeCount.c.toString(),
			parts: parts
		};
	};

	return {
		calculate: calculate
	};
}());

// Export for Node JS
if (typeof exports !== 'undefined') {
	exports.calculate = SPECIFICITY.calculate;
}

},{}],122:[function(require,module,exports){
var util = require('util');
var unit = require('parse-unit');
var extend = require('xtend');
var textWidth = require('text-width');

var CLEAR_PADDING = 5;

var supported = function() {
	if(!textWidth.supported) return false;

	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');

	return (typeof context.getImageData === 'function');
};

var empty = function(size) {
	return {
		ascent: 0,
		descent: 0,
		height: 0,
		size: size || 0
	};
};

var px = function(size) {
	if(typeof size === 'number') return size;

	size = unit(size);

	var v = size[0] || 0;
	var u = size[1] || 'px';

	switch(u) {
		case 'px': return v;
		case 'cm': return v * 37.8;
		case 'mm': return v * 3.78;
		case 'in': return v * 96;
		case 'pt': return v * (4 / 3);
		case 'pc': return v * 16;
		default: return 0;
	}
};

var font = function(options) {
	options = extend({
		style: 'normal',
		variant: 'normal',
		weight: 'normal',
		size: 'medium',
		family: 'sans-serif'
	}, options);

	return util.format('%s %s %s %s %s',
		options.style,
		options.variant,
		options.weight,
		options.size,
		options.family);
};

var initialize = function() {
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');

	context.textBaseline = 'baseline';
	context.fillStyle = 'rgba(0, 0, 0, 1)';

	var height = function(text, options) {
		if(!options && typeof text === 'object') {
			options = text;
			text = null;
		}

		text = (typeof text !== 'string') ? 'Mg' : text;
		options = options || {};

		var size = ('size' in options) ? px(options.size) : 16;
		options.size = size + 'px';

		context.font = font(options);

		var width = textWidth(text, options);

		if(!width || !size) return empty(size);

		context.fillText(text, 0, size);
		context.fillText(text, width, 0);

		var image = context.getImageData(0, 0, width * 2, size);
		var ascent = 0;
		var descent = 0;

		outer:
		for(var i = 0; i < image.height; i++) {
			for(var j = 0; j < image.width; j++) {
				var value = image.data[i * (image.width * 4) + j * 4 + 3];

				if(!value) continue;

				if(j < width && !ascent) ascent = i;
				else if(j >= width) descent = i;

				if(ascent && descent) break outer;
			}
		}

		ascent = size - ascent;
		context.clearRect(0, 0, width * 2 + CLEAR_PADDING,
			size + descent + CLEAR_PADDING);

		return {
			ascent: ascent,
			descent: descent,
			height: ascent + descent,
			size: size
		};
	};

	height.supported = true;
	return height;
};

module.exports = supported() ? initialize() : (function() {
	var height = function() {
		return empty();
	};

	height.supported = false;
	return height;
}());

},{"parse-unit":100,"text-width":123,"util":131,"xtend":134}],123:[function(require,module,exports){
var util = require('util');
var extend = require('xtend');

var supported = function() {
	if(typeof document === 'undefined' || typeof document.createElement !== 'function') return false;

	var canvas = document.createElement('canvas');
	if(typeof canvas.getContext !== 'function') return false;

	var context = canvas.getContext('2d');
	return !!context && (typeof context.measureText === 'function');
};

var initialize = function() {
	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');

	var width = function(str, options) {
		options = extend({
			style: 'normal',
			variant: 'normal',
			weight: 'normal',
			size: 'medium',
			family: 'sans-serif',
			align: 'start',
			baseline: 'alphabetic'
		}, options);

		var size = options.size;
		if(typeof size === 'number') size = size + 'px';

		context.font = util.format('%s %s %s %s %s',
			options.style,
			options.variant,
			options.weight,
			size,
			options.family);
		context.textAlign = options.align;
		context.textBaseline = options.baseline;

		return context.measureText(str).width;
	};

	width.supported = true;
	return width;
};

module.exports = supported() ? initialize() : (function() {
	var width = function() {
		return 0;
	};

	width.supported = false;
	return width;
}());

},{"util":131,"xtend":134}],124:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":125,"timers":124}],125:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],126:[function(require,module,exports){

/**
 * Generate an object from the given `(key, value)+` pairs.
 *
 * @param {Mixed} ...
 * @return {Object}
 * @api public
 */

module.exports = function(){
  var obj = {};
  for (var i = 0; i < arguments.length; ++i) {
    obj[arguments[i]] = arguments[++i];
  }
  return obj;
};
},{}],127:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":128,"punycode":102,"querystring":105}],128:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],129:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],130:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],131:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":130,"_process":7,"inherits":129}],132:[function(require,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}],133:[function(require,module,exports){
"use strict";
var window = require("global/window")
var isFunction = require("is-function")
var parseHeaders = require("parse-headers")
var xtend = require("xtend")

module.exports = createXHR
// Allow use of default import syntax in TypeScript
module.exports.default = createXHR;
createXHR.XMLHttpRequest = window.XMLHttpRequest || noop
createXHR.XDomainRequest = "withCredentials" in (new createXHR.XMLHttpRequest()) ? createXHR.XMLHttpRequest : window.XDomainRequest

forEachArray(["get", "put", "post", "patch", "head", "delete"], function(method) {
    createXHR[method === "delete" ? "del" : method] = function(uri, options, callback) {
        options = initParams(uri, options, callback)
        options.method = method.toUpperCase()
        return _createXHR(options)
    }
})

function forEachArray(array, iterator) {
    for (var i = 0; i < array.length; i++) {
        iterator(array[i])
    }
}

function isEmpty(obj){
    for(var i in obj){
        if(obj.hasOwnProperty(i)) return false
    }
    return true
}

function initParams(uri, options, callback) {
    var params = uri

    if (isFunction(options)) {
        callback = options
        if (typeof uri === "string") {
            params = {uri:uri}
        }
    } else {
        params = xtend(options, {uri: uri})
    }

    params.callback = callback
    return params
}

function createXHR(uri, options, callback) {
    options = initParams(uri, options, callback)
    return _createXHR(options)
}

function _createXHR(options) {
    if(typeof options.callback === "undefined"){
        throw new Error("callback argument missing")
    }

    var called = false
    var callback = function cbOnce(err, response, body){
        if(!called){
            called = true
            options.callback(err, response, body)
        }
    }

    function readystatechange() {
        if (xhr.readyState === 4) {
            setTimeout(loadFunc, 0)
        }
    }

    function getBody() {
        // Chrome with requestType=blob throws errors arround when even testing access to responseText
        var body = undefined

        if (xhr.response) {
            body = xhr.response
        } else {
            body = xhr.responseText || getXml(xhr)
        }

        if (isJson) {
            try {
                body = JSON.parse(body)
            } catch (e) {}
        }

        return body
    }

    function errorFunc(evt) {
        clearTimeout(timeoutTimer)
        if(!(evt instanceof Error)){
            evt = new Error("" + (evt || "Unknown XMLHttpRequest Error") )
        }
        evt.statusCode = 0
        return callback(evt, failureResponse)
    }

    // will load the data & process the response in a special response object
    function loadFunc() {
        if (aborted) return
        var status
        clearTimeout(timeoutTimer)
        if(options.useXDR && xhr.status===undefined) {
            //IE8 CORS GET successful response doesn't have a status field, but body is fine
            status = 200
        } else {
            status = (xhr.status === 1223 ? 204 : xhr.status)
        }
        var response = failureResponse
        var err = null

        if (status !== 0){
            response = {
                body: getBody(),
                statusCode: status,
                method: method,
                headers: {},
                url: uri,
                rawRequest: xhr
            }
            if(xhr.getAllResponseHeaders){ //remember xhr can in fact be XDR for CORS in IE
                response.headers = parseHeaders(xhr.getAllResponseHeaders())
            }
        } else {
            err = new Error("Internal XMLHttpRequest Error")
        }
        return callback(err, response, response.body)
    }

    var xhr = options.xhr || null

    if (!xhr) {
        if (options.cors || options.useXDR) {
            xhr = new createXHR.XDomainRequest()
        }else{
            xhr = new createXHR.XMLHttpRequest()
        }
    }

    var key
    var aborted
    var uri = xhr.url = options.uri || options.url
    var method = xhr.method = options.method || "GET"
    var body = options.body || options.data
    var headers = xhr.headers = options.headers || {}
    var sync = !!options.sync
    var isJson = false
    var timeoutTimer
    var failureResponse = {
        body: undefined,
        headers: {},
        statusCode: 0,
        method: method,
        url: uri,
        rawRequest: xhr
    }

    if ("json" in options && options.json !== false) {
        isJson = true
        headers["accept"] || headers["Accept"] || (headers["Accept"] = "application/json") //Don't override existing accept header declared by user
        if (method !== "GET" && method !== "HEAD") {
            headers["content-type"] || headers["Content-Type"] || (headers["Content-Type"] = "application/json") //Don't override existing accept header declared by user
            body = JSON.stringify(options.json === true ? body : options.json)
        }
    }

    xhr.onreadystatechange = readystatechange
    xhr.onload = loadFunc
    xhr.onerror = errorFunc
    // IE9 must have onprogress be set to a unique function.
    xhr.onprogress = function () {
        // IE must die
    }
    xhr.onabort = function(){
        aborted = true;
    }
    xhr.ontimeout = errorFunc
    xhr.open(method, uri, !sync, options.username, options.password)
    //has to be after open
    if(!sync) {
        xhr.withCredentials = !!options.withCredentials
    }
    // Cannot set timeout with sync request
    // not setting timeout on the xhr object, because of old webkits etc. not handling that correctly
    // both npm's request and jquery 1.x use this kind of timeout, so this is being consistent
    if (!sync && options.timeout > 0 ) {
        timeoutTimer = setTimeout(function(){
            if (aborted) return
            aborted = true//IE9 may still call readystatechange
            xhr.abort("timeout")
            var e = new Error("XMLHttpRequest timeout")
            e.code = "ETIMEDOUT"
            errorFunc(e)
        }, options.timeout )
    }

    if (xhr.setRequestHeader) {
        for(key in headers){
            if(headers.hasOwnProperty(key)){
                xhr.setRequestHeader(key, headers[key])
            }
        }
    } else if (options.headers && !isEmpty(options.headers)) {
        throw new Error("Headers cannot be set on an XDomainRequest object")
    }

    if ("responseType" in options) {
        xhr.responseType = options.responseType
    }

    if ("beforeSend" in options &&
        typeof options.beforeSend === "function"
    ) {
        options.beforeSend(xhr)
    }

    // Microsoft Edge browser sends "undefined" when send is called with undefined value.
    // XMLHttpRequest spec says to pass null as body to indicate no body
    // See https://github.com/naugtur/xhr/issues/100.
    xhr.send(body || null)

    return xhr


}

function getXml(xhr) {
    // xhr.responseXML will throw Exception "InvalidStateError" or "DOMException"
    // See https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/responseXML.
    try {
        if (xhr.responseType === "document") {
            return xhr.responseXML
        }
        var firefoxBugTakenEffect = xhr.responseXML && xhr.responseXML.documentElement.nodeName === "parsererror"
        if (xhr.responseType === "" && !firefoxBugTakenEffect) {
            return xhr.responseXML
        }
    } catch (e) {}

    return null
}

function noop() {}

},{"global/window":68,"is-function":91,"parse-headers":99,"xtend":134}],134:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],135:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend(target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],136:[function(require,module,exports){
var ElementType = require('domelementtype');

var cascade = require('./css/cascade');
var compute = require('./css/compute');

module.exports = function(stylesheets, html) {
	var stack = [html];

	while(stack.length) {
		var nodes = stack.pop();

		nodes.forEach(function(node) {
			if(ElementType.isTag(node)) {
				var style = cascade(stylesheets, node);
				var parentStyle = node.parentNode && node.parentNode.style;

				node.style = compute(style, parentStyle);
			}

			if(node.childNodes) stack.push(node.childNodes);
		});
	}
};

},{"./css/cascade":137,"./css/compute":139,"domelementtype":46}],137:[function(require,module,exports){
var util = require('util');
var css = require('css');
var dot = require('dot-prop');

var compare = require('./compare-specificity');
var declarations = require('./declarations');

var parse = function(property, value, order, rule) {
	var declaration = declarations[property];
	return declaration && declaration.parse(property, value, order, rule);
};

var reduce = function(arr, fn) {
	return arr.reduce(function(acc, item) {
		return acc.concat(fn(item));
	}, []);
};

var ElementRule = function(element) {
	this.element = element;

	this.declarations = [];
	this.specificity = [1, 0, 0, 0];
};

ElementRule.parse = function(element, str) {
	str = util.format('element.style { %s }', str);

	var rule = new ElementRule(element);
	var ast = css.parse(str, { silent: true });
	var order = 1;

	var declarations = dot(ast, 'stylesheet.rules.0.declarations');
	if(!declarations) return rule;

	declarations.forEach(function(d) {
		var declaration = parse(d.property, d.value, order, rule);
		if(!declaration) return;

		rule.declarations.push(declaration);
		order++;
	});

	return rule;
};

ElementRule.prototype.matches = function(element) {
	return this.element === element;
};

ElementRule.prototype.compareTo = function(other) {
	return compare(this.specificity, other.specificity);
};

ElementRule.prototype.toString = function() {
	return util.format('element.style { %s }', this.declarations.join(' '));
};

module.exports = function(stylesheets, node) {
	var rules = reduce(stylesheets, function(stylesheet) {
		return stylesheet.match(node);
	});

	var declarations = reduce(rules, function(rule) {
		return rule.declarations;
	});

	if(node.attribs.style) {
		var rule = ElementRule.parse(node, node.attribs.style);
		declarations = declarations.concat(rule.declarations);
	}

	declarations.sort(function(a, b) {
		return a.compareTo(b);
	});

	var style = {};
	declarations.forEach(function(declaration) {
		style[declaration.property] = declaration.value;
	});

	return style;
};

},{"./compare-specificity":138,"./declarations":141,"css":36,"dot-prop":57,"util":131}],138:[function(require,module,exports){
module.exports = function(first, second) {
	for(var i = 0; i < first.length; i++) {
		var a = first[i];
		var b = second[i];

		if(a === b) continue;
		return a - b;
	}

	return 0;
};

},{}],139:[function(require,module,exports){
var declarations = require('./declarations');
var values = require('./values');

var Keyword = values.Keyword;
var PROPERTIES = Object.keys(declarations);

module.exports = function(style, parentStyle) {
	var parentOrInitial = function(property) {
		return parentStyle ? parentStyle[property] : declarations[property].INITIAL;
	};

	var initial = function(property) {
		return declarations[property].INITIAL;
	};

	var inherit = function(property) {
		var Declaration = declarations[property];
		return parentStyle ? parentStyle[property] : Declaration.INITIAL;
	};

	var currentColor = function(property) {
		return property === 'color' ?
			parentOrInitial('color') :
			compute('color');
	};

	var em = function(property) {
		var length = style[property].length;
		var basis = property === 'font-size' ?
			parentOrInitial('font-size') :
			compute('font-size');

		return values.Length.px(basis.length * length);
	};

	var fontPercentage = function(property) {
		var percent = style[property].percentage;
		var basis = property === 'font-size' ?
			parentOrInitial('font-size') :
			compute('font-size');

		return values.Length.px(basis.length * percent / 100);
	};

	var compute = function(property) {
		var value = style[property];
		var Declaration = declarations[property];

		if(!value) {
			if(Declaration.INHERITED) return inherit(property);
			else return Declaration.INITIAL;
		} else {
			if(Keyword.Inherit.is(value)) return inherit(property);
			if(Keyword.Initial.is(value)) return initial(property);
			if(Keyword.CurrentColor.is(value)) return currentColor(property);
			if(values.Length.is(value) && value.unit === 'em') return em(property);
			if(property === 'line-height' && values.Percentage.is(value)) return fontPercentage(property);
			if(property === 'font-size' && values.Percentage.is(value)) return fontPercentage(property);
		}

		return value;
	};

	PROPERTIES.forEach(function(property) {
		style[property] = compute(property);
	});

	return style;
};

},{"./declarations":141,"./values":144}],140:[function(require,module,exports){
module.exports={
	"display": {
		"initial": "inline",
		"values": ["inline", "block", "none", "line-break"],
		"inherited": false
	},
	"text-align": {
		"initial": "left",
		"values": ["left", "center", "right"],
		"inherited": true
	},
	"color": {
		"initial": "#000000",
		"values": ["<color>"],
		"inherited": true
	},
	"font-family": {
		"initial": "Times New Roman",
		"values": [["sans-serif", "serif", "monospace", "cursive", "fantasy", "<family-name>"]],
		"inherited": true
	},
	"font-weight": {
		"initial": "normal",
		"values": ["normal", "bold"],
		"inherited": true
	},
	"font-style": {
		"initial": "normal",
		"values": ["normal", "italic", "oblique"],
		"inherited": true
	},
	"font-size": {
		"initial": "16px",
		"values": ["<percentage>", "<length>"],
		"inherited": true
	},
	"line-height": {
		"initial": "1.2",
		"values": ["<number>", "<percentage>", "<length>"],
		"inherited": true
	},
	"vertical-align": {
		"initial": "baseline",
		"values": ["baseline", "<percentage>", "<length>"],
		"inherited": false
	},
	"white-space": {
		"initial": "normal",
		"values": ["normal", "nowrap", "pre", "pre-wrap", "pre-line"],
		"inherited": true
	},
	"background-color": {
		"initial": "rgba(0, 0, 0, 0)",
		"values": ["<color>"],
		"inherited": false
	},
	"width": {
		"initial": "auto",
		"values": ["<percentage>", "<length>", "auto"],
		"inherited": false
	},
	"height": "width",
	"margin-top": {
		"initial": "0px",
		"values": ["<percentage>", "<length>", "auto"],
		"inherited": false
	},
	"margin-right": "margin-top",
	"margin-bottom": "margin-top",
	"margin-left": "margin-top",
	"padding-top": {
		"initial": "0px",
		"values": ["<percentage>", "<length>"],
		"inherited": false
	},
	"padding-right": "padding-top",
	"padding-bottom": "padding-top",
	"padding-left": "padding-top",
	"border-top-style": {
		"initial": "none",
		"values": ["none", "solid", "dashed"],
		"inherited": false
	},
	"border-right-style": "border-top-style",
	"border-bottom-style": "border-top-style",
	"border-left-style": "border-top-style",
	"border-top-width": {
		"initial": "1px",
		"values": ["<length>"],
		"inherited": false
	},
	"border-right-width": "border-top-width",
	"border-bottom-width": "border-top-width",
	"border-left-width": "border-top-width",
	"border-top-color": {
		"initial": "currentColor",
		"values": ["<color>", "currentColor"],
		"inherited": false
	},
	"border-right-color": "border-top-color",
	"border-bottom-color": "border-top-color",
	"border-left-color": "border-top-color"
}

},{}],141:[function(require,module,exports){
var util = require('util');
var capitalize = require('capitalize');
var camelize = require('camelize');

var values = require('./values');
var declarations = require('./declarations.json');

var resolve = function(arr) {
	return ['inherit', 'initial']
		.concat(arr)
		.map(function(val) {
			if(Array.isArray(val)) {
				var resolved = resolve(val);
				return values.CommaSeparated.define(resolved);
			}

			if(val === values.Length.TYPE) return values.Length;
			if(val === values.Percentage.TYPE) return values.Percentage;
			if(val === values.Number.TYPE) return values.Number;
			if(val === values.Color.TYPE) return values.Color;
			if(val === values.FamilyName.TYPE) return values.FamilyName;
			else {
				val = capitalize(camelize(val), true);
				return values.Keyword[val];
			}
		});
};

var parse = function(arr, value) {
	for(var i = 0; i < arr.length; i++) {
		var v = arr[i].parse(value);
		if(v) return v;
	}
};

var define = function(property, definition) {
	var Klass = function(value, important, order, rule) {
		if(!(this instanceof Klass)) return new Klass(value);

		this.value = value;
		this.important = important;
		this.order = order;
		this.rule = rule;
	};

	Klass.parse = function(p, v, order, rule) {
		if(property !== p.toLowerCase()) return;

		var important = /\s+!important$/.test(v);

		v = v.replace(/\s+!important$/, '');
		v = parse(Klass.VALUES, v);

		if(v) return new Klass(v, important, order, rule);
	};

	Klass.PROPERTY = property;
	Klass.VALUES = resolve(definition.values);
	Klass.INITIAL = parse(Klass.VALUES, definition.initial);
	Klass.INHERITED = definition.inherited;

	Klass.prototype.property = property;

	Klass.prototype.compareTo = function(other) {
		if(!this.important && other.important) return -1;
		if(this.important && !other.important) return 1;

		var specificity = this.rule.compareTo(other.rule);
		if(specificity) return specificity;

		return this.order - other.order;
	};

	Klass.prototype.toString = function() {
		return util.format('%s: %s;', property, this.value);
	};

	return Klass;
};

Object.keys(declarations).forEach(function(property) {
	var definition = declarations[property];
	definition = (typeof definition === 'string') ? declarations[definition] : definition;

	exports[property] = define(property, definition);
});

},{"./declarations.json":140,"./values":144,"camelize":9,"capitalize":10,"util":131}],142:[function(require,module,exports){
var expand = require('css-shorthand-expand');
var properties = require('css-shorthand-properties');
var flatten = require('flatten');
var extend = require('xtend');
var tuple = require('tuple');

module.exports = function(name, value) {
	var expanded = expand(name, value);
	if(!expanded) return tuple(name, value);

	var recursive = /^border/.test(name);
	var all = properties.expand(name, recursive);
	all = flatten(all);
	all = all.reduce(function(acc, property) {
		acc[property] = 'initial';
		return acc;
	}, {});

	return extend(all, expanded);
};

},{"css-shorthand-expand":26,"css-shorthand-properties":31,"flatten":67,"tuple":126,"xtend":134}],143:[function(require,module,exports){
var util = require('util');

var CSSselect = require('css-select');
var css = require('css');
var specificity = require('specificity');

var declarations = require('./declarations');
var compare = require('./compare-specificity');
var expand = require('./expand-shorthand');

var parse = function(property, value, order, rule) {
	var declaration = declarations[property];
	return declaration && declaration.parse(property, value, order, rule);
};

var compile = function(selector) {
	try {
		return CSSselect.compile(selector);
	} catch(err) {
		return function() {
			return false;
		};
	}
};

var Rule = function(selector, order, stylesheet) {
	this.selector = selector;
	this.order = order;
	this.stylesheet = stylesheet;

	this.declarations = [];
	this.matches = compile(selector);

	this.specificity = specificity
		.calculate(selector)[0]
		.specificity
		.split(',')
		.map(function(s) {
			return parseInt(s, 10);
		});
};

Rule.prototype.compareTo = function(other) {
	var priority = other.stylesheet && this.stylesheet.comparePriorityTo(other.stylesheet);
	if(priority) return priority;

	var specificity = compare(this.specificity, other.specificity);
	if(specificity) return specificity;

	var order = other.stylesheet && this.stylesheet.compareOrderTo(other.stylesheet);
	return order ? order : this.order - other.order;
};

Rule.prototype.toString = function() {
	return util.format('%s { %s }', this.selector, this.declarations.join(' '));
};

var Stylesheet = function(order, priority) {
	this.order = order || 0;
	this.priority = priority || 0;
	this.rules = [];
};

Stylesheet.empty = function(order, priority) {
	return new Stylesheet(order, priority);
};

Stylesheet.parse = function(str, order, priority) {
	var ast = css.parse(str, { silent: true });
	var rules = ast.stylesheet.rules;

	var stylesheet = new Stylesheet(order, priority);

	rules.forEach(function(r, i) {
		if(r.type !== 'rule' || !r.declarations) return;

		r.selectors.forEach(function(s) {
			var rule = new Rule(s, i, stylesheet);
			var order = 1;

			r.declarations.forEach(function(d) {
				var longhand = expand(d.property, d.value);

				Object.keys(longhand).forEach(function(key) {
					var declaration = parse(key, longhand[key], order, rule);
					if(!declaration) return;

					rule.declarations.push(declaration);
					order++;
				});
			});

			if(rule.declarations.length) stylesheet.rules.push(rule);
		});
	});

	return stylesheet;
};

Stylesheet.prototype.match = function(node) {
	return this.rules.filter(function(rule) {
		return rule.matches(node);
	});
};

Stylesheet.prototype.comparePriorityTo = function(other) {
	return this.priority - other.priority;
};

Stylesheet.prototype.compareOrderTo = function(other) {
	return this.order - other.order;
};

Stylesheet.prototype.toString = function() {
	return this.rules.join(' ');
};

module.exports = Stylesheet;

},{"./compare-specificity":138,"./declarations":141,"./expand-shorthand":142,"css":36,"css-select":14,"specificity":121,"util":131}],144:[function(require,module,exports){
var util = require('util');
var capitalize = require('capitalize');
var camelize = require('camelize');
var parseColor = require('parse-color');

var declarations = require('./declarations.json');

var VALUE_WITH_UNIT = /^([+-]?\d*[\.]?\d+)(\%|\w+)$/
var NUMBER = /^[+-]?\d*[\.]?\d+$/;

var define = function(fn) {
	var Klass = function() {
		var self = Object.create(Klass.prototype);
		fn.apply(self, arguments);

		return self;
	};

	return Klass;
};

var keywords = function(values, Klass) {
	values.forEach(function(v) {
		if(Array.isArray(v)) return keywords(v, Klass);

		var	isPredefined = v === Length.TYPE || v === Percentage.TYPE ||
			v === Number.TYPE || v === Color.TYPE;

		if(isPredefined) return;

		var n = capitalize(camelize(v), true);
		if(Klass[n]) return;

		Klass[n] = new Klass(v);
	});
};

var CommaSeparated = define(function(values) {
	this.values = values;
});

CommaSeparated.TYPE = '<comma-separated>';

CommaSeparated.parse = function(str, definitions) {
	var parseValue = function(value) {
		for(var i = 0; i < definitions.length; i++) {
			var v = definitions[i].parse(value);
			if(v) return v;
		}
	};

	var values = str
		.split(',')
		.map(function(v) {
			v = v.trim();
			return parseValue(v);
		})
		.filter(Boolean);

	return new CommaSeparated(values);
};

CommaSeparated.define = function(definitions) {
	var Klass = function(values) {
		return new CommaSeparated(values);
	};

	Klass.TYPE = CommaSeparated.TYPE;
	Klass.is = CommaSeparated.is;

	Klass.parse = function(str) {
		return CommaSeparated.parse(str, definitions);
	};

	return Klass;
};

CommaSeparated.is = function(value) {
	return value.type === CommaSeparated.TYPE;
};

CommaSeparated.prototype.type = CommaSeparated.TYPE;
CommaSeparated.prototype.toString = function() {
	return this.values.join(', ');
};

var Length = define(function(length, unit) {
	this.length = length;
	this.unit = unit;
});

Length.TYPE = '<length>';
Length.UNITS = ['px', 'em'];

Length.parse = function(str) {
	var match = str.match(VALUE_WITH_UNIT);
	if(!match) {
		if(str !== '0') return;
		return new Length(0, 'px');
	}

	var number = match[1];
	var unit = match[2];

	if(!NUMBER.test(number) || Length.UNITS.indexOf(unit) === -1) return;

	return new Length(parseFloat(number), unit);
};

Length.is = function(value) {
	return value.type === Length.TYPE;
};

Length.px = function(length) {
	return new Length(length, 'px');
};

Length.em = function(length) {
	return new Length(length, 'em');
};

Length.prototype.type = Length.TYPE;
Length.prototype.toString = function() {
	return this.length + this.unit;
};

var Percentage = define(function(percentage) {
	this.percentage = percentage;
});

Percentage.TYPE = '<percentage>';

Percentage.parse = function(str) {
	var match = str.match(VALUE_WITH_UNIT);
	if(!match || match[2] !== '%') return;

	return new Percentage(parseFloat(match[1]));
};

Percentage.is = function(value) {
	return value.type === Percentage.TYPE;
};

Percentage.prototype.type = Percentage.TYPE;
Percentage.prototype.toString = function() {
	return this.percentage + '%';
};

var Number = define(function(number) {
	this.number = number;
});

Number.TYPE = '<number>';

Number.parse = function(str) {
	if(!NUMBER.test(str)) return;
	return new Number(parseFloat(str));
};

Number.is = function(value) {
	return value.type === Number.TYPE;
};

Number.prototype.type = Number.TYPE;
Number.prototype.toString = function() {
	return this.number.toString();
};

var Color = define(function(red, green, blue, alpha) {
	this.red = red;
	this.green = green;
	this.blue = blue;
	this.alpha = (typeof alpha !== 'number') ? 1 : alpha;
});

Color.TYPE = '<color>';

Color.parse = function(str) {
	var rgba = parseColor(str).rgba;
	if(rgba) return new Color(rgba[0], rgba[1], rgba[2], rgba[3]);
	if(str === 'transparent') return Color(0, 0, 0, 0);
};

Color.is = function(value) {
	return value.type === Color.TYPE;
};

Color.prototype.type = Color.TYPE;
Color.prototype.toString = function() {
	return util.format('rgba(%s, %s, %s, %s)', this.red, this.green, this.blue, this.alpha);
};

var FamilyName = define(function(name) {
	this.name = name;
});

FamilyName.TYPE = '<family-name>';

FamilyName.parse = function(str) {
	var first = str.charAt(0);
	var last = str.charAt(str.length - 1);

	var isFirstQuote = /'|"/.test(first);
	var isLastQuote = /'|"/.test(last);

	if((isFirstQuote || isLastQuote) && first !== last) return;
	if(isFirstQuote && isLastQuote) str = str.slice(1, -1);

	return new FamilyName(str);
};

FamilyName.is = function(value) {
	return value.type === FamilyName.TYPE;
};

FamilyName.prototype.type = FamilyName.TYPE;
FamilyName.prototype.toString = function() {
	return util.format('"%s"', this.name);
};

var Keyword = define(function(keyword) {
	this.keyword = keyword;
	this.normalized = keyword.toLowerCase();
	this.type = keyword;
});

Keyword.prototype.parse = function(str) {
	if(this.normalized === str.toLowerCase()) return this;
};

Keyword.prototype.is = function(value) {
	return !!(value.keyword && value.keyword === this.keyword);
};

Keyword.prototype.toString = function() {
	return this.keyword;
};

Object.keys(declarations).forEach(function(property) {
	var definition = declarations[property];
	if(typeof definition === 'string') return;

	keywords(definition.values, Keyword);
});

Keyword.Initial = new Keyword('initial');
Keyword.Inherit = new Keyword('inherit');

exports.CommaSeparated = CommaSeparated;
exports.Length = Length;
exports.Percentage = Percentage;
exports.Number = Number;
exports.Color = Color;
exports.FamilyName = FamilyName;
exports.Keyword = Keyword;

},{"./declarations.json":140,"camelize":9,"capitalize":10,"parse-color":98,"util":131}],145:[function(require,module,exports){
var Viewport = require('./layout/viewport');
var LineBox = require('./layout/line-box');
var TextBox = require('./layout/text-box');
var ImageBox = require('./layout/image-box');

var background = require('./draw/background');
var border = require('./draw/border');
var text = require('./draw/text');
var image = require('./draw/image');

var drawChildren = function(box, context) {
	if(!box.children) return;

	box.children.forEach(function(child) {
		draw(child, context);
	});
};

var draw = function(box, context) {
	if(box instanceof Viewport || box instanceof LineBox) return drawChildren(box, context);
	if(box instanceof TextBox) return text(box, context);

	background(box, context);
	border(box, context);

	if(box instanceof ImageBox) image(box, context);

	drawChildren(box, context);
};

module.exports = draw;

},{"./draw/background":146,"./draw/border":147,"./draw/image":148,"./draw/text":149,"./layout/image-box":156,"./layout/line-box":158,"./layout/text-box":161,"./layout/viewport":162}],146:[function(require,module,exports){
module.exports = function(box, context) {
	var color = box.style['background-color'];

	if((!box.innerWidth() && !box.innerHeight()) || !color.alpha) return;

	var x = box.position.x - box.padding.left;
	var y = box.position.y - box.padding.top;
	var width = box.padding.left + box.dimensions.width + box.padding.right;
	var height = box.padding.top + box.dimensions.height + box.padding.bottom;

	context.fillStyle = color.toString();
	context.fillRect(x, y, width, height);
};

},{}],147:[function(require,module,exports){
var drawBorderTop = function(box, context) {
	if(!box.border.top) return;

	var x = box.position.x - box.padding.left - box.border.left;
	var y = box.position.y - box.padding.top - box.border.top;
	var width = box.border.left + box.padding.left + box.dimensions.width + box.padding.right + box.border.right;
	var height = box.border.top;

	context.fillStyle = box.style['border-top-color'].toString();
	context.fillRect(x, y, width, height);
};

var drawBorderRight = function(box, context) {
	if(!box.border.right) return;

	var x = box.position.x + box.dimensions.width + box.padding.right;
	var y = box.position.y - box.padding.top - box.border.top;
	var width = box.border.right;
	var height = box.border.top + box.padding.top + box.dimensions.height + box.padding.bottom + box.border.bottom;

	context.fillStyle = box.style['border-right-color'].toString();
	context.fillRect(x, y, width, height);
};

var drawBorderBottom = function(box, context) {
	if(!box.border.bottom) return;

	var x = box.position.x - box.padding.left - box.border.left;
	var y = box.position.y + box.dimensions.height + box.padding.bottom;
	var width = box.border.left + box.padding.left + box.dimensions.width + box.padding.right + box.border.right;
	var height = box.border.bottom;

	context.fillStyle = box.style['border-bottom-color'].toString();
	context.fillRect(x, y, width, height);
};

var drawBorderLeft = function(box, context) {
	if(!box.border.left) return;

	var x = box.position.x - box.padding.left - box.border.left;
	var y = box.position.y - box.padding.top - box.border.top;
	var width = box.border.left;
	var height = box.border.top + box.padding.top + box.dimensions.height + box.padding.bottom + box.border.bottom;

	context.fillStyle = box.style['border-left-color'].toString();
	context.fillRect(x, y, width, height);
};

module.exports = function(box, context) {
	drawBorderTop(box, context);
	drawBorderRight(box, context);
	drawBorderBottom(box, context);
	drawBorderLeft(box, context);
};

},{}],148:[function(require,module,exports){
module.exports = function(box, context) {
	if(!box.image.complete) return;

	context.drawImage(box.image.data,
		box.position.x,
		box.position.y,
		box.dimensions.width,
		box.dimensions.height);
};

},{}],149:[function(require,module,exports){
var util = require('util');

module.exports = function(box, context) {
	var style = box.style;

	context.font = util.format('%s %s %s %s',
		style['font-style'],
		style['font-weight'],
		style['font-size'],
		style['font-family']);
	context.textBaseline = 'bottom';
	context.fillStyle = style['color'].toString();
	context.fillText(box.display, box.position.x, box.position.y + box.dimensions.height);
};

},{"util":131}],150:[function(require,module,exports){
var htmlparser = require('htmlparser2');
var ElementType = require('domelementtype');
var DomHandler = require('domhandler').DomHandler;

module.exports = function(html, callback) {
	var stylesheets = [];
	var scripts = [];
	var images = [];
	var anchors = [];
	var title = null;

	var ondone = function(err, html) {
		if(err) return callback(err);
		callback(null, {
			html: html,
			stylesheets: stylesheets,
			scripts: scripts,
			images: images,
			anchors: anchors,
			title: title
		});
	};

	var handler = new DomHandler(ondone, {
		withDomLvl1: true,
		normalizeWhitespace: false
	}, function(element) {
		if(element.type === ElementType.Script) scripts.push(element);
		if(element.type === ElementType.Style) stylesheets.push(element);
		if(element.type === ElementType.Tag && element.name === 'link' && element.attribs.rel === 'stylesheet') stylesheets.push(element);
		if(element.type === ElementType.Tag && element.name === 'img') images.push(element);
		if(element.type === ElementType.Tag && element.name === 'a') anchors.push(element);
		if(element.type === ElementType.Tag && element.name === 'title') title = element;
	});

	var parser = new htmlparser.Parser(handler);

	parser.write(html);
	parser.done();
};

},{"domelementtype":46,"domhandler":47,"htmlparser2":78}],151:[function(require,module,exports){
var url = require('url');
var afterAll = require('after-all');
var he = require('he');

var empty = function(src) {
	return {
		width: 0,
		height: 0,
		src: src,
		complete: false,
		data: null
	};
};

module.exports = function(base, nodes, callback) {
	if(!nodes.length) return callback(null, []);

	var images = new Array(nodes.length);
	var next = afterAll(function(err) {
		callback(err, images);
	});

	nodes.forEach(function(node, i) {
		var src = node.attribs.src;
		var cb = next(function(err, image) {
			image = image || empty(src);

			images[i] = node.image = {
				width: image.width,
				height: image.height,
				src: image.src,
				complete: image.complete,
				data: image
			};
		});

		if(!src) return cb();

		src = he.decode(src);
		src = url.resolve(base, src);

		var image = new Image();
		image.onload = function() {
			cb(null, image);
		};
		image.onerror = function() {
			cb();
		};

		image.src = src;
	});
};

},{"after-all":1,"he":69,"url":127}],152:[function(require,module,exports){
var events = require('events');
var afterAll = require('after-all');
var extend = require('xtend/mutable');

var html = require('./html');
var stylesheets = require('./stylesheets');
var css = require('./css');
var images = require('./images');
var layout = require('./layout');
var draw = require('./draw');
var Stylesheet = require('./css/stylesheet');

var noop = function() {};

var clone = function(obj) {
	return JSON.parse(JSON.stringify(obj));
};

var defaultStylesheets = function(stylesheets) {
	return (stylesheets || []).map(function(sheet, i) {
		return Stylesheet.parse(sheet, i - stylesheets.length);
	});
};

module.exports = function(options, callback) {
	callback = callback || noop;

	var page = new events.EventEmitter();
	var emit = page.emit.bind(page);
	var ondone = function(err) {
		if(err) {
			emit('fail', err);
			return callback(err);
		}

		emit('ready', page);
		callback(null, page);
	};

	extend(page, options, {
		stylesheets: null,
		viewport: clone(options.viewport)
	});

	var position = options.viewport.position;
	options.viewport.position = extend({ x: 0, y: 0 }, position);

	html(options.content, function(err, document) {
		if(err) return ondone(err);

		page.document = document;
		emit('html', document);

		var next = afterAll(function(err) {
			if(err) return ondone(err);

			var tree = layout(document.html, options.viewport);
			page.layout = tree;
			emit('layout', tree);

			draw(tree, options.context);
			emit('draw');

			ondone();
		});

		images(options.url, document.images, next(function(err, images) {
			page.images = images;
			emit('images', images);
		}));

		stylesheets(options.url, document.stylesheets, next(function(err, stylesheets) {
			stylesheets = defaultStylesheets(options.stylesheets).concat(stylesheets);
			css(stylesheets, document.html);
			page.stylesheets = stylesheets;
			emit('stylesheets', stylesheets);
		}));
	});

	return page;
};

},{"./css":136,"./css/stylesheet":143,"./draw":145,"./html":150,"./images":151,"./layout":153,"./stylesheets":165,"after-all":1,"events":66,"xtend/mutable":135}],153:[function(require,module,exports){
var ElementType = require('domelementtype');

var values = require('./css/values');
var Viewport = require('./layout/viewport');
var BlockBox = require('./layout/block-box');
var LineBox = require('./layout/line-box');
var LineBreakBox = require('./layout/line-break-box');
var InlineBox = require('./layout/inline-box');
var TextBox = require('./layout/text-box');
var ImageBox = require('./layout/image-box');

var None = values.Keyword.None;
var Block = values.Keyword.Block;
var Inline = values.Keyword.Inline;
var LineBreak = values.Keyword.LineBreak;

var isInlineLevelBox = function(box) {
	return box instanceof InlineBox ||
		box instanceof TextBox ||
		box instanceof LineBreakBox ||
		box instanceof ImageBox.Inline;
};

var isInlineContainerBox = function(box) {
	return box instanceof InlineBox ||
		box instanceof LineBox;
};

var isBlockLevelBox = function(box) {
	return box instanceof Viewport ||
		box instanceof LineBox ||
		box instanceof BlockBox ||
		box instanceof ImageBox.Block;
};

var isBlockContainerBox = function(box) {
	return box instanceof Viewport ||
		box instanceof BlockBox;
};

var branch = function(ancestor, descedant) {
	var first, current;

	while(descedant !== ancestor) {
		var d = descedant.clone();
		descedant.addLink(d);

		if(current) d.attach(current);
		if(!first) first = d;

		current = d;

		if(!descedant.parent) throw new Error('No ancestor match');
		descedant = descedant.parent;
	}

	if(current) ancestor.attach(current);
	return first;
};

var build = function(parent, nodes) {
	nodes.forEach(function(node) {
		var box;

		if(ElementType.isTag(node)) {
			var style = node.style;
			var display = style.display;

			if(None.is(display)) {
				return;
			} else if(node.name === 'img') {
				var image = node.image;

				if(Block.is(display)) box = new ImageBox.Block(parent, style, image);
				else box = new ImageBox.Inline(parent, style, image);
			} else if(Inline.is(display)) {
				box = new InlineBox(parent, style);
			} else if(Block.is(display)) {
				box = new BlockBox(parent, style);
			} else if(LineBreak.is(display)) {
				box = new LineBreakBox(parent, style);
			}

			build(box, node.childNodes);
		} else if(node.type === ElementType.Text) {
			box = new TextBox(parent, node.data);
		}

		if(box) parent.children.push(box);
	});
};

var blocks = function(parent, boxes, ancestor) {
	ancestor = ancestor || parent;

	var isInline = isInlineContainerBox(parent);
	var resume;

	boxes.forEach(function(child) {
		var isBlock = isBlockLevelBox(child);
		var box;

		if(isInline && isBlock) {
			box = child.clone(ancestor);
			parent = branch(ancestor, parent);
			resume = parent.parent;
		} else {
			box = child.cloneWithLinks(parent);
		}

		if(child.children) {
			var a = isBlockContainerBox(box) ? box : ancestor;
			parent = blocks(box, child.children, a) || parent;
		}
	});

	return resume;
};

var lines = function(parent, boxes) {
	var isBlock = isBlockContainerBox(parent);
	var line;

	boxes.forEach(function(child) {
		var isInline = isInlineLevelBox(child);
		var box;

		if(isBlock && isInline) {
			if(!line) {
				line = new LineBox(parent);
				parent.children.push(line);
			}

			box = child.cloneWithLinks(line);
		} else {
			line = null;
			box = child.cloneWithLinks(parent);
		}

		if(child.children) lines(box, child.children);
	});
};

module.exports = function(html, viewport) {
	viewport = new Viewport(viewport.position, viewport.dimensions);

	build(viewport, html);

	viewport = [
		blocks,
		lines
	].reduce(function(acc, fn) {
		var a = acc.clone();
		fn(a, acc.children);
		return a;
	}, viewport);

	viewport.layout();

	return viewport;
};

},{"./css/values":144,"./layout/block-box":154,"./layout/image-box":156,"./layout/inline-box":157,"./layout/line-box":158,"./layout/line-break-box":159,"./layout/text-box":161,"./layout/viewport":162,"domelementtype":46}],154:[function(require,module,exports){
var util = require('util');

var ParentBox = require('./parent-box');
var values = require('../css/values');

var Auto = values.Keyword.Auto;
var Percentage = values.Percentage;
var Length = values.Length;

var auto = function(value) {
	return Auto.is(value);
};

var BlockBox = function(parent, style) {
	ParentBox.call(this, parent, style);
};

util.inherits(BlockBox, ParentBox);

BlockBox.prototype.addLine = function(child, branch) {
	var children = this.children;
	var i = children.indexOf(child);

	this.attach(branch, i + 1);
};

BlockBox.prototype.layout = function(offset) {
	this._layoutWidth();
	this._layoutPosition(offset);
	this._layoutChildren();
	this._layoutHeight();
};

BlockBox.prototype._layoutWidth = function() {
	var self = this;
	var parent = this.parent;
	var style = this.style;

	var width = style.width;

	var marginLeft = style['margin-left'];
	var marginRight = style['margin-right'];

	var borderLeft = this.styledBorderWidth('left');
	var borderRight = this.styledBorderWidth('right');

	var paddingLeft = style['padding-left'];
	var paddingRight = style['padding-right'];

	var total = [
		width,
		marginLeft,
		marginRight,
		borderLeft,
		borderRight,
		paddingLeft,
		paddingRight
	].reduce(function(acc, v) {
		return acc + self.toPx(v);
	}, 0);

	var underflow = parent.dimensions.width - total;

	if(!auto(width) && underflow < 0) {
		if(auto(marginLeft)) marginLeft = Length.px(0);
		if(auto(marginRight)) marginRight = Length.px(0);
	}

	var isWidthAuto = auto(width);
	var isMarginLeftAuto = auto(marginLeft);
	var isMarginRightAuto = auto(marginRight);

	if(!isWidthAuto && !isMarginLeftAuto && !isMarginRightAuto) {
		var margin = this.toPx(marginRight);
		marginRight = Length.px(margin + underflow);
	} else if(!isWidthAuto && !isMarginLeftAuto && isMarginRightAuto) {
		marginRight = Length.px(underflow);
	} else if(!isWidthAuto && isMarginLeftAuto && !isMarginRightAuto) {
		marginLeft = Length.px(underflow);
	} else if(isWidthAuto && !isMarginLeftAuto && !isMarginRightAuto) {
		if(isMarginLeftAuto) marginLeft = Length.px(0);
		if(isMarginRightAuto) marginRight = Length.px(0);

		if(underflow >= 0) {
			width = Length.px(underflow);
		} else {
			var margin = this.toPx(marginRight);

			width = Length.px(0);
			marginRight = Length.px(margin + underflow);
		}
	} else if(!isWidthAuto && isMarginLeftAuto && isMarginRightAuto) {
		marginLeft = Length.px(underflow / 2);
		marginRight = Length.px(underflow / 2);
	}

	this.dimensions.width = this.toPx(width);

	this.margin.left = this.toPx(marginLeft);
	this.margin.right = this.toPx(marginRight);

	this.border.left = this.toPx(borderLeft);
	this.border.right = this.toPx(borderRight);

	this.padding.left = this.toPx(paddingLeft);
	this.padding.right = this.toPx(paddingRight);
};

BlockBox.prototype._layoutPosition = function(offset) {
	var parent = this.parent;
	var style = this.style;

	this.margin.top = this.toPx(style['margin-top']);
	this.margin.bottom = this.toPx(style['margin-bottom']);

	this.border.top = this.toPx(this.styledBorderWidth('top'));
	this.border.bottom = this.toPx(this.styledBorderWidth('bottom'));

	this.padding.top = this.toPx(style['padding-top']);
	this.padding.bottom = this.toPx(style['padding-bottom']);

	this.position.x = parent.position.x + this.leftWidth();
	this.position.y = parent.position.y + offset.height + this.topWidth();
};

BlockBox.prototype._layoutChildren = function() {
	var offset = { width: 0, height: 0 };

	this.forEach(function(child) {
		child.layout(offset);
		offset.height += child.height();
	});

	this.dimensions.height = offset.height;
};

BlockBox.prototype._layoutHeight = function() {
	var parent = this.parent;
	var height = this.style.height;
	var parentHeight = parent.style.height;

	if(Length.is(height)) {
		this.dimensions.height = height.length;
	} else if(Percentage.is(height) && Length.is(parentHeight)) {
		this.dimensions.height = parentHeight.length * height.percentage / 100;
	}
};

module.exports = BlockBox;

},{"../css/values":144,"./parent-box":160,"util":131}],155:[function(require,module,exports){
var values = require('../css/values');

var None = values.Keyword.None;
var Length = values.Length;

var Widths = function() {
	this.top = 0;
	this.right = 0;
	this.bottom = 0;
	this.left = 0;
};

Widths.prototype.some = function() {
	return [
		this.top,
		this.right,
		this.bottom,
		this.left
	].some(function(v) {
		return v !== 0;
	});
};

Widths.prototype.reset = function() {
	this.top =
	this.right =
	this.bottom =
	this.left = 0;
};

var Box = function(style) {
	this.style = style;

	this.position = { x: 0, y: 0 };
	this.dimensions = { width: 0, height: 0 };

	this.margin = new Widths();
	this.border = new Widths();
	this.padding = new Widths();
};

Box.prototype.topWidth = function() {
	return this.margin.top + this.border.top + this.padding.top;
};

Box.prototype.rightWidth = function() {
	return this.margin.right + this.border.right + this.padding.right;
};

Box.prototype.bottomWidth = function() {
	return this.margin.bottom + this.border.bottom + this.padding.bottom;
};

Box.prototype.leftWidth = function() {
	return this.margin.left + this.border.left + this.padding.left;
};

Box.prototype.innerWidth = function() {
	return this.padding.left + this.dimensions.width + this.padding.right;
};

Box.prototype.innerHeight = function() {
	return this.padding.top + this.dimensions.height + this.padding.bottom;
};

Box.prototype.outerWidth = function() {
	return this.border.left + this.innerWidth() + this.border.right;
};

Box.prototype.outerHeight = function() {
	return this.border.top + this.innerHeight() + this.border.bottom;
};

Box.prototype.width = function() {
	return this.margin.left + this.outerWidth() + this.margin.right;
};

Box.prototype.height = function() {
	return this.margin.top + this.outerHeight() + this.margin.bottom;
};

Box.prototype.translate = function(dx, dy) {
	this.position.x += dx;
	this.position.y += dy;
};

Box.prototype.styledBorderWidth = function(direction) {
	var borderWidth = this.style['border-' + direction + '-width'];
	var borderStyle = this.style['border-' + direction + '-style'];

	return None.is(borderStyle) ? Length.px(0) : borderWidth;
};

module.exports = Box;

},{"../css/values":144}],156:[function(require,module,exports){
var util = require('util');

var Box = require('./box');
var ParentBox = require('./parent-box');
var values = require('../css/values');

var Auto = values.Keyword.Auto;
var Length = values.Length;
var Percentage = values.Percentage;

var ImageBox = function(parent, style, image) {
	Box.call(this, style);

	this.parent = parent;
	this.image = image;
};

util.inherits(ImageBox, Box);

ImageBox.prototype.layout = function() {
	var style = this.style;
	var image = this.image;
	var width = style.width;
	var height = style.height;
	var ratio = image.width / image.height;

	var isWidthAuto = Auto.is(width);
	var isHeightAuto = Auto.is(height);

	if(isWidthAuto && isHeightAuto) {
		width = Length.px(image.width);
		height = Length.px(image.height);
	} else if(isWidthAuto) {
		width = Length.px(this.toPx(height) * ratio);
	} else if(isHeightAuto) {
		height = Length.px(this.toPx(width) / ratio);
	}

	this.dimensions.width = this.toPx(width);
	this.dimensions.height = this.toPx(height);

	this.margin.top = this.toPx(style['margin-top']);
	this.margin.bottom = this.toPx(style['margin-bottom']);

	this.border.left = this.toPx(this.styledBorderWidth('left'));
	this.border.right = this.toPx(this.styledBorderWidth('right'));
	this.border.top = this.toPx(this.styledBorderWidth('top'));
	this.border.bottom = this.toPx(this.styledBorderWidth('bottom'));

	this.padding.left = this.toPx(style['padding-left']);
	this.padding.right = this.toPx(style['padding-right']);
	this.padding.top = this.toPx(style['padding-top']);
	this.padding.bottom = this.toPx(style['padding-bottom']);
};

ImageBox.prototype.collapseWhitespace = function() {
	return false;
};

ImageBox.prototype.hasContent = function() {
	return true;
};

ImageBox.prototype.clone = function(parent) {
	var clone = new this.constructor(parent, this.style, this.image);
	if(parent) parent.children.push(clone);

	return clone;
};

ImageBox.prototype.cloneWithLinks = ParentBox.prototype.cloneWithLinks;
ImageBox.prototype.addLink = ParentBox.prototype.addLink;
ImageBox.prototype.toPx = ParentBox.prototype.toPx;

var InlineImageBox = function(parent, style, image) {
	ImageBox.call(this, parent, style, image);
	this.baseline = 0;
};

util.inherits(InlineImageBox, ImageBox);

InlineImageBox.prototype.layout = function(offset, line) {
	ImageBox.prototype.layout.call(this);

	var style = this.style;

	this.margin.left = this.toPx(style['margin-left']);
	this.margin.right = this.toPx(style['margin-right']);

	var parent = this.parent;
	var x = parent.position.x + offset.width + this.leftWidth();
	var available = line.position.x + line.dimensions.width - x;

	if(this.width() > available && !this._isFirst(line)) {
		this._reset();
		return parent.addLine(this);
	}

	this._layoutBaseline();

	this.position.x = x;
	this.position.y = this.baseline - this.dimensions.height - this.bottomWidth();
};

InlineImageBox.prototype.linePosition = function() {
	return {
		x: this.position.x - this.leftWidth(),
		y: this.position.y - this.topWidth()
	};
};

InlineImageBox.prototype.lineHeight = function() {
	return this.height();
};

InlineImageBox.prototype._layoutBaseline = function() {
	var parent = this.parent;
	var style = this.style;
	var alignment = this.style['vertical-align'];

	if(Length.is(alignment)) {
		this.baseline = parent.baseline - alignment.length;
	} else if(Percentage.is(alignment)) {
		var size = this.toPx(style['font-size']);
		var lineHeight = style['line-height'];

		var lh = values.Number.is(lineHeight) ?
			lineHeight.number * size : this.toPx(lineHeight);

		this.baseline = parent.baseline - (alignment.percentage * lh / 100);
	}  else {
		this.baseline = parent.baseline;
	}
};

InlineImageBox.prototype._reset = function() {
	this.padding.reset();
	this.border.reset();
	this.margin.reset();

	this.baseline = 0;
	this.dimensions.width = 0;
	this.dimensions.height = 0;
};

InlineImageBox.prototype._isFirst = function(line) {
	return line.contents().indexOf(this) === 0;
};

var BlockImageBox = function(parent, style, image) {
	ImageBox.call(this, parent, style, image);
};

util.inherits(BlockImageBox, ImageBox);

BlockImageBox.prototype.layout = function(offset) {
	ImageBox.prototype.layout.call(this);

	this._layoutWidth();
	this._layoutPosition(offset);
};

BlockImageBox.prototype._layoutWidth = function() {
	var self = this;
	var style = this.style;
	var parent = this.parent;

	var marginLeft = style['margin-left'];
	var marginRight = style['margin-right'];

	var total = [
		this.dimensions.width,
		this.padding.left,
		this.padding.right,
		this.border.left,
		this.border.right,
		marginLeft,
		marginRight
	].reduce(function(acc, v) {
		return acc + (typeof v === 'number' ? v : self.toPx(v));
	}, 0);

	var underflow = parent.dimensions.width - total;

	if(underflow < 0) {
		if(Auto.is(marginLeft)) marginLeft = Length.px(0);
		if(Auto.is(marginRight)) marginRight = Length.px(0);
	}

	var isMarginLeftAuto = Auto.is(marginLeft);
	var isMarginRightAuto = Auto.is(marginRight);

	if(!isMarginLeftAuto && !isMarginRightAuto) {
		var margin = this.toPx(marginRight);
		marginRight = Length.px(margin + underflow);
	} else if(!isMarginLeftAuto && isMarginRightAuto) {
		marginRight = Length.px(underflow);
	} else if(isMarginLeftAuto && !isMarginRightAuto) {
		marginLeft = Length.px(underflow);
	} else {
		marginLeft = Length.px(underflow / 2);
		marginRight = Length.px(underflow / 2);
	}

	this.margin.left = this.toPx(marginLeft);
	this.margin.right = this.toPx(marginRight);
};

BlockImageBox.prototype._layoutPosition = function(offset) {
	var parent = this.parent;

	this.position.x = parent.position.x + this.leftWidth();
	this.position.y = parent.position.y + offset.height + this.topWidth();
};

ImageBox.Inline = InlineImageBox;
ImageBox.Block = BlockImageBox;

module.exports = ImageBox;

},{"../css/values":144,"./box":155,"./parent-box":160,"util":131}],157:[function(require,module,exports){
var util = require('util');
var textHeight = require('text-height');

var ParentBox = require('./parent-box');
var values = require('../css/values');

var Length = values.Length;
var Percentage = values.Percentage;

var InlineBox = function(parent, style) {
	ParentBox.call(this, parent, style);
	this.baseline = 0;
};

util.inherits(InlineBox, ParentBox);

InlineBox.prototype.layout = function(offset, line) {
	this._layoutWidth();
	this._layoutBaseline();
	this._layoutPosition(offset);
	this._layoutHeight();
	this._layoutChildren(line);
	this._layoutWidth();
};

InlineBox.prototype.linePosition = function() {
	var lineHeight = this.lineHeight();
	var size = this.toPx(this.style['font-size']);
	var leading = (lineHeight - size) / 2;

	return {
		x: this.position.x,
		y: this.position.y - leading
	};
};

InlineBox.prototype.lineHeight = function() {
	var style = this.style;
	var size = this.toPx(style['font-size']);
	var lineHeight = style['line-height'];

	return values.Number.is(lineHeight) ?
		lineHeight.number * size : this.toPx(lineHeight);
};

InlineBox.prototype._layoutWidth = function() {
	var self = this;
	var style = this.style;

	var iif = function(direction, value) {
		return self[direction + 'Link'] ? 0 : self.toPx(value);
	};

	this.margin.left = iif('left', style['margin-left']);
	this.border.left = iif('left', this.styledBorderWidth('left'));
	this.padding.left = iif('left', style['padding-left']);

	this.margin.right = iif('right', style['margin-right']);
	this.border.right = iif('right', this.styledBorderWidth('right'));
	this.padding.right = iif('right', style['padding-right']);
};

InlineBox.prototype._layoutPosition = function(offset) {
	var parent = this.parent;
	var style = this.style;
	var size = this.toPx(style['font-size']);

	this.border.top = this.toPx(this.styledBorderWidth('top'));
	this.border.bottom = this.toPx(this.styledBorderWidth('bottom'));

	this.padding.top = this.toPx(style['padding-top']);
	this.padding.bottom = this.toPx(style['padding-bottom']);

	this.position.x = parent.position.x + offset.width + this.leftWidth();
	this.position.y = this.baseline - size + this._textHeight().descent;
};

InlineBox.prototype._layoutChildren = function(line) {
	var offset = { width: 0, height: 0 };

	this.forEach(function(child) {
		child.layout(offset, line);
		offset.width += child.width();
	});

	this.dimensions.width = offset.width;
};

InlineBox.prototype._layoutHeight = function() {
	this.dimensions.height = this.toPx(this.style['font-size']);
};

InlineBox.prototype._layoutBaseline = function() {
	var parent = this.parent;
	var alignment = this.style['vertical-align'];

	if(Length.is(alignment)) {
		this.baseline = parent.baseline - alignment.length;
	} else if(Percentage.is(alignment)) {
		this.baseline = parent.baseline - (alignment.percentage * this.lineHeight() / 100);
	}  else {
		this.baseline = parent.baseline;
	}
};

InlineBox.prototype._textHeight = function() {
	var style = this.style;
	return textHeight({
		size: style['font-size'].toString(),
		family: style['font-family'].toString(),
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});
};

module.exports = InlineBox;

},{"../css/values":144,"./parent-box":160,"text-height":122,"util":131}],158:[function(require,module,exports){
var util = require('util');
var textHeight = require('text-height');

var ParentBox = require('./parent-box');
var TextBox = require('./text-box');
var ImageBox = require('./image-box');
var LineBreakBox = require('./line-break-box');
var values = require('../css/values');

var LineBox = function(parent, style) {
	ParentBox.call(this, parent, style);
	this.baseline = 0;
};

util.inherits(LineBox, ParentBox);

LineBox.prototype.flatten = function() {
	var descedants = [];
	var flatten = function(parent) {
		descedants.push(parent);
		if(parent.children) parent.children.forEach(flatten);
	};

	this.children.forEach(flatten);
	return descedants;
};

LineBox.prototype.contents = function(breaks) {
	return this.flatten().filter(function(box) {
		return box instanceof TextBox ||
			box instanceof ImageBox ||
			(breaks && box instanceof LineBreakBox);
	});
};

LineBox.prototype.addLine = function(child, branch) {
	ParentBox.prototype.addLine.call(this, child, branch, true);
};

LineBox.prototype.layout = function(offset) {
	var parent = this.parent;

	this.dimensions.width = parent.dimensions.width;

	this.position.x = parent.position.x;
	this.position.y = parent.position.y + offset.height;

	this._layoutStrut();
	this._layoutChildren();
	this._layoutHeight();
};

LineBox.prototype.collapseWhitespace = function() {
	return ParentBox.prototype.collapseWhitespace.call(this, false);
};

LineBox.prototype._layoutStrut = function() {
	var style = this.style;
	var size = this.toPx(style['font-size']);
	var height = textHeight({
		size: style['font-size'].toString(),
		family: style['font-family'].toString(),
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});

	this.baseline = this.position.y + size - height.descent;
};

LineBox.prototype._layoutChildren = function() {
	var self = this;
	var offset = { width: 0, height: 0 };

	this.forEach(function(child) {
		child.layout(offset, self);
		offset.width += child.width();
	});
};

LineBox.prototype._layoutHeight = function() {
	if(!this.hasContent()) return;

	var minY = this._linePosition();
	var maxY = minY + this._lineHeight();

	var height = function(parent) {
		var position = parent.linePosition();

		minY = Math.min(minY, position.y);
		maxY = Math.max(maxY, position.y + parent.lineHeight());
		if(parent.children) parent.children.forEach(height);
	};

	this.children.forEach(height);
	this.dimensions.height = maxY - minY;
	this.translateChildren(0, this.position.y - minY);
};

LineBox.prototype._linePosition = function() {
	var lineHeight = this._lineHeight();
	var size = this.toPx(this.style['font-size']);
	var leading = (lineHeight - size) / 2;

	return this.position.y - leading;
};

LineBox.prototype._lineHeight = function() {
	var style = this.style;
	var size = this.toPx(style['font-size']);
	var lineHeight = style['line-height'];

	return values.Number.is(lineHeight) ?
		lineHeight.number * size : this.toPx(lineHeight);
};

module.exports = LineBox;

},{"../css/values":144,"./image-box":156,"./line-break-box":159,"./parent-box":160,"./text-box":161,"text-height":122,"util":131}],159:[function(require,module,exports){
var util = require('util');

var Box = require('./box');
var ParentBox = require('./parent-box');

var LineBreakBox = function(parent, style) {
	Box.call(this, style);
	this.parent = parent;

	this.leftLink = false;
	this.rightLink = false;
};

util.inherits(LineBreakBox, Box);

LineBreakBox.prototype.layout = function(offset, line) {
	var parent = this.parent;

	this.position.x = parent.position.x + offset.width;
	this.position.y = parent.position.y;

	parent.breakLine(this);
};

LineBreakBox.prototype.collapseWhitespace = function() {
	return false;
};

LineBreakBox.prototype.hasContent = function() {
	return true;
};

LineBreakBox.prototype.linePosition = function() {
	return this.position;
};

LineBreakBox.prototype.lineHeight = function() {
	return 0;
};

LineBreakBox.prototype.isPx = ParentBox.prototype.isPx;
LineBreakBox.prototype.clone = ParentBox.prototype.clone;
LineBreakBox.prototype.cloneWithLinks = ParentBox.prototype.cloneWithLinks;

module.exports = LineBreakBox;

},{"./box":155,"./parent-box":160,"util":131}],160:[function(require,module,exports){
var util = require('util');

var Box = require('./box');
var compute = require('../css/compute');
var values = require('../css/values');

var Auto = values.Keyword.Auto;
var Percentage = values.Percentage;

var ParentBox = function(parent, style) {
	Box.call(this, style);

	this.style = style || compute({}, parent.style);
	this.parent = parent;
	this.children = [];

	this.leftLink = false;
	this.rightLink = false;
};

util.inherits(ParentBox, Box);

ParentBox.prototype.layout = function() {};

ParentBox.prototype.addLink = function(box) {
	box.leftLink = true;
	box.rightLink = this.rightLink;

	this.rightLink = true;
};

ParentBox.prototype.addLine = function(child, branch, force) {
	this.stopEach();

	var parent = this.parent;
	var i = this.children.indexOf(child);
	if(i === 0 && !branch && !force) return parent.addLine(this);

	var children = this.children.slice();
	var box = this.clone();

	if(branch) box.attach(branch);
	else box.attach(child);

	for(var j = i + 1; j < children.length; j++) {
		box.attach(children[j]);
	}

	this.addLink(box);
	parent.addLine(this, box);
};

ParentBox.prototype.breakLine = function(child) {
	var children = this.children.slice();
	var box = this.clone();
	var i = children.indexOf(child);

	for(var j = i + 1; j < children.length; j++) {
		box.attach(children[j]);
	}

	this.addLink(box);
	this.parent.addLine(this, box);
};

ParentBox.prototype.hasContent = function() {
	var hasOutline = this.padding.some() ||
		this.border.some() ||
		this.margin.some();

	return hasOutline || this.children.some(function(child) {
		return child.hasContent();
	});
};

ParentBox.prototype.collapseWhitespace = function(strip) {
	this.children.forEach(function(child) {
		strip = child.collapseWhitespace(strip);
	});

	return strip;
};

ParentBox.prototype.attach = function(node, i) {
	if(node.parent) node.parent.detach(node);

	node.parent = this;

	if(i !== undefined) this.children.splice(i, 0, node);
	else this.children.push(node);
};

ParentBox.prototype.detach = function(node) {
	var children = this.children;
	var i = children.indexOf(node);

	if(i < 0) return;

	node.parent = null;
	children.splice(i, 1);
};

ParentBox.prototype.clone = function(parent) {
	var clone = new this.constructor(parent, this.style);
	if(parent) parent.children.push(clone);

	return clone;
};

ParentBox.prototype.cloneWithLinks = function(parent) {
	var clone = this.clone(parent);
	clone.leftLink = this.leftLink;
	clone.rightLink = this.rightLink;

	return clone;
};

ParentBox.prototype.forEach = function(fn) {
	var children = this.children;
	var stop = false;

	this._stop = function() {
		stop = true;
	};

	for(var i = 0; i < children.length && !stop; i++) {
		fn(children[i], i);
	}
};

ParentBox.prototype.stopEach = function() {
	if(this._stop) this._stop();
};

ParentBox.prototype.translate = function(dx, dy) {
	Box.prototype.translate.call(this, dx, dy);
	this.translateChildren(dx, dy);
};

ParentBox.prototype.translateChildren = function(dx, dy) {
	this.children.forEach(function(child) {
		child.translate(dx, dy);
	});
};

ParentBox.prototype.visibleWidth = function() {
	var min = function(box) {
		return box.position.x - box.leftWidth();
	};

	var max = function(box) {
		return box.position.x + box.dimensions.width + box.rightWidth();
	};

	var minX = min(this);
	var maxX = max(this);

	var height = function(parent) {
		minX = Math.min(minX, min(parent));
		maxX = Math.max(maxX, max(parent));

		if(parent.children) parent.children.forEach(height);
	};

	this.children.forEach(height);
	return maxX - minX;
};

ParentBox.prototype.visibleHeight = function() {
	var min = function(box) {
		return box.position.y - box.topWidth();
	};

	var max = function(box) {
		return box.position.y + box.dimensions.height + box.bottomWidth();
	};

	var minY = min(this);
	var maxY = max(this);

	var height = function(parent) {
		minY = Math.min(minY, min(parent));
		maxY = Math.max(maxY, max(parent));

		if(parent.children) parent.children.forEach(height);
	};

	this.children.forEach(height);
	return maxY - minY;
};

ParentBox.prototype.toPx = function(value) {
	if(Auto.is(value)) return 0;
	if(Percentage.is(value)) {
		var width = this.parent.dimensions.width;
		return width * value.percentage / 100;
	}

	return value.length;
};

module.exports = ParentBox;

},{"../css/compute":139,"../css/values":144,"./box":155,"util":131}],161:[function(require,module,exports){
var util = require('util');
var textWidth = require('text-width');
var he = require('he');

var values = require('../css/values');
var collapse = require('./whitespace/collapse');
var breaks = require('./whitespace/breaks');
var Box = require('./box');
var ParentBox = require('./parent-box');
var Viewport = require('./viewport');

var Normal = values.Keyword.Normal;
var Nowrap = values.Keyword.Nowrap;
var PreLine = values.Keyword.PreLine;
var PreWrap = values.Keyword.PreWrap;

var NEWLINE = '\n';
var TAB = '        ';

var isBreakable = function(box) {
	var format = box.style['white-space'];
	return Normal.is(format) || PreWrap.is(format) || PreLine.is(format);
};

var TextString = function(str, style) {
	this.original = str;
	this.style = style;

	this.normalized = he.decode(str).replace(/\t/g, TAB);
};

TextString.prototype.trimLeft = function() {
	this.normalized = this.normalized.replace(/^ /, '');
};

TextString.prototype.trimRight = function() {
	this.normalized = this.normalized.replace(/ $/, '');
};

TextString.prototype.append = function(str) {
	return new TextString(this.original + str, this.style);
};

TextString.prototype.width = function() {
	var style = this.style;

	return textWidth(this.normalized, {
		size: style['font-size'].toString(),
		family: style['font-family'].toString(),
		weight: style['font-weight'].keyword,
		style: style['font-style'].keyword
	});
};

var TextBox = function(styleOrParent, text) {
	var isParent = styleOrParent instanceof ParentBox || styleOrParent instanceof Viewport;
	var parent = isParent ? styleOrParent : null;
	var style = isParent ? styleOrParent.style : styleOrParent;

	text = text || '';

	Box.call(this, style);
	this.parent = parent;
	this.text = text;
	this.display = text;

	this.leftLink = false;
	this.rightLink = false;
	this.preservedNewline = false;
};

util.inherits(TextBox, Box);

TextBox.prototype.layout = function(offset, line) {
	var parent = this.parent;
	var style = this.style;
	var format = style['white-space'].keyword;
	var textContext = this._textContext(line);
	var lines = breaks.hard(this.text, format);

	var textString = function(t) {
		return new TextString(t || '', style);
	};

	var text = textString(lines[0]);
	var isCollapsible = this._isCollapsible();
	var isBreakable = this._isBreakable() || textContext.precededByBreakable;
	var isMultiline = lines.length > 1;
	var isTrimable = isCollapsible && textContext.precededByEmpty;

	if(isTrimable) text.trimLeft();
	if(isCollapsible && (textContext.followedByEmpty || isMultiline)) text.trimRight();

	var x = parent.position.x + offset.width;
	var available = line.position.x + line.dimensions.width - x;
	var rest;

	if(isBreakable && available < 0 && !textContext.first) {
		rest = this.text;
		text = textString();
	} else if(isBreakable && text.width() > available) {
		var i = 0;
		var words = breaks.soft(text.original, format);
		var fillCurrent, fillNext = textString(words[i]);

		if(isTrimable) fillNext.trimLeft();

		while(fillNext.width() <= available && i++ < words.length) {
			fillCurrent = fillNext;
			fillNext = fillNext.append(words[i]);
			if(isTrimable) fillNext.trimLeft();
		}

		fillCurrent = fillCurrent || textString();

		if(!fillCurrent.width() && textContext.first) {
			i = 0;

			do {
				fillCurrent = fillCurrent.append(words[i]);
				if(isTrimable) fillCurrent.trimLeft();
			} while(!fillCurrent.width() && i++ < words.length);
		}

		if(isCollapsible) fillCurrent.trimRight();

		var newline = fillCurrent.original === text.original ? 1 : 0;

		rest = this.text.slice(fillCurrent.original.length + newline);
		text = fillCurrent;
	} else {
		rest = this.text.slice(text.original.length + 1);
	}

	if(this.text.charAt(text.length) === NEWLINE) this.preservedNewline = true;

	if(rest || isMultiline) {
		var textBox = rest === this.text ? null : new TextBox(style, rest);
		parent.addLine(this, textBox);
		if(!textBox) return;
	}

	this.dimensions.height = this.toPx(style['font-size']);
	this.dimensions.width = text.width();

	this.position.x = x;
	this.position.y = parent.position.y;

	this.display = text.normalized;
};

TextBox.prototype.endsWithCollapsibleWhitespace = function() {
	var text = collapse(this.text, { format: this.style['white-space'].keyword });
	return / $/.test(text) && this._isCollapsible();
};

TextBox.prototype.collapseWhitespace = function(strip) {
	var wh = this.endsWithCollapsibleWhitespace();
	var text = collapse(this.text, {
		format: this.style['white-space'].keyword,
		strip: strip
	});

	this.text = text;
	return wh;
};

TextBox.prototype.hasContent = function() {
	return this._isCollapsible() ? !this._isWhitespace() : (this.preservedNewline || !!this.dimensions.width);
};

TextBox.prototype.linePosition = function() {
	return this.position;
};

TextBox.prototype.lineHeight = function() {
	return this.dimensions.height;
};

TextBox.prototype.clone = function(parent) {
	var clone = new TextBox(parent, this.text);
	parent.children.push(clone);

	return clone;
};

TextBox.prototype.cloneWithLinks = ParentBox.prototype.cloneWithLinks;
TextBox.prototype.addLink = ParentBox.prototype.addLink;
TextBox.prototype.toPx = ParentBox.prototype.toPx;

TextBox.prototype._isCollapsible = function() {
	var format = this.style['white-space'];
	return Normal.is(format) || Nowrap.is(format) || PreLine.is(format);
};

TextBox.prototype._isBreakable = function() {
	return isBreakable(this);
};

TextBox.prototype._isWhitespace = function() {
	return /^[\t\n\r ]*$/.test(this.text);
};

TextBox.prototype._textContext = function(line) {
	var contents = line.contents();
	var i = contents.indexOf(this);
	var precededByBreakable = false;
	var precededByEmpty = true;
	var followedByEmpty = true;

	for(var j = 0; j < contents.length; j++) {
		var empty = !contents[j].hasContent();
		if(j < i) precededByBreakable = precededByBreakable || isBreakable(contents[j]);
		if(j < i) precededByEmpty = precededByEmpty && empty;
		if(j > i) followedByEmpty = followedByEmpty && empty;
	}

	return {
		first: i === 0,
		last: i === (contents.length - 1),
		precededByBreakable: precededByBreakable,
		precededByEmpty: precededByEmpty,
		followedByEmpty: followedByEmpty
	};
};

module.exports = TextBox;

},{"../css/values":144,"./box":155,"./parent-box":160,"./viewport":162,"./whitespace/breaks":163,"./whitespace/collapse":164,"he":69,"text-width":123,"util":131}],162:[function(require,module,exports){
var util = require('util');

var values = require('../css/values');
var compute = require('../css/compute');
var Box = require('./box');
var ParentBox = require('./parent-box');
var BlockBox = require('./block-box');

var Length = values.Length;
var Auto = values.Keyword.Auto;

var Viewport = function(position, dimensions) {
	var height = (typeof dimensions.height === 'number') ?
		Length.px(dimensions.height) : Auto;

	Box.call(this, compute({
		width: Length.px(dimensions.width),
		height: height
	}));

	this.position = position;
	this.dimensions = dimensions;
	this.children = [];
};

util.inherits(Viewport, Box);

Viewport.prototype.clone = function() {
	return new Viewport(this.position, this.dimensions);
};

Viewport.prototype.layout = function() {
	var offset = { width: 0, height: 0 };

	this.collapseWhitespace(false);

	this.children.forEach(function(child) {
		child.layout(offset);
		offset.height += child.height();
	});

	var dimensions = this.dimensions;
	if(typeof dimensions.height !== 'number') dimensions.height = offset.height;
};

Viewport.prototype.attach = ParentBox.prototype.attach;
Viewport.prototype.detach = ParentBox.prototype.detach;
Viewport.prototype.collapseWhitespace = ParentBox.prototype.collapseWhitespace;
Viewport.prototype.addLink = ParentBox.prototype.addLink;
Viewport.prototype.visibleWidth = ParentBox.prototype.visibleWidth;
Viewport.prototype.visibleHeight = ParentBox.prototype.visibleHeight;
Viewport.prototype.addLine = BlockBox.prototype.addLine;

module.exports = Viewport;

},{"../css/compute":139,"../css/values":144,"./block-box":154,"./box":155,"./parent-box":160,"util":131}],163:[function(require,module,exports){
exports.hard = function(str, format) {
	var hard = format === 'pre' || format === 'pre-wrap' || format === 'pre-line';
	return hard ? str.split('\n') : [str];
};

exports.soft = function(str, format) {
	var soft = format === 'normal' || format === 'pre-wrap' || format === 'pre-line';
	return soft ? str.split(/( +|-+)/) : [str];
};

},{}],164:[function(require,module,exports){
module.exports = function(str, options) {
	options = options || {};

	var format = options.format || 'normal';
	var strip = options.strip;

	str = str.replace(/\r\n?/g, '\n');

	if(format === 'normal' || format === 'nowrap' || format === 'pre-line') {
		str = str.replace(/[\t ]*\n[\t ]*/g, '\n');
	}
	if(format === 'normal' || format === 'nowrap') {
		str = str.replace(/\n/g, ' ');
	}
	if(format === 'normal' || format === 'nowrap' || format === 'pre-line') {
		str = str.replace(/\t/g, ' ');
		str = str.replace(/ +/g, ' ');

		if(strip) str = str.replace(/^ /, '');
	}

	return str;
};

},{}],165:[function(require,module,exports){
var url = require('url');

var ElementType = require('domelementtype');
var afterAll = require('after-all');
var xhr = require('xhr');
var he = require('he');

var Stylesheet = require('./css/stylesheet');

var link = function(base, node, i, callback) {
	var href = node.attribs.href;
	if(!href) return callback(null, Stylesheet.empty(i));

	href = he.decode(href);
	href = url.resolve(base, href);

	xhr({
		method: 'GET',
		url: href
	}, function(err, response, body) {
		var errored = err || !/2\d\d/.test(response.statusCode);
		var stylesheet = errored ? Stylesheet.empty(i) : Stylesheet.parse(body, i);

		callback(null, stylesheet);
	});
};

var style = function(node, i) {
	var text = node.childNodes && node.childNodes[0];
	if(!text || text.type !== ElementType.Text) return Stylesheet.empty(i);

	return Stylesheet.parse(text.data, i);
};

module.exports = function(base, nodes, callback) {
	if(!nodes.length) return callback(null, []);

	var stylesheets = new Array(nodes.length);
	var next = afterAll(function(err) {
		callback(err, stylesheets);
	});

	nodes.forEach(function(node, i) {
		var cb = next(function(err, stylesheet) {
			node.stylesheet = stylesheet;
			stylesheets[i] = stylesheet;
		});

		if(node.name === 'link') link(base, node, i, cb);
		else cb(null, style(node, i));
	});
};

},{"./css/stylesheet":143,"after-all":1,"domelementtype":46,"he":69,"url":127,"xhr":133}],166:[function(require,module,exports){
var util = require('util');

var qs = require('querystring');
var url = require('url');

var serialize = require('./serialize');
var render = require('../');

var query = qs.parse(window.location.search.replace(/^\?/, ''));

var assets = {};
assets['simple-block.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t#block {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tbackground-color: #ffa500;\n\t\t\theight: 20px;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div id=\"block\"></div>\n</body>\n</html>\n";
assets['nested-block.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.block {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 10px;\n\t\t\tpadding-right: 10px;\n\t\t\tpadding-bottom: 10px;\n\t\t\tpadding-left: 10px;\n\t\t}\n\n\t\t.block-1 {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.block-2 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.block-3 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.block-4 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.block-5 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"block block-1\">\n\t\t<div class=\"block block-2\">\n\t\t\t<div class=\"block block-3\">\n\t\t\t\t<div class=\"block block-4\">\n\t\t\t\t\t<div class=\"block block-5\"></div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</body>\n</html>\n";
assets['stack-block.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.block {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 10px;\n\t\t\tpadding-right: 10px;\n\t\t\tpadding-bottom: 10px;\n\t\t\tpadding-left: 10px;\n\n\t\t\tmargin-top: 5px;\n\t\t\tmargin-bottom: 5px;\n\t\t}\n\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.block-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.block-2 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.block-3 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.block-4 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.block-5 {\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"block outer\">\n\t\t<div class=\"block block-1\"></div>\n\t\t<div class=\"block block-2\"></div>\n\t\t<div class=\"block block-3\"></div>\n\t\t<div class=\"block block-4\"></div>\n\t\t<div class=\"block block-5\"></div>\n\t</div>\n</body>\n</html>\n";
assets['simple-inline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t#inline {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tcolor: #ff0000;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span id=\"inline\">Hello</span>\n</body>\n</html>\n";
assets['empty-inline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\n\t\t.inline-1 {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tmargin-top: 5px;\n\t\t\tmargin-right: 5px;\n\t\t\tmargin-bottom: 5px;\n\t\t\tmargin-left: 5px;\n\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tmargin-top: 5px;\n\t\t\tmargin-right: 5px;\n\t\t\tmargin-bottom: 5px;\n\t\t\tmargin-left: 5px;\n\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer\">\n\t\t<span class=\"inline-1\"></span>\n\t\t<span class=\"inline-2\"></span>\n\t\t<span class=\"inline-3\"></span>\n\t\t<span class=\"inline-4\"></span>\n\t</span>\n</body>\n</html>\n";
assets['nested-inline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.inline {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\t\t}\n\n\t\t.inline-1 {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-2 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-4 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-5 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"inline inline-1\">\n\t\tH\n\t\t<span class=\"inline inline-2\">\n\t\t\te\n\t\t\t<span class=\"inline inline-3\">\n\t\t\t\tl\n\t\t\t\t<span class=\"inline inline-4\">\n\t\t\t\t\tl\n\t\t\t\t\t<span class=\"inline inline-5\">o</span>\n\t\t\t\t</span>\n\t\t\t</span>\n\t\t</span>\n\t</span>\n</body>\n</html>\n";
assets['column-inline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.inline {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\t\t}\n\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"inline outer\">\n\t\t<span class=\"inline inline-1\">H</span>\n\t\t<span class=\"inline inline-2\">e</span>\n\t\t<span class=\"inline inline-3\">l</span>\n\t\t<span class=\"inline inline-4\">l</span>\n\t\t<span class=\"inline inline-5\">o</span>\n\t</span>\n</body>\n</html>\n";
assets['white-space.html'] = ["<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\twidth: 50%;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\twhite-space: normal;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\twhite-space: nowrap;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\twhite-space: pre;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\twhite-space: pre-line;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\twhite-space: pre-wrap;\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline-1\">\n\t\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\tDonec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.\n\n\t\t\t\tNunc non risus gravida, pharetra felis et, scelerisque lacus.\n\t\t\tSuspendisse lacinia sit amet est id ornare.\n\t\t</span>\n\t\t<span class=\"inline-2\">\n\t\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\tDonec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.\n\n\t\t\t\tNunc non risus gravida, pharetra felis et, scelerisque lacus.\n\t\t\tSuspendisse lacinia sit amet est id ornare.\n\t\t</span>\n\t\t<span class=\"inline-3\">\n\t\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\tDonec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.\n\n\t\t\t\tNunc non risus gravida, pharetra felis et, scelerisque lacus.\n\t\t\tSuspendisse lacinia sit amet est id ornare.\n\t\t</span>\n\t\t<span class=\"inline-4\">\n\t\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\tDonec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.\n\n\t\t\t\tNunc non risus gravida, pharetra felis et, scelerisque lacus.\n\t\t\tSuspendisse lacinia sit amet est id ornare.\n\t\t</span>\n\t\t<span class=\"inline-5\">\n\t\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\tDonec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.\n\n\t\t\t\tNunc non risus gravida, pharetra felis et, scelerisque lacus.\n\t\t\tSuspendisse lacinia sit amet est id ornare.\n\t\t</span>\n\t</div>\n</body>\n</html>\n", 512, 768];
assets['pre.html'] = ["<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\twidth: 50%;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\twhite-space: pre;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\twhite-space: pre-wrap;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\twhite-space: pre;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\twhite-space: normal;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\twhite-space: nowrap;\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t\t.inline-6 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-7 {\n\t\t\tbackground-color: #ffff00;\n\t\t\tpadding-left: 50px;\n\t\t\tpadding-right: 50px;\n\t\t}\n\t\t.inline-8 {\n\t\t\twhite-space: pre;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-9 {\n\t\t\twhite-space: normal;\n\t\t}\n\t\t.inline-10 {\n\t\t\twhite-space: pre;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-11 {\n\t\t\twhite-space: normal;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline-1\">\n\t\t\t<span>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>\n\t\t</span>\n\t\t<span class=\"inline-2\">\n\t\t\t<span>Donec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.</span>\n\t\t</span>\n\t\t<span class=\"inline-3\">\n\t\t\t<span>Nunc non risus gravida, </span><span class=\"inline-4\">pharetra felis et, scelerisque lacus.</span>\n\t\t</span>\n\t\t<span class=\"inline-5\">\n\t\t\t<span>Suspendisse lacinia sit amet est id ornare.</span><span>Lorem ipsum dolor sit amet</span>\n\t\t</span>\n\t\t<span class=\"inline-6\">\n\t\t\t<span>consectetur adipiscing elit.</span><span class=\"inline-7\"></span>\n\t\t</span>\n\t\t<span class=\"inline-8\">\n\t\t\tDonec ac convallis<span class=\"inline-9\"></span>nisi. Mauris fermentum est nec placerat tincidunt.\n\t\t</span>\n\t\t<span class=\"inline-10\">\n\t\t\t<span>Nunc non risus gravida, pharetra<span class=\"inline-11\"></span></span>felis et, scelerisque lacus.\n\t\t</span>\n\t</div>\n\n\t<div class=\"outer\">\n<span class=\"inline-1\">Lorem ipsum\n\n</span>\n<span class=\"inline-1\">dolor sit amet\n\n</span>\n\t</div>\n</body>\n</html>\n", 512, 384];
assets['mixed-white-space.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\twhite-space: pre;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\twhite-space: pre;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline-1\">\n\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.<br>\n\t\t</span>\n\t\t<span class=\"inline-2\"> </span>\n\t\t<span class=\"inline-3\">\n\t\t\tNunc non risus gravida, pharetra felis et, scelerisque lacus.<br>\n\t\t</span>\n\t\t<span class=\"inline-4\"></span>\n\t\t<span class=\"inline-5\">\n\t\t\tSuspendisse lacinia sit amet est id ornare.\n\t\t</span>\n\t</div>\n\n\t<div class=\"outer\">\n\t\t<span class=\"inline-2\"> </span>\n\t\t<span class=\"inline-4\">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.</span>\n\t</div>\n</body>\n</html>\n";
assets['multiline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\twidth: 50%;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline-1\">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>\n\t\t<span class=\"inline-2\">Donec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.</span>\n\t\t<span class=\"inline-3\">Nunc non risus gravida, pharetra felis et, scelerisque lacus.</span>\n\t\t<span class=\"inline-4\">Suspendisse lacinia sit amet est id ornare.</span>\n\t\t<span class=\"inline-5\">Quisque sit amet lectus ornare, ullamcorper diam in, varius mi.</span>\n\t</div>\n</body>\n</html>\n";
assets['br.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline-1\">\n\t\t\tLorem ipsum dolor sit amet,<br>\n\t\t\tconsectetur adipiscing elit.\n\t\t</span>\n\t\t<br>\n\t\t<span class=\"inline-2\">\n\t\t\tDonec ac convallis nisi.<br>\n\t\t\tMauris fermentum est nec placerat tincidunt.\n\t\t</span>\n\t\t<br>\n\t\t<span class=\"inline-3\">\n\t\t\tNunc non risus gravida, pharetra felis et,<br>\n\t\t\tscelerisque lacus.\n\t\t</span>\n\t\t<br>\n\t\t<br>\n\t\t<span class=\"inline-4\">\n\t\t\tSuspendisse lacinia sit amet est id ornare.\n\t\t</span>\n\t\t<br>\n\t\t<br>\n\t\t<br>\n\t\t<span class=\"inline-5\">\n\t\t\tQuisque sit amet lectus ornare,<br>\n\t\t\tullamcorper diam in,<br>\n\t\t\tvarius mi.\n\t\t</span>\n\t\t<br>\n\t\t<br>\n\t</div>\n</body>\n</html>\n";
assets['block-in-inline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer\">\n\t\t<span class=\"inline-1\">H</span>\n\t\t<div class=\"inline-2\">e</div>\n\t\t<span class=\"inline-3\">l</span>\n\t\t<div class=\"inline-4\">l</div>\n\t\t<span class=\"inline-5\">o</span>\n\t</span>\n</body>\n</html>\n";
assets['nested-block-in-inline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer\">\n\t\t<span class=\"inline-1\">\n\t\t\t<div>H</div>\n\t\t</span>\n\t\t<div class=\"inline-2\">e</div>\n\t\t<span class=\"inline-3\">\n\t\t\t<div>l</div>\n\t\t</span>\n\t\t<div class=\"inline-4\">l</div>\n\t\t<span class=\"inline-5\">\n\t\t\t<div>o</div>\n\t\t</span>\n\t</span>\n</body>\n</html>\n";
assets['padded-block-in-inline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.inline {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tmargin-right: 5px;\n\t\t\tmargin-left: 5px;\n\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\n\t\t.outer {\n\t\t\twidth: 50%;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline\">\n\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\t<div>Donec ac convallis nisi.</div>\n\t\t\tMauris fermentum est nec placerat tincidunt.\n\t\t</span>\n\t</div>\n</body>\n</html>\n";
assets['padded-inline.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.inline {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tmargin-right: 5px;\n\t\t\tmargin-left: 5px;\n\t\t}\n\n\t\t.outer {\n\t\t\twidth: 50%;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline inline-1\">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>\n\t\t<span class=\"inline inline-2\">Donec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.</span>\n\t\t<span class=\"inline inline-3\">Nunc non risus gravida, pharetra felis et, scelerisque lacus.</span>\n\t\t<span class=\"inline inline-4\">Suspendisse lacinia sit amet est id ornare.</span>\n\t\t<span class=\"inline inline-5\">Quisque sit amet lectus ornare, ullamcorper diam in, varius mi.</span>\n\t</div>\n</body>\n</html>\n";
assets['padded-br.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.inline {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tmargin-right: 5px;\n\t\t\tmargin-left: 5px;\n\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\n\t\t.outer {\n\t\t\twidth: 50%;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline\">\n\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\t<br>\n\t\t\tMauris fermentum est nec placerat tincidunt.\n\t\t</span>\n\t</div>\n</body>\n</html>\n";
assets['padded-all.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.inline {\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tmargin-right: 5px;\n\t\t\tmargin-left: 5px;\n\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\n\t\t.outer {\n\t\t\twidth: 50%;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"outer\">\n\t\t<span class=\"inline\">\n\t\t\tLorem ipsum dolor sit amet, consectetur adipiscing elit.\n\t\t\t<div>Donec ac convallis nisi.</div>\n\t\t\tMauris fermentum est nec placerat tincidunt.\n\t\t\t<br>\n\t\t\tNunc non risus gravida, pharetra felis et, scelerisque lacus.\n\t\t</span>\n\t</div>\n</body>\n</html>\n";
assets['font-size.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tfont-size: 10px;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tfont-size: 14px;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tfont-size: 18px;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tfont-size: 22px;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tfont-size: 26px;\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer\">\n\t\t<span class=\"inline-1\">Lorem</span>\n\t\t<span class=\"inline-2\">ipsum</span>\n\t\t<span class=\"inline-3\">dolor</span>\n\t\t<span class=\"inline-4\">sit</span>\n\t\t<span class=\"inline-5\">amet</span>\n\t\tconsectetur\n\t</span>\n</body>\n</html>\n";
assets['multiline-font-size.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.inline-1 {\n\t\t\tfont-size: 10px;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tfont-size: 14px;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tfont-size: 18px;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tfont-size: 22px;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tfont-size: 26px;\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer\">\n\t\t<span class=\"inline-1\">Lorem</span>\n\t\t<span class=\"inline-2\">ipsum</span>\n\t\t<span class=\"inline-3\">dolor</span>\n\t\t<span class=\"inline-4\">sit</span>\n\t\t<span class=\"inline-5\">amet</span>\n\t\tconsectetur\n\t</span>\n\t<br>\n\t<span class=\"outer\">\n\t\t<span class=\"inline-1\">Donec</span>\n\t\t<span class=\"inline-2\">ac</span>\n\t\t<span class=\"inline-3\">convallis</span>\n\t\t<span class=\"inline-4\">nisi.</span>\n\t\t<span class=\"inline-5\">Mauris</span>\n\t\tfermentum\n\t</span>\n\t<div>\n\t\t<span class=\"outer\">\n\t\t\t<span class=\"inline-1\">Nunc</span>\n\t\t\t<span class=\"inline-2\">non</span>\n\t\t\t<span class=\"inline-3\">risus</span>\n\t\t\t<span class=\"inline-4\">gravida,</span>\n\t\t\t<span class=\"inline-5\">pharetra</span>\n\t\t\tfelis\n\t\t</span>\n\t</div>\n</body>\n</html>\n";
assets['image.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n</head>\n<body>\n\t<img src=\"images/waves.png\">\n</body>\n</html>\n";
assets['inline-image.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer img {\n\t\t\tmargin-left: 10px;\n\t\t\tmargin-right: 10px;\n\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer\">\n\t\t<span class=\"inline-1\">Lorem ipsum dolor sit amet</span>\n\t\t<img src=\"images/waves.png\">\n\t\t<span class=\"inline-2\">consectetur adipiscing elit.</span>\n\t</span>\n</body>\n</html>\n";
assets['block-image.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer img {\n\t\t\tmargin-left: 10px;\n\t\t\tmargin-right: 10px;\n\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tdisplay: block;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer\">\n\t\t<span class=\"inline-1\">Lorem ipsum dolor sit amet</span>\n\t\t<img src=\"images/waves.png\">\n\t\t<span class=\"inline-2\">consectetur adipiscing elit.</span>\n\t</span>\n</body>\n</html>\n";
assets['multiline-image.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer-inline {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer-inline img {\n\t\t\tmargin-left: 15px;\n\n\t\t\tborder-top-style: solid;\n\t\t\tborder-right-style: solid;\n\t\t\tborder-bottom-style: solid;\n\t\t\tborder-left-style: solid;\n\n\t\t\tborder-top-width: 1px;\n\t\t\tborder-right-width: 1px;\n\t\t\tborder-bottom-width: 1px;\n\t\t\tborder-left-width: 1px;\n\n\t\t\tborder-top-color: #800080;\n\t\t\tborder-right-color: #800080;\n\t\t\tborder-bottom-color: #800080;\n\t\t\tborder-left-color: #800080;\n\n\t\t\tpadding-top: 5px;\n\t\t\tpadding-right: 5px;\n\t\t\tpadding-bottom: 5px;\n\t\t\tpadding-left: 5px;\n\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.outer-block {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer-inline\">\n\t\t<span class=\"inline-1\">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</span>\n\t\t<img src=\"images/waves.png\">\n\t\t<span class=\"inline-2\">Donec ac convallis nisi.</span>\n\t</span>\n\n\t<div class=\"outer-block\">\n\t\tMauris fermentum est nec placerat tincidunt.\n\t</div>\n</body>\n</html>\n";
assets['line-height.html'] = ["<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer-inline {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer-block {\n\t\t\tline-height: 2;\n\t\t}\n\t\t.inline-1 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-1 .big {\n\t\t\tfont-size: 64px;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.inline-2 {\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.inline-3 {\n\t\t\tline-height: 50px;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-3 .big {\n\t\t\tfont-size: 32px;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.inline-4 {\n\t\t\tline-height: 50%;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.inline-5 {\n\t\t\tline-height: 0;\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t\t.inline-6 {\n\t\t\tline-height: 2;\n\t\t\tbackground-color: #800080;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer-inline\">\n\t\t<span class=\"inline-1\">Lorem <span class=\"big\">ipsum</span> dolor sit amet consectetur</span><br>\n\t\t<span class=\"inline-2\">Donec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.</span><br>\n\t\t<span class=\"inline-3\">Nunc non risus <span class=\"big\">gravida</span>, pharetra felis et, scelerisque lacus.</span><br>\n\t\t<span class=\"inline-4\">Suspendisse lacinia sit amet est id ornare.</span><br>\n\t\t<span class=\"inline-5\">Quisque sit amet lectus ornare,</span><br>\n\t\t<span class=\"inline-6\">ullamcorper diam in, varius mi.</span><br>\n\t</span>\n\n\t<div class=\"outer-block\">\n\t\t<span class=\"inline-1\">Lorem ipsum dolor sit amet consectetur</span><br>\n\t\t<span class=\"inline-2\">Donec ac convallis nisi. Mauris fermentum est nec placerat tincidunt.</span><br>\n\t</div>\n</body>\n</html>\n", 512, 384];
assets['vertical-align.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer-1 {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer-1 .inline-1 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: baseline;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.outer-1 .inline-2 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: sub;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.outer-1 .inline-3 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: super;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.outer-1 .inline-4 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: text-top;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.outer-1 .inline-5 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: text-bottom;\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t\t.outer-1 .inline-6 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: middle;\n\t\t\tbackground-color: #800080;\n\t\t}\n\n\t\t.outer-2 {\n\t\t\tfont-size: 26px;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer-2 .inline-1 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: baseline;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.outer-2 .inline-2 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: sub;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.outer-2 .inline-3 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: super;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.outer-2 .inline-4 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: text-top;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\t\t.outer-2 .inline-5 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: text-bottom;\n\t\t\tbackground-color: #4b0082;\n\t\t}\n\t\t.outer-2 .inline-6 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: middle;\n\t\t\tbackground-color: #800080;\n\t\t}\n\n\t\t.outer-3 {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer-3 .inline-1 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: 10px;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.outer-3 .inline-2 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: -10px;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.outer-3 .inline-3 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: 50%;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.outer-3 .inline-4 {\n\t\t\tfont-size: 26px;\n\t\t\tvertical-align: -50%;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\n\t\t.outer-4 {\n\t\t\tfont-size: 26px;\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer-4 .inline-1 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: 10px;\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.outer-4 .inline-2 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: -10px;\n\t\t\tbackground-color: #ffff00;\n\t\t}\n\t\t.outer-4 .inline-3 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: 50%;\n\t\t\tbackground-color: #008000;\n\t\t}\n\t\t.outer-4 .inline-4 {\n\t\t\tfont-size: 16px;\n\t\t\tvertical-align: -50%;\n\t\t\tbackground-color: #0000ff;\n\t\t}\n\n\t\t.outer-5 {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer-3\">\n\t\t<span class=\"inline-1\">Lorem</span>\n\t\t<span class=\"inline-2\">ipsum</span>\n\t\t<span class=\"inline-3\">dolor</span>\n\t\t<span class=\"inline-4\">sit</span>\n\t\tamet\n\t</span>\n\t<br>\n\t<span class=\"outer-4\">\n\t\t<span class=\"inline-1\">consectetur</span>\n\t\t<span class=\"inline-2\">Donec</span>\n\t\t<span class=\"inline-3\">ac</span>\n\t\t<span class=\"inline-4\">convallis</span>\n\t\tnisi.\n\t</span>\n\t<br>\n\t<span class=\"outer-3\">\n\t\tMauris\n\t\t<span class=\"inline-1\">\n\t\t\tfermentum\n\t\t\t<span class=\"inline-2\">\n\t\t\t\test\n\t\t\t\t<span class=\"inline-3\">\n\t\t\t\t\tnec\n\t\t\t\t\t<span class=\"inline-4\">\n\t\t\t\t\t\tplacerat\n\t\t\t\t\t</span>\n\t\t\t\t</span>\n\t\t\t</span>\n\t\t</span>\n\t</span>\n\t<br>\n\t<span class=\"outer-4\">\n\t\ttincidunt.\n\t\t<span class=\"inline-1\">\n\t\t\tNunc\n\t\t\t<span class=\"inline-2\">\n\t\t\t\tnon\n\t\t\t\t<span class=\"inline-3\">\n\t\t\t\t\trisus\n\t\t\t\t\t<span class=\"inline-4\">\n\t\t\t\t\t\tgravida\n\t\t\t\t\t</span>\n\t\t\t\t</span>\n\t\t\t</span>\n\t\t</span>\n\t</span>\n</body>\n</html>\n";
assets['vertical-align-image.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.outer-1 {\n\t\t\tbackground-color: #ff0000;\n\t\t}\n\t\t.outer-1 img {\n\t\t\theight: 64px;\n\t\t\tvertical-align: -32px;\n\t\t}\n\n\t\t.outer-2 {\n\t\t\tbackground-color: #ffa500;\n\t\t}\n\t\t.outer-2 img {\n\t\t\theight: 64px;\n\t\t\tvertical-align: 50%;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<span class=\"outer-1\">\n\t\tLorem ipsum dolor sit amet, <img src=\"images/waves.png\"> consectetur adipiscing elit.\n\t</span>\n\t<br>\n\t<span class=\"outer-2\">\n\t\tDonec ac convallis nisi. <img src=\"images/waves.png\"> Mauris fermentum est nec placerat tincidunt.\n\t</span>\n</body>\n</html>\n";
assets['shorthand.html'] = "<!DOCTYPE html>\n<html>\n<head>\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/reset.css\">\n\t<link rel=\"stylesheet\" type=\"text/css\" href=\"css/default.css\">\n\n\t<style type=\"text/css\">\n\t\t.block {\n\t\t\tborder: 1px solid #800080;\n\t\t\tpadding: 10px;\n\t\t}\n\n\t\t.block-1 {\n\t\t\tbackground: #ff0000;\n\t\t}\n\t\t.block-2 {\n\t\t\tbackground: #ffa500;\n\t\t\tmargin: 10px 5px;\n\t\t}\n\n\t\t.inline-1 {\n\t\t\tfont: 16px monospace;\n\t\t\tbackground: #ffff00;\n\t\t}\n\t\t.inline-2 {\n\t\t\tfont: inherit;\n\t\t\tbackground: #008000;\n\t\t}\n\t\t.inline-3 {\n\t\t\tbackground: #0000ff;\n\t\t}\n\t</style>\n</head>\n<body>\n\t<div class=\"block block-1\">\n\t\t<div class=\"block block-2\"></div>\n\t</div>\n\n\t<span class=\"inline inline-1\">\n\t\tLorem ipsum dolor sit amet\n\t\t<span class=\"inline inline-2\">consectetur\n\t\t\t<span class=\"inline inline-3\">adipiscing elit</span>\n\t\t</span>\n\t</span>\n</body>\n</html>\n";

var resolve = function(name) {
	var loc = window.location;
	var path = url.resolve(loc.pathname, name);

	return util.format('%s//%s%s', loc.protocol, loc.host, path);
};

var canvas = function(element, options, callback) {
	var canvas = document.createElement('canvas');
	var dimensions = options.viewport.dimensions;
	var dpr = window.devicePixelRatio || 1;

	canvas.width = dimensions.width * dpr;
	canvas.height = dimensions.height * dpr;
	canvas.style.width = dimensions.width + 'px';
	canvas.style.height = dimensions.height + 'px';

	element.appendChild(canvas);
	var context = canvas.getContext('2d');
	context.scale(dpr, dpr);
	options.context = context;

	render(options, callback);
};

var iframe = function(element, options) {
	var dimensions = options.viewport.dimensions;
	var iframe = document.createElement('iframe');
	element.appendChild(iframe);

	iframe.width = dimensions.width;
	iframe.height = dimensions.height;

	var doc = iframe.contentDocument;

	doc.open();
	doc.write(options.content);
	doc.close();
};

var row = function(element, options) {
	var row = document.createElement('div');
	row.className = 'row clearfix';

	var top = document.createElement('div');
	top.className = 'top';

	var name = options.url.split('/').pop();
	var content = document.createTextNode(name);
	var link = document.createElement('a');
	link.href = window.location.pathname + '?name=' + encodeURIComponent(name);

	link.appendChild(content);
	top.appendChild(link);

	var left = document.createElement('div');
	left.className = 'left-column';

	var right = document.createElement('div');
	right.className = 'right-column';

	row.appendChild(top);
	row.appendChild(left);
	row.appendChild(right);

	element.appendChild(row);

	iframe(right, options);
	canvas(left, options, function(err, page) {
		if(err) throw err;

		console.log('--', page.url);
		console.log(serialize(page.layout));
	});
};

var container = document.getElementById('container');

Object.keys(assets).forEach(function(asset) {
	if(query.name && query.name !== asset) return;
	if(query.name) document.title += util.format(' (%s)', asset);

	var data = assets[asset];
	data = Array.isArray(data) ? data : [data, 512, 256];

	row(container, {
		url: resolve(asset),
		content: data[0],
		viewport: {
			position: { x: 0, y: 0 },
			dimensions: { width: data[1], height: data[2] }
		}
	});
});

},{"../":152,"./serialize":167,"querystring":105,"url":127,"util":131}],167:[function(require,module,exports){
var Viewport = require('../source/layout/viewport');
var BlockBox = require('../source/layout/block-box');
var LineBox = require('../source/layout/line-box');
var LineBreakBox = require('../source/layout/line-break-box');
var InlineBox = require('../source/layout/inline-box');
var TextBox = require('../source/layout/text-box');
var ImageBox = require('../source/layout/image-box');

var indent = function(i) {
	return (new Array(i + 1)).join('|    ');
};

var name = function(box) {
	if(box instanceof Viewport) return 'Viewport';
	if(box instanceof BlockBox) return 'BlockBox';
	if(box instanceof LineBox) return 'LineBox';
	if(box instanceof LineBreakBox) return 'LineBreakBox';
	if(box instanceof InlineBox) return 'InlineBox';
	if(box instanceof TextBox) return 'TextBox';
	if(box instanceof ImageBox.Block) return 'BlockImageBox';
	if(box instanceof ImageBox.Inline) return 'InlineImageBox';
};

var attributes = function(box) {
	return '(' + [
		['x', box.position.x],
		['y', box.position.y],
		['width', box.dimensions.width],
		['height', box.dimensions.height]
	].map(function(pair) {
		return pair[0] + '=' + pair[1];
	}).join(', ') + ')';
};

var toString = function(box, indentation) {
	var space = indent(indentation);

	if(box instanceof TextBox) return [space, name(box), attributes(box), '[', JSON.stringify(box.display), ']'].join('');
	if(box instanceof ImageBox) return [space, name(box), attributes(box), '[', JSON.stringify(box.image.src), ']'].join('');
	if(box instanceof LineBreakBox) return [space, name(box)].join('');

	var children = box.children
		.map(function(child) {
			return toString(child, indentation + 1);
		}).filter(Boolean);

	return [space + name(box) + attributes(box) + '[']
		.concat(children)
		.concat([space + ']'])
		.join('\n');
};

module.exports = function(box) {
	return toString(box, 0);
};

},{"../source/layout/block-box":154,"../source/layout/image-box":156,"../source/layout/inline-box":157,"../source/layout/line-box":158,"../source/layout/line-break-box":159,"../source/layout/text-box":161,"../source/layout/viewport":162}]},{},[166]);
