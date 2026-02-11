/**
 * MapLibre GL JSインスタンスの管理
 */
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getDefaultBasemap } from './basemaps.js';
import { Protocol } from 'pmtiles';

let map = null;
let pmtilesProtocol = null;

/**
 * 地図を初期化
 * @param {string} containerId - 地図を表示するコンテナのID
 * @param {Object} options - 初期化オプション
 * @returns {maplibregl.Map} 地図インスタンス
 */
export function initMap(containerId, options = {}) {
  // PMTilesプロトコルを登録
  if (!pmtilesProtocol) {
    pmtilesProtocol = new Protocol();
    maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
    console.log('GeoHub: PMTiles protocol registered');
  }

  const defaultBasemap = getDefaultBasemap();

  const defaultOptions = {
    container: containerId,
    style: {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
  try {
    const style = map.getStyle();

    // 既存の背景地図レイヤーを削除
    const layersToRemove = style.layers.filter(layer =>
      layer.source && typeof layer.source === 'string' && layer.source.startsWith('gsi-')
    );

    console.log(`GeoHub: Removing ${layersToRemove.length} basemap layers`);
    layersToRemove.forEach(layer => {
      try {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id);
          console.log(`GeoHub: Removed layer ${layer.id}`);
        }
      } catch (error) {
        console.error(`GeoHub: Failed to remove layer ${layer.id}`, error);
      }
    });

    // 既存の背景地図ソースを削除
    const sourcesToRemove = Object.keys(style.sources).filter(sourceId =>
      sourceId.startsWith('gsi-')
    );

    console.log(`GeoHub: Removing ${sourcesToRemove.length} basemap sources`);
    sourcesToRemove.forEach(sourceId => {
      try {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
          console.log(`GeoHub: Removed source ${sourceId}`);
        }
      } catch (error) {
        console.error(`GeoHub: Failed to remove source ${sourceId}`, error);
      }
    });

    // 新しい背景地図ソースを追加
    if (!map.getSource(basemap.id)) {
      map.addSource(basemap.id, {
        type: basemap.type,
        tiles: basemap.tiles,
        tileSize: basemap.tileSize,
        attribution: basemap.attribution
      });
      console.log(`GeoHub: Added source ${basemap.id}`);
    }

    // 新しい背景地図レイヤーを追加（全てのレイヤーの最背面に）
    const newLayerId = `${basemap.id}-layer`;
    if (!map.getLayer(newLayerId)) {
      map.addLayer({
        id: newLayerId,
        type: 'raster',
        source: basemap.id
      }, getFirstNonBasemapLayerId());
      console.log(`GeoHub: Added layer ${newLayerId}`);
    }

    console.log(`GeoHub: Successfully switched to basemap ${basemap.id}`);
  } catch (error) {
    console.error('GeoHub: Failed to switch basemap', error);
  }
}

/**
 * 背景地図以外の最初のレイヤーIDを取得（背景地図を最背面に配置するため）
 */
function getFirstNonBasemapLayerId() {
  const layers = map.getStyle().layers;
  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    // 背景地図（gsi-で始まるsource）以外のレイヤーを探す
    if (layer.source && !layer.source.startsWith('gsi-')) {
      return layer.id;
    }
  }
  // 背景地図以外のレイヤーがない場合はundefinedを返す（最上位に追加）
  return undefined;
}
