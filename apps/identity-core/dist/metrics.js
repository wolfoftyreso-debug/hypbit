"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
// Metrics counters — replace with CloudWatch/DataDog in prod
exports.metrics = {
    authSuccess: 0,
    authFailure: 0,
    refreshSuccess: 0,
    sessionRevocations: 0,
    anomalyCount: 0,
};
