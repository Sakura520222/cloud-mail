export function getWriterRef(uiStore) {
  const writerRef = uiStore.writerRef
  return writerRef?.value || writerRef || null
}

export function callWriter(uiStore, method, ...args) {
  const writer = getWriterRef(uiStore)
  const action = writer?.[method]

  if (typeof action !== 'function') {
    return false
  }

  action(...args)
  return true
}