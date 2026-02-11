/**
 * レイヤー管理モジュール
 * カスタムレイヤーの追加、削除、表示切り替えを管理
 */

// レイヤー情報を保持する配列
let layers = [];

// レイヤー変更時のコールバック
let onLayersChange = null;

/**
 * レイヤーマネージャーを初期化
 * @param {Function} callback - レイヤー変更時のコールバック
 */
export function initLayerManager(callback) {
  onLayersChange = callback;
  console.log('GeoHub: Layer manager initialized');
}

/**
 * レイヤーを追加
 * @param {Object} layerConfig - レイヤー設定
 * @returns {string} レイヤーID
 */
export function addLayer(layerConfig) {
  const layer = {
    id: layerConfig.id || generateLayerId(),
    name: layerConfig.name || 'Untitled Layer',
    type: layerConfig.type || 'raster', // raster, vector, geojson
    source: layerConfig.source,
    visible: layerConfig.visible !== undefined ? layerConfig.visible : true,
    opacity: layerConfig.opacity !== undefined ? layerConfig.opacity : 1.0,
    metadata: layerConfig.metadata || {}
  };

  layers.push(layer);
  notifyChange();

  console.log(`GeoHub: Layer added - ${layer.id}`);
  return layer.id;
}

/**
 * レイヤーを削除
 * @param {string} layerId
 */
export function removeLayer(layerId) {
  const index = layers.findIndex(l => l.id === layerId);
  if (index !== -1) {
    layers.splice(index, 1);
    notifyChange();
    console.log(`GeoHub: Layer removed - ${layerId}`);
    return true;
  }
  return false;
}

/**
 * レイヤーの表示/非表示を切り替え
 * @param {string} layerId
 * @param {boolean} visible
 */
export function setLayerVisibility(layerId, visible) {
  const layer = layers.find(l => l.id === layerId);
  if (layer) {
    layer.visible = visible;
    notifyChange();
    console.log(`GeoHub: Layer visibility changed - ${layerId}: ${visible}`);
    return true;
  }
  return false;
}

/**
 * レイヤーの透明度を設定
 * @param {string} layerId
 * @param {number} opacity - 0.0 ~ 1.0
 */
export function setLayerOpacity(layerId, opacity) {
  const layer = layers.find(l => l.id === layerId);
  if (layer) {
    layer.opacity = Math.max(0, Math.min(1, opacity));
    notifyChange();
    console.log(`GeoHub: Layer opacity changed - ${layerId}: ${layer.opacity}`);
    return true;
  }
  return false;
}

/**
 * すべてのレイヤーを取得
 * @returns {Array} レイヤーリスト
 */
export function getAllLayers() {
  return [...layers];
}

/**
 * 特定のレイヤー情報を取得
 * @param {string} layerId
 */
export function getLayer(layerId) {
  return layers.find(l => l.id === layerId);
}

/**
 * レイヤーをクリア（すべて削除）
 */
export function clearLayers() {
  layers = [];
  notifyChange();
  console.log('GeoHub: All layers cleared');
}

/**
 * ラスタータイルレイヤーを追加（便利関数）
 * @param {Object} config - { name, tiles, attribution, tileSize }
 */
export function addRasterTileLayer(config) {
  return addLayer({
    name: config.name,
    type: 'raster',
    source: {
      type: 'raster',
      tiles: config.tiles,
      tileSize: config.tileSize || 256,
      attribution: config.attribution || ''
    }
  });
}

/**
 * ベクタータイルレイヤーを追加（便利関数）
 * @param {Object} config - { name, tiles, attribution, metadata }
 */
export function addVectorTileLayer(config) {
  return addLayer({
    name: config.name,
    type: 'vector',
    source: {
      type: 'vector',
      tiles: config.tiles,
      attribution: config.attribution || ''
    },
    metadata: config.metadata || {}
  });
}

/**
 * GeoJSONレイヤーを追加（便利関数）
 * @param {Object} config - { name, data }
 */
export function addGeoJSONLayer(config) {
  return addLayer({
    name: config.name,
    type: 'geojson',
    source: {
      type: 'geojson',
      data: config.data
    }
  });
}

/**
 * レイヤーIDを自動生成
 */
function generateLayerId() {
  return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * レイヤー変更を通知
 */
function notifyChange() {
  if (onLayersChange) {
    onLayersChange(getAllLayers());
  }
}
