export function serialize (object) {
  return JSON.stringify(object, (k, v)=>{
    if (typeof v === 'bigint') {
      return String(v)
    }
    return v
  })
}
