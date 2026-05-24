let writerRef = null

export function setWriterRef(ref) {
  writerRef = ref
}

export function getWriterRef(uiStore) {
  return writerRef?.value || null
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