"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.Wallet = void 0;
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const bip39 = __importStar(require("bip39"));
const bip32 = __importStar(require("bip32"));
const web3_js_1 = require("@solana/web3.js");
const System_1 = require("./System");
const BPFLoader_1 = require("./BPFLoader");
function pathToAccount(path) {
    return new web3_js_1.Account(tweetnacl_1.default.sign.keyPair.fromSeed(path.privateKey).secretKey);
}
class Wallet {
    constructor(account, base, conn) {
        this.account = account;
        this.base = base;
        this.conn = conn;
        this.sys = new System_1.System(this);
    }
    static generateMnemonic(bits = 128) {
        return bip39.generateMnemonic(bits);
    }
    static async fromMnemonic(mnemonic, conn) {
        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error("Invalid seed words");
        }
        const seed = await bip39.mnemonicToSeed(mnemonic);
        return Wallet.fromSeed(seed, conn);
    }
    static fromAccount(account, conn) {
        const base = bip32
            .fromSeed(Buffer.from(account.secretKey))
            .derivePath(`m/501'/0'/0`);
        return new Wallet(account, base, conn);
    }
    static fromSeed(seed, conn) {
        // The ticks ' are hardened keys. Keys in different harden paths
        // cannot correlated. Leaked unhardend key in a child path could leak
        // the secret key of its parent.
        //
        // TLDR: treat hardened paths as "accounts" that are firewalled.
        const base = bip32.fromSeed(seed).derivePath(`m/501'/0'/0`);
        return new Wallet(pathToAccount(base), base, conn);
    }
    get address() {
        return this.pubkey.toBase58();
    }
    get pubkey() {
        return this.account.publicKey;
    }
    deriveIndex(index) {
        const child = this.base.derive(index);
        return new Wallet(pathToAccount(child), child, this.conn);
    }
    derive(subpath) {
        const child = this.base.derivePath(subpath);
        return new Wallet(pathToAccount(child), child, this.conn);
    }
    deriveAccount(subpath) {
        return this.derive(subpath).account;
    }
    async info(subpath) {
        return this.sys.accountInfo(this.account.publicKey);
    }
    async loadProgram(binPath) {
        const bpfLoader = new BPFLoader_1.BPFLoader(this);
        return bpfLoader.loadFile(binPath);
    }
}
exports.Wallet = Wallet;
