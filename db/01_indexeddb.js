// db/01_indexeddb.js
// MathematicsWeb v0.5.0 — IndexedDB 简易封装
// 4 个 meta key + sceneParams 存储

const DB_NAME = 'mathw';
const DB_VERSION = 1;
const STORES = {
  meta: 'meta',                   // { key, value }
  sceneParams: 'sceneParams',     // { sceneId, params }
};

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORES.meta)) db.createObjectStore(STORES.meta, { keyPath: 'key' });
      if (!db.objectStoreNames.contains(STORES.sceneParams)) db.createObjectStore(STORES.sceneParams, { keyPath: 'sceneId' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(storeName, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;
    Promise.resolve(fn(store)).then(r => { result = r; }).catch(reject);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function asPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const idb = {
  async getMeta(key) {
    return withStore(STORES.meta, 'readonly', async (store) => {
      const r = await asPromise(store.get(key));
      return r ? r.value : null;
    });
  },
  async setMeta(key, value) {
    return withStore(STORES.meta, 'readwrite', async (store) => {
      await asPromise(store.put({ key, value }));
    });
  },
  async getSceneParams(sceneId) {
    return withStore(STORES.sceneParams, 'readonly', async (store) => {
      const r = await asPromise(store.get(sceneId));
      return r ? r.params : null;
    });
  },
  async setSceneParams(sceneId, params) {
    return withStore(STORES.sceneParams, 'readwrite', async (store) => {
      await asPromise(store.put({ sceneId, params }));
    });
  },
  async getAllSceneParams() {
    // 返回 { sceneId: params } map
    return withStore(STORES.sceneParams, 'readonly', async (store) => {
      const all = await asPromise(store.getAll());
      const out = {};
      all.forEach(r => { out[r.sceneId] = r.params; });
      return out;
    });
  },
};
