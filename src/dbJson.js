import { base64 } from "@hackbg/fadroma";
import { DataTypes } from "sequelize"
const { JSONB } = DataTypes
export const JSONField = name => ({
  type: JSONB,
  allowNull: false,
  set (value) { this.setDataValue(name, jsonify(value)); },
})
export const NullableJSONField = name => ({
  type: JSONB,
  allowNull: true,
  set (value) { this.setDataValue(name, (value === undefined) ? null : jsonify(value)); },
})
export const jsonify = data => JSON.parse(serialize(data))
export const serialize = data => JSON.stringify(data, stringifier)
export const stringifier = (_, value) => {
  if (typeof value === "bigint") return value.toString()
  if (value instanceof Uint8Array) return base64.encode(value)
  return value
}
