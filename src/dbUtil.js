import db from './db.js'
import { QueryTypes } from 'sequelize'
const { SELECT, COUNT } = QueryTypes

import { sql } from 'slonik'

export { sql }

export const defaultAttributes = (args = {}) => {
  const attrs = { exclude: ['createdAt', 'updatedAt'] }
  if (args instanceof Array) {
    attrs.include = args
  } else if (args instanceof Object) {
    if (args.include) attrs.include = [...new Set([...attrs.include||[], ...args.include])]
    if (args.exclude) attrs.exclude = [...new Set([...attrs.exclude||[], ...args.exclude])]
  } else {
    throw new Error('defaultAttributes takes Array or Object')
  }
  return attrs
}

export const toCount = query =>
  query.then(query=>Number(query[0][0].count))

export const count = query =>
  toCount(db.query(query))

export const slonikCount = query =>
  toCount(slonikQuery(query))

export const slonikSelect = (query, options = {}) =>
  slonikQuery(query, { ...options, type: SELECT })

export const slonikQuery = (query, options = {}) => {
  const { sql, values } = query
  const bind = {}
  for (let i = 0; i < values.length; i++) {
    bind[`slonik_${i+1}`] = values[i]
  }
  return db.query(sql, { ...options, bind })
}

export const ASC =
  sql.fragment`ASC`

export const DESC =
  sql.fragment`DESC`

export const paginate = (column, ordering, limit, offset) =>
  sql.fragment`ORDER BY ${sql.identifier([column])} ${ordering} LIMIT ${limit} OFFSET ${offset}`

export const paginateByContent = (column, path, type, ordering, limit, offset) =>
  sql.fragment`ORDER BY (${sql.identifier([column])} -> ${path})::${type} ${ordering} LIMIT ${limit} OFFSET ${offset}`

export const txContents =
  sql.fragment`jsonb_path_query("txData", '$.data.content[*]')`

export const txsByContent =
  sql.fragment`SELECT "blockHeight", "txHash", "txTime", ${txContents} as content
  FROM "transactions"`

export const fromTxsByContent =
  sql.fragment`FROM (${txsByContent})`

export const matchContentType = type =>
  sql.fragment`content->'type' = ${sql.jsonb(type)}`

export const OR = (a, b) =>
  sql.fragment`(${a} OR ${b})`

export const matchSourceOrValidator = ({ source, validator }) =>
  (source && validator)
    ? OR(
      sql.fragment`content->'data'->>'source' = ${source}`,
      sql.fragment`content->'data'->>'validator' = ${validator}`
    ) :
  (source)
    ? sql.fragment`content->'data'->>'source' = ${source}` :
  (validator)
    ? sql.fragment`content->'data'->>'validator' = ${validator}`
    : sql.fragment`true`
