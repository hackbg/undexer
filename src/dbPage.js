import { DEFAULT_PAGE_SIZE } from './config.js';

// Read limit/offset from query parameters and apply defaults
export function pagination (req) {
  return {
    offset: Math.max(0,   req.query.offset ? Number(req.query.offset) : 0),
    limit:  Math.min(100, req.query.limit  ? Number(req.query.limit)  : DEFAULT_PAGE_SIZE),
  }
}

// Read limit/before/after from query parameters and apply defaults
export function relativePagination (req) {
  return {
    before: Math.max(0,   req.query.before || 0),
    after:  Math.max(0,   req.query.after  || 0),
    limit:  Math.min(100, req.query.limit ? Number(req.query.limit) : DEFAULT_PAGE_SIZE),
  }
}
