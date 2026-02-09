/**
 * サイドパネルの制御
 */

let panel = null;
let panelToggleBtn = null;
let panelCloseBtn = null;
let isOpen = false;

/**
 * サイドパネルを初期化
 */
export function initPanel() {
  panel = document.getElementById('side-panel');
  panelToggleBtn = document.getElementById('panel-toggle');
  panelCloseBtn = document.getElementById('panel-close');
  
  if (!panel || !panelToggleBtn || !panelCloseBtn) {
    console.error('GeoHub: Panel elements not found');
    return;
  }
  
  // イベントリスナーを設定
  panelToggleBtn.addEventListener('click', openPanel);
  panelCloseBtn.addEventListener('click', closePanel);
  
  console.log('GeoHub: Panel initialized');
}

/**
 * パネルを開く
 */
export function openPanel() {
  if (!panel) return;
  
  panel.classList.add('open');
  panelToggleBtn.classList.add('hidden');
  isOpen = true;
}

/**
 * パネルを閉じる
 */
export function closePanel() {
  if (!panel) return;
  
  panel.classList.remove('open');
  panelToggleBtn.classList.remove('hidden');
  isOpen = false;
}

/**
 * パネルの開閉状態を切り替え
 */
export function togglePanel() {
  if (isOpen) {
    closePanel();
  } else {
    openPanel();
  }
}

/**
 * パネルのコンテンツを更新
 * @param {string|HTMLElement} content - 表示するコンテンツ
 */
export function setPanelContent(content) {
  const panelContent = document.querySelector('.panel-content');
  if (!panelContent) return;
  
  if (typeof content === 'string') {
    panelContent.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    panelContent.innerHTML = '';
    panelContent.appendChild(content);
  }
}

/**
 * パネルをクリア（プレースホルダーに戻す）
 */
export function clearPanel() {
  setPanelContent('<p class="panel-placeholder">地図上の地物をクリックしてください</p>');
}

/**
 * パネルの開閉状態を取得
 * @returns {boolean}
 */
export function isPanelOpen() {
  return isOpen;
}
