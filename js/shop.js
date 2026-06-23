const WORKER_BASE = 'https://shop.haigbeylerian.com';

document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('[data-product-id]').forEach(card => {

    async function startCheckout() {
      const productId   = card.dataset.productId;
      const btn         = card.querySelector('.tab-card-btn');
      const originalText = btn.textContent;

      card.classList.add('is-loading');
      btn.textContent = 'Loading…';

      try {
        const res = await fetch(`${WORKER_BASE}/create-checkout`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ productId }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const { url } = await res.json();
        window.location.href = url;
      } catch (err) {
        console.error('Checkout error:', err);
        card.classList.remove('is-loading');
        btn.textContent = originalText;
        alert('Something went wrong starting checkout. Please try again.');
      }
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
