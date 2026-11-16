(() => {
  'use strict';

  const WHATSAPP_NUMBER = '5517981912146';
  const CLINIC_ADDRESS =
    'Av. Domingos Falavina, 1700 - Jardim Marajó I, São José do Rio Preto - SP, CEP 15045-395';

  /**
   * Calcula o status em tempo real da Corpus considerando o horário local
   * e a regra de funcionamento em dois turnos com intervalo das 12:00 às 15:00.
   * @param {Date} [now]
   * @returns {{ state: 'open' | 'lunch' | 'closed', icon: string, label: string, detail: string }}
   */
  function getClinicStatus(now = new Date()) {
    const day = now.getDay(); // 0 = Domingo, 1..5 = Seg..Sex, 6 = Sábado
    const minutes = now.getHours() * 60 + now.getMinutes();

    if (day >= 1 && day <= 5) {
      if (minutes >= 360 && minutes < 720) {
        return {
          state: 'open',
          icon: '🟢',
          label: 'Aberto agora',
          detail: 'Turno da manhã • Fecha às 12:00 para almoço'
        };
      }
      if (minutes >= 720 && minutes < 900) {
        return {
          state: 'lunch',
          icon: '🟡',
          label: 'Pausa almoço • Reabre às 15:00',
          detail: 'Atendimento suspenso das 12:00 às 15:00'
        };
      }
      if (minutes >= 900 && minutes < 1260) {
        return {
          state: 'open',
          icon: '🟢',
          label: 'Aberto agora',
          detail: 'Turno tarde/noite • Fecha às 21:00'
        };
      }
      return {
        state: 'closed',
        icon: '🔴',
        label: 'Fechado agora',
        detail: 'Atendimento em 2 turnos (Manhã até 12h • Tarde após 15h)'
      };
    }

    if (day === 6) {
      if (minutes >= 480 && minutes < 720) {
        return {
          state: 'open',
          icon: '🟢',
          label: 'Aberto agora',
          detail: 'Turno de sábado • Fecha às 12:00'
        };
      }
      return {
        state: 'closed',
        icon: '🔴',
        label: 'Fechado agora',
        detail: 'Reabre no próximo turno comercial'
      };
    }

    return {
      state: 'closed',
      icon: '🔴',
      label: 'Fechado agora',
      detail: 'Reabre no próximo turno comercial'
    };
  }

  /**
   * Atualiza todos os badges e detalhes de status na página.
   */
  function updateClinicStatusUI() {
    const status = getClinicStatus(new Date());
    const badges = document.querySelectorAll('[data-status-badge]');
    const details = document.querySelectorAll('[data-status-detail]');

    badges.forEach((badge) => {
      badge.textContent = `${status.icon} ${status.label}`;
      badge.classList.remove('status-pill--open', 'status-pill--lunch', 'status-pill--closed');
      badge.classList.add(`status-pill--${status.state}`);
    });

    details.forEach((detailEl) => {
      detailEl.textContent = status.detail;
    });
  }

  /**
   * Inicializa o Simulador Interativo de Triagem Rápida (2 passos).
   */
  function initTriageSimulator() {
    const state = {
      focus: 'Emagrecimento Integrado',
      shift: 'Manhã (até 12h)'
    };

    const focusChip = document.getElementById('summaryFocusChip');
    const shiftChip = document.getElementById('summaryShiftChip');
    const previewText = document.getElementById('triagePreviewText');
    const whatsappBtn = document.getElementById('triageWhatsappBtn');

    if (!whatsappBtn || !previewText) return;

    function syncTriageUI() {
      const message = `Olá! Vim pelo site da Corpus Saúde. Meu foco hoje é ${state.focus} e tenho preferência pelo turno da ${state.shift}. Gostaria de informações sobre horários e aula experimental.`;

      if (focusChip) focusChip.textContent = state.focus;
      if (shiftChip) shiftChip.textContent = state.shift;
      previewText.textContent = `"${message}"`;
      whatsappBtn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    }

    const groups = document.querySelectorAll('[data-triage-group]');
    groups.forEach((groupEl) => {
      const groupName = groupEl.getAttribute('data-triage-group');
      const buttons = groupEl.querySelectorAll('.triage-option');

      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          buttons.forEach((item) => {
            item.classList.remove('is-selected');
            item.setAttribute('aria-checked', 'false');
          });

          btn.classList.add('is-selected');
          btn.setAttribute('aria-checked', 'true');

          const selectedValue = btn.getAttribute('data-value');
          if (groupName === 'focus' && selectedValue) {
            state.focus = selectedValue;
          } else if (groupName === 'shift' && selectedValue) {
            state.shift = selectedValue;
          }

          syncTriageUI();
        });
      });
    });

    syncTriageUI();
  }

  /**
   * Inicializa botão de copiar endereço com fallback seguro.
   */
  function initCopyAddress() {
    const copyBtn = document.getElementById('copyAddressBtn');
    const copyLabel = document.getElementById('copyAddressLabel');
    if (!copyBtn || !copyLabel) return;

    let resetTimer = null;

    function showCopiedFeedback() {
      copyLabel.textContent = 'Endereço copiado!';
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        copyLabel.textContent = 'Copiar endereço';
      }, 2500);
    }

    copyBtn.addEventListener('click', async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(CLINIC_ADDRESS);
          showCopiedFeedback();
          return;
        }
      } catch (_err) {
        // Segue para fallback abaixo
      }

      const tempInput = document.createElement('textarea');
      tempInput.value = CLINIC_ADDRESS;
      tempInput.setAttribute('readonly', '');
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      document.body.appendChild(tempInput);
      tempInput.select();
      try {
        document.execCommand('copy');
        showCopiedFeedback();
      } finally {
        document.body.removeChild(tempInput);
      }
    });
  }

  /**
   * Inicializa menu responsivo no header mobile.
   */
  function initMobileMenu() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const drawer = document.getElementById('mobileNavDrawer');
    if (!toggleBtn || !drawer) return;

    function setOpen(isOpen) {
      drawer.hidden = !isOpen;
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
    }

    toggleBtn.addEventListener('click', () => {
      const currentlyOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
      setOpen(!currentlyOpen);
    });

    drawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
  }

  /**
   * Registra o Service Worker e gerencia o prompt de instalação PWA.
   */
  function initPwaFeatures() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((err) => {
          console.warn('Falha ao registrar Service Worker:', err);
        });
      });
    }

    const installBanner = document.getElementById('pwaInstallBanner');
    const installConfirmBtn = document.getElementById('pwaInstallConfirmBtn');
    const installDismissBtn = document.getElementById('pwaInstallDismissBtn');
    const installHeaderBtn = document.getElementById('installPwaHeaderBtn');
    const installCardBtn = document.getElementById('installPwaCardBtn');

    const modal = document.getElementById('pwaInstructionModal');
    const modalBody = document.getElementById('pwaModalBody');
    const modalCloseBtn = document.getElementById('pwaModalCloseBtn');

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    let deferredPrompt = null;

    if (isStandalone) {
      if (installHeaderBtn) installHeaderBtn.hidden = true;
      if (installBanner) installBanner.hidden = true;
      return;
    }

    function openManualModal() {
      if (!modal) return;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (modalBody) {
        modalBody.innerHTML = isIOS
          ? 'No Safari do seu iPhone/iPad, toque no ícone de <strong>Compartilhar</strong> na barra inferior e escolha <strong>“Adicionar à Tela de Início”</strong>.'
          : 'No menu do seu navegador (canto superior direito <strong>⋮</strong>), selecione <strong>“Instalar aplicativo”</strong> ou <strong>“Adicionar à tela inicial”</strong>.';
      }
      modal.hidden = false;
    }

    async function handleInstallClick() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        if (choice && choice.outcome === 'accepted' && installBanner) {
          installBanner.hidden = true;
        }
      } else {
        openManualModal();
      }
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;

      if (installBanner && sessionStorage.getItem('corpusPwaDismissed') !== '1') {
        installBanner.hidden = false;
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      if (installBanner) installBanner.hidden = true;
      if (installHeaderBtn) installHeaderBtn.hidden = true;
    });

    if (installConfirmBtn) installConfirmBtn.addEventListener('click', handleInstallClick);
    if (installHeaderBtn) installHeaderBtn.addEventListener('click', handleInstallClick);
    if (installCardBtn) installCardBtn.addEventListener('click', handleInstallClick);

    if (installDismissBtn && installBanner) {
      installDismissBtn.addEventListener('click', () => {
        installBanner.hidden = true;
        sessionStorage.setItem('corpusPwaDismissed', '1');
      });
    }

    if (modalCloseBtn && modal) {
      modalCloseBtn.addEventListener('click', () => {
        modal.hidden = true;
      });
      modal.addEventListener('click', (event) => {
        if (event.target === modal) {
          modal.hidden = true;
        }
      });
    }
  }

  /**
   * Inicialização geral após carregamento do DOM.
   */
  document.addEventListener('DOMContentLoaded', () => {
    updateClinicStatusUI();
    setInterval(updateClinicStatusUI, 30000);

    initTriageSimulator();
    initCopyAddress();
    initMobileMenu();
    initPwaFeatures();
  });
})();
