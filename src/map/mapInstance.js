/**
 * MapLibre GL JSインスタンスの管理
 */
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getDefaultBasemap } from './basemaps.js';

let map = null;

/**
 * 地図を初期化
 * @param {string} containerId - 地図を表示するコンテナのID
 * @param {Object} options - 初期化オプション
 * @returns {maplibregl.Map} 地図インスタンス
 */
export function initMap(containerId, options = {}) {
  const defaultBasemap = getDefaultBasemap();
  
  const defaultOptions = {
    container: containerId,
    style: {
      version: 8,
      sources: {
        [defaultBasemap.id]: {
          type: defaultBasemap.type,
          tiles: defaultBasemap.tiles,
          tileSize: defaultBasemap.tileSize,
          attribution: defaultBasemap.attribution
        }
      },
      layers: [
        {
          id: `${defaultBasemap.id}-layer`,
          type: 'raster',
          source: defaultBasemap.id
        }
      ]
    },
    center: [139.7671, 35.6812], // 東京を中心
    zoom: 10,
    minZoom: 5,
    maxZoom: 18
  };
  
  map = new maplibregl.Map({
    ...defaultOptions,
    ...options
  });
  
  // ナビゲーションコントロールを追加
  map.addControl(new maplibregl.NavigationControl(), 'top-left');
  
  // スケールコントロールを追加
  map.addControl(new maplibregl.ScaleControl({
    maxWidth: 200,
    unit: 'metric'
  }), 'bottom-left');
  
  // 地図の読み込み完了時のログ
  map.on('load', () => {
    console.log('GeoHub: Map loaded successfully');
  });
  
  // エラーハンドリング
  map.on('error', (e) => {
    console.error('GeoHub: Map error', e);
  });
  
  return map;
}

/**
 * 地図インスタンスを取得
 * @returns {maplibregl.Map|null}
 */
export function getMap() {
  return map;
}

/**
 * 地図を破棄
 */
export function destroyMap() {
  if (map) {
    map.remove();
    map = null;
  }
}

/**
 * 背景地図を切り替え
 * @param {string} basemapId - 切り替える背景地図のID
 */
export function switchBasemap(basemapId) {
  if (!map) {
    console.error('GeoHub: Map instance not found');
    return;
  }

  // basemaps.jsから該当する背景地図を取得
  import('./basemaps.js').then(({ basemaps }) => {
    const newBasemap = Object.values(basemaps).find(bm => bm.id === basemapId);

    if (!newBasemap) {
      console.error(`GeoHub: Basemap ${basemapId} not found`);
      return;
    }

    // 地図が読み込まれていることを確認
    if (!map.isStyleLoaded()) {
      map.once('load', () => performBasemapSwitch(newBasemap));
    } else {
      performBasemapSwitch(newBasemap);
    }
  });
}

/**
 * 実際の背景地図切り替え処理
 */
function performBasemapSwitch(basemap) {
  // 既存の背景地図レイヤーとソースを削除
  const style = map.getStyle();
  const existingLayers = style.layers.filter(layer =>
    layer.source && layer.source.startsWith('gsi-')
  );

  existingLayers.forEach(layer => {
    if (map.getLayer(layer.id)) {
      map.removeLayer(layer.id);
    }
  });

  // 既存の背景地図ソースを削除
  Object.keys(style.sources).forEach(sourceId => {
    if (sourceId.startsWith('gsi-') && map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }
  });

  // 新しい背景地図ソースを追加
  map.addSource(basemap.id, {
    type: basemap.type,
    tiles: basemap.tiles,
    tileSize: basemap.tileSize,
    attribution: basemap.attribution
  });

  // 新しい背景地図レイヤーを追加（最背面に）
  map.addLayer({
    id: `${basemap.id}-layer`,
    type: 'raster',
    source: basemap.id
  }, getFirstSymbolLayerId());

  console.log(`GeoHub: Switched to basemap ${basemap.id}`);
}

/**
 * 最初のシンボルレイヤーのIDを取得（背景地図を最背面に配置するため）
 */
function getFirstSymbolLayerId() {
  const layers = map.getStyle().layers;
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol') {
      return layers[i].id;
    }
  }
  return undefined;
}
