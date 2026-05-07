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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = exports.db = void 0;
const admin = __importStar(require("firebase-admin"));
const env_1 = require("./env");
if (!admin.apps.length) {
    try {
        if (!env_1.config.firebase.serviceAccount || env_1.config.firebase.serviceAccount === '{}') {
            throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in .env');
        }
        // Fix: Strip potential single quotes that can cause JSON.parse to fail
        const rawJson = env_1.config.firebase.serviceAccount.trim().replace(/^'|'$/g, '');
        const serviceAccount = JSON.parse(rawJson);
        // Debug: Check if project IDs match
        console.log('Backend Config Project ID:', env_1.config.firebase.projectId);
        console.log('Service Account Project ID:', serviceAccount.project_id);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: env_1.config.firebase.projectId
        });
        console.log('Firebase Admin SDK initialized successfully');
    }
    catch (error) {
        console.error('Firebase init failed:', error.message);
        // Fallback initialization
        admin.initializeApp({
            projectId: env_1.config.firebase.projectId
        });
    }
}
exports.db = admin.firestore();
exports.auth = admin.auth();
