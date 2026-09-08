// ============================================================================
// RESPONSE LIFECYCLE EXPORTS
// ============================================================================
// Everything you need to build consistent HTTP and WebSocket responses

// Core context builder (unified metadata creation)
export * from './context';

// Lifecycle orchestrators (HTTP, WebSocket)
export * from './http';
export * from './ws';
export * from './core';

// Shared engine (eliminates interceptor/filter duplication)
export * from './engine';
export * from './ws-engine';

//
export * from '../http/envelope';
export * from '../transport/serialize';
export * from '../transport/exception-normalization';
export * from '../websocket/envelope';
export { buildHttpRequestMeta, buildWebSocketMeta } from '../request-lifecyle';
