/**
 * 背景地図の定義
 * 地理院タイルなどのラスタータイルソースを管理
 */

export const basemaps = {
  // 地理院タイル - 標準地図
  gsi_standard: {
    id: 'gsi-standard',
    name: '地理院地図（標準）',
    type: 'raster',
    tiles: [
      'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
    ],
    tileSize: 256,
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
  },
  
  // 地理院タイル - 淡色地図
  gsi_pale: {
    id: 'gsi-pale',
    name: '地理院地図（淡色）',
    type: 'raster',
    tiles: [
      'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'
    ],
    tileSize: 256,
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
  },
  
  // 地理院タイル - 写真
  gsi_photo: {
    id: 'gsi-photo',
    name: '地理院地図（写真）',
    type: 'raster',
    tiles: [
      'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'
    ],
    tileSize: 256,
    attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
  },

  // OpenStreetMap
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    type: 'raster',
    tiles: [
      'https://tile.openstreetmap.jp/{z}/{x}/{y}.png'
    ],
    tileSize: 256,
    attribution: '<a href="http://osm.org/copyright" target="_blank">OSM</a>'
  }
};

/**
 * デフォルトの背景地図を取得
 */
export function getDefaultBasemap() {
  return basemaps.gsi_standard;
}

/**
 * すべての背景地図のリストを取得
 */
export function getAllBasemaps() {
  return Object.values(basemaps);
}
