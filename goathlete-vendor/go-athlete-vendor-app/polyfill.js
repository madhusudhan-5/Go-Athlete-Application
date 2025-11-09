// Polyfill for ReadableStream in Node.js < 18
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = require('stream/web').ReadableStream;
}
if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = require('stream/web').WritableStream;
}
if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = require('stream/web').TransformStream;
}

