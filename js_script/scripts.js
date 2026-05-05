document.addEventListener('DOMContentLoaded', function () {

    // ===================== REGISTRAZIONE =====================

    const formReg = document.getElementById('formRegistrazione');

    if (formReg) {
        formReg.addEventListener('submit', function (e) {
            e.preventDefault();

            const feedback = document.getElementById('feedback');
            const dati = new FormData(this);

            fetch('/GoalToGo/api/api_signin.php', {
                method: 'POST',
                body: dati
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    feedback.innerHTML = `<p class="success">${data.message}</p>`;
                    formReg.reset();
                    window.location.href = 'home_page.html';
                } else {
                    feedback.innerHTML = `<p class="error">${data.message}</p>`;
                }
            })
            .catch(err => {
                console.error(err);
                feedback.innerHTML = '<p class="error">Communication error</p>';
            });
        });
    }

    // ===================== LOGIN =====================

    const formLog = document.getElementById('formLogin');

    if (formLog) {
        formLog.addEventListener('submit', function (e) {
            e.preventDefault();

            const dati = new FormData(this);

            fetch('/GoalToGo/api/api_login.php', {
                method: 'POST',
                body: dati
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    Swal.fire({
                        title: 'Ottimo!',
                        text: 'Login effettuato!',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    })
                    .then(() => {
                        console.log('LOGIN RESPONSE:', data);

                        localStorage.setItem('tipoUtente', data.tipo);
                        localStorage.setItem('idUtente', data.id);

                        if (data.tipo === 'gestore') {
                            window.location.href = 'pagina_campi_gestore.html';
                        } else {
                            window.location.href = 'home_page.html';
                        }
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
                    text: 'Problema di comunicazione con il server',
                    icon: 'error'
                });
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

            const payload = {
                nome:       document.getElementById('nome').value,
                indirizzo:  document.getElementById('indirizzo').value,
                citta:      document.getElementById('citta').value,
                prezzo:     document.getElementById('prezzo').value,
                fk_gestore: localStorage.getItem('idUtente'),
                orari:      orariSelezionati
            };

            console.log('INVIO CAMPO:', payload);

            fetch('/GoalToGo/api/api_registrazione_campo.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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

    // ===================== GESTIONE CAMPO =====================

const fasceOrarieContainer = document.getElementById('fasceOrarie');

if (fasceOrarieContainer) {
    const campoId   = localStorage.getItem('campoSelezionato');
    const campoNome = localStorage.getItem('campoNome');
    const campoInd  = localStorage.getItem('campoIndirizzo');
    const campoCitta= localStorage.getItem('campoCitta');
    const campoPrezzo = localStorage.getItem('campoPrezzo');

    if (campoNome)   document.getElementById('titoloCampo').innerText      = campoNome;
    if (campoInd)    document.getElementById('dettaglioIndirizzo').innerText = campoInd;
    if (campoCitta)  document.getElementById('dettaglioCitta').innerText     = campoCitta;
    if (campoPrezzo) document.getElementById('dettaglioPrezzo').innerText    = '€' + campoPrezzo + ' / ora';

    const dati = new FormData();
    dati.append('id', campoId);

    fetch('/GoalToGo/api/api_get_orari_campo.php', {
        method: 'POST',
        body: dati
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            fasceOrarieContainer.innerHTML = '';

            data.orari.forEach(orario => {
                const inizio      = orario.inizio.slice(0, 5);
                const fine        = orario.fine.slice(0, 5);
                const disponibile = orario.disponibile;
                const colore      = disponibile ? 'fascia--rosso' : 'fascia--verde';

                const btn = document.createElement('button');
                btn.type      = 'button';
                btn.className = `orario-btn ${colore}`;
                btn.dataset.id = orario.id;
                btn.dataset.disponibile = disponibile ? '1' : '0';
                btn.innerText = `${inizio}-${fine}`;

                btn.addEventListener('click', function () {
                    const attuale = this.dataset.disponibile === '1';
                    this.dataset.disponibile = attuale ? '0' : '1';
                    this.classList.toggle('fascia--rosso', !attuale);
                    this.classList.toggle('fascia--verde', attuale);
                });

                fasceOrarieContainer.appendChild(btn);
            });
        }
    })
    .catch(err => {
        console.error(err);
    });
}

window.salvaDisponibilita = function () {
    const bottoni = document.querySelectorAll('#fasceOrarie .orario-btn');

    const aggiornamenti = [];
    bottoni.forEach(btn => {
        aggiornamenti.push({
            id:           parseInt(btn.dataset.id),
            disponibile:  btn.dataset.disponibile === '1'
        });
    });

    fetch('/GoalToGo/api/api_aggiorna_disponibilita.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orari: aggiornamenti })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            Swal.fire({
                title: 'Salvato!',
                text: 'Disponibilità aggiornata',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'pagina_campi_gestore.html';
            });
        } else {
            Swal.fire({ title: 'Errore', text: data.message, icon: 'error' });
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire({ title: 'Errore', text: 'Errore di comunicazione', icon: 'error' });
    });
};

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
        dati.append('id', utenteId);

        fetch('/GoalToGo/api/api_get_campi.php', {
            method: 'POST',
            body: dati
        })
        .then(res => res.json())
        .then(data => {
            console.log('CAMPI RICEVUTI:', data);

            if (data.status === 'success') {
                const campi = data.campi;

                const numCampiEl = document.getElementById('numCampi');
                if (numCampiEl) {
                    numCampiEl.innerText = campi.length;
                }

                let totaleSlot = 0;
                let totaleOccupati = 0;
                let totaleIncassi = 0;

                campi.forEach(campo => {
                    console.log('CAMPO:', campo);
                    if (campo.orari && Array.isArray(campo.orari)) {
                        totaleSlot += campo.orari.length;
                        campo.orari.forEach(orario =>{
                            if(orario.disponibile){
                                totaleOccupati++;
                                totaleIncassi+=parseInt(campo.PREZZO);
                            }
                        });
                    }
                });

                const numSlotEl = document.getElementById('numSlot');
                if (numSlotEl) {
                    numSlotEl.innerText = totaleSlot;
                }

                const numOccupatiEl = document.getElementById('numOccupati');
                if(numOccupatiEl) {
                    numOccupatiEl.innerText = totaleOccupati;
                }

                const numIncassiEl = document.getElementById('numIncassi');
                if(numIncassiEl) {
                    numIncassiEl.innerText = totaleIncassi + '€';
                }

                if (!campi || campi.length === 0) {
                    listaCampiContainer.innerHTML = '<p>Nessun campo registrato</p>';
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
        const colore      = disponibile ? 'fascia--rosso' : 'fascia--verde';

        orariHTML += `
            <button class="fascia-btn ${colore}">
                ${inizio}-${fine}
            </button>
        `;
    });
}

cardDiv.innerHTML = `
    <div class="campo-card-header">
        <div class="campo-icon">⚽</div>
        <span class="campo-nome">${campo.NOME}</span>
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

                    cardDiv.style.cursor = 'pointer';
cardDiv.addEventListener('click', function () {
    localStorage.setItem('campoSelezionato', campo.ID);
    localStorage.setItem('campoNome',        campo.NOME);
    localStorage.setItem('campoIndirizzo',   campo.INDIRIZZO);
    localStorage.setItem('campoCitta',       campo.CITTA);
    localStorage.setItem('campoPrezzo',      campo.PREZZO);
    window.location.href = 'pagina_gestione_campo.html';
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

    // ===================== DATA OGGI =====================

    const dataOggi = document.getElementById('data-oggi');

    if (dataOggi) {
        const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
        dataOggi.textContent = new Date().toLocaleDateString('it-IT', options);
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
                n_componenti:  parseInt(document.getElementById('club-count').textContent),
                fk_giocatore:  parseInt(localStorage.getItem('idUtente'))
            };

            fetch('/GoalToGo/api/api_crea_club.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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

});

// ===================== NAVIGAZIONE =====================

function handleClick(action) {
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
            const count_player = document.getElementById('count-player').textContent;
            localStorage.setItem('count-player', count_player);
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

function aggiungiGiocatoreClub() {
    let giocatori_club = parseInt(document.getElementById('club-count').textContent) || 1;

    giocatori_club++;

    document.getElementById('club-count').textContent = giocatori_club;
    localStorage.setItem('clubCount', giocatori_club);
}

function riduciGiocatoreClub() {
    let giocatori_club = parseInt(document.getElementById('club-count').textContent) || 1;

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