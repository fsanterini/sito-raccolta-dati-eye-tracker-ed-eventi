// Chiamata tabella originale

let originalData;
let tabellaEspansa = true;

const currentPage = window.location.pathname;

fetch('http://localhost:8000/tutte-sessioni')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    originalData = data;
    console.log("Dati caricati:", originalData);
    
    // Verifica la pagina corrente per decidere quale tabella mostrare
    if (currentPage.includes('table_eventi.html')) {
      creaTabella(data, 'eventi');
    } else if (currentPage.includes('table_eye_tracker.html')) {
      creaTabella(data, 'eye-tracker');
    } else {
      console.warn("Pagina non riconosciuta, nessuna tabella caricata.");
    }
  })
  .catch(error => {
    console.error('Errore durante la richiesta al server:', error);
    const messageDiv = document.getElementById('message');
    messageDiv.innerText = 'Errore nel caricamento dei dati. Riprova più tardi.';
    messageDiv.style.display = 'block';
  });
  
// Chiamata tabella filtrata
function applicaFiltri() {
  const partecipantFilter = document.getElementById('partecipantFilter').value;
  const RecordingDateFilterElement = document.getElementById('RecordingDateFilter').value;
  const MinFixations = parseInt(document.getElementById('MinFixations')?.value || 0);
  const MaxFixations = parseInt(document.getElementById('MaxFixations')?.value || 0);
  const messageDiv = document.getElementById('message');
  let url = '';
  let RecordingDateFilter = null;

  // Funzione per formattare la data
  function formatDateToDDMMYYYY(date) {
    const giorno = date.getDate().toString().padStart(2, '0');
    const mese = (date.getMonth() + 1).toString().padStart(2, '0');
    const anno = date.getFullYear();
    return `${giorno}/${mese}/${anno}`;
  }

  // Validazione dell'ID partecipante
  if (partecipantFilter) {
    if (!partecipantFilter.match(/^\w+$/)) {
      messageDiv.innerText = 'Inserire un valore valido per participant_id (numerico o alfabetico)';
      messageDiv.style.display = 'block';
      return;
    }
  }

  // Validazione della data
  if (RecordingDateFilterElement) {
    RecordingDateFilter = new Date(RecordingDateFilterElement);
    const recordingDateFormatted = formatDateToDDMMYYYY(RecordingDateFilter);
    if (isNaN(RecordingDateFilter.getTime())) {
      messageDiv.innerText = 'Inserire una data valida dal calendario';
      messageDiv.style.display = 'block';
      return;
    }
    RecordingDateFilter = recordingDateFormatted;
  }

  // Rileva la sezione corrente
  const currentPage = window.location.pathname;

  if (currentPage.includes('table_eye_tracker.html')) {
    // Sezione eye-tracker: include tutti i filtri

    if ((MinFixations || MaxFixations) && (isNaN(MinFixations) || isNaN(MaxFixations) || MinFixations > MaxFixations)) {
      messageDiv.innerText = 'Inserire valori validi per il numero minimo e massimo di fissazioni';
      messageDiv.style.display = 'block';
      return;
    }

    if (RecordingDateFilter && partecipantFilter) {
      url = `http://localhost:8000/sessioni-filtrate?partecipantFilter=${encodeURIComponent(partecipantFilter)}&RecordingDateFilter=${encodeURIComponent(RecordingDateFilter)}`;
      if (MinFixations) url += `&minFixations=${MinFixations}`;
      if (MaxFixations) url += `&maxFixations=${MaxFixations}`;
      chiamataFiltri(url, 'eye-tracker');
    } else if (RecordingDateFilter && !partecipantFilter) {
      url = `http://localhost:8000/sessioni-filtrate?RecordingDateFilter=${encodeURIComponent(RecordingDateFilter)}`;
      if (MinFixations) url += `&minFixations=${MinFixations}`;
      if (MaxFixations) url += `&maxFixations=${MaxFixations}`;
      chiamataFiltri(url, 'eye-tracker');
    } else if (!RecordingDateFilter && partecipantFilter) {
      url = `http://localhost:8000/sessioni-filtrate?partecipantFilter=${encodeURIComponent(partecipantFilter)}`;
      if (MinFixations) url += `&minFixations=${MinFixations}`;
      if (MaxFixations) url += `&maxFixations=${MaxFixations}`;
      chiamataFiltri(url, 'eye-tracker');
    } else if (!RecordingDateFilter && !partecipantFilter) {
      if (MinFixations || MaxFixations) {
        url = `http://localhost:8000/sessioni-filtrate?`;
        if (MinFixations) url += `minFixations=${MinFixations}&`;
        if (MaxFixations) url += `maxFixations=${MaxFixations}&`;
        url = url.slice(0, -1);
        chiamataFiltri(url, 'eye-tracker');
      } else {
        messageDiv.innerText = 'Inserire almeno un filtro';
        messageDiv.style.display = 'block';
      }
    }
  } else if (currentPage.includes('table_eventi.html')) {
    // Sezione eventi: includi solo participantFilter e RecordingDateFilter

    if (RecordingDateFilter && partecipantFilter) {
      url = `http://localhost:8000/sessioni-filtrate?partecipantFilter=${encodeURIComponent(partecipantFilter)}&RecordingDateFilter=${encodeURIComponent(RecordingDateFilter)}`;
      chiamataFiltri(url, 'eventi');
    } else if (RecordingDateFilter && !partecipantFilter) {
      url = `http://localhost:8000/sessioni-filtrate?RecordingDateFilter=${encodeURIComponent(RecordingDateFilter)}`;
      chiamataFiltri(url, 'eventi');
    } else if (!RecordingDateFilter && partecipantFilter) {
      url = `http://localhost:8000/sessioni-filtrate?partecipantFilter=${encodeURIComponent(partecipantFilter)}`;
      chiamataFiltri(url, 'eventi');
    } else {
      messageDiv.innerText = 'Inserire almeno un filtro';
      messageDiv.style.display = 'block';
    }
  } else {
    messageDiv.innerText = 'Sezione non riconosciuta';
    messageDiv.style.display = 'block';
  }
}



function chiamataFiltri(url, tipo) {
  console.log('URL della richiesta:', url);
  fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'same-origin',
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Errore durante la richiesta:${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data) {
        creaTabella(data, tipo);  // Passa il parametro tipo
      } else {
        console.error('Dati undefined o null ricevuti');
      }
    })
    .catch(error => {
      console.error('Errore durante la richiesta al server:', error);
    });
}

// formatta data per la tabella + riepilogo 
function formattaDataOra(dataOra,formato,colore) {
  const data = new Date(dataOra);

const giorno = data.getDate();
const mese = data.getMonth() + 1; 
const anno = data.getFullYear();

const ore = data.getHours();
const minuti = data.getMinutes();
const secondi = data.getSeconds();
const millisecondi = data.getMilliseconds();

const coloreStile = colore ? `style="color: ${colore};"` : '';
const dataFormattata = `<span ${coloreStile}>DAY: </span>${aggiungiZero(giorno)}-${aggiungiZero(mese)}-${anno}`;
  const oraFormattata = `<span ${coloreStile}>TIME:</span>${aggiungiZero(ore)}:${aggiungiZero(minuti)}:${aggiungiZero(secondi)}.${millisecondi}`;

  if (formato === 'tabella') {
    return `${dataFormattata}<br>${oraFormattata}`;
  } else if (formato === 'riepilogo') {
    return `${dataFormattata} ${oraFormattata}`;
  } else {
    return 'Formato non supportato';
  }
}

function aggiungiZero(numero) {
return numero < 10 ? `0${numero}` : numero;
}

// Creazione tabella + messaggi
function creaTabella(sessioni, tipo) {
  const tableBody = document.getElementById('database-table');
  const messageDiv = document.getElementById('message');
  tableBody.innerHTML = '';

  if (sessioni && Array.isArray(sessioni) && sessioni.length > 0) {
    let sessionCount = sessioni.length;
    messageDiv.innerText = `${sessionCount} session${sessionCount == 1 ? 'e' : 'i'} visualizzat${sessionCount == 1 ? 'a' : 'e'}`;
    
    sessioni.forEach(sessione => {
      const row = document.createElement('tr');

      if (tipo == 'eye-tracker') {
        row.innerHTML = `
          <td>${sessione.participant_id || 'N/A'}</td>
          <td>${sessione.recording_date || 'N/A'}</td>
          <td>${sessione.recording_duration || 'N/A'}</td>
          <td>${sessione.number_of_whole_fixations || 0}</td>
          <td><button class="btn btn-primary" onclick='creaDiv(${JSON.stringify(sessione)})'>Analisi</button></td>
        `;
      } else if (tipo === 'eventi') {
        row.innerHTML = `
          <td>${sessione.participant_id || 'N/A'}</td>
          <td>${sessione.recording_date || 'N/A'}</td>
          <td>${sessione.recording_duration || 'N/A'}</td>
          <td>${sessione.total_event_items || 0}</td>
          <td>
            <button class="btn btn-primary" onclick='creaDiv(${JSON.stringify(sessione)})')">Analisi</button>
          </td>
        `;

        const buttonCell = row.querySelector('td:last-child');
    const eventsContainer = document.createElement('div');
    
    // Aggiungi il pulsante LOG corretto
    buttonCell.appendChild(creaButton(sessione, eventsContainer));
    buttonCell.appendChild(eventsContainer);
      } else {
        row.innerHTML = `
          <td>${sessione.participant_id || 'N/A'}</td>
          <td>${sessione.recording_date || 'N/A'}</td>
          <td>${sessione.recording_duration || 'N/A'}</td>
          <td>Dati non disponibili</td>
          <td><button class="btn btn-warning">N/A</button></td>
        `;
      }
      
      tableBody.appendChild(row);
    });
  } else {
    messageDiv.innerText = 'Nessuna sessione trovata';
    messageDiv.style.display = 'block';
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="5">Nessun dato disponibile</td>`;
    tableBody.appendChild(noDataRow);
  }
}


// Formattazione eventi
function formattaEventi(eventi) {
  if (eventi && Array.isArray(eventi) && eventi.length > 0) {
      return eventi.map((evento, index) => {
          return `<br><span style="color: red;"> ${index} : </span>{type: "${evento.type}",<br>
          &nbsp;&nbsp;xpath: "${evento.xpath}",<br>
          &nbsp;&nbsp;url: "${evento.url}",<br>
          &nbsp;&nbsp;time: "${evento.time}"},<br>
          &nbsp;&nbsp;direction: "${evento.direction}"}`;
      }).join('');
  } else {
      return 'Nessun evento disponibile';
  }
}


// Validazione data
function validDate(filter) {
 const inputDate= new Date(filter)
 return !isNaN(inputDate.getTime()) && inputDate < new Date();
}

// Validazione ID sessione
function isNumber( partecipantFilter) {
  return /^\d+$/.test(partecipantFilter);
}

// Elimina filtri
function eliminaFilter() {
  document.getElementById('partecipantFilter').value = '';
  document.getElementById('RecordingDateFilter').value = '';
  document.getElementById('MaxFixations').value = '';
  document.getElementById('MinFixations').value = '';

  const messageDiv = document.getElementById('message');
  messageDiv.style.display = 'none'; // Nasconde il messaggio di errore

  // Controlla la pagina corrente per determinare il tipo di dati da caricare
  const currentPage = window.location.pathname;
  let tipo = '';

  if (currentPage.includes('table_eye_tracker.html')) {
    tipo = 'eye-tracker';
  } else if (currentPage.includes('table_eventi.html')) {
    tipo = 'eventi';
  } else {
    console.warn("Pagina non riconosciuta, nessuna tabella caricata.");
    return;
  }

  // Controlla se originalData è vuoto o non definito
  if (!originalData || originalData.length === 0) {
    fetch('http://localhost:8000/tutte-sessioni')  // Ricarica i dati originali dal server
      .then(response => response.json())
      .then(data => {
        originalData = data; // Ripristina i dati originali
        console.log("Dati originali ricaricati:", originalData);
        creaTabella(originalData, tipo); // Ricarica la tabella con il tipo corretto
      })
      .catch(error => {
        console.error('Errore nel ricaricamento dei dati:', error);
        messageDiv.innerText = 'Errore nel caricamento dei dati.';
        messageDiv.style.display = 'block';
      });
  } else {
    console.log("Utilizzo dati originali già caricati.");
    creaTabella(originalData, tipo); // Passa il tipo per evitare la tabella di default
  }
}


// Crea button log 
function creaButton(sessione, eventsContainer) {
  const button = document.createElement('button');
  button.innerText = 'LOG';
  button.classList.add('btn', 'btn-secondary', 'm-2');
  button.addEventListener('click', () => toggleEventi(sessione, eventsContainer, button));  // Modificato
  return button;
}


// Toggle 
function toggleEventi(sessione, eventsContainer, button) {
  const eventsVisible = eventsContainer.innerHTML.trim() !== '';
  if (eventsVisible) {
      nascondiEventi(eventsContainer, button);
  } else {
      visualizzaEventi(sessione.session_events, eventsContainer, button);  // Modificato
  }
}


// Visualizza eventi
function visualizzaEventi(eventi, eventsContainer, button) {
  const formattedEvents = formattaEventi(eventi);
  eventsContainer.innerHTML = `<strong>Eventi:</strong><br>${formattedEvents}<br>`;
 
  if (button) {
      button.innerText = 'Close';
  }
}


// Nascondi eventi
function nascondiEventi(eventsContainer, button) {
  eventsContainer.innerHTML = '';
 
  if (button) {
    button.innerText = 'LOG';
  }
}

//espandi-riduci tabella 
function espandiTabella() {
  const tableRows = document.querySelectorAll('#database-table tr');
  const button = document.getElementById('buttonEspandi');

  if (tabellaEspansa) {
    tableRows.forEach(row => {
      row.style.display = 'table-row';
    });
    button.innerText = 'Riduci tabella';
  } else {
    tableRows.forEach((row, index) => {
      row.style.display = index < 5 ? 'table-row' : 'none';
    });
    button.innerText = 'Espandi tabella';
  }
  tabellaEspansa = !tabellaEspansa;
}



//creazione button "analisi sessione"
function creaButtonANALISI(sessione) {
  const button = document.createElement('button');
  button.innerText = 'Analisi sessione';
  button.classList.add('btn', 'btn-primary', 'm-2');
  button.addEventListener('click', (event) => {
    const existingDiv = document.getElementById('analisiContainer_' + sessione.participant_id);

    if (existingDiv) {
      existingDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      creaDiv(sessione, event);
    }
    
  });
  return button;
}



//crea DIV 
function creaDiv(sessione, event) {
  const existingDiv = document.getElementById('analisiContainer_' + sessione.participant_id);

  if (existingDiv) {
    existingDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return existingDiv;
  }

  const newDiv = document.createElement('div');
  newDiv.id = 'analisiContainer_' + sessione.participant_id;
  newDiv.style.backgroundColor = "white";
  newDiv.style.marginLeft = '5%';
  newDiv.style.width = '90%';
  newDiv.style.height = 'auto';
  newDiv.classList.add('graph-container');

  Chiudi(newDiv);

  const riepilogo = document.createElement('div');
  
  // Rileva la sezione corrente
  const currentPage = window.location.pathname;

  // Logica per i campi in base alla sezione
  if (currentPage.includes('table_eye_tracker.html')) {
    // Campi per la sezione Eye Tracker
    riepilogo.innerHTML = `
      <h3>ANALISI SESSIONE - Eye Tracker</h3>
      <p>Id partecipante: ${sessione.participant_id || 'N/A'}</p>
      <p>Data registrazione: ${sessione.recording_date || 'N/A'}</p>
      <p>Durata registrazione: ${sessione.recording_duration || 'N/A'}</p>
      <p>Numero di fissazioni: ${sessione.number_of_whole_fixations || 0}</p>
    `;
  } else if (currentPage.includes('table_eventi.html')) {
    // Campi per la sezione Eventi
    riepilogo.innerHTML = `
      <h3>ANALISI SESSIONE - Eventi</h3>
      <p>Id partecipante: ${sessione.participant_id || 'N/A'}</p>
      <p>Data registrazione: ${sessione.recording_date || 'N/A'}</p>
      <p>Durata registrazione: ${sessione.recording_duration || 'N/A'}</p>
      <p>Numero di eventi: ${sessione.total_event_items|| 0}</p>
    `;
  }



  // Stile del riepilogo
  riepilogo.style.backgroundColor = 'lightblue';
  riepilogo.style.width = '30%';
  riepilogo.style.border = 'solid';
  riepilogo.style.padding = '1%';
  newDiv.appendChild(riepilogo);

  // Aggiunta del nuovo contenitore al DOM
  document.body.appendChild(newDiv);

  // Aggiungi tasti per Scanpath e Heatmap
  creaDivGrafici(sessione, event, newDiv);

  // Scroll automatico al nuovo contenitore
  newDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return newDiv;
}
// FINE DIV GRANDE 

function getPairedImages(sessione) {
  const pairedImages = [];

  const AOIImages = sessione.aoi?.zone_AOI || [];
  const graphicImages = sessione.aoi?.graphic || [];

  console.log("AOI Images:", AOIImages);
  console.log("Graphic Images:", graphicImages);

  // Normalizzazione percorsi (sostituzione \ con / per uniformità)
  const normalizedGraphicImages = graphicImages.map(g => g.replace(/\\/g, '/'));
  const normalizedAOIImages = AOIImages.map(a => a.replace(/\\/g, '/'));

  console.log("Normalized AOI Images:", normalizedAOIImages);
  console.log("Normalized Graphic Images:", normalizedGraphicImages);
  console.log("Sessione:", sessione);
  console.log("Sessione aoi:", sessione.aoi);
  console.log("AOI Images:", sessione.aoi?.zone_AOI);
  console.log("Graphic Images:", sessione.aoi?.graphic);
  console.log("Percorsi AOI:", AOIImages);
  console.log("Percorsi Graphic:", graphicImages);
  console.log("sessione.images.aoi:", sessione.images?.aoi);



  // Creazione mappa dei graphic images basata sul nome file
  const graphicMap = new Map(
      normalizedGraphicImages.map(g => [g.split('/').pop().trim().toLowerCase(), g])
  );
  console.log("Graphic Map:", graphicMap);

  // Creazione delle coppie
  normalizedAOIImages.forEach(aoi => {
      const aoiFilename = aoi.split('/').pop().trim().toLowerCase();
      if (graphicMap.has(aoiFilename)) {
          pairedImages.push({
              aoi: aoi,
              graphic: graphicMap.get(aoiFilename)
          });
      } else {
          console.warn(`Nessun match per AOI: ${aoiFilename}`);
      }
  });

  console.log("Paired Images:", pairedImages);
  return pairedImages;
}


//div grafici
function creaDivGrafici(sessione, event, newDiv) {

  console.log("Creazione del div grafici per:", sessione.participant_id);
  console.log("Eventi disponibili:", sessione.session_events);

  const existingDiv = document.getElementById('divGraph' + sessione.participant_id);

  if (existingDiv) {
      existingDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return existingDiv;
  }

  const divGraph = document.createElement('div');
  divGraph.id = 'divGraph' + sessione.participant_id;
  divGraph.style.backgroundColor = 'lightgrey';
  divGraph.style.padding = '20px';
  newDiv.appendChild(divGraph);

  chiudiGRAFICI(divGraph);
  


    // Verifica se siamo nella sezione "Eventi" o "Eye Tracker"
    const currentPage = window.location.pathname;

    if (currentPage.includes('table_eventi.html')) {
        console.log("Sezione Eventi - Mostra solo il pulsante 'Visualizza Grafici'.");

        // Creazione del pulsante "Visualizza Grafici"
        const buttonVisualizzaGrafici = document.createElement('button');
        buttonVisualizzaGrafici.innerText = 'Visualizza Grafici';
        buttonVisualizzaGrafici.classList.add('btn', 'btn-primary', 'm-2');

        buttonVisualizzaGrafici.addEventListener('click', () => {
            const existingGraphContainer = document.getElementById('graphContainer_' + sessione.participant_id);
            if (existingGraphContainer) {
                existingGraphContainer.remove();
                buttonVisualizzaGrafici.innerText = 'Visualizza Grafici';
            } else {
                const graphContainer = document.createElement('div');
                graphContainer.id = 'graphContainer_' + sessione.participant_id;
                graphContainer.style.marginTop = "10px";
                graphContainer.style.padding = "10px";
                graphContainer.style.backgroundColor = "white";
                graphContainer.style.border = "1px solid #ccc";

                divGraph.appendChild(graphContainer);
                creaDonut(sessione, event, graphContainer);
                creaBarre(sessione, event, graphContainer);
                creaMap(sessione, event, graphContainer);

                buttonVisualizzaGrafici.innerText = 'Nascondi Grafici';
            }
        });

        divGraph.appendChild(buttonVisualizzaGrafici);
    }else{


    // Contenitore per i caroselli
    const carouselContainer = document.createElement('div');
    carouselContainer.classList.add('carousel-container');

    // Creazione carosello ScanPath
    const scanpathCarousel = document.createElement('div');
    scanpathCarousel.classList.add('carousel-wrapper');
    scanpathCarousel.style.display = 'none';

    const scanpathImages = sessione.images?.scanpath_duration_plot || [];
    let scanpathIndex = 0;

    const scanpathImgElement = document.createElement('img');
    scanpathImgElement.classList.add('carousel-image');
    scanpathCarousel.appendChild(scanpathImgElement);

    const prevScanpathButton = document.createElement('button');
    prevScanpathButton.innerHTML = '◀️';
    prevScanpathButton.classList.add('carousel-button', 'prev');
    prevScanpathButton.addEventListener('click', () => {
        scanpathIndex = (scanpathIndex - 1 + scanpathImages.length) % scanpathImages.length;
        updateCarouselImage(scanpathImgElement, scanpathImages, scanpathIndex);
    });

    const nextScanpathButton = document.createElement('button');
    nextScanpathButton.innerHTML = '▶️';
    nextScanpathButton.classList.add('carousel-button', 'next');
    nextScanpathButton.addEventListener('click', () => {
        scanpathIndex = (scanpathIndex + 1) % scanpathImages.length;
        updateCarouselImage(scanpathImgElement, scanpathImages, scanpathIndex);
    });

    scanpathCarousel.appendChild(prevScanpathButton);
    scanpathCarousel.appendChild(nextScanpathButton);

    // Creazione carosello Heatmap
    const heatmapCarousel = document.createElement('div');
    heatmapCarousel.classList.add('carousel-wrapper');
    heatmapCarousel.style.display = 'none';

    const heatmapImages = sessione.images?.heatmap_duration_plot || [];
    let heatmapIndex = 0;

    const heatmapImgElement = document.createElement('img');
    heatmapImgElement.classList.add('carousel-image');
    heatmapCarousel.appendChild(heatmapImgElement);

    const prevHeatmapButton = document.createElement('button');
    prevHeatmapButton.innerHTML = '◀️';
    prevHeatmapButton.classList.add('carousel-button', 'prev');
    prevHeatmapButton.addEventListener('click', () => {
        heatmapIndex = (heatmapIndex - 1 + heatmapImages.length) % heatmapImages.length;
        updateCarouselImage(heatmapImgElement, heatmapImages, heatmapIndex);
    });

    const nextHeatmapButton = document.createElement('button');
    nextHeatmapButton.innerHTML = '▶️';
    nextHeatmapButton.classList.add('carousel-button', 'next');
    nextHeatmapButton.addEventListener('click', () => {
        heatmapIndex = (heatmapIndex + 1) % heatmapImages.length;
        updateCarouselImage(heatmapImgElement, heatmapImages, heatmapIndex);
    });

    heatmapCarousel.appendChild(prevHeatmapButton);
    heatmapCarousel.appendChild(nextHeatmapButton);

    // Creazione video
    const videoElement = document.createElement('video');
    videoElement.classList.add('carousel-video');
    videoElement.controls = true;
    videoElement.style.display = 'none';
    videoElement.src = sessione.video || '';

    // Pulsanti per alternare i contenuti
    const buttonVisualizzaScanpath = document.createElement('button');
    buttonVisualizzaScanpath.innerText = 'Visualizza ScanPath';
    buttonVisualizzaScanpath.classList.add('btn', 'btn-primary', 'm-2');
    buttonVisualizzaScanpath.addEventListener('click', () => {
        updateCarouselImage(scanpathImgElement, scanpathImages, scanpathIndex);
        scanpathCarousel.style.display = 'block';
        heatmapCarousel.style.display = 'none';
        AOICarousel.style.display = 'none';
        videoElement.style.display = 'none';
    });

    const buttonVisualizzaHeatmap = document.createElement('button');
    buttonVisualizzaHeatmap.innerText = 'Visualizza Heatmap';
    buttonVisualizzaHeatmap.classList.add('btn', 'btn-primary', 'm-2');
    buttonVisualizzaHeatmap.addEventListener('click', () => {
        updateCarouselImage(heatmapImgElement, heatmapImages, heatmapIndex);
        scanpathCarousel.style.display = 'none';
        heatmapCarousel.style.display = 'block';
        AOICarousel.style.display = 'none';
        videoElement.style.display = 'none';
    });

    const buttonVisualizzaVideo = document.createElement('button');
    buttonVisualizzaVideo.innerText = 'Visualizza Video';
    buttonVisualizzaVideo.classList.add('btn', 'btn-primary', 'm-2');
    buttonVisualizzaVideo.addEventListener('click', () => {
        scanpathCarousel.style.display = 'none';
        heatmapCarousel.style.display = 'none';
        AOICarousel.style.display = 'none';
        videoElement.style.display = 'block';
    });

    // Creazione carosello AOI
    const AOICarousel = document.createElement('div');
    AOICarousel.classList.add('carousel-wrapper');
    AOICarousel.style.display = 'none';
    
    const AOIImgElement = document.createElement('img');
    const GraphicImgElement = document.createElement('img');
    AOIImgElement.classList.add('carousel-image');
    GraphicImgElement.classList.add('carousel-image');
    
    const AOIContainer = document.createElement('div');
    AOIContainer.classList.add('aoi-container'); // **Aggiunta della classe CSS**
    AOIContainer.appendChild(AOIImgElement);
    AOIContainer.appendChild(GraphicImgElement);
    console.log("Children of AOIContainer:", AOIContainer.children);
    AOICarousel.appendChild(AOIContainer);

    const pairedImages = getPairedImages(sessione);
    let pairIndex = 0;

    document.body.appendChild(AOICarousel); // Assicurati che il carosello sia nel DOM
  console.log("AOICarousel is now in DOM:", document.body.contains(AOICarousel));
  console.log("AOI Image in DOM:", document.body.contains(AOIImgElement));
  console.log("Graphic Image in DOM:", document.body.contains(GraphicImgElement));


  function updatePairImages() {
    if (pairedImages.length > 0) {
        console.log("Updating images:", pairedImages[pairIndex]);
        AOIImgElement.src = pairedImages[pairIndex].aoi;
        GraphicImgElement.src = pairedImages[pairIndex].graphic;

        AOIImgElement.style.display = 'block';
        GraphicImgElement.style.display = 'block';


        console.log("AOI Image Source:", AOIImgElement.src);
        console.log("Graphic Image Source:", GraphicImgElement.src);
    } else {
        console.warn("Nessuna coppia di immagini AOI-Graphic trovata!");
    }
  }

      const prevPairButton = document.createElement('button');
      prevPairButton.innerHTML = '◀️';
      prevPairButton.classList.add('carousel-button', 'prev');
      prevPairButton.addEventListener('click', () => {
          pairIndex = (pairIndex - 1 + pairedImages.length) % pairedImages.length;
          updatePairImages();
      });

      const nextPairButton = document.createElement('button');
      nextPairButton.innerHTML = '▶️';
      nextPairButton.classList.add('carousel-button', 'next');
      nextPairButton.addEventListener('click', () => {
          pairIndex = (pairIndex + 1) % pairedImages.length;
          updatePairImages();
      });

      AOICarousel.appendChild(prevPairButton);
      AOICarousel.appendChild(nextPairButton);

      const buttonVisualizzaAOI = document.createElement('button');
      buttonVisualizzaAOI.innerText = 'Visualizza AOI';
      buttonVisualizzaAOI.classList.add('btn', 'btn-primary', 'm-2');
      buttonVisualizzaAOI.addEventListener('click', () => {
          updatePairImages();
          AOICarousel.style.display = 'block';
      });

      console.log("AOI Image in DOM:", document.body.contains(AOIImgElement));
  console.log("Graphic Image in DOM:", document.body.contains(GraphicImgElement));



    // Aggiunta elementi al contenitore principale
    carouselContainer.appendChild(buttonVisualizzaScanpath);
    carouselContainer.appendChild(buttonVisualizzaHeatmap);
    carouselContainer.appendChild(buttonVisualizzaVideo);
    carouselContainer.appendChild(buttonVisualizzaAOI);
    carouselContainer.appendChild(scanpathCarousel);
    carouselContainer.appendChild(heatmapCarousel);
    carouselContainer.appendChild(AOICarousel);
    carouselContainer.appendChild(videoElement);

    // Aggiunta al divGraph
    divGraph.appendChild(carouselContainer);
    }

    return divGraph;
  }


// Funzione per aggiornare l'immagine corrente del carosello
function updateCarouselImage(imgElement, images, index) {
  if (images.length > 0) {
      imgElement.src = images[index];
      imgElement.style.display = 'block';
  } else {
      imgElement.style.display = 'none';
  }
}


// Funzione per aggiornare dinamicamente il carosello
function updateCarousel(images, carouselWrapper) {
  console.log("Aggiornamento carosello con immagini:", images);

  // Pulisce il carosello esistente
  carouselWrapper.innerHTML = "";

  if (!images || images.length === 0) {
      carouselWrapper.innerHTML = "<p style='color:red;'>Nessuna immagine disponibile</p>";
      return;
  }

  images.forEach((imgSrc, index) => {
      const carouselItem = document.createElement('div');
      carouselItem.classList.add('carousel-item');
      if (index === 0) carouselItem.classList.add('active');

      const imgElement = document.createElement('img');
      imgElement.src = imgSrc;
      imgElement.classList.add('carousel-image');
      imgElement.alt = `Immagine ${index + 1}`;

      carouselItem.appendChild(imgElement);
      carouselWrapper.appendChild(carouselItem);
  });
}





function caricaEventi() {
  fetch('http://localhost:8000/eventi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            start: new Date().toISOString(),
            end: new Date().toISOString(),
            session_events: [{ type: "click", xpath: "/html/body", time: new Date().toISOString() }]
        })
    })
      .then(response => response.json())
      .then(eventi => {
        console.log("Eventi caricati:", eventi);
          const wrapper = document.getElementById('graph-container');
          creaDonut(eventi, null, wrapper);
          creaBarre(eventi, null, wrapper);
      })
      .catch(error => console.error('Errore nel caricamento degli eventi:', error));
}

if (currentPage.includes('table_eventi.html')) {
  caricaEventi();
}

//chiudi grafici 
function chiudiGRAFICI(divGraph) {
  const closeButtonGraph= document.createElement('button');
  closeButtonGraph.innerText= 'Chiudi';
  closeButtonGraph.style.border= 'solid'; 
  closeButtonGraph.style.paddingTop='0.5%';
  closeButtonGraph.style.paddingBottom='0.5%'
  closeButtonGraph.style.paddingLeft='0.5%'
  closeButtonGraph.style.paddingRight='0.5%'
  closeButtonGraph.style.color='red';
  closeButtonGraph.style.marginLeft= '95%'
  
  closeButtonGraph.addEventListener('click', () => {
    divGraph.remove();
  });
  divGraph.appendChild(closeButtonGraph); ;
}





//Chiudi DIV grande
function Chiudi(newDiv) {
const closeButton = document.createElement('button');
closeButton.innerText = 'Chiudi';
  closeButton.style.border= 'solid'; 
  closeButton.style.paddingTop='0.5%';
  closeButton.style.paddingBottom='0.5%'
  closeButton.style.paddingLeft='0.5%'
  closeButton.style.paddingRight='0.5%'
  closeButton.style.color='red';
  closeButton.style.float="right";
  closeButton.addEventListener('click', () => {
    newDiv.remove();
  });

  newDiv.appendChild(closeButton);
}

////////////////////////////////////////GRAFICI
//TIMELINE prepara + crea
function preparaDatiTimeline(eventi) {
  const datasets = [];
  const labelsMap = new Map();
  const colori = {};

  if (eventi && Array.isArray(eventi)) {
  eventi.forEach((evento) => {

    if (evento && evento.type && evento.time) {
      const tipoEvento = evento.type;
      const data = evento.time ? new Date(evento.time) : null;

    if (tipoEvento !== null && data !== null) {
      if (!colori[tipoEvento]) {
        colori[tipoEvento] = getRandomColor();
      }

    const labelKey = `${tipoEvento} (${getItemsCount(eventi, tipoEvento)} items)`;

    if (!labelsMap.has(labelKey)) {
      labelsMap.set(labelKey, tipoEvento);

      datasets.push({
        label: labelKey,
        data: [{ x: data, y: labelKey }],
        backgroundColor: colori[tipoEvento],
        borderColor: colori[tipoEvento],
      });
    } else {
      const existingDataset = datasets.find((dataset) => dataset.label === labelKey);
      existingDataset.data.push({ x: data, y: labelKey });
    }
  }
  }
  });
}

  return {
    labels: Array.from(labelsMap.keys()),
    datasets: datasets
  };
}

///////////////////////////////COLORE GRAFICI
function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}
////////////////////////////ITEMS 
function getItemsCount(eventi, tipoEvento) {
  return eventi.filter((evento) => evento.type === tipoEvento).length;
}


//DONUT prepara + crea 
function preparaDatiDonut(eventi) {
      if (!eventi || !Array.isArray(eventi)) {
        console.error("❌ Error: 'eventi' è undefined o non è un array", eventi);
        return [];
    }

    eventi.forEach((evento) => {
        console.log(evento.type);
    });
      
  const labels = [];
  const data = [];
  const colori = [];

  
  const urlCount = {};
  eventi.forEach((evento) => {

    if (evento && evento.url) {
    const url = evento.url ?? 'N/A';
    
    if (!urlCount[url]) {
      urlCount[url] = 1;
      colori[url] = getRandomColor();
    } else {
      urlCount[url]++;
    }
  }
  });

  
  Object.keys(urlCount).forEach((url) => {

    if (url) {
      labels.push(url);
      data.push(urlCount[url]);
    }
  });

  return {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: Object.values(colori),
    }],
  };
}

//////
function creaDonut(sessione, event, wrapper) {
  const canvas = document.createElement('canvas');
  canvas.style.width = '80%';
  canvas.style.height = 'auto';
  canvas.id = 'donutChart';
  wrapper.appendChild(canvas);

  const datiDonut = preparaDatiDonut(sessione.session_events);

  if (!datiDonut || !datiDonut.labels || datiDonut.labels.length === 0) {
    console.error('Dati del donut non validi o vuoti.');
    return;
  }

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: datiDonut,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
    layout: {
        padding: {
          top: 0,
        }, 
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            generateLabels: function (chart) {
              if (chart && chart.config && chart.config.data && chart.config.data.datasets) {
                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);

                labels.forEach((label,index) => {
                  const dataset = chart.config.data.datasets[0].data;
                  const total = dataset.reduce((acc, value) => acc + value, 0);
                  const percentage = ((dataset[index] / total) * 100).toFixed(2);
                  label.text= `${chart.config.data.labels[index]}: (${percentage}%)`;
                });

                return labels;
              }

              return [];
            },
          },
        },
      },
      
      cutout: '50%',
      tooltips: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const dataset = context.dataset.data;
            const total = dataset.reduce((acc, value) => acc + value, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${percentage}%`;
          },
        },
      },
    },
  });
}


////BARRE prepara + crea 
function preparaDatiBarre(eventi) {
  const labels = [];
  const data = {};

  eventi.forEach((evento) => {
    if (evento && evento.type) {
      const tipoEvento = evento.type;

      if (!data[tipoEvento]) {
        data[tipoEvento] = 1;
      } else {
        data[tipoEvento]++;
      }
    }
  });

  Object.keys(data).forEach((tipoEvento) => {
    labels.push(tipoEvento);
  });

  const datasets = [{
    data: Object.values(data),
    backgroundColor: labels.map(() => getRandomColor()),
  }];

  return {
    labels: labels,
    datasets: datasets,
  };
}

////
function creaBarre (sessione,event,wrapper) {
  const canvas = document.createElement('canvas');
  canvas.style.width = '80%';
  canvas.style.height = 'auto';
  canvas.id = 'barChart';
  wrapper.appendChild(canvas);

  const datiBarre = preparaDatiBarre(sessione.session_events);

  if (!datiBarre || !datiBarre.labels || datiBarre.labels.length === 0) {
    console.error('Dati del grafico a barre non validi o vuoti.');
    return;
  }

  const ctx = canvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: datiBarre,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      layout: {
        padding: {
          top: 0,
        },
      },
      scales: {
        x: {
          type: 'category',
          position: 'bottom',
          labels: datiBarre.labels,
        },
        y: {
          type: 'linear',
          position: 'left',
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  });
}


////MAPPA
function getCoordinates(xpath) {
  var match = xpath.match(/\(([^,]+),\s([^)]+)\)/);

  if (match) {
    var x = match[1].trim();
    var y = match[2].trim();

    if (x !== 'undefined' && y !== 'undefined' && !isNaN(x) && !isNaN(y)) {
      return { x: parseFloat(x), y: parseFloat(y) };
    }
  } 
  return null
}



//
function creaMap(sessione, event, wrapper) {
  const urlData = {};

  sessione.session_events.forEach(evento => {
    if (evento.xpath && evento.xpath.includes('(') && evento.xpath.includes(')')) {
      var coordinates = getCoordinates(evento.xpath);
      
      if(coordinates=== null) {
        return;
      }
      console.log(`Coordinate: x=${coordinates.x}, y=${coordinates.y}`);

      const key = evento.url;
      if (!urlData[key]) {
        urlData[key] = { data: {}, count: 0 };
      }

      const data = urlData[key].data;

      const coordsKey = `${coordinates.x}_${coordinates.y}`;
      if (data[coordsKey]) {
        data[coordsKey].count++;
        data[coordsKey].events.push(evento.type);
      } else {
        data[coordsKey] = {
          x: coordinates.x,
          y: coordinates.y,
          count: 1,
          events: [evento.type],
        };
      }

      urlData[key].count++;
    }
  });

  Object.keys(urlData).forEach(url => {
    const canvas = document.createElement('canvas');
    canvas.style.width = '80%';
    canvas.style.height = 'auto';
    canvas.id = `maps_${url.replace(/\W/g, '_')}`;
    wrapper.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const data = urlData[url].data;

    const bubbleData = Object.values(data).map(item => {
      return {
        x: item.x,
        y: item.y,
        r: Math.min(item.count * 5, 30),
        backgroundColor: getRandomColor(),
        events: item.events,
      };
    });

    const image = new Image(); // Creare un oggetto immagine
    image.src = 'sfondobubble.png';

    image.onload = function () {
      new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [{
            label: `Eventi - \n ${url} \n(${urlData[url].count} eventi)`,
            data: bubbleData,
            pointBackgroundColor: bubbleData.map(item => item.backgroundColor),
            pointRadius: bubbleData.map(item => item.r),
          }]
        },
        options: {
          scales: {
            x: {
              type: 'linear',
              position: 'bottom',
              min: 0,
            },
            y: {
              type: 'linear',
              position: 'top',
              reverse: true,
            }
          },
          plugins: {
            beforeDraw: chart => {
              ctx.drawImage(image, chart.chartArea.left * 1.3, chart.chartArea.top * 1.3, chart.chartArea.width, chart.chartArea.height);
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const eventInfo = data[`${context.parsed.x}_${context.parsed.y}`];
                  const eventCount = eventInfo.count;
                  const eventTypes = eventInfo.events.join(', ');

                  return `Eventi: ${eventCount}\nTipo:${eventTypes.replace(/, /g, '\n')}`;
                }
              }
            },
          }
        }
      });
    };
  });
}


//CHIAMATA SMELL 
function cercaPattern (sessione,divDetectorSmell) {
  const url = 'http://localhost:8000/confrontaPattern';
  console.log('Prima della chiamata fetch');
    fetch (url, {
    method: 'POST',
    mode: 'cors',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
     },
     body: JSON.stringify({ eventi: sessione.session_events }),
  })
  .then (response => {
    if (!response.ok) {
      throw new Error (`Errore HTTP. Status:${response.status}`)
    }
    return response.json();
  })
  .then (data => {
    console.log('Risultati:', JSON.stringify(data, null, 2));
    const divRisultatiSmell= document.createElement ('div')
    divRisultatiSmell.id = 'divRisultatiSmell' + sessione.participant_id;
    divRisultatiSmell.innerHTML = JSON.stringify(data, null, 2) ;

//divSmell.style.marginLeft='2%';
//divSmell.style.paddingTop='5%';
 divDetectorSmell.appendChild(divRisultatiSmell)
 //divSmell.scrollIntoView({ behavior: 'smooth', block: 'start' });
    })

  .catch(error => {
    console.error('Errore nella chiamata al server:', error);
  });
}

if (evento && evento.type === 'keypress') {
  const data = new Date(evento.time);
}

if (evento && evento.type && evento.type.startsWith("custom")) {
  const data = new Date(evento.time);
}
