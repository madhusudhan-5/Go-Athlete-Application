// Polyfill for ReadableStream in React Native
// React Native doesn't have ReadableStream, WritableStream, or TransformStream
// We use web-streams-polyfill to provide proper polyfills

const { ReadableStream, WritableStream, TransformStream } = require('web-streams-polyfill');

if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = ReadableStream;
}

if (typeof globalThis.WritableStream === 'undefined') {
  globalThis.WritableStream = WritableStream;
}

if (typeof globalThis.TransformStream === 'undefined') {
  globalThis.TransformStream = TransformStream;
}

