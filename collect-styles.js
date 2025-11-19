// Script para coletar estilos de uma div e todos os filhos
// Cole este script no console do navegador (F12 -> Console)

function getClassName(el) {
  if (!el.className) return null;
  if (typeof el.className === 'string') return el.className;
  if (el.className.baseVal !== undefined) return el.className.baseVal;
  if (el.className.animVal !== undefined) return el.className.animVal;
  return String(el.className);
}

function collectAllStyles(selector) {
  // Tentar múltiplas formas de seleção
  let element = null;
  
  // Se não foi fornecido seletor ou é null, tentar usar $0 (elemento selecionado no DevTools)
  if (!selector && window.$0) {
    console.log('✅ Usando elemento selecionado no DevTools ($0)');
    element = window.$0;
  }
  // Tentar o seletor original
  else if (selector) {
    try {
      element = document.querySelector(selector);
    } catch(e) {
      console.warn('Erro ao usar seletor original:', e);
    }
    
    // Se não encontrou, tentar sem escape
    if (!element) {
      try {
        const cleanSelector = selector.replace(/\\:/g, ':');
        element = document.querySelector(cleanSelector);
      } catch(e) {
        console.warn('Erro ao usar seletor limpo:', e);
      }
    }
    
    // Se ainda não encontrou, tentar encontrar por $0 (elemento selecionado no DevTools)
    if (!element && window.$0) {
      console.log('⚠️ Seletor não encontrado. Usando elemento selecionado no DevTools ($0)');
      element = window.$0;
    }
  }
  
  if (!element) {
    console.error('❌ Elemento não encontrado');
    if (selector) {
      console.error('Seletor usado:', selector);
    }
    console.log('💡 Dica: Selecione o elemento no DevTools e execute: collectAllStyles()');
    return null;
  }
  
  function getAllStylesRecursive(el, depth = 0, maxDepth = 15) {
    if (!el || depth > maxDepth) return null;
    
    const className = getClassName(el);
    const computed = window.getComputedStyle(el);
    
    const result = {
      selector: el.id ? '#' + el.id : 
                 className ? '.' + className.split(' ').filter(c => c).join('.') :
                 el.tagName.toLowerCase(),
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      className: className || null,
      depth: depth,
      styles: {},
      textContent: el.textContent ? el.textContent.substring(0, 150).trim() : null,
      children: []
    };
    
    // Coletar todos os estilos computados (apenas propriedades relevantes para performance)
    const importantProps = [
      // Layout
      'display', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content', 
      'gap', 'row-gap', 'column-gap', 'align-self', 'flex', 'flex-grow', 'flex-shrink',
      // Box Model
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
      'box-sizing', 'box-shadow',
      // Background & Colors
      'background', 'background-color', 'background-image', 'background-size', 
      'background-position', 'background-repeat', 'background-clip',
      'color', 'opacity',
      // Borders
      'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
      'border-width', 'border-style', 'border-color', 'border-radius',
      'border-top-left-radius', 'border-top-right-radius', 
      'border-bottom-left-radius', 'border-bottom-right-radius',
      // Typography
      'font-size', 'font-weight', 'font-family', 'font-style', 'font-variant',
      'line-height', 'letter-spacing', 'text-align', 'text-decoration',
      'text-transform', 'white-space', 'word-wrap', 'overflow-wrap',
      // Position
      'position', 'top', 'left', 'right', 'bottom', 'z-index',
      // Transform & Transitions
      'transform', 'transition', 'transition-duration', 'transition-timing-function',
      // Overflow
      'overflow', 'overflow-x', 'overflow-y',
      // Other
      'cursor', 'pointer-events', 'user-select', 'visibility'
    ];
    
    importantProps.forEach(prop => {
      try {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'normal' && value !== 'none' && value !== 'auto' && 
            value !== '0px' && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
          result.styles[prop] = value;
        }
      } catch(e) {
        // Ignorar propriedades que não podem ser acessadas
      }
    });
    
    // Processar filhos
    if (el.children && el.children.length > 0 && depth < maxDepth) {
      for (let i = 0; i < el.children.length; i++) {
        const child = el.children[i];
        const childStyles = getAllStylesRecursive(child, depth + 1, maxDepth);
        if (childStyles) {
          result.children.push(childStyles);
        }
      }
    }
    
    return result;
  }
  
  return getAllStylesRecursive(element);
}

// Versão simplificada - apenas estilos principais (mais rápida)
function collectStylesSimple(selector) {
  let element = null;
  
  // Se não foi fornecido seletor, usar $0
  if (!selector && window.$0) {
    element = window.$0;
  }
  // Tentar o seletor
  else if (selector) {
    try {
      element = document.querySelector(selector);
    } catch(e) {
      console.warn('Erro ao usar seletor:', e);
    }
    
    if (!element && window.$0) {
      element = window.$0;
    }
  }
  
  if (!element) {
    console.error('Elemento não encontrado');
    return null;
  }
  
  const result = {};
  
  function processElement(el, prefix = '', depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return;
    
    const computed = getComputedStyle(el);
    const className = getClassName(el);
    const classKey = className ? '.' + className.split(' ').filter(c => c).join('.') : el.tagName.toLowerCase();
    const key = prefix ? prefix + ' > ' + classKey : classKey;
    
    const importantProps = [
      'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
      'padding', 'margin', 'width', 'height', 'min-width', 'max-width',
      'background-color', 'background', 'color', 'border', 'border-radius',
      'font-size', 'font-weight', 'font-family', 'line-height',
      'box-sizing', 'position', 'top', 'left', 'right', 'bottom',
      'z-index', 'opacity', 'transform', 'transition', 'box-shadow'
    ];
    
    result[key] = {
      tagName: el.tagName.toLowerCase(),
      id: el.id || null,
      styles: {}
    };
    
    importantProps.forEach(prop => {
      try {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'normal' && value !== 'none' && value !== 'auto' && 
            value !== '0px' && value !== 'rgba(0, 0, 0, 0)') {
          result[key].styles[prop] = value;
        }
      } catch(e) {}
    });
    
    // Processar filhos
    if (el.children && el.children.length > 0 && depth < maxDepth) {
      for (let i = 0; i < el.children.length; i++) {
        processElement(el.children[i], key, depth + 1, maxDepth);
      }
    }
  }
  
  processElement(element);
  return result;
}

// Exportar funções globalmente
window.collectAllStyles = collectAllStyles;
window.collectStylesSimple = collectStylesSimple;

console.log('✅ Funções carregadas!');
console.log('');
console.log('📖 INSTRUÇÕES DE USO:');
console.log('');
console.log('OPÇÃO 1 - Usando seletor:');
console.log('  collectAllStyles("#node-0_7_container > div > div.flex-1...")');
console.log('');
console.log('OPÇÃO 2 - Usando elemento selecionado no DevTools (RECOMENDADO):');
console.log('  1. Abra o DevTools (F12)');
console.log('  2. Selecione o elemento na aba Elements/Inspector');
console.log('  3. No console, digite: collectAllStyles() ou collectAllStyles(null)');
console.log('     (O script usará automaticamente o $0 - elemento selecionado)');
console.log('');
console.log('OPÇÃO 3 - Versão simplificada (mais rápida):');
console.log('  collectStylesSimple() ou collectStylesSimple("seu-seletor")');
console.log('');
console.log('💾 Para copiar o resultado:');
console.log('  copy(JSON.stringify(collectAllStyles(), null, 2))');
console.log('');
console.log('💡 Dica: Se você selecionou o elemento no DevTools, pode usar apenas:');
console.log('  copy(JSON.stringify(collectAllStyles(), null, 2))');

