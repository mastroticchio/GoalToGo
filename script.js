function handleClick(action, element = null) {
  switch (action) {
    case 'crea-club':
      window.location.href = "pagina_crea_club.html";
      break;
    case 'prenota':
      window.location.href = "pagina_prenota.html";
      break;
    case 'trova':
      window.location.href = "pagina_trova_partita.html";
      break;
    case 'club':
      window.location.href = "pagina_club.html";
      break;
    case 'inizia':
      window.location.href = "home_page.html";
      break;
    case 'pagina-prenota-seconda-per-partite':
      window.location.href = "pagina_prenota_seconda_per_partite.html"
      break;
    case 'inizia-registrazione':
      handleRegister();
      break;
    case 'schermata-accedi':
      window.location.href = "pagina_accedi.html"
      break;
    case 'schermata-registrati':
      window.location.href = "pagina_registrati.html"
      break;
    case 'crea-partita':
      window.location.href = "pagina_crea_partita.html"
      break;
    case 'pagina-prenota-seconda':
      window.location.href = "pagina_prenota_seconda_per_prenotazione.html"
      break;
    case 'trova-partita-seconda':
      const count_player = document.getElementById("count-player").textContent;
      localStorage.setItem("count-player", count_player);
      window.location.href = "pagina_trova_partita_seconda.html";
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
      const prezzo = document.getElementById("price").textContent;
      localStorage.setItem("price", prezzo);
      const numGiocatori = document.getElementById("count").textContent;
      localStorage.setItem("count", numGiocatori);
      window.location.href = "pagina_pagamento.html"
      break;
    case 'pagamento-trova-partita-2':
      const numGiocatori2 = document.getElementById("count-player").textContent;
      localStorage.setItem("count", numGiocatori2);
      window.location.href = "pagina_pagamento.html"
      break;
    default:
      console.log("Azione sconosciuta");
  }
}

function setVisibility(button) {
  const buttons = document.querySelectorAll(".visibility-btn");

  buttons.forEach(btn => btn.classList.remove("active"));

  button.classList.add("active");

  const value = button.textContent.trim();
  localStorage.setItem("clubVisibility", value);
}

function handleRegister() {
  const isGiocatore = document
    .querySelector(".toggle-btn.active")
    .innerText.includes("giocatore");

  if (isGiocatore) {
    const inputs = document.querySelectorAll("#form-giocatore input");

    const email = inputs[0].value;
    const username = inputs[1].value;
    const password = inputs[2].value;
    const confirm = inputs[3].value;

    if (!email || !username || !password || !confirm) {
      alert("Compila tutti i campi");
      return;
    }

    if (password !== confirm) {
      alert("Le password non coincidono");
      return;
    }

    console.log("Registrazione giocatore:", { email, username, password });

    window.location.href = "home_page.html";

  } else {
    const inputs = document.querySelectorAll("#form-campo input");

    const email = inputs[0].value;
    const nome = inputs[1].value;
    const password = inputs[2].value;
    const confirm = inputs[3].value;

    if (!email || !nome || !password || !confirm) {
      alert("Compila tutti i campi");
      return;
    }

    if (password !== confirm) {
      alert("Le password non coincidono");
      return;
    }

    console.log("Registrazione campo:", { email, nome, password });

    window.location.href = "pagina_campi_gestore.html";
  }
}

function switchMode(mode) {
  const giocatore = document.getElementById("form-giocatore");
  const campo = document.getElementById("form-campo");

  const buttons = document.querySelectorAll(".toggle-btn");

  buttons.forEach(btn => btn.classList.remove("active"));

  if (mode === "giocatore") {
    giocatore.classList.add("active-form");
    campo.classList.remove("active-form");
    buttons[0].classList.add("active");
  } else {
    campo.classList.add("active-form");
    giocatore.classList.remove("active-form");
    buttons[1].classList.add("active");
  }
}

function aggiungiGiocatore() {
  let giocatori = parseInt(document.getElementById("count").textContent) || 1;
  let prezzo = parseInt(document.getElementById("price").textContent) || 0;

  giocatori++;
  prezzo += 5;

  document.getElementById("count").textContent = giocatori;
  document.getElementById("price").textContent = prezzo;

  localStorage.setItem("count", giocatori);
  localStorage.setItem("price", prezzo);
}

function riduciGiocatore() {
  let giocatori = parseInt(document.getElementById("count").textContent) || 1;
  let prezzo = parseInt(document.getElementById("price").textContent) || 0;

  if (giocatori <= 1) return;

  giocatori--;
  prezzo -= 5;

  document.getElementById("count").textContent = giocatori;
  document.getElementById("price").textContent = prezzo;

  localStorage.setItem("count", giocatori);
  localStorage.setItem("price", prezzo);
}

function aggiungiGiocatoreClub() {
  let giocatori_club = parseInt(document.getElementById("club-count").textContent) || 1;

  /*const MAX = 30;
  if (giocatori >= MAX) return;*/

  giocatori_club++;

  document.getElementById("club-count").textContent = giocatori_club;

  localStorage.setItem("clubCount", giocatori_club);
}

function riduciGiocatoreClub() {
  let giocatori_club = parseInt(document.getElementById("club-count").textContent) || 1;

  /*const MIN = 2;
  if (giocatori <= MIN) return;*/

  giocatori_club--;

  document.getElementById("club-count").textContent = giocatori_club;

  localStorage.setItem("clubCount", giocatori_club);
}

function toggleGiorno(btn) {
  btn.classList.toggle('active');
}

function toggleOrario(btn) {
  btn.classList.toggle('active');
}

function aggiungiImmagine() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const box = document.getElementById('upload-campo');
      box.style.backgroundImage = `url(${ev.target.result})`;
      box.style.backgroundSize = 'cover';
      box.style.backgroundPosition = 'center';
      box.innerText = '';
    };
    reader.readAsDataURL(file);
  };
  input.click();
}

const dataOggi = document.getElementById('data-oggi');
if (dataOggi) {
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  dataOggi.textContent = new Date().toLocaleDateString('it-IT', options);
}