import { useEffect, useRef, useState } from 'react'
import { EMPTY_FILTER_LISTS, buildFilterLists } from '../workers/filterLogic'

let sharedWorker = null
let workerUsers = 0

function acquireWorker() {
  if (typeof Worker === 'undefined') return null
  if (!sharedWorker) {
    sharedWorker = new Worker(new URL('../workers/filterLists.worker.js', import.meta.url), {
      type: 'module'
    })
  }
  workerUsers += 1
  return sharedWorker
}

function releaseWorker() {
  workerUsers = Math.max(0, workerUsers - 1)
  if (workerUsers === 0 && sharedWorker) {
    sharedWorker.terminate()
    sharedWorker = null
  }
}

/**
 * Calcula as opções dos filtros em Web Worker (fora da main thread).
 * rawData vai pro worker só quando muda; filtros disparam rebuild com debounce.
 */
export function useFilterLists(rawData, filters, { debounceMs = 80 } = {}) {
  const [lists, setLists] = useState(EMPTY_FILTER_LISTS)
  const reqId = useRef(0)
  const lastRawRef = useRef(null)
  const filtersRef = useRef(filters)
  filtersRef.current = filters

  useEffect(() => {
    const worker = acquireWorker()

    if (!worker) {
      setLists(buildFilterLists(rawData || [], filtersRef.current || {}))
      return undefined
    }

    const onMessage = (event) => {
      const msg = event.data
      if (!msg || msg.id !== reqId.current) return
      if (msg.type === 'lists' && msg.lists) setLists(msg.lists)
    }

    worker.addEventListener('message', onMessage)
    return () => {
      worker.removeEventListener('message', onMessage)
      releaseWorker()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (rawData === lastRawRef.current) return
    lastRawRef.current = rawData

    if (!sharedWorker) {
      setLists(buildFilterLists(rawData || [], filtersRef.current || {}))
      return
    }

    const id = ++reqId.current
    sharedWorker.postMessage({ id, type: 'setRawData', rawData: rawData || [] })
    sharedWorker.postMessage({
      id,
      type: 'buildLists',
      filters: filtersRef.current || {}
    })
  }, [rawData])

  useEffect(() => {
    if (!sharedWorker) {
      setLists(buildFilterLists(lastRawRef.current || [], filters || {}))
      return undefined
    }

    const t = window.setTimeout(() => {
      const id = ++reqId.current
      sharedWorker.postMessage({
        id,
        type: 'buildLists',
        filters: filters || {}
      })
    }, debounceMs)

    return () => window.clearTimeout(t)
  }, [filters, debounceMs])

  return lists
}
