let writerInstance = null

export function setWriterRef(writerRef) {
  writerInstance = writerRef?.value || writerRef || null
}

export function getWriterRef(uiStore) {
  const writerRef = writerInstance || uiStore?.writerRef
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