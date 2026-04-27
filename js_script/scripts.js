document.addEventListener('DOMContentLoaded',function()
    {
    const formReg = document.getElementById('formRegistrazione'); 
    
    if(formReg)
        {
        formReg.addEventListener('submit', function(e)
            {
            e.preventDefault();
            const feedback = document.getElementById('feedback');
            const dati = new FormData(this);  //prende i dati dai campi di registrazione i presenti nel form
            fetch('api/api_signin.php', {method: 'POST', body:dati})
            .then(res => 
                {
                if(!res.ok) throw new Error('Errore');
                return res.json();
                })
            .then(data => 
                {
                if(data.status == 'success')
                    {
                    feedback.innerHTML = '<p class="success">${data.message}</p>';
                    formReg.reset();    
                    }    
                else
                    {
                    feedback.innerHTML =  '<p class="error">${data.message}</p>';   
                    }
                })
                .catch(err => 
                {
                feedback.innerHTML = '<p class="error">Communication error</p>';
                console.error(err);
                })
            })    
        }
    const formLog = document.getElementById("formLogin");

    if(formLog)
        {
        formLog.addEventListener('submit', function(e)
            {
            e.preventDefault(); //non far aggiornale la pagina
            const dati = new FormData(this); //mappa i dati del form attaraverso i name
            fetch("api/api_login.php", {method: 'POST', body: dati})
            .then(res => 
                {
                if(!res.ok) throw new Error('Errore');
                return res.json();    
                })
            .then(data => 
                {
                if(data.status == 'success')
                    {
                    Swal.fire({
                    title: 'Ottimo!',
                    text: 'Login effettuato!',
                    icon: 'success',
                    timer: 2000, // Chiude automaticamente dopo 2 secondi
                    showConfirmButton: false
                    }).then(() => {
                    
                    window.location.href = "home.html";
                    });    
                    }
                else    
                    {
                    Swal.fire({
                        title: 'Errore',
                        text: data.message,
                        icon: 'error',
                        confirmButtonText: 'Riprova'
                        });    
                    }    
                })
            .catch(err => {console.error(err);});
            })
        }
    })