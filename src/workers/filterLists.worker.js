import { buildFilterLists } from './filterLogic.js'

/** @type {unknown[] | null} */
let cachedRawData = null

self.onmessage = (event) => {
  const msg = event.data || {}
  const { id, type } = msg

  try {
    if (type === 'setRawData') {
      cachedRawData = msg.rawData || []
      self.postMessage({ id, type: 'rawDataReady', rows: cachedRawData.length })
      return
    }

    if (type === 'buildLists') {
      if (msg.rawData) cachedRawData = msg.rawData
      const lists = buildFilterLists(cachedRawData || [], msg.filters || {})
      self.postMessage({ id, type: 'lists', lists })
      return
    }
  } catch (err) {
    self.postMessage({
      id,
      type: 'error',
      message: err?.message || String(err)
    })
  }
}
