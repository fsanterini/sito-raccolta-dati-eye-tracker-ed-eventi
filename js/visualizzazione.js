// PAGINA DASHBOARD
// numero di sessioni TOTALE
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-session')
    .then(response => response.json())
    .then(data => {
        const sessionCountElement = document.getElementById('session-count');
        if (sessionCountElement) { 
        sessionCountElement.textContent = `Numero di sessioni nel database: ${data.sessionCount}`;
        } else {
          console.error('elemento non trovato.');
        }
    })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
});

// FISSAZIONI TOTALI
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-total-fixations')
    .then(response => response.json())
    .then(data => {
        const totalFixationsElement = document.getElementById('total-fixations');
        if (totalFixationsElement) {
          totalFixationsElement.textContent = `Numero totale di fissazioni: ${data.totalFixations}`;
        } else {
          console.error('Elemento non trovato.');
        }
    })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
});

//numero eventi TOTALE
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-itemsEventi')
    .then(response => response.json())
    .then(data => {
        const totalItemsEventiElement= document.getElementById('total-items-eventi');
        if (totalItemsEventiElement){
        totalItemsEventiElement.textContent= `Numero totale di eventi catturati: ${data.totalevents}`;
        } else {
          console.error('elemento non trovato.');
        }
      })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
});



//numero fissazioni MEDIA 
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-MEDIA-itemsFixation')
    .then(response => response.json())
    .then(data => {
        const mediaItemsElement= document.getElementById('media-items-fixation');
        if (mediaItemsElement) {
        mediaItemsElement.textContent= `In media ogni sessione conta ${data.mediaItems} fissazioni`;
        } else {
          console.error('elemento non trovato.');
        }
      })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
});

//numero eventi MEDIA 
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-MEDIA-itemsEventi')
    .then(response => response.json())
    .then(data => {
        const mediaItemsElement= document.getElementById('media-items-eventi');
        if (mediaItemsElement) {
        mediaItemsElement.textContent= `In media ogni sessione conta ${data.mediaItems} eventi`;
        } else {
          console.error('elemento non trovato.');
        }
      })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
});



//tempo TOTALE
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-Time')
    .then(response => response.json())
    .then(data => {
      console.log(data)
        const totalTIMEElement= document.getElementById('total-Time');
        if (totalTIMEElement) {
          totalTIMEElement.textContent= `Tempo totale di utilizzo del Logger: ${data.totalTIME}`;
        } else {
          console.error('elemento non trovato.');
        } 
})
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
});

//tempo MEDIA 
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-media-time')
    .then(response => response.json())
    .then(data => {
        const mediaTimeElement= document.getElementById('media-time');
        if (mediaTimeElement) {
          mediaTimeElement.textContent= `In media ogni sessione ha una durata di ${data.mediaTime} secondi`;
        } else {
          console.error('elemento non trovato.');
        }
      })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
});

//Grafico torta generale (pagine)
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-DatiTorta')
    .then(response => response.json())
    .then(data => {
        createPieChart(data);
    })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });

    function createPieChart(data) {
      

      const ctx = document.getElementById('pageUsageChart').getContext('2d');
      const chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(data),
          datasets: [{ data: Object.values(data),
                        backgroundColor: [
                        'red','blue','green','purple','yellow','orange','black','pink','brown']}],
              },
          options: { legend: {
                            position: 'top', 
                            align: 'start',    
                   }},
        });
        }
      });

// grafico numero sessioni e giorni (generale)
document.addEventListener('DOMContentLoaded', () => {
  fetch('http://localhost:8000/get-barchart')
    .then(response => response.json())
    .then(data => {
        createBarChart(data);
    })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });

    function createBarChart(data) {
      const giorni= data.map (entry => entry.giorno);
      const numeriSessioni= data.map (entry=> entry.numeroSessioni);

      const ctx = document.getElementById('sessionDayChart').getContext('2d');
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: giorni,
          datasets: [{ data: numeriSessioni,backgroundColor: 'blue'}],
              },
        options: { 
          legend: {display: false},
          scales: { 
            x: {
              title:{ display: true, text: "Data"}, 
              labels:{display: true, text:'Data'}
            },
            y: {
              title: { display: true, text: 'Items sessioni'},
              labels:{display: true, text:'Items'}
            }},
          },
        });
      }
    });  


