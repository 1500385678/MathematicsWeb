// db/02_workspace.js
// MathematicsWeb v0.1.0 — 工作区恢复(轻量版,比 three.jsWeb 简单,只存 last scene + fav)
// 沿用 three.jsWeb 设计意图,但 v0.1 范围缩到最小

import { idb } from './01_indexeddb.js';

export class Workspace {
  constructor() {
    this.favorites = [];
    this.lastScene = null;
  }

  async init() {
    try {
      this.lastScene = await idb.getMeta('lastScene');
      this.favorites = (await idb.getMeta('favorites')) || [];
    } catch (e) {
      console.warn('[mathw] workspace init failed', e);
    }
    return this;
  }

  async setLastScene(sceneId) {
    this.lastScene = sceneId;
    await idb.setMeta('lastScene', sceneId);
  }

  async toggleFavorite(sceneId) {
    const idx = this.favorites.indexOf(sceneId);
    if (idx >= 0) this.favorites.splice(idx, 1);
    else this.favorites.push(sceneId);
    await idb.setMeta('favorites', [...this.favorites]);
    return this.favorites.includes(sceneId);
  }

  isFavorite(sceneId) {
    return this.favorites.includes(sceneId);
  }
}
