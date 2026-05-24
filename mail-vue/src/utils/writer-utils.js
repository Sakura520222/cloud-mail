export function callWriter(uiStore, method, ...args) {
  const writer = uiStore?.writerRef
  const action = writer?.[method]

  if (typeof action !== 'function') {
    return false
  }

  action(...args)
  return true
}