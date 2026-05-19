document.addEventListener('DOMContentLoaded', function () {

    // ===================== UTIL: ESCAPE HTML =====================
    function escapeHtml(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    // ===================== REGISTRAZIONE =====================

    const formReg = document.getElementById('formRegistrazione');

    if (formReg) {
        formReg.addEventListener('submit', function (e) {
            e.preventDefault();

            const feedback = document.getElementById('feedback');
            const btnInvia = this.querySelector('button[type="submit"]');
            const dati     = new FormData(this);

            feedback.innerHTML = '';
            if (btnInvia) { btnInvia.disabled = true; btnInvia.textContent = 'Attendere…'; }

            fetch('/GoalToGo/api/api_signin.php', {
                method: 'POST',
                body: dati,
                credentials: 'include'
            })
            .then(res => res.text())   // testo grezzo prima — così se il server manda HTML non esplode
            .then(raw => {
                let data;
                try {
                    data = JSON.parse(raw);
                } catch (_) {
                    // Il server ha risposto con HTML (errore PHP o DB offline)
                    console.error('Risposta non-JSON:', raw);
                    feedback.innerHTML = '<p class="error">Errore del server. Controlla che XAMPP/MySQL sia attivo e che il database "goaltogo" esista.</p>';
                    return;
                }

                if (data.status === 'success') {
                    if (data.tipo && data.id) {
                        localStorage.setItem('tipoUtente', data.tipo);
                        localStorage.setItem('idUtente',   data.id);
                        localStorage.setItem('nomeUtente', (data.user && data.user.nickname) || '');
                    }
                    feedback.innerHTML = `<p class="success">${data.message}</p>`;
                    this.reset();
                    window.location.href = data.tipo === 'gestore' ? 'pagina_campi_gestore.html' : 'home_page.html';
                } else {
                    feedback.innerHTML = `<p class="error">${data.message ?? 'Errore sconosciuto'}</p>`;
                    if (data.detail) console.error('Dettaglio:', data.detail);
                }
            })
            .catch(err => {
                console.error('Fetch fallita:', err);
                feedback.innerHTML = '<p class="error">Impossibile raggiungere il server. Controlla che XAMPP sia avviato.</p>';
            })
            .finally(() => {
                if (btnInvia) { btnInvia.disabled = false; btnInvia.textContent = 'Inizia'; }
            });
        });
    }

    // ===================== LOGIN =====================

    const formLog = document.getElementById('formLogin');

    if (formLog) {
        formLog.addEventListener('submit', function (e) {
            e.preventDefault();

            const dati   = new FormData(this);
            const btnLog = this.querySelector('button[type="submit"]');
            if (btnLog) { btnLog.disabled = true; btnLog.textContent = 'Attendere…'; }

            fetch('/GoalToGo/api/api_login.php', {
                method: 'POST',
                body: dati,
                credentials: 'include'
            })
            .then(res => res.text())
            .then(raw => {
                let data;
                try { data = JSON.parse(raw); }
                catch (_) {
                    console.error('Risposta non-JSON dal login:', raw);
                    Swal.fire({ title: 'Errore server', text: 'Controlla che XAMPP/MySQL sia attivo.', icon: 'error' });
                    return;
                }
                if (data.status === 'success') {
                    localStorage.setItem('tipoUtente', data.tipo);
                    localStorage.setItem('idUtente',   data.id);
                    localStorage.setItem('nomeUtente', data.user?.nickname ?? data.nickname ?? '');
                    Swal.fire({ title: 'Ottimo!', text: 'Login effettuato!', icon: 'success', timer: 1500, showConfirmButton: false })
                        .then(() => {
                            window.location.href = data.tipo === 'gestore' ? 'pagina_campi_gestore.html' : 'home_page.html';
                        });
                } else {
                    Swal.fire({ title: 'Errore', text: data.message ?? 'Credenziali non valide', icon: 'error' });
                }
            })
            .catch(err => {
                console.error('Fetch login fallita:', err);
                Swal.fire({ title: 'Errore', text: 'Impossibile raggiungere il server.', icon: 'error' });
            })
            .finally(() => {
                if (btnLog) { btnLog.disabled = false; btnLog.textContent = 'Accedi'; }
            });
        });
    }

    // ===================== FORM CAMPO =====================

    const formCampo = document.getElementById('formCampo');
    let orariSelezionati = [];

    window.toggleOrario = function (btn) {
        btn.classList.toggle('active');

        const valore = btn.innerText;

        if (orariSelezionati.includes(valore)) {
            orariSelezionati = orariSelezionati.filter(o => o !== valore);
        } else {
            orariSelezionati.push(valore);
        }

        console.log('Orari selezionati:', orariSelezionati);
    };

    if (formCampo) {
        formCampo.addEventListener('submit', function (e) {
            e.preventDefault();

            // Slot orari sono fissi (10-22, 12 slot da 1h): il backend li genera in automatico.
            const payload = {
                nome:       document.getElementById('nome').value,
                indirizzo:  document.getElementById('indirizzo').value,
                citta:      document.getElementById('citta').value,
                prezzo:     document.getElementById('prezzo').value
            };

            console.log('INVIO CAMPO:', payload);

            fetch('/GoalToGo/api/api_registrazione_campo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        title: 'Campo creato!',
                        text: 'Registrazione completata con successo',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    })
                    .then(() => {
                        window.location.href = 'pagina_campi_gestore.html';
                    });
                } else {
                    Swal.fire({
                        title: 'Errore',
                        text: data.message,
                        icon: 'error'
                    });
                }
            })
            .catch(err => {
                console.error(err);
                Swal.fire({
                    title: 'Errore',
                    text: 'Errore di comunicazione col server',
                    icon: 'error'
                });
            });
        });
    }

    // ===================== LISTA CAMPI GESTORE =====================

    const listaCampiContainer = document.getElementById('listaCampi');

    if (listaCampiContainer) {
        const utenteId = localStorage.getItem('idUtente');

        console.log('ID RECUPERATO:', utenteId);

        if (!utenteId) {
            console.error('Utente non loggato');
            return;
        }

        const dati = new FormData();

        fetch('/GoalToGo/api/api_get_campi.php', {
            method: 'POST',
            body: dati,
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            console.log('CAMPI RICEVUTI:', data);

            if (data.status === 'success') {
                const campi = data.campi;

                const numCampiEl = document.getElementById('numCampi');
                if (numCampiEl) {
                    animateCount(numCampiEl, campi.length);
                }

                let totaleSlot = 0;
                campi.forEach(campo => {
                    if (campo.orari && Array.isArray(campo.orari)) {
                        totaleSlot += campo.orari.length;
                    }
                });

                const numSlotEl = document.getElementById('numSlot');
                if (numSlotEl) {
                    animateCount(numSlotEl, totaleSlot);
                }

                if (!campi || campi.length === 0) {
                    listaCampiContainer.innerHTML = `
                        <div class="empty-state" role="status">
                            <div class="empty-state__icon" aria-hidden="true">⚽</div>
                            <h3>Nessun campo registrato</h3>
                            <p>Aggiungi il tuo primo campo per iniziare a ricevere prenotazioni.</p>
                        </div>`;
                    return;
                }

                listaCampiContainer.innerHTML = '';

                campi.forEach(campo => {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'campo-card';

let orariHTML = '';

if (!campo.orari || campo.orari.length === 0) {
    orariHTML = '<p>Nessun orario disponibile</p>';
} else {
    campo.orari.forEach(orario => {
    const inizio      = orario.inizio.slice(0, 5);
    const fine        = orario.fine.slice(0, 5);
    const disponibile = orario.disponibile == 1;
    const colore      = disponibile ? 'fascia--verde' : 'fascia--rosso';
    const stato       = disponibile ? 'disponibile' : 'occupato';

    orariHTML += `
        <button class="fascia-btn ${colore}"
                type="button"
                data-orario-id="${orario.id}"
                data-disponibile="${disponibile ? '1' : '0'}"
                aria-label="${inizio}-${fine}, ${stato}">
            ${inizio}-${fine}
        </button>
    `;
});
}

cardDiv.innerHTML = `
    <div class="campo-card-header">
        <div class="campo-icon">⚽</div>
        <span class="campo-nome">${escapeHtml(campo.NOME)}</span>
    </div>

    <div class="legenda">
        <span class="legenda-item">
            <span class="pallino pallino--verde"></span> Disponibile
        </span>
        <span class="legenda-item">
            <span class="pallino pallino--rosso"></span> Occupato
        </span>
    </div>

    <div class="fasce-label">FASCE ORARIE OGGI</div>

    <div class="fasce-orarie">
        ${orariHTML}
    </div>
`;

cardDiv.querySelectorAll('.fascia-btn[data-orario-id]').forEach(btn => {
    btn.addEventListener('click', function (e) {
        e.stopPropagation(); // non aprire pagina_gestione_campo.html

        const orarioId    = this.dataset.orarioId;
        const attuale     = this.dataset.disponibile === '1';
        const nuovoStato  = !attuale;
        const testoConferma = nuovoStato
            ? `Vuoi segnare ${this.textContent.trim()} come disponibile?`
            : `Vuoi segnare ${this.textContent.trim()} come occupato?\n(prenotazione telefonica)`;

        Swal.fire({
            title: nuovoStato ? 'Segna disponibile' : 'Segna occupato',
            text: testoConferma,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: nuovoStato ? '#4caf50' : '#e53935',
            cancelButtonColor: '#505050',
            confirmButtonText: 'Conferma',
            cancelButtonText: 'Annulla'
        }).then(result => {
            if (!result.isConfirmed) return;

            fetch('/GoalToGo/api/api_aggiorna_disponibilita.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orari: [{ id: parseInt(orarioId), disponibile: nuovoStato }]
                }),
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    // aggiorna il bottone visivamente senza ricaricare la pagina
                    this.dataset.disponibile = nuovoStato ? '1' : '0';
                    this.classList.remove('fascia--verde', 'fascia--rosso');
                    this.classList.add(nuovoStato ? 'fascia--verde' : 'fascia--rosso');
                    this.setAttribute('aria-label',
                        this.textContent.trim() + ', ' + (nuovoStato ? 'disponibile' : 'occupato'));

                    Swal.fire({
                        title: nuovoStato ? 'Slot liberato' : 'Slot occupato',
                        icon: 'success',
                        timer: 1200,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({ title: 'Errore', text: data.message, icon: 'error' });
                }
            })
            .catch(err => {
                console.error(err);
                Swal.fire({ title: 'Errore', text: 'Errore di comunicazione', icon: 'error' });
            });
        });
    });
});

                    listaCampiContainer.appendChild(cardDiv);
                });

            } else {
                console.error('Errore:', data.message);
                listaCampiContainer.innerHTML = '<p>Errore nel caricamento dei campi</p>';
            }
        })
        .catch(err => {
            console.error('Errore fetch campi:', err);
            listaCampiContainer.innerHTML = '<p>Errore di comunicazione col server</p>';
        });
    }
    // ===================== CERCA PARTITA =====================

    let partitaSearchPerformed = false;

    function buildSearchUrl() {
        const formEl = document.getElementById('form_partita');
        const params = new URLSearchParams();
        if (formEl) {
            const fd = new FormData(formEl);
            const nome = fd.get('nome_partita');
            if (nome) params.set('nome_partita', nome);
        }
        document.querySelectorAll('.chip-row .chip--active[data-filter]').forEach(chip => {
            const [k, v] = chip.dataset.filter.split('=');
            if (k && v) params.set(k, v);
        });
        return '/GoalToGo/api/api_cerca_partita.php?' + params.toString();
    }

    function eseguiRicercaPartita() {
        fetch(buildSearchUrl(), { credentials: 'include' })
            .then(res => res.json())
            .then(partite => { mostraPartite(partite); partitaSearchPerformed = true; })
            .catch(err => console.error("Errore ricerca", err));
    }

    const formPartita = document.getElementById('form_partita');
    if (formPartita) {
        formPartita.addEventListener('submit', function (e) {
            e.preventDefault();
            eseguiRicercaPartita();
        });

        // Re-run search when chips change (anche prima della prima submit)
        document.querySelectorAll('.chip-row').forEach(row => {
            row.addEventListener('click', e => {
                if (!e.target.closest('.chip')) return;
                // delay so the chip toggle handler fires first
                setTimeout(eseguiRicercaPartita, 0);
            });
        });

        // Auto-load: appena la pagina apre, mostriamo le partite di oggi.
        eseguiRicercaPartita();
    }

    // ===================== LE MIE PARTITE (sezione in pagina trova) =====================
    const miePartiteEl = document.getElementById('miePartiteList');
    if (miePartiteEl) {
        fetch('/GoalToGo/api/api_mie_partite.php', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success' || !Array.isArray(data.partite) || data.partite.length === 0) {
                    miePartiteEl.innerHTML = `
                      <div class="empty-state" role="status" style="padding: var(--s-4);">
                        <p>Non sei iscritto a nessuna partita. Cercane una o creane una nuova.</p>
                      </div>`;
                    return;
                }
                miePartiteEl.innerHTML = data.partite.map(p => {
                    const stato = p.STATO === 'confermata' ? '✓ Confermata' : 'In attesa';
                    const pillCls = p.STATO === 'confermata' ? 'pill--success' : 'pill--info';
                    const orario = p.ORARIO ? p.ORARIO.replace('T', ' ') : '';
                    return `
                      <button type="button" class="card" data-partita-id="${escapeHtml(p.ID)}" data-num-giocatori="${escapeHtml(p.NUM_GIOCATORI)}">
                        <div>
                          <h4 class="titolo">${escapeHtml(p.NOME)}</h4>
                          <span class="text-white">${escapeHtml(p.NOME_CAMPO ?? 'Campo n/d')} · ${escapeHtml(orario)}</span><br>
                          <span class="pill ${pillCls}" style="margin-top: var(--s-1); display: inline-block;">${stato}</span>
                          <span class="text-white" style="margin-left: var(--s-2);">Sei in Squadra ${escapeHtml(p.SQUADRA || 'A')}</span>
                        </div>
                        <div class="campo-right">
                          <strong class="titolo">${escapeHtml(p.NUM_GIOCATORI)}/${escapeHtml(p.MAX_GIOCATORI)}</strong>
                        </div>
                      </button>`;
                }).join('');
                // wire click → naviga al dettaglio partita
                miePartiteEl.querySelectorAll('.card[data-partita-id]').forEach(card => {
                    card.addEventListener('click', () => {
                        localStorage.setItem('idPartita', card.dataset.partitaId);
                        localStorage.setItem('count-player', card.dataset.numGiocatori || '0');
                        window.location.href = 'pagina_trova_partita_seconda.html';
                    });
                });
            })
            .catch(err => console.error('Errore fetch mie partite:', err));
    }
    function mostraPartite(partite) {
        const container = document.getElementById('conteiner_partite');
        if (!container) return;

        container.innerHTML = '';

        if (partite.status === 'error') {
            container.innerHTML = `
                <div class="empty-state" role="status">
                    <div class="empty-state__icon" aria-hidden="true">⚽</div>
                    <h3>Nessuna partita trovata</h3>
                    <p>${partite.message}</p>
                </div>`;
            return;
        }

        if (!Array.isArray(partite) || partite.length === 0) {
            container.innerHTML = `
                <div class="empty-state" role="status">
                    <div class="empty-state__icon" aria-hidden="true">⚽</div>
                    <h3>Nessuna partita trovata</h3>
                    <p>Prova a modificare i filtri di ricerca o crea una nuova partita.</p>
                </div>`;
            return;
        }

        partite.forEach(p => {
            container.innerHTML += `
                <button type="button" class="card" onclick="handleClick('trova-partita-seconda', this)"
                        data-partita-id="${escapeHtml(p.ID ?? '')}"
                        data-num-giocatori="${escapeHtml(p.NUM_GIOCATORI ?? 0)}">
                    <div>
                        <h4 class="titolo">${escapeHtml(p.NOME)}</h4>
                        <span class="text-white">${escapeHtml(p.INDIRIZZO ?? 'Indirizzo non disponibile')}</span><br>
                        <span class="text-white">${escapeHtml(p.ORARIO)}</span>
                    </div>
                    <div class="campo-right">
                        <strong class="titolo">${escapeHtml(p.NUM_GIOCATORI)}/10</strong>
                    </div>
                </button>`;
        });
    }

    // ===================== DATA OGGI =====================

    const dataOggi = document.getElementById('data-oggi');

    if (dataOggi) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        dataOggi.textContent = new Date().toLocaleDateString('it-IT', options);
    }

    const dataOggiLega = document.getElementById('data-oggi-lega');
    if (dataOggiLega) {
        const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        dataOggiLega.textContent = new Date().toLocaleDateString('it-IT', opts);
    }

    // ===================== FORM CREA CLUB =====================

    const formCreaClub = document.getElementById('formCreaClub');

    if (formCreaClub) {
        formCreaClub.addEventListener('submit', function (e) {
            e.preventDefault();

            const payload = {
                nome:          document.getElementById('nomeClub').value,
                descrizione:   document.getElementById('descrizioneClub').value,
                visibilita:    localStorage.getItem('clubVisibility') || 'pubblico',
                n_componenti:  parseInt(document.getElementById('club-count').textContent)
            };

            fetch('/GoalToGo/api/api_crea_club.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        title: 'Club creato!',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    })
                    .then(() => {
                        localStorage.setItem('idClub', data.id_club);
                        window.location.href = 'pagina_club.html';
                    });
                } else {
                    Swal.fire({ title: 'Errore', text: data.message, icon: 'error' });
                }
            })
            .catch(err => {
                console.error(err);
                Swal.fire({ title: 'Errore', text: 'Errore di comunicazione', icon: 'error' });
            });
        });
    }

    // ===================== STAT-CARD COUNT-UP =====================

    function animateCount(el, target, duration = 800) {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            el.textContent = target;
            return;
        }
        const start = 0;
        const startTime = performance.now();
        function tick(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            el.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    // ===================== BOTTOM NAV ACTIVE STATE =====================

    const navItems = document.querySelectorAll('.bottom-nav__item');
    if (navItems.length && !document.querySelector('.bottom-nav__item.is-active')) {
        const currentPath = window.location.pathname.split('/').pop();
        navItems.forEach(item => {
            const itemPath = item.getAttribute('href')?.split('/').pop();
            if (itemPath && itemPath === currentPath) {
                item.classList.add('is-active');
                item.setAttribute('aria-current', 'page');
            }
        });
    }

    // ===================== CLUB ITEM NAVIGATION =====================

    const clubItems = document.querySelectorAll('.club-item');
    if (clubItems.length) {
        clubItems.forEach(item => {
            const navigate = () => {
                const clubId = item.dataset.clubId;
                if (clubId) localStorage.setItem('idClub', clubId);
                window.location.href = 'pagina_dettaglio_club.html';
            };
            item.addEventListener('click', navigate);
            item.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate();
                }
            });
        });
    }

    // ===================== PAGINA CLUB - IL MIO CLUB =====================

    const mioClubEl = document.getElementById('mioClubSection');
    if (mioClubEl) {
        fetch('/GoalToGo/api/api_profilo.php', { credentials: 'include' })
            .then(r => r.json())
            .then(prof => {
                if (prof.status !== 'success' || !prof.profilo) {
                    mioClubEl.innerHTML = '';
                    return;
                }
                const fkClub = prof.profilo.fk_club;
                if (!fkClub) {
                    mioClubEl.innerHTML = `
                        <div class="empty-state" role="status">
                          <div class="empty-state__icon" aria-hidden="true">👥</div>
                          <h3>Non sei in nessun club</h3>
                          <p>Unisciti a un club esistente o creane uno nuovo.</p>
                        </div>`;
                    return;
                }
                // Recupero il club di cui sono membro
                fetch(`/GoalToGo/api/api_get_club.php?id=${encodeURIComponent(fkClub)}`, { credentials: 'include' })
                  .then(r => r.json())
                  .then(d => {
                      if (d.status !== 'success' || !d.club) {
                          mioClubEl.innerHTML = '';
                          return;
                      }
                      const c = d.club;
                      localStorage.setItem('idClub', c.ID);
                      mioClubEl.innerHTML = `
                          <div class="play"><h3>Il mio club</h3></div>
                          <a class="card" href="pagina_dettaglio_club.html" data-club-id="${escapeHtml(c.ID)}" style="border-color: var(--brand);">
                            <div>
                              <h4 class="titolo">${escapeHtml(c.NOME)}</h4>
                              <span class="text-white">${escapeHtml(c.membri_totali ?? 0)} / ${escapeHtml(c.N_COMPONENTI)} membri</span>
                            </div>
                            <div class="campo-right"><strong class="titolo">→</strong></div>
                          </a>
                          <a href="pagina_chat_club.html"
                             class="btn btn--primary"
                             style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:var(--s-3);text-decoration:none;padding:14px;border-radius:var(--r-md);font-weight:700;font-size:var(--text-md);background:var(--brand);color:#000;">
                            💬 Entra nella chat del club
                          </a>
                          <button type="button" id="btnLeaveMioClub"
                             class="btn btn--secondary"
                             style="margin-top:var(--s-2);width:100%;">
                            Esci dal club
                          </button>`;
                      const card = mioClubEl.querySelector('.card[data-club-id]');
                      if (card) card.addEventListener('click', () => localStorage.setItem('idClub', card.dataset.clubId));
                      const btnLeaveMio = document.getElementById('btnLeaveMioClub');
                      if (btnLeaveMio) {
                          btnLeaveMio.addEventListener('click', () => {
                              Swal.fire({
                                  title: 'Vuoi davvero uscire?',
                                  text: 'Lascerai il club ' + c.NOME,
                                  icon: 'warning', showCancelButton: true,
                                  confirmButtonText: "Sì, esci", cancelButtonText: 'Annulla'
                              }).then(res => {
                                  if (!res.isConfirmed) return;
                                  fetch('/GoalToGo/api/api_leave_club.php', { method: 'POST', credentials: 'include' })
                                      .then(r => r.json())
                                      .then(d => {
                                          if (d.status === 'success') {
                                              localStorage.removeItem('idClub');
                                              Swal.fire({ title: 'Hai lasciato il club', icon: 'success', timer: 1200, showConfirmButton: false })
                                                  .then(() => window.location.reload());
                                          } else {
                                              Swal.fire({ title: 'Errore', text: d.message, icon: 'error' });
                                          }
                                      });
                              });
                          });
                      }
                  });
            })
            .catch(err => console.error('Errore fetch mio club:', err));
    }

    // ===================== PAGINA CLUB - LISTA CLUB =====================

    const clubListEl = document.getElementById('clubList');
    if (clubListEl) {
        const emptyClubState = '<div class="empty-state" role="status">' +
            '<div class="empty-state__icon" aria-hidden="true">👥</div>' +
            '<h3>Nessun club</h3><p>Crea il primo club da qui.</p></div>';
        const noResultsState = (q) => '<div class="empty-state" role="status">' +
            '<div class="empty-state__icon" aria-hidden="true">🔍</div>' +
            '<h3>Nessun risultato</h3><p>Nessun club trovato per &laquo;' + escapeHtml(q) + '&raquo;.</p></div>';

        function renderClubList(clubs, query) {
            if (!Array.isArray(clubs) || clubs.length === 0) {
                clubListEl.innerHTML = query ? noResultsState(query) : emptyClubState;
                return;
            }
            clubListEl.innerHTML = clubs.map(c => `
                <a class="club-item" href="pagina_dettaglio_club.html" data-club-id="${escapeHtml(c.ID)}">
                  <div class="club-info">
                    <strong>${escapeHtml(c.NOME)}</strong>
                    <span>${escapeHtml(c.membri_totali ?? 0)} / ${escapeHtml(c.N_COMPONENTI)} membri</span>
                  </div>
                  <span class="status open">aperto</span>
                </a>
            `).join('');
            clubListEl.querySelectorAll('.club-item').forEach(item => {
                item.addEventListener('click', () => {
                    localStorage.setItem('idClub', item.dataset.clubId);
                });
            });
        }

        function caricaClubs(query) {
            const url = query
                ? '/GoalToGo/api/api_get_club.php?nome=' + encodeURIComponent(query)
                : '/GoalToGo/api/api_get_club.php';
            return fetch(url, { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    if (data.status !== 'success' || !Array.isArray(data.clubs)) {
                        clubListEl.innerHTML = query ? noResultsState(query) : emptyClubState;
                        return;
                    }
                    renderClubList(data.clubs, query);
                })
                .catch(err => console.error('Errore fetch clubs:', err));
        }

        // load iniziale
        caricaClubs('');

        // ricerca live con debounce
        const searchInput = document.getElementById('searchClub');
        if (searchInput) {
            let debounceTimer = null;
            const onChange = () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    caricaClubs(searchInput.value.trim());
                }, 250);
            };
            searchInput.addEventListener('input', onChange);
            searchInput.addEventListener('search', onChange); // tasto X dentro al type=search
        }
    }

    // ===================== PAGINA DETTAGLIO CLUB =====================

    const clubBannerEl = document.getElementById('clubBanner');
    const giocatoriListEl = document.getElementById('giocatori-list');
    const clubActionsEl = document.getElementById('clubActions');
    if (clubBannerEl || giocatoriListEl) {
        const clubIdSelected = localStorage.getItem('idClub');
        if (!clubIdSelected) {
            if (clubBannerEl) clubBannerEl.innerHTML = '<p>Nessun club selezionato.</p>';
        } else {
            // Carico in parallelo: dettaglio club, membri, e profilo (per sapere se sono iscritto qui)
            const fetchClub    = fetch(`/GoalToGo/api/api_get_club.php?id=${encodeURIComponent(clubIdSelected)}`, { credentials: 'include' }).then(r => r.json());
            const fetchProfilo = fetch('/GoalToGo/api/api_profilo.php', { credentials: 'include' }).then(r => r.json());

            Promise.all([fetchClub, fetchProfilo]).then(([clubData, profData]) => {
                if (clubData.status === 'success' && clubData.club && clubBannerEl) {
                    clubBannerEl.innerHTML = `
                        <div class="club-logo-placeholder" aria-hidden="true">🏆</div>
                        <div>
                          <h2 class="club-banner-nome">${escapeHtml(clubData.club.NOME)}</h2>
                          <div class="club-banner-info">
                            <span class="club-banner-membri">${escapeHtml(clubData.club.membri_totali ?? 0)} / ${escapeHtml(clubData.club.N_COMPONENTI)} membri</span>
                          </div>
                        </div>`;
                }
                // Bottoni Unisciti / Esci dal club, in base allo stato
                if (clubActionsEl && profData.status === 'success' && profData.profilo) {
                    const fkClub = profData.profilo.fk_club;
                    const sonoIn  = fkClub !== null && String(fkClub) === String(clubIdSelected);
                    const giaInAltro = fkClub !== null && String(fkClub) !== String(clubIdSelected);
                    clubActionsEl.hidden = false;
                    if (sonoIn) {
                        clubActionsEl.innerHTML = `
                            <button type="button" class="btn btn--primary" id="btnEntraChat" style="margin-bottom:var(--s-2);">💬 Entra nella chat del club</button>
                            <button type="button" class="btn btn--secondary" id="btnLeaveClub">Esci dal club</button>
                        `;
                        const btnChat = document.getElementById('btnEntraChat');
                        if (btnChat) {
                            btnChat.addEventListener('click', () => {
                                window.location.href = 'pagina_chat_club.html';
                            });
                        }
                    } else if (giaInAltro) {
                        clubActionsEl.innerHTML = `<button type="button" class="btn btn--secondary" disabled aria-disabled="true">Sei già in un altro club</button>`;
                    } else {
                        clubActionsEl.innerHTML = `<button type="button" class="btn btn--primary" id="btnJoinClub">Unisciti al club</button>`;
                    }
                    const btnJoin = document.getElementById('btnJoinClub');
                    if (btnJoin) {
                        btnJoin.addEventListener('click', () => {
                            fetch('/GoalToGo/api/api_join_club.php', {
                                method: 'POST', credentials: 'include',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id_club: parseInt(clubIdSelected, 10) })
                            })
                            .then(r => r.json())
                            .then(d => {
                                if (d.status === 'success') {
                                    Swal.fire({ title: 'Iscritto al club!', icon: 'success', timer: 1200, showConfirmButton: false })
                                      .then(() => window.location.reload());
                                } else {
                                    Swal.fire({ title: 'Errore', text: d.message, icon: 'error' });
                                }
                            });
                        });
                    }
                    const btnLeave = document.getElementById('btnLeaveClub');
                    if (btnLeave) {
                        btnLeave.addEventListener('click', () => {
                            const clubNome = clubData.club ? clubData.club.NOME : '';
                            const doLeave = () => {
                                fetch('/GoalToGo/api/api_leave_club.php', { method: 'POST', credentials: 'include' })
                                    .then(r => r.json())
                                    .then(d => {
                                        if (d.status === 'success') {
                                            localStorage.removeItem('idClub');
                                            if (typeof Swal !== 'undefined') {
                                                Swal.fire({ title: 'Hai lasciato il club', icon: 'success', timer: 1200, showConfirmButton: false })
                                                    .then(() => { window.location.href = 'pagina_club.html'; });
                                            } else {
                                                window.location.href = 'pagina_club.html';
                                            }
                                        } else {
                                            if (typeof Swal !== 'undefined') Swal.fire({ title: 'Errore', text: d.message, icon: 'error' });
                                            else alert('Errore: ' + d.message);
                                        }
                                    })
                                    .catch(err => {
                                        console.error('Errore leave club:', err);
                                        alert('Errore di comunicazione');
                                    });
                            };
                            if (typeof Swal !== 'undefined') {
                                Swal.fire({
                                    title: 'Vuoi davvero uscire?',
                                    text: 'Lascerai il club ' + clubNome,
                                    icon: 'warning', showCancelButton: true,
                                    confirmButtonText: "Si', esci", cancelButtonText: 'Annulla'
                                }).then(res => { if (res.isConfirmed) doLeave(); });
                            } else {
                                if (confirm('Vuoi davvero lasciare il club ' + clubNome + '?')) doLeave();
                            }
                        });
                    }
                }
            }).catch(err => console.error('Errore fetch dettaglio club:', err));

            fetch(`/GoalToGo/api/api_get_membri.php?club_id=${encodeURIComponent(clubIdSelected)}`, { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    if (!giocatoriListEl) return;
                    if (data.status !== 'success' || !data.membri || data.membri.length === 0) {
                        giocatoriListEl.innerHTML = '<p class="empty-state">Nessun membro nel club.</p>';
                        return;
                    }
                    giocatoriListEl.innerHTML = data.membri.map((m, i) => `
                        <div class="giocatore-row" role="listitem">
                          <span class="giocatore-dot" style="background:${i % 2 === 0 ? 'var(--success)' : 'var(--text-3)'}" aria-hidden="true"></span>
                          <span class="giocatore-avatar" aria-hidden="true">👤</span>
                          <span class="giocatore-nome">${escapeHtml(m.NICKNAME)}</span>
                          <span class="giocatore-stelle" aria-label="rating">⭐⭐⭐⭐</span>
                          <span class="giocatore-ruolo ruolo--cen">CEN</span>
                        </div>
                    `).join('');
                })
                .catch(err => console.error('Errore fetch membri:', err));
        }
    }

    // ===================== PAGINA PRENOTA - MIE PRENOTAZIONI =====================

    const miePrenotazioniEl = document.getElementById('miePrenotazioniList');
    if (miePrenotazioniEl) {
        fetch('/GoalToGo/api/api_mie_prenotazioni.php', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success' || !Array.isArray(data.prenotazioni) || data.prenotazioni.length === 0) {
                    miePrenotazioniEl.innerHTML = `
                      <div class="empty-state" role="status" style="padding: var(--s-4);">
                        <p>Non hai prenotazioni per oggi.</p>
                      </div>`;
                    return;
                }
                miePrenotazioniEl.innerHTML = data.prenotazioni.map(p => {
                    const inizio = (p.ORARIO_INIZIO || '').slice(0, 5);
                    const fine   = (p.ORARIO_FINE   || '').slice(0, 5);
                    const prezzo = parseFloat(p.PREZZO || 0).toFixed(2);
                    return `
                      <div class="card" style="border-color: var(--brand);">
                        <div>
                          <h4 class="titolo">${escapeHtml(p.NOME_CAMPO ?? 'Campo')}</h4>
                          <span class="text-white">${escapeHtml(p.INDIRIZZO ?? '')} ${escapeHtml(p.CITTA ?? '')}</span><br>
                          <span class="pill pill--success" style="margin-top: var(--s-1); display: inline-block;">${escapeHtml(inizio)}–${escapeHtml(fine)} · pagato</span>
                        </div>
                        <div class="campo-right">
                          <strong class="titolo">€${prezzo}</strong>
                        </div>
                      </div>`;
                }).join('');
            })
            .catch(err => console.error('Errore fetch mie prenotazioni:', err));
    }

    // ===================== PAGINA PRENOTA - LISTA CAMPI =====================

    const listaCampiPrenotaEl = document.getElementById('lista-campi-prenota');
    if (listaCampiPrenotaEl) {
        const emptyCampiState = '<div class="empty-state" role="status">' +
            '<div class="empty-state__icon" aria-hidden="true">⚽</div>' +
            '<h3>Nessun campo disponibile</h3><p>Riprova più tardi.</p></div>';
        fetch('/GoalToGo/api/api_list_campi.php', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success' || !Array.isArray(data.campi) || data.campi.length === 0) {
                    listaCampiPrenotaEl.innerHTML = emptyCampiState;
                    return;
                }
                listaCampiPrenotaEl.innerHTML = data.campi.map(c => `
                    <a class="card" href="pagina_prenota_seconda_per_prenotazione.html" data-campo-id="${escapeHtml(c.ID)}">
                      <div>
                        <h4 class="titolo">${escapeHtml(c.NOME)}</h4>
                        <span class="text-white">${escapeHtml(c.INDIRIZZO ?? '')} ${escapeHtml(c.CITTA ?? '')}</span><br>
                        <span class="text-white">€${parseFloat(c.PREZZO).toFixed(2)} / ora</span>
                      </div>
                      <div class="campo-right"><strong class="titolo">→</strong></div>
                    </a>
                `).join('');
                listaCampiPrenotaEl.querySelectorAll('.card[data-campo-id]').forEach(card => {
                    card.addEventListener('click', () => {
                        localStorage.setItem('idCampo', card.dataset.campoId);
                    });
                });
            })
            .catch(err => console.error('Errore fetch campi prenota:', err));
    }

    // ===================== PAGINA PRENOTA SECONDA (CAMPO + ORARI) =====================

    const detailPageWrapper = document.getElementById('campoDettaglio');
    if (detailPageWrapper) {
        const campoIdSel = localStorage.getItem('idCampo');
        if (!campoIdSel) {
            detailPageWrapper.innerHTML = '<p>Seleziona un campo da Prenota.</p>';
        } else {
            // pulisco eventuali selezioni residue (anche da flussi precedenti diversi)
            localStorage.removeItem('idCampoOrari');
            localStorage.removeItem('orarioSelezionato');
            localStorage.removeItem('orarioISO');
            localStorage.removeItem('idPrenotazione');
            localStorage.removeItem('idPartita'); // evito contaminazione flusso partita

            fetch(`/GoalToGo/api/api_get_campo.php?id=${encodeURIComponent(campoIdSel)}`, { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    if (data.status !== 'success' || !data.campo) return;
                    const c = data.campo;
                    const header = document.getElementById('campoHeader');
                    if (header) {
                        header.innerHTML = `
                            <h2>${escapeHtml(c.NOME)}</h2>
                            <p>${escapeHtml(c.INDIRIZZO ?? '')} ${escapeHtml(c.CITTA ?? '')}</p>
                            <p><strong>€${parseFloat(c.PREZZO).toFixed(2)}</strong> / ora</p>`;
                    }
                    const fasceContainer = document.getElementById('campoFasce');
                    const orarioInfoEl  = document.getElementById('orarioInfo');
                    const btnProcedi    = document.getElementById('btnProcediPagamento');

                    if (fasceContainer && Array.isArray(c.orari)) {
                        fasceContainer.innerHTML = c.orari.map(o => {
                            const inizio = String(o.inizio ?? '');
                            const fine = String(o.fine ?? '');
                            const labelInizio = inizio.slice(0, 5);
                            const labelFine = fine.slice(0, 5);
                            // o.disponibile e' boolean: TRUE = libero, FALSE = occupato
                            const libero = o.disponibile === true || o.disponibile === 1 || o.disponibile === '1';
                            return `
                              <button type="button" class="fascia-btn ${libero ? 'fascia--verde' : 'fascia--rosso'}"
                                      data-orario-id="${escapeHtml(o.id ?? o.ID ?? '')}"
                                      data-inizio="${escapeHtml(inizio)}" data-fine="${escapeHtml(fine)}"
                                      ${libero ? '' : 'disabled'}
                                      aria-label="${escapeHtml(labelInizio)}-${escapeHtml(labelFine)}, ${libero ? 'disponibile' : 'occupato'}">
                                ${escapeHtml(labelInizio)}-${escapeHtml(labelFine)}
                              </button>`;
                        }).join('');

                        fasceContainer.addEventListener('click', e => {
                            const btn = e.target.closest('.fascia-btn[data-orario-id]');
                            if (!btn || btn.disabled) return;
                            fasceContainer.querySelectorAll('.fascia-btn').forEach(b => b.classList.remove('fascia--selected'));
                            btn.classList.add('fascia--selected');
                            localStorage.setItem('idCampoOrari', btn.dataset.orarioId);
                            const inizio5 = (btn.dataset.inizio || '').slice(0, 5);
                            const fine5   = (btn.dataset.fine || '').slice(0, 5);
                            localStorage.setItem('orarioSelezionato', `${inizio5}-${fine5}`);
                            // ISO datetime per oggi (uso giornaliero)
                            const today = new Date();
                            const yyyy = today.getFullYear();
                            const mm = String(today.getMonth() + 1).padStart(2, '0');
                            const dd = String(today.getDate()).padStart(2, '0');
                            localStorage.setItem('orarioISO', `${yyyy}-${mm}-${dd}T${inizio5}`);

                            if (orarioInfoEl) orarioInfoEl.textContent = `Slot selezionato: ${inizio5}–${fine5}. Procedi al pagamento per confermare.`;
                            if (btnProcedi)   btnProcedi.disabled = false;
                        });
                    }
                    localStorage.setItem('prezzoCampo', c.PREZZO);
                    localStorage.setItem('nomeCampo', c.NOME);

                    if (btnProcedi) {
                        btnProcedi.addEventListener('click', () => {
                            if (!localStorage.getItem('idCampoOrari')) {
                                if (typeof Swal !== 'undefined') Swal.fire({ title: 'Manca lo slot', text: 'Seleziona prima un orario.', icon: 'warning' });
                                return;
                            }
                            window.location.href = 'pagina_pagamento.html';
                        });
                    }
                })
                .catch(err => console.error('Errore fetch campo dettaglio:', err));
        }
    }

    // ===================== PAGINA PAGAMENTO =====================

    const formPagamento = document.getElementById('formPagamento');
    if (formPagamento) {
        formPagamento.addEventListener('submit', e => {
            e.preventDefault();
            // Determino il flusso QUI, una volta sola, e lo passo a confermaPagamento.
            // L'inferenza non si appoggia a localStorage residuo: idCampoOrari implica
            // SEMPRE che siamo nel flusso campo (la pagina precedente lo setta apposta).
            const fkOrari = parseInt(localStorage.getItem('idCampoOrari') || 0, 10);
            const flusso  = fkOrari > 0 ? 'campo' : 'partita';

            const prenId = localStorage.getItem('idPrenotazione');
            if (!prenId) {
                let orario = localStorage.getItem('orarioISO') || '';
                if (!orario) {
                    const sel = localStorage.getItem('orarioSelezionato') || '';
                    const [start] = sel.split('-');
                    if (start) {
                        const t = new Date();
                        const ymd = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0');
                        orario = ymd + 'T' + start;
                    }
                }
                const prezzo = parseFloat(localStorage.getItem('prezzoCampo') || localStorage.getItem('price') || 0);
                const num = 1;
                if (!fkOrari || !orario) {
                    if (typeof Swal !== 'undefined') Swal.fire({ title: 'Manca lo slot', text: 'Seleziona un orario prima di pagare.', icon: 'warning' });
                    else alert('Seleziona un orario prima di pagare.');
                    return;
                }
                fetch('/GoalToGo/api/api_prenotazione.php', {
                    method: 'POST', credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fk_campo_orari: fkOrari, orario, prezzo, num_giocatori: num })
                })
                    .then(r => r.json())
                    .then(data => {
                        if (data.status !== 'success') throw new Error(data.message || 'Errore prenotazione');
                        localStorage.setItem('idPrenotazione', data.prenotazione_id);
                        return data.prenotazione_id;
                    })
                    .then(id => confermaPagamento(id, flusso))
                    .catch(err => {
                        if (typeof Swal !== 'undefined') Swal.fire({ title: 'Errore', text: err.message, icon: 'error' });
                        else alert('Errore: ' + err.message);
                    });
            } else {
                confermaPagamento(parseInt(prenId, 10), flusso);
            }
        });
    }

    function confermaPagamento(id, flusso) {
        // flusso = 'campo' | 'partita' | undefined → fallback su inferenza
        if (!flusso) {
            flusso = !!localStorage.getItem('idCampoOrari') ? 'campo'
                   : !!localStorage.getItem('idPartita') ? 'partita'
                   : 'home';
        }
        const wasFlussoCampo   = flusso === 'campo';
        const wasFlussoPartita = flusso === 'partita';

        return fetch('/GoalToGo/api/api_pagamento.php', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prenotazione_id: id })
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    const done = () => {
                        ['idPrenotazione','idCampo','idCampoOrari','orarioSelezionato','orarioISO','prezzoCampo','nomeCampo','price','count']
                            .forEach(k => localStorage.removeItem(k));
                        // redirect smart: porto l'utente dove vede subito il risultato
                        if (wasFlussoCampo) {
                            window.location.href = 'pagina_prenota.html';
                        } else if (wasFlussoPartita) {
                            window.location.href = 'pagina_trova_partita.html';
                        } else {
                            window.location.href = 'home_page.html';
                        }
                    };
                    const titoloOk = wasFlussoCampo ? 'Campo prenotato!' : 'Pagamento confermato!';
                    const testoOk  = wasFlussoCampo
                        ? 'Lo trovi nella sezione Campi prenotati.'
                        : 'Sei dentro alla partita.';
                    if (typeof Swal !== 'undefined') {
                        return Swal.fire({ title: titoloOk, text: testoOk, icon: 'success', timer: 1600, showConfirmButton: false })
                            .then(done);
                    }
                    done();
                    return;
                }
                if (typeof Swal !== 'undefined') Swal.fire({ title: 'Pagamento fallito', text: data.message ?? 'Riprova', icon: 'error' });
                else alert('Pagamento fallito: ' + (data.message ?? ''));
            })
            .catch(err => {
                if (typeof Swal !== 'undefined') Swal.fire({ title: 'Errore', text: err.message, icon: 'error' });
                else alert('Errore: ' + err.message);
            });
    }

    // ===================== PAGINA CHAT CLUB - PROPOSTE =====================

    function refreshProposte() {
        const list = document.getElementById('proposte-list');
        if (!list) return;
        fetch('/GoalToGo/api/api_get_proposte.php', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success' || !Array.isArray(data.proposte) || data.proposte.length === 0) {
                    list.innerHTML = '<p class="empty-state">Nessuna proposta ancora. Crea la prima!</p>';
                    return;
                }
                list.innerHTML = data.proposte.map(p => `
                    <div class="evento-pill">
                      <strong>${escapeHtml(p.NICKNAME ?? '')}</strong>:
                      ${escapeHtml(p.TESTO ?? '')}
                      ${p.ORARIO ? `<br><small>${escapeHtml(p.ORARIO)} ${p.NOME_CAMPO ? '· ' + escapeHtml(p.NOME_CAMPO) : ''}</small>` : ''}
                    </div>
                `).join('');
            })
            .catch(err => console.error('Errore fetch proposte:', err));
    }
    window.refreshProposte = refreshProposte;

    if (document.getElementById('proposte-list')) refreshProposte();

    // Override the stub inviaProposta with a real POST to api_crea_proposta.php
    window.inviaProposta = function (event) {
        event?.preventDefault();
        const overlay = document.querySelector('.modale-overlay') || document.querySelector('#modale');
        if (!overlay) return;
        const get = name => overlay.querySelector(`[name="${name}"]`)?.value ?? '';
        const payload = {
            testo: get('testo') || get('campo') || 'Partita',
            orario: get('orario'),
            nome_campo: get('campo'),
            max_giocatori: parseInt(get('max_giocatori') || '10', 10),
        };
        if (!payload.testo && !payload.orario) {
            Swal.fire({ title: 'Mancano dei campi', icon: 'warning' });
            return;
        }
        fetch('/GoalToGo/api/api_crea_proposta.php', {
            method: 'POST', credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({ title: 'Proposta inviata!', icon: 'success', timer: 1500, showConfirmButton: false })
                        .then(() => {
                            overlay.querySelectorAll('input, textarea').forEach(i => { i.value = ''; });
                            if (typeof chiudiModale === 'function') chiudiModale();
                            refreshProposte();
                        });
                } else {
                    Swal.fire({ title: 'Errore', text: data.message, icon: 'error' });
                }
            })
            .catch(err => Swal.fire({ title: 'Errore', text: err.message, icon: 'error' }));
    };

    // ===================== PAGINA PROFILO =====================

    const formProfilo = document.getElementById('formProfilo');
    if (formProfilo) {
        fetch('/GoalToGo/api/api_profilo.php', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success' || !data.profilo) return;
                const nickInput = formProfilo.querySelector('[name="nickname"]');
                const emailInput = formProfilo.querySelector('[name="email"]');
                if (nickInput) nickInput.value = data.profilo.NICKNAME ?? data.profilo.nickname ?? '';
                if (emailInput) emailInput.value = data.profilo.EMAIL ?? data.profilo.email ?? '';
            })
            .catch(err => console.error('Errore fetch profilo:', err));

        formProfilo.addEventListener('submit', e => {
            e.preventDefault();
            const fd = new FormData(formProfilo);
            fetch('/GoalToGo/api/api_profilo.php', {
                method: 'POST', credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname: fd.get('nickname'), email: fd.get('email') })
            })
                .then(r => r.json())
                .then(data => {
                    if (data.status === 'success') {
                        if (fd.get('nickname')) localStorage.setItem('nomeUtente', fd.get('nickname'));
                        Swal.fire({ title: 'Profilo aggiornato', icon: 'success', timer: 1200, showConfirmButton: false });
                    } else {
                        Swal.fire({ title: 'Errore', text: data.message, icon: 'error' });
                    }
                })
                .catch(err => Swal.fire({ title: 'Errore', text: err.message, icon: 'error' }));
        });
    }

    // ===================== PROFILO GIOCATORE - SEZIONI RIASSUNTIVE =====================

    const profiloClubBox     = document.getElementById('profiloClubBox');
    const profiloPartiteList = document.getElementById('profiloPartiteList');
    const profiloPrenoList   = document.getElementById('profiloPrenotazioniList');

    if (profiloClubBox || profiloPartiteList || profiloPrenoList) {
        // 1) Il mio club
        if (profiloClubBox) {
            fetch('/GoalToGo/api/api_profilo.php', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    if (data.status !== 'success' || !data.profilo) { profiloClubBox.innerHTML = ''; return; }
                    const fkClub = data.profilo.fk_club;
                    if (!fkClub) {
                        profiloClubBox.innerHTML = `
                            <div class="empty-state" role="status" style="padding: var(--s-4);">
                              <p>Non sei in nessun club. <a href="pagina_club.html" style="color: var(--brand);">Cercane uno</a> o creane uno tuo.</p>
                            </div>`;
                        return;
                    }
                    return fetch(`/GoalToGo/api/api_get_club.php?id=${encodeURIComponent(fkClub)}`, { credentials: 'include' })
                        .then(r => r.json())
                        .then(d => {
                            if (d.status !== 'success' || !d.club) { profiloClubBox.innerHTML = ''; return; }
                            const c = d.club;
                            profiloClubBox.innerHTML = `
                                <a class="card" href="pagina_dettaglio_club.html" data-club-id="${escapeHtml(c.ID)}" style="border-color: var(--brand);">
                                  <div>
                                    <h4 class="titolo">${escapeHtml(c.NOME)}</h4>
                                    <span class="text-white">${escapeHtml(c.membri_totali ?? 0)} / ${escapeHtml(c.N_COMPONENTI)} membri</span>
                                  </div>
                                  <div class="campo-right"><strong class="titolo">→</strong></div>
                                </a>`;
                            const card = profiloClubBox.querySelector('.card[data-club-id]');
                            if (card) card.addEventListener('click', () => localStorage.setItem('idClub', card.dataset.clubId));
                        });
                })
                .catch(err => console.error('Errore profilo club:', err));
        }

        // 2) Le mie partite di oggi
        if (profiloPartiteList) {
            fetch('/GoalToGo/api/api_mie_partite.php', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    if (data.status !== 'success' || !Array.isArray(data.partite) || data.partite.length === 0) {
                        profiloPartiteList.innerHTML = `
                            <div class="empty-state" role="status" style="padding: var(--s-4);">
                              <p>Non sei iscritto a nessuna partita oggi.</p>
                            </div>`;
                        return;
                    }
                    profiloPartiteList.innerHTML = data.partite.map(p => {
                        const stato = p.STATO === 'confermata' ? '✓ Confermata' : 'In attesa';
                        const pillCls = p.STATO === 'confermata' ? 'pill--success' : 'pill--info';
                        const orario = p.ORARIO ? p.ORARIO.replace('T', ' ') : '';
                        return `
                          <button type="button" class="card" data-partita-id="${escapeHtml(p.ID)}" data-num-giocatori="${escapeHtml(p.NUM_GIOCATORI)}">
                            <div>
                              <h4 class="titolo">${escapeHtml(p.NOME)}</h4>
                              <span class="text-white">${escapeHtml(p.NOME_CAMPO ?? 'Campo n/d')} · ${escapeHtml(orario)}</span><br>
                              <span class="pill ${pillCls}" style="margin-top: var(--s-1); display: inline-block;">${stato}</span>
                              <span class="text-white" style="margin-left: var(--s-2);">Squadra ${escapeHtml(p.SQUADRA || 'A')}</span>
                            </div>
                            <div class="campo-right"><strong class="titolo">${escapeHtml(p.NUM_GIOCATORI)}/${escapeHtml(p.MAX_GIOCATORI)}</strong></div>
                          </button>`;
                    }).join('');
                    profiloPartiteList.querySelectorAll('.card[data-partita-id]').forEach(card => {
                        card.addEventListener('click', () => {
                            localStorage.setItem('idPartita', card.dataset.partitaId);
                            localStorage.setItem('count-player', card.dataset.numGiocatori || '0');
                            window.location.href = 'pagina_trova_partita_seconda.html';
                        });
                    });
                })
                .catch(err => console.error('Errore profilo partite:', err));
        }

        // 3) I miei campi prenotati oggi
        if (profiloPrenoList) {
            fetch('/GoalToGo/api/api_mie_prenotazioni.php', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                    if (data.status !== 'success' || !Array.isArray(data.prenotazioni) || data.prenotazioni.length === 0) {
                        profiloPrenoList.innerHTML = `
                            <div class="empty-state" role="status" style="padding: var(--s-4);">
                              <p>Non hai prenotazioni di campo per oggi.</p>
                            </div>`;
                        return;
                    }
                    profiloPrenoList.innerHTML = data.prenotazioni.map(p => {
                        const inizio = (p.ORARIO_INIZIO || '').slice(0, 5);
                        const fine   = (p.ORARIO_FINE   || '').slice(0, 5);
                        const prezzo = parseFloat(p.PREZZO || 0).toFixed(2);
                        return `
                          <div class="card" style="border-color: var(--brand);">
                            <div>
                              <h4 class="titolo">${escapeHtml(p.NOME_CAMPO ?? 'Campo')}</h4>
                              <span class="text-white">${escapeHtml(p.INDIRIZZO ?? '')} ${escapeHtml(p.CITTA ?? '')}</span><br>
                              <span class="pill pill--success" style="margin-top: var(--s-1); display: inline-block;">${escapeHtml(inizio)}–${escapeHtml(fine)} · pagato</span>
                            </div>
                            <div class="campo-right"><strong class="titolo">€${prezzo}</strong></div>
                          </div>`;
                    }).join('');
                })
                .catch(err => console.error('Errore profilo prenotazioni:', err));
        }
    }

    // ===================== PAGINA TROVA PARTITA SECONDA =====================

    const trovaSecondaPage = document.getElementById('trova-seconda-page');
    if (trovaSecondaPage) {
        const partitaId = parseInt(localStorage.getItem('idPartita') || trovaSecondaPage.dataset.partitaId || 0, 10);
        if (partitaId) {
            // pulisco residui dal flusso campo
            localStorage.removeItem('idCampoOrari');
            localStorage.removeItem('orarioSelezionato');
            localStorage.removeItem('orarioISO');
            localStorage.removeItem('prezzoCampo');
            localStorage.removeItem('nomeCampo');
            const teamAEl = document.getElementById('teamA');
            const teamBEl = document.getElementById('teamB');
            const nomeEl  = document.getElementById('partitaNome');
            const statoEl = document.getElementById('partitaStato');
            const countEl = document.getElementById('count-player');
            const maxEl   = document.getElementById('count-max');
            const campoEl = document.getElementById('partitaCampo');
            const orarioEl = document.getElementById('partitaOrario');
            const prezzoEl = document.getElementById('partitaPrezzo');

            function renderTeam(listEl, team, players, maxPerSquadra, sonoIscritto, statoPartita) {
                const rows = [];
                // riga per ogni giocatore iscritto
                players.forEach(p => {
                    rows.push(`
                        <li class="giocatore-row" role="listitem">
                          <span class="giocatore-avatar" aria-hidden="true">👤</span>
                          <span class="giocatore-nome">${escapeHtml(p.nickname)}</span>
                        </li>`);
                });
                // riga "+ Aggiungiti": solo se non sono iscritto, partita non confermata, e c'e' posto
                const liberi = maxPerSquadra - players.length;
                const possoEntrare = !sonoIscritto && statoPartita !== 'confermata' && liberi > 0;
                if (possoEntrare) {
                    rows.push(`
                        <li>
                          <button type="button" class="card join-team-btn" data-team="${team}"
                                  style="width:100%; cursor:pointer;"
                                  aria-label="Aggiungiti alla squadra ${team}">
                            <div>
                              <strong style="color: var(--brand);">+ Aggiungiti</strong>
                              <span style="display:block; color: var(--text-2); font-size: var(--text-xs);">${liberi} ${liberi === 1 ? 'posto libero' : 'posti liberi'}</span>
                            </div>
                            <div class="campo-right"><span aria-hidden="true">⚽</span></div>
                          </button>
                        </li>`);
                }
                // padding rows: posti vuoti rimanenti come placeholder
                const placeholderCount = liberi - (possoEntrare ? 1 : 0);
                for (let i = 0; i < placeholderCount; i++) {
                    rows.push(`
                        <li class="giocatore-row" role="listitem" aria-label="Posto libero" style="opacity: 0.4;">
                          <span class="giocatore-avatar" aria-hidden="true">⚪</span>
                          <span class="giocatore-nome" style="font-style: italic;">Posto libero</span>
                        </li>`);
                }
                listEl.innerHTML = rows.join('');
            }

            function loadPartita() {
                fetch(`/GoalToGo/api/api_get_partita.php?id=${partitaId}`, { credentials: 'include' })
                    .then(r => r.json())
                    .then(data => {
                        if (data.status !== 'success' || !data.partita) {
                            if (teamAEl) teamAEl.innerHTML = '<li class="empty-state">Partita non trovata</li>';
                            return;
                        }
                        const p = data.partita;
                        if (nomeEl)  nomeEl.textContent  = p.NOME ?? '';
                        if (countEl) countEl.textContent = p.NUM_GIOCATORI ?? 0;
                        if (maxEl)   maxEl.textContent   = data.max_giocatori;
                        if (campoEl) campoEl.textContent = `${p.NOME_CAMPO ?? ''} — ${p.INDIRIZZO ?? ''} ${p.CITTA ?? ''}`.trim();
                        if (orarioEl) orarioEl.textContent = p.ORARIO ?? '';
                        if (prezzoEl) prezzoEl.textContent = parseFloat(p.PREZZO || 0).toFixed(2);
                        if (statoEl) {
                            statoEl.textContent = data.stato === 'confermata' ? '✓ CONFERMATA' : 'IN ATTESA';
                            statoEl.className = 'pill ' + (data.stato === 'confermata' ? 'pill--success' : 'pill--info');
                        }

                        // salvo in localStorage il count e il max per la pagina pagamento successiva
                        localStorage.setItem('count-player', String(p.NUM_GIOCATORI ?? 0));
                        localStorage.setItem('maxGiocatoriPartita', String(data.max_giocatori));
                        localStorage.setItem('idPartita', String(p.ID));

                        if (teamAEl) renderTeam(teamAEl, 'A', data.teamA || [], data.max_per_squadra, data.sono_iscritto !== null, data.stato);
                        if (teamBEl) renderTeam(teamBEl, 'B', data.teamB || [], data.max_per_squadra, data.sono_iscritto !== null, data.stato);

                        // wire dei bottoni "+ Aggiungiti"
                        document.querySelectorAll('.join-team-btn').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const team = btn.dataset.team;
                                fetch('/GoalToGo/api/api_iscriviti_partita.php', {
                                    method: 'POST', credentials: 'include',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ fk_partita: partitaId, squadra: team })
                                })
                                .then(r => r.json())
                                .then(d => {
                                    if (d.status === 'success') {
                                        Swal.fire({ title: 'Iscritto a Squadra ' + team + '!', icon: 'success', timer: 1000, showConfirmButton: false })
                                          .then(() => { window.location.href = 'pagina_pagamento.html'; });
                                    } else {
                                        Swal.fire({ title: 'Errore', text: d.message, icon: 'error' });
                                    }
                                });
                            });
                        });
                    })
                    .catch(err => console.error('Errore fetch partita:', err));
            }

            loadPartita();
        }
    }

    // ===================== CHIP FILTER TOGGLE =====================

    const chipRows = document.querySelectorAll('.chip-row');
    if (chipRows.length) {
        chipRows.forEach(row => {
            const multi = row.dataset.multi === 'true';
            row.addEventListener('click', e => {
                const chip = e.target.closest('.chip');
                if (!chip) return;
                if (multi) {
                    chip.classList.toggle('chip--active');
                    chip.setAttribute('aria-selected', chip.classList.contains('chip--active') ? 'true' : 'false');
                } else {
                    row.querySelectorAll('.chip--active').forEach(c => {
                        c.classList.remove('chip--active');
                        c.setAttribute('aria-selected', 'false');
                    });
                    chip.classList.add('chip--active');
                    chip.setAttribute('aria-selected', 'true');
                }
            });
        });
    }

    // ===================== CIAO USER (HOME) =====================

    const ciaoUserEl = document.getElementById('ciao_user');
    if (ciaoUserEl) {
        const nome = localStorage.getItem('nomeUtente');
        ciaoUserEl.textContent = nome ? `Ciao, ${nome}` : 'Ciao!';
    }

    // ===================== FORM CREA PARTITA =====================

    const formCreaPartita = document.getElementById('formCreaPartita');
    if (formCreaPartita) {
        // Slot orari cliccabili: 12 fasce 10-22 (1 ora). L'utente seleziona
        // un solo slot evidenziato in lime; la data e' implicitamente oggi.
        const slotContainer = formCreaPartita.querySelector('#slot-orari-partita');
        const orarioInput   = formCreaPartita.querySelector('#orario-partita');
        if (slotContainer && orarioInput) {
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const dataOggi = `${yyyy}-${mm}-${dd}`;
            const oraCorrente = today.getHours();

            const buttons = [];
            for (let h = 10; h < 22; h++) {
                const hh = String(h).padStart(2, '0');
                const hh2 = String(h + 1).padStart(2, '0');
                const passato = h <= oraCorrente; // slot gia' passati: non selezionabili
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'fascia-btn' + (passato ? ' fascia--rosso' : ' fascia--verde');
                btn.dataset.ora = hh;
                btn.textContent = `${hh}:00-${hh2}:00`;
                btn.setAttribute('role', 'radio');
                btn.setAttribute('aria-checked', 'false');
                if (passato) {
                    btn.disabled = true;
                    btn.setAttribute('aria-label', `${hh}:00-${hh2}:00, gia' passato`);
                } else {
                    btn.setAttribute('aria-label', `${hh}:00-${hh2}:00, disponibile`);
                }
                slotContainer.appendChild(btn);
                buttons.push(btn);
            }

            slotContainer.addEventListener('click', e => {
                const btn = e.target.closest('.fascia-btn');
                if (!btn || btn.disabled) return;
                buttons.forEach(b => {
                    b.classList.remove('fascia--selected');
                    b.setAttribute('aria-checked', 'false');
                });
                btn.classList.add('fascia--selected');
                btn.setAttribute('aria-checked', 'true');
                orarioInput.value = `${dataOggi}T${btn.dataset.ora}:00`;
            });
        }
        // Populate the campo dropdown
        const select = formCreaPartita.querySelector('#campo-partita');
        if (select) {
            // Lista pubblica (logged-in only) di tutti i campi: i giocatori
            // creano partite scegliendo da qui, indipendentemente dal gestore.
            fetch('/GoalToGo/api/api_list_campi.php', { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success' && Array.isArray(data.campi)) {
                        data.campi.forEach(campo => {
                            const opt = document.createElement('option');
                            opt.value = campo.ID;
                            opt.textContent = `${campo.NOME} — ${campo.CITTA ?? campo.INDIRIZZO ?? ''}`.trim();
                            select.appendChild(opt);
                        });
                    }
                })
                .catch(err => console.error('Errore fetch campi per crea-partita:', err));
        }

        formCreaPartita.addEventListener('submit', e => {
            e.preventDefault();
            const fd = new FormData(formCreaPartita);
            if (!fd.get('orario')) {
                Swal.fire({ title: 'Manca lo slot', text: 'Seleziona uno slot orario per la partita.', icon: 'warning' });
                return;
            }
            // max_giocatori arrotondato a numero pari (le squadre devono essere uguali)
            let maxG = parseInt(fd.get('max_giocatori'), 10) || 10;
            if (maxG % 2 !== 0) maxG++;
            const payload = {
                nome:          fd.get('nome'),
                orario:        fd.get('orario'),
                fk_campo:      parseInt(fd.get('fk_campo'), 10) || 0,
                max_giocatori: maxG,
            };
            localStorage.setItem('maxGiocatoriPartita', maxG);

            fetch('/GoalToGo/api/api_crea_partita.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({ title: 'Partita creata!', icon: 'success', timer: 1500, showConfirmButton: false })
                            .then(() => {
                                if (data.partita_id) localStorage.setItem('idPartita', data.partita_id);
                                window.location.href = 'pagina_trova_partita.html';
                            });
                    } else {
                        Swal.fire({ title: 'Errore', text: data.message ?? 'Riprova', icon: 'error' });
                    }
                })
                .catch(err => {
                    console.error(err);
                    Swal.fire({ title: 'Errore', text: 'Problema di comunicazione', icon: 'error' });
                });
        });
    }

    // ===================== KEYBOARD ACTIVATION FOR ROLE=BUTTON =====================
    // Elements with role="button" tabindex="0" must respond to Enter/Space.
    document.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const el = e.target;
        if (!(el instanceof HTMLElement)) return;
        if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return;
        if (el.getAttribute('role') !== 'button') return;
        if (el.getAttribute('tabindex') !== '0') return;
        e.preventDefault();
        el.click();
    });

});

// ===================== NAVIGAZIONE =====================

function handleClick(action, el) {
    switch (action) {
        case 'crea-club':
            window.location.href = 'pagina_crea_club.html';
            break;
        case 'prenota':
            window.location.href = 'pagina_prenota.html';
            break;
        case 'trova':
            window.location.href = 'pagina_trova_partita.html';
            break;
        case 'club':
            window.location.href = 'pagina_club.html';
            break;
        case 'pagina-prenota-seconda-per-partite':
            window.location.href = 'pagina_prenota_seconda_per_partite.html';
            break;
        case 'schermata-accedi':
            window.location.href = 'pagina_accedi.html';
            break;
        case 'schermata-registrati':
            window.location.href = 'pagina_registrati.html';
            break;
        case 'crea-partita':
            window.location.href = 'pagina_crea_partita.html';
            break;
        case 'pagina-prenota-seconda':
            window.location.href = 'pagina_prenota_seconda_per_prenotazione.html';
            break;
        case 'trova-partita-seconda':
            // el = la card cliccata, passata come 2° arg da onclick="handleClick('...', this)"
            if (el && el.dataset) {
                if (el.dataset.partitaId) localStorage.setItem('idPartita', el.dataset.partitaId);
                if (el.dataset.numGiocatori) localStorage.setItem('count-player', el.dataset.numGiocatori);
            }
            window.location.href = 'pagina_trova_partita_seconda.html';
            break;
        case 'aggiungi-giocatori':
            aggiungiGiocatore();
            break;
        case 'riduci-giocatori':
            riduciGiocatore();
            break;
        case 'aggiungi-giocatori-club':
            aggiungiGiocatoreClub();
            break;
        case 'riduci-giocatori-club':
            riduciGiocatoreClub();
            break;
        case 'pagamento-trova-partita':
            const prezzo = document.getElementById('price').textContent;
            localStorage.setItem('price', prezzo);
            const numGiocatori = document.getElementById('count').textContent;
            localStorage.setItem('count', numGiocatori);
            window.location.href = 'pagina_pagamento.html';
            break;
        case 'pagamento-trova-partita-2':
            window.location.href = 'pagina_pagamento.html';
            break;
        case 'profilo':
            window.location.href = 'pagina_profilo.html';
            break;
        default:
            console.log('Azione sconosciuta');
    }
}

// ===================== VISIBILITÀ CLUB =====================

function setVisibility(button) {
    const buttons = document.querySelectorAll('.visibility-btn');

    buttons.forEach(btn => btn.classList.remove('active'));

    button.classList.add('active');

    const value = button.textContent.trim();
    localStorage.setItem('clubVisibility', value);
}

// ===================== SWITCH MODALITÀ REGISTRAZIONE =====================

function switchMode(mode) {
    const giocatore = document.getElementById('form-giocatore');
    const campo     = document.getElementById('form-campo');

    const giocatoreInputs = giocatore.querySelectorAll('input');
    const campoInputs     = campo.querySelectorAll('input');

    const buttons = document.querySelectorAll('.toggle-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Aggiorna il campo nascosto "tipo" letto dal backend (api_signin.php)
    const tipoInput = document.getElementById('tipoUtente');
    if (tipoInput) {
        tipoInput.value = mode === 'giocatore' ? 'giocatore' : 'gestore';
    }

    if (mode === 'giocatore') {
        giocatore.classList.add('active-form');
        campo.classList.remove('active-form');
        buttons[0].classList.add('active');

        giocatoreInputs.forEach(input => input.disabled = false);
        campoInputs.forEach(input => input.disabled = true);
    } else {
        campo.classList.add('active-form');
        giocatore.classList.remove('active-form');
        buttons[1].classList.add('active');

        campoInputs.forEach(input => input.disabled = false);
        giocatoreInputs.forEach(input => input.disabled = true);
    }
}

// ===================== CONTATORE GIOCATORI =====================

function aggiungiGiocatore() {
    let giocatori = parseInt(document.getElementById('count').textContent) || 1;
    let prezzo    = parseInt(document.getElementById('price').textContent) || 0;

    giocatori++;
    prezzo += 5;

    document.getElementById('count').textContent = giocatori;
    document.getElementById('price').textContent = prezzo;

    localStorage.setItem('count', giocatori);
    localStorage.setItem('price', prezzo);
}

function riduciGiocatore() {
    let giocatori = parseInt(document.getElementById('count').textContent) || 1;
    let prezzo    = parseInt(document.getElementById('price').textContent) || 0;

    if (giocatori <= 1) return;

    giocatori--;
    prezzo -= 5;

    document.getElementById('count').textContent = giocatori;
    document.getElementById('price').textContent = prezzo;

    localStorage.setItem('count', giocatori);
    localStorage.setItem('price', prezzo);
}

// ===================== CONTATORE GIOCATORI CLUB =====================

// Limite max componenti club: vincolo di prodotto.
const CLUB_MAX_COMPONENTI = 40;
const CLUB_MIN_COMPONENTI = 2;

function aggiungiGiocatoreClub() {
    let giocatori_club = parseInt(document.getElementById('club-count').textContent) || CLUB_MIN_COMPONENTI;

    if (giocatori_club >= CLUB_MAX_COMPONENTI) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({ title: 'Limite raggiunto', text: 'Un club può avere al massimo ' + CLUB_MAX_COMPONENTI + ' componenti.', icon: 'info', timer: 1500, showConfirmButton: false });
        }
        return;
    }

    giocatori_club++;

    document.getElementById('club-count').textContent = giocatori_club;
    localStorage.setItem('clubCount', giocatori_club);
}

function riduciGiocatoreClub() {
    let giocatori_club = parseInt(document.getElementById('club-count').textContent) || CLUB_MIN_COMPONENTI;

    if (giocatori_club <= CLUB_MIN_COMPONENTI) return;

    giocatori_club--;

    document.getElementById('club-count').textContent = giocatori_club;
    localStorage.setItem('clubCount', giocatori_club);
}

// ===================== TOGGLE UI =====================

function toggleGiorno(btn) {
    btn.classList.toggle('active');
}

function toggleOrario(btn) {
    btn.classList.toggle('active');
}

// ===================== UPLOAD IMMAGINE CAMPO =====================

function aggiungiImmagine() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (ev) {
            const box = document.getElementById('upload-campo');
            box.style.backgroundImage    = `url(${ev.target.result})`;
            box.style.backgroundSize     = 'cover';
            box.style.backgroundPosition = 'center';
            box.innerText = '';
        };

        reader.readAsDataURL(file);
    };

    input.click();
}

// ===================== MODALE PROPONI PARTITA =====================

function apriModale() {
    const overlay = document.querySelector('.modale-overlay');
    if (!overlay) return;
    overlay.style.display = 'flex';
    overlay.setAttribute('aria-hidden', 'false');
    // focus first interactive element inside the modal
    const first = overlay.querySelector('input, select, textarea, button');
    first?.focus();
    // ESC to close
    document.addEventListener('keydown', _modalEsc);
}

function chiudiModale() {
    const overlay = document.querySelector('.modale-overlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', _modalEsc);
}

function _modalEsc(e) {
    if (e.key === 'Escape') chiudiModale();
}

function inviaProposta(event) {
    event?.preventDefault();
    const overlay = document.querySelector('#modale');
    if (!overlay) return;

    // The modal currently uses bare inputs (no <form>). Support both:
    // a real <form> if it exists, otherwise gather fields directly.
    const form = overlay.querySelector('form');
    let data;
    if (form) {
        data = Object.fromEntries(new FormData(form).entries());
    } else {
        data = {};
        overlay.querySelectorAll('input[name], select[name], textarea[name]').forEach(el => {
            data[el.name] = el.value;
        });
        // Map "campo" (modal field) -> "nome" so the validation below stays consistent.
        if (data.campo && !data.nome) data.nome = data.campo;
    }

    if (!data.nome || !data.orario) {
        Swal.fire({ title: 'Mancano dei campi', icon: 'warning' });
        return;
    }

    // TODO: when /GoalToGo/api/api_crea_proposta.php exists, fetch it.
    // For now we acknowledge and close the modal so the UX feels intentional.
    Swal.fire({
        title: 'Proposta inviata!',
        text: 'I tuoi compagni di club riceveranno una notifica.',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
    }).then(() => {
        if (form) {
            form.reset();
        } else {
            overlay.querySelectorAll('input, select, textarea').forEach(el => {
                if (el.type !== 'button' && el.type !== 'submit') el.value = '';
            });
        }
        chiudiModale();
    });
}

function accettaPartita() {
    Swal.fire({
        title: 'Sei dentro!',
        text: 'Ci vediamo in campo. ⚽',
        icon: 'success',
        timer: 1800,
        showConfirmButton: false
    });
}

// ===================== LOGOUT =====================
window.logout = function () {
    fetch('/GoalToGo/api/api_logout.php', { method: 'POST', credentials: 'include' })
        .catch(function () { /* swallow network errors — local cleanup must still happen */ })
        .finally(function () {
            localStorage.clear();
            window.location.replace('pagina_accedi.html');
        });
};
// ================================================================

// ================================================================
// PAGINA CHAT CLUB — LOGICA PROPOSTA UNICA
// Regole:
//  1. Una sola proposta attiva per volta nel club (30 min di lock)
//  2. Chiunque può accettare (aderire) durante i 30 min
//  3. Se si raggiunge il MAX_GIOCATORI → proposta confermata → vai al pagamento
//  4. Dopo i 30 min senza raggiungere il quorum → scaduta → chiunque può fare una nuova proposta
// ================================================================

(function () {
    'use strict';

    if (!document.getElementById('proposte-list')) return;

    // ---- util ----
    function escH(s) {
        return String(s ?? '').replace(/[&<>"']/g, c =>
            ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
    }

    function fmtData(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
            return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
        } catch { return iso; }
    }

    // ---- stato ----
    let _globalTimer      = null;   // setInterval del countdown globale
    let _propAttivaId     = null;   // id proposta attiva corrente
    let _pollInterval     = null;   // setInterval del poll

    // ---- DATA OGGI ----
    const dataEl = document.getElementById('data-oggi-lega');
    if (dataEl) {
        dataEl.textContent = 'OGGI ' + new Date().toLocaleDateString('it-IT',
            { day:'numeric', month:'long', year:'numeric' }).toUpperCase();
    }

    // ================================================================
    // CARICA BANNER E SIDEBAR
    // ================================================================
    function caricaBannerClub() {
        const idClub = localStorage.getItem('idClub');
        if (!idClub) return;

        fetch(`/GoalToGo/api/api_get_club.php?id=${encodeURIComponent(idClub)}`, { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.status !== 'success' || !data.club) return;
                const c = data.club;
                const nomeEl = document.getElementById('chat-club-nome');
                const memEl  = document.getElementById('chat-club-membri');
                if (nomeEl) nomeEl.textContent = c.NOME ?? c.nome ?? '—';
                if (memEl)  memEl.textContent  = (c.membri_totali ?? 0) + ' membri';
            }).catch(console.error);

        fetch('/GoalToGo/api/api_get_membri.php', { credentials: 'include' })
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success' && Array.isArray(data.membri)) {
                    renderSidebar(data.membri);
                }
            }).catch(console.error);
    }

    function renderSidebar(membri) {
        const labelEl = document.getElementById('sb-label-totale');
        const listEl  = document.getElementById('sb-membri-list');
        if (labelEl) labelEl.textContent = 'MEMBRI : ' + membri.length;
        if (!listEl) return;
        listEl.innerHTML = membri.map(m => {
            const nick = m.NICKNAME ?? m.nickname ?? '?';
            return `<div class="sb-user">
                      <div class="sb-avatar-gray" aria-hidden="true">${escH(nick.charAt(0).toUpperCase())}</div>
                      <div class="sb-nome">${escH(nick)}</div>
                    </div>`;
        }).join('');
    }

    // ================================================================
    // COUNTDOWN GLOBALE (banner in cima al feed)
    // ================================================================
    function avviaTimerGlobale(secondiRimanenti) {
        if (_globalTimer) clearInterval(_globalTimer);

        const bannerEl = document.getElementById('chat-timer-banner');
        const testoEl  = document.getElementById('chat-timer-testo');
        if (!bannerEl || !testoEl) return;

        let sec = Math.max(0, secondiRimanenti);

        function aggiorna() {
            if (sec <= 0) {
                clearInterval(_globalTimer);
                bannerEl.style.display = 'none';
                // Scaduto: sblocca il bottone proponi e ricarica
                abilitaProponi(true);
                refreshProposteChat();
                return;
            }
            const m = Math.floor(sec / 60);
            const s = String(sec % 60).padStart(2, '0');
            testoEl.textContent = `Proposta attiva — scade tra ${m}:${s}`;
            bannerEl.style.display = '';
            sec--;
        }

        aggiorna();
        _globalTimer = setInterval(aggiorna, 1000);
    }

    function fermaTimerGlobale() {
        if (_globalTimer) { clearInterval(_globalTimer); _globalTimer = null; }
        const bannerEl = document.getElementById('chat-timer-banner');
        if (bannerEl) bannerEl.style.display = 'none';
    }

    // ================================================================
    // BOTTONE PROPONI — lock/unlock
    // ================================================================
    function abilitaProponi(abilitato) {
        const btn = document.getElementById('btn-proponi-principale');
        if (!btn) return;
        btn.disabled = !abilitato;
        if (abilitato) {
            btn.classList.remove('btn-proponi--locked');
            btn.title = '';
        } else {
            btn.classList.add('btn-proponi--locked');
            btn.title = 'Non puoi proporre mentre è in corso un\'altra proposta';
        }
    }

    // ================================================================
    // RENDER PROPOSTE
    // ================================================================
    function renderProposte(proposte) {
        const list = document.getElementById('proposte-list');
        if (!list) return;

        if (!Array.isArray(proposte) || proposte.length === 0) {
            list.innerHTML = `<div class="empty-state" style="text-align:center;padding:var(--s-6) 0;">
                <div style="font-size:2rem;margin-bottom:var(--s-2);">⚽</div>
                <p>Nessuna proposta ancora.<br>Sii il primo a proporre una partita!</p>
              </div>`;
            document.getElementById('btn-accetta-principale').style.display = 'none';
            fermaTimerGlobale();
            abilitaProponi(true);
            return;
        }

        // La proposta attiva è sempre al massimo 1 — la prima della lista
        const attiva = proposte.find(p => p.STATO === 'attiva');
        const storia = proposte.filter(p => p.STATO !== 'attiva');

        // Gestisci timer globale e lock bottone proponi
        if (attiva) {
            _propAttivaId = parseInt(attiva.ID, 10);
            avviaTimerGlobale(parseInt(attiva.SECONDI_RIMANENTI, 10) || 0);
            abilitaProponi(false);

            // Mostra bottone "Accetta e gioca" solo se l'utente non ha ancora aderito
            const btnAcc = document.getElementById('btn-accetta-principale');
            if (btnAcc) btnAcc.style.display = attiva.IO_HO_ADERITO ? 'none' : '';
        } else {
            _propAttivaId = null;
            fermaTimerGlobale();
            abilitaProponi(true);
            document.getElementById('btn-accetta-principale').style.display = 'none';
        }

        let html = '';

        // Card proposta attiva
        if (attiva) html += buildCard(attiva, true);

        // Storico proposte scadute/confermate
        if (storia.length) {
            html += `<div class="sb-label" style="margin-top:var(--s-5);letter-spacing:.1em;">STORICO</div>`;
            html += storia.map(p => buildCard(p, false)).join('');
        }

        list.innerHTML = html;
    }

    function buildCard(p, isAttiva) {
        const nick    = escH(p.NICKNAME ?? '—');
        const iniziale= (p.NICKNAME ?? '?').charAt(0).toUpperCase();
        const testo   = escH(p.TESTO ?? '');
        const campo   = p.NOME_CAMPO ? escH(p.NOME_CAMPO).toUpperCase() : '';
        const data    = p.DATA   ? fmtData(p.DATA)   : '';
        const orario  = p.ORARIO ? escH(p.ORARIO)    : '';
        const max     = parseInt(p.MAX_GIOCATORI, 10) || 10;
        const num     = parseInt(p.NUM_ADESIONI,  10) || 0;
        const pct     = Math.min(100, Math.round((num / max) * 100));
        const ioHo    = !!p.IO_HO_ADERITO;
        const conf    = p.STATO === 'confermata';
        const scaduta = p.STATO === 'scaduta';
        const propId  = parseInt(p.ID, 10);

        // Badge stato
        let badge = '';
        if (conf)         badge = `<span class="proposta-stato proposta-stato--ok">Confermata ✓</span>`;
        else if (scaduta) badge = `<span class="proposta-stato proposta-stato--off">Scaduta</span>`;

        // Pulsante accetta / esci (solo proposta attiva)
        let btnHtml = '';
        if (isAttiva && !conf) {
            if (ioHo) {
                btnHtml = `<button class="btn-rifiuta-proposta" onclick="rifiutaProposta(${propId})">
                             Esci dalla partita
                           </button>`;
            } else {
                btnHtml = `<button class="btn-accetta-proposta" onclick="accettaProposta(${propId})">
                             Accetta e gioca !
                           </button>`;
            }
        }

        // Badge "sei dentro" per proposte confermate a cui hai aderito
        if (conf && ioHo) {
            btnHtml = `<span class="proposta-stato proposta-stato--ok" style="font-size:var(--text-xs);">Sei dentro ✓</span>`;
        }

        return `
        <div class="proposta-row${isAttiva ? ' proposta-row--attiva' : ''}" id="proposta-${propId}">
          <div class="proposta-avatar" aria-hidden="true">${escH(iniziale)}</div>
          <div class="proposta-body">
            <div class="proposta-nome">${nick}</div>
            <div class="proposta-card${isAttiva ? ' proposta-card--highlight' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--s-2);margin-bottom:var(--s-1);">
                <div class="proposta-card-title">${testo}</div>
                ${badge}
              </div>
              ${campo  ? `<div class="proposta-card-campo">${campo}</div>` : ''}
              ${(data || orario) ? `<div class="proposta-card-ora">${[data, orario].filter(Boolean).join(' · ')}</div>` : ''}
              <div class="proposta-progress-row">
                <span class="prog-label">${num}/${max}</span>
                <div class="prog-bar" role="progressbar" aria-valuenow="${num}" aria-valuemax="${max}"
                     aria-label="${num} su ${max} giocatori">
                  <div class="prog-fill${conf ? ' prog-fill--conf' : ''}" style="width:${pct}%;"></div>
                </div>
              </div>
              ${btnHtml ? `<div class="proposta-btns" style="margin-top:var(--s-2);">${btnHtml}</div>` : ''}
            </div>
          </div>
        </div>`;
    }

    // ================================================================
    // FETCH PROPOSTE (polling)
    // ================================================================
    function refreshProposteChat() {
        fetch('/GoalToGo/api/api_get_proposte_chat.php', { credentials: 'include' })
            .then(r => r.text())
            .then(raw => {
                console.log('[GoalToGo] proposte raw:', raw.substring(0, 300));
                let data;
                try { data = JSON.parse(raw); }
                catch(_) { console.error('[GoalToGo] proposte non-JSON:', raw); return; }
                if (data.status !== 'success') { console.error('Proposte:', data.message); return; }
                renderProposte(data.proposte || [], data.proposta_attiva || null);
            })
            .catch(err => console.error('Errore fetch proposte:', err));
    }
    window.refreshProposteChat = refreshProposteChat;

    // ================================================================
    // ACCETTA
    // ================================================================
    window.accettaProposta = function (propostaId) {
        fetch('/GoalToGo/api/api_adesione_proposta.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposta_id: propostaId, azione: 'accetta' })
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok || data.status === 'success') {
                if (data.confermata) {
                    // ✅ Partita completa → vai al pagamento
                    Swal.fire({
                        title: 'Partita confermata! ⚽',
                        text: 'Tutti i giocatori sono pronti. Procedi al pagamento.',
                        icon: 'success',
                        confirmButtonText: 'Vai al pagamento'
                    }).then(r => {
                        if (r.isConfirmed) {
                            // Salva l'id proposta per il pagamento e reindirizza
                            localStorage.setItem('propostaConfermataId', propostaId);
                            window.location.href = 'pagina_pagamento.html';
                        } else {
                            refreshProposteChat();
                        }
                    });
                } else {
                    Swal.fire({
                        title: 'Sei dentro!',
                        text: `Giocatori: ${data.num_adesioni ?? ''}. In attesa degli altri…`,
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    }).then(() => refreshProposteChat());
                }
            } else {
                Swal.fire({ title: 'Errore', text: data.message, icon: 'error' });
            }
        })
        .catch(err => Swal.fire({ title: 'Errore', text: err.message, icon: 'error' }));
    };

    // ================================================================
    // BOTTONE FOOTER "Accetta e gioca !"
    // ================================================================
    window.accettaPropostaPrincipale = function () {
        if (_propAttivaId) accettaProposta(_propAttivaId);
    };

    // ================================================================
    // RIFIUTA / ESCI
    // ================================================================
    window.rifiutaProposta = function (propostaId) {
        fetch('/GoalToGo/api/api_adesione_proposta.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ proposta_id: propostaId, azione: 'rifiuta' })
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                refreshProposteChat();
            } else {
                Swal.fire({ title: 'Errore', text: data.message, icon: 'error' });
            }
        })
        .catch(err => Swal.fire({ title: 'Errore', text: err.message, icon: 'error' }));
    };

    // ================================================================
    // MODALE PROPOSTA
    // ================================================================
    window.apriModaleProposta = function () {
        const btn = document.getElementById('btn-proponi-principale');
        if (btn && btn.disabled) {
            Swal.fire({
                title: 'Proposta già in corso',
                text: 'C\'è già una proposta attiva. Aspetta che scada (30 min) o che la partita si completi.',
                icon: 'info'
            });
            return;
        }
        const m = document.getElementById('modale-proposta');
        if (m) { m.style.display = 'flex'; m.setAttribute('aria-hidden', 'false'); }
    };

    window.chiudiModaleProposta = function () {
        const m = document.getElementById('modale-proposta');
        if (m) { m.style.display = 'none'; m.setAttribute('aria-hidden', 'true'); }
    };

    // Chiudi su click overlay
    const modaleEl = document.getElementById('modale-proposta');
    if (modaleEl) modaleEl.addEventListener('click', e => {
        if (e.target === modaleEl) chiudiModaleProposta();
    });

    // ================================================================
    // INVIA PROPOSTA
    // ================================================================
    window.inviaPropostaChat = function (event) {
        event?.preventDefault();
        const form = document.getElementById('form-proposta');
        if (!form) return;
        const get = name => form.querySelector(`[name="${name}"]`)?.value ?? '';

        const payload = {
            testo:         get('testo').trim(),
            data:          get('data'),
            orario:        get('orario').trim(),
            nome_campo:    get('nome_campo').trim(),
            max_giocatori: parseInt(get('max_giocatori') || '10', 10),
        };

        // descrizione opzionale — se vuota usa testo di default
        if (!payload.testo) payload.testo = 'Partita proposta';

        const btnSubmit = form.querySelector('button[type="submit"]');
        if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Invio…'; }

        fetch('/GoalToGo/api/api_crea_proposta_chat.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(r => r.text())
        .then(raw => {
            console.log('[GoalToGo] risposta proposta:', raw);
            let data;
            try { data = JSON.parse(raw); }
            catch (_) {
                Swal.fire({ title: 'Errore server', text: 'Risposta non valida dal server. Controlla la console (F12).', icon: 'error' });
                return;
            }
            if (data.status === 'success') {
                Swal.fire({
                    title: 'Proposta inviata! ⚽',
                    text: 'I tuoi compagni hanno 30 minuti per accettare.',
                    icon: 'success', timer: 2200, showConfirmButton: false
                }).then(() => {
                    form.reset();
                    chiudiModaleProposta();
                    refreshProposteChat();
                });
            } else {
                Swal.fire({ title: 'Non puoi proporre ora', text: data.message, icon: 'info' });
            }
        })
        .catch(err => Swal.fire({ title: 'Errore', text: err.message, icon: 'error' }))
        .finally(() => {
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = 'Invia proposta'; }
        });
    };

    // ================================================================
    // CSS INLINE per i nuovi elementi
    // ================================================================
    const style = document.createElement('style');
    style.textContent = `
        /* Badge stato */
        .proposta-stato {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 999px;
            font-size: var(--text-xs);
            font-weight: 700;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .proposta-stato--ok  { background: rgba(34,197,94,.15);  color: #22c55e; border: 1px solid #22c55e; }
        .proposta-stato--off { background: rgba(239,68,68,.12);  color: var(--danger); border: 1px solid var(--danger); }

        /* Highlight card attiva */
        .proposta-card--highlight {
            border-color: var(--brand) !important;
            box-shadow: 0 0 0 1px var(--brand);
        }

        /* Banner timer */
        .chat-timer-pill {
            background: rgba(188,255,0,.1);
            border: 1px solid var(--brand);
            color: var(--brand);
            font-weight: 700;
            font-size: var(--text-sm);
            text-align: center;
            margin-bottom: var(--s-3);
        }

        /* Barra progress confermata */
        .prog-fill--conf { background: #22c55e; }

        /* Bottone proponi disabilitato */
        .btn-proponi--locked {
            opacity: .45;
            cursor: not-allowed;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);

    // ================================================================
    // INIT
    // ================================================================
    caricaBannerClub();
    refreshProposteChat();

    // Poll ogni 15 secondi
    _pollInterval = setInterval(refreshProposteChat, 15000);

})();
