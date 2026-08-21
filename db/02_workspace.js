// db/02_workspace.js
// MathematicsWeb v0.5.0 — 工作区(收藏 + 进度 + 场景参数持久化)
// 沿用 three.jsWeb 设计意图 + canvasweb 的轻 IndexedDB 模式
//
// 4 个 meta key:
//   - lastScene:  最后访问的场景 ID(刷新后恢复)
//   - favorites:   收藏场景 ID 数组
//   - visited:     已访问场景 ID 数组(进度)
//   - sceneParams:  { sceneId: { ...params } }  各场景自定义参数

import { idb } from './01_indexeddb.js';

export class Workspace {
  constructor() {
    this.lastScene = null;
    this.favorites = [];
    this.visited = [];
    this.sceneParams = {};      // { sceneId: { ... } }
    this._listeners = [];       // 状态变化订阅
  }

  async init() {
    try {
      this.lastScene = await idb.getMeta('lastScene');
      this.favorites = (await idb.getMeta('favorites')) || [];
      this.visited = (await idb.getMeta('visited')) || [];
      const all = await idb.getAllSceneParams();
      this.sceneParams = all || {};
    } catch (e) {
      console.warn('[mathw] workspace init failed', e);
    }
    return this;
  }

  // ---------- 订阅 ----------
  onChange(fn) {
    this._listeners.push(fn);
    return () => { this._listeners = this._listeners.filter(f => f !== fn); };
  }
  _emit() {
    this._listeners.forEach(fn => { try { fn(this); } catch (_) {} });
  }

  // ---------- 最后访问 ----------
  async setLastScene(sceneId) {
    this.lastScene = sceneId;
    await idb.setMeta('lastScene', sceneId);
    this._emit();
  }

  // ---------- 收藏 ----------
  async toggleFavorite(sceneId) {
    const idx = this.favorites.indexOf(sceneId);
    if (idx >= 0) this.favorites.splice(idx, 1);
    else this.favorites.push(sceneId);
    await idb.setMeta('favorites', [...this.favorites]);
    this._emit();
    return this.favorites.includes(sceneId);
  }
  isFavorite(sceneId) { return this.favorites.includes(sceneId); }

  // ---------- 访问进度 ----------
  async markVisited(sceneId) {
    if (!this.visited.includes(sceneId)) {
      this.visited.push(sceneId);
      await idb.setMeta('visited', [...this.visited]);
      this._emit();
    }
  }
  isVisited(sceneId) { return this.visited.includes(sceneId); }

  // ---------- 场景参数 ----------
  async saveSceneParams(sceneId, params) {
    this.sceneParams[sceneId] = { ...params };
    await idb.setSceneParams(sceneId, this.sceneParams[sceneId]);
    this._emit();
  }
  getSceneParams(sceneId) {
    return this.sceneParams[sceneId] || null;
  }
}
