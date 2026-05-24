export function callWriter(uiStore, method, ...args) {
  const writer = uiStore?.writerRef
  console.log('[callWriter]', method, { writer, type: typeof writer, keys: writer ? Object.keys(writer) : [] })
  const action = writer?.[method]

  if (typeof action !== 'function') {
    console.warn('[callWriter] method not found:', method, 'action:', action)
    return false
  }

  action(...args)
  return true
}