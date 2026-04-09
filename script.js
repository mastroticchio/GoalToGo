function handleClick(action) {
  switch (action) {
    case 'prenota':
      window.location.href = "pagina_prenota.html";
      break;
    case 'trova':
      alert("Vai a trovare una partita");
      break;
    case 'lega':
      alert("Vai alle leghe");
      break;
    case 'inizia':
      window.location.href = "home_page.html";
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
    case 'pagina-prenota-seconda':
      window.location.href = "pagina_prenota_seconda.html"
    case 'aggiungi-giocatori':
      aggiungiGiocatore();
      break;
    case 'riduci-giocatori':
      riduciGiocatore();
      break;
    case 'pagamento-trova-partita':
      window.location.href = "pagina_pagamento.html"
      break;
    default:
      console.log("Azione sconosciuta");
  }
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

  } else {
    const inputs = document.querySelectorAll("#form-campo input");

    const email = inputs[0].value;
    const nome = inputs[1].value;
    const indirizzo = inputs[2].value;
    const password = inputs[3].value;
    const confirm = inputs[4].value;

    if (!email || !nome || !indirizzo || !password || !confirm) {
      alert("Compila tutti i campi");
      return;
    }

    if (password !== confirm) {
      alert("Le password non coincidono");
      return;
    }

    console.log("Registrazione campo:", { email, nome, indirizzo, password });
  }
  window.location.href = "home_page.html";
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
  let giocatori = parseInt(document.getElementById("count").textContent);
  let prezzo = parseInt(document.getElementById("price").textContent);

  giocatori++;
  prezzo += 5;

  document.getElementById("count").textContent = giocatori;
  document.getElementById("price").textContent = prezzo;
}

function riduciGiocatore() {
  let giocatori = parseInt(document.getElementById("count").textContent);
  let prezzo = parseInt(document.getElementById("price").textContent);

  giocatori--;
  prezzo -= 5;

  document.getElementById("count").textContent = giocatori;
  document.getElementById("price").textContent = prezzo;
}

/*ovviamente questa va rifatta, ogni click deve portare ad una nuova schermata, per ora ho messo solo delle finestre pop-up per far finta che sia interattivo*/