const WORKER_BASE = 'https://shop.haigbeylerian.com';

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('[data-product-id]').forEach(card => {

    function startCheckout() {
      const productId = card.dataset.productId;
      const btn       = card.querySelector('.tab-card-btn');
      card.classList.add('is-loading');
      if (btn) btn.textContent = 'Loading…';

      const form    = document.createElement('form');
      form.method   = 'POST';
      form.action   = `${WORKER_BASE}/create-checkout`;
      const input   = document.createElement('input');
      input.type    = 'hidden';
      input.name    = 'productId';
      input.value   = productId;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
    }

    card.addEventListener('click', startCheckout);

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startCheckout();
      }
    });

  });

});
