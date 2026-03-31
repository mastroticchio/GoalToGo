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
    default:
      console.log("Azione sconosciuta");
  }
}

/*ovviamente questa va rifatta, ogni click deve portare ad una nuova schermata, per ora ho messo solo delle finestre pop-up per far finta che sia interattivo*/