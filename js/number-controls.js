/* Controles compartidos para las calculadoras, también en pantallas táctiles. */
(() => {
  'use strict';

  function enhance(input) {
    if (input.closest('.number-control') || input.readOnly) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'number-control';
    const label = Array.from(input.labels || []).map(item => item.textContent.trim()).join(' ')
      || input.getAttribute('aria-label') || input.title || input.placeholder || input.id || 'valor';
    input.before(wrapper);
    wrapper.append(input);
    const actions = document.createElement('div');
    actions.className = 'number-control-actions';
    wrapper.append(actions);

    for (const direction of [-1, 1]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = direction < 0 ? '−' : '+';
      button.setAttribute('aria-label', `${direction < 0 ? 'Disminuir' : 'Aumentar'} ${label}`);
      button.disabled = input.disabled;
      button.addEventListener('click', () => {
        if (input.disabled || input.readOnly || input.matches(':disabled')) return;
        const before = input.value;
        if (input.step === 'any') {
          // Sin paso declarado: un toque cambia una unidad sin restringir decimales escritos.
          const current = Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : 0;
          const min = input.min === '' ? -Infinity : Number(input.min);
          const max = input.max === '' ? Infinity : Number(input.max);
          input.value = String(Number(Math.min(max, Math.max(min, current + direction)).toPrecision(15)));
        } else {
          // El navegador aplica el paso, su base y los límites originales.
          direction > 0 ? input.stepUp() : input.stepDown();
        }
        if (input.value !== before) {
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
      actions.append(button);
    }
    new MutationObserver(() => {
      actions.querySelectorAll('button').forEach(button => {
        button.disabled = input.disabled || input.readOnly;
      });
    }).observe(input, { attributes: true, attributeFilter: ['disabled', 'readonly'] });
  }

  function scan(root) {
    if (root.matches?.('input[type="number"]')) enhance(root);
    root.querySelectorAll?.('input[type="number"]').forEach(enhance);
  }
  scan(document);
  new MutationObserver(records => {
    records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType === 1) scan(node);
    }));
  }).observe(document.body, { childList: true, subtree: true });
})();
