"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferLayout = exports.u64LEBuffer = exports.u64FromBuffer = exports.uint64 = exports.publicKey = void 0;
const buffer_layout_1 = __importDefault(require("buffer-layout"));
// export let BufferLayout = BufferLayout
/**
 * Layout for a public key
 */
const publicKey = (property) => {
    return buffer_layout_1.default.blob(32, property);
};
exports.publicKey = publicKey;
// /**
//  * Layout for a 64bit unsigned value
//  */
const uint64 = (property = 'uint64') => {
    return buffer_layout_1.default.blob(8, property);
};
exports.uint64 = uint64;
function u64FromBuffer(buf) {
    return buf.readBigUInt64LE();
}
exports.u64FromBuffer = u64FromBuffer;
function u64LEBuffer(n) {
    const buf = Buffer.allocUnsafe(8);
    buf.writeBigUInt64LE(n);
    return buf;
}
exports.u64LEBuffer = u64LEBuffer;
exports.BufferLayout = __importStar(require("buffer-layout"));
