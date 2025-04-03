const express= require('express');
const cors= require ('cors')
const bodyParser = require('body-parser');
const server = express();
const cookieParser= require('cookie-parser'); 
const port = 8000;
const moment = require('moment');
const parseString  = require('xml2js').parseString;
const fs = require('fs');
const path = require('path');

const {MongoClient}= require ('mongodb'); 


server.use(bodyParser.json());
server.use(express.static('public'));
server.use(cookieParser()); 

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
server.use(cors(corsOptions))

const filePath = path.join(__dirname, 'test_utente_eventi_non_ufficiale.json');

//server.use(cors());

+

/*server.get('/', (req, res) => {
  res.sendFile(__dirname + '/nuovaprova.html');
  console.log("nuovo utente collegato")
});

server.get ('/pagina2.html', (req,res) => {
  const filePath= path.join (__dirname, 'pagina2.html');
  res.sendFile(filePath);
}

const path= require ('path'); //

server.get ('/nuovaprova.html', (req,res) => {
  console.log ('utente collegato')
  const filePath= path.join (__dirname, 'nuovaprova.html');
  res.sendFile(filePath);
})
*/
server.get('/nuovaprova_mauve.html', (req, res) => {
  console.log('Utente reindirizzato al sito Mauve');
  res.redirect('http://146.48.30.34:8080/MauveWeb/');
});


server.get('/provajson.js', (req, res) => {
  res.sendFile(__dirname + '/provajson.js');
}); 

const url='mongodb://127.0.0.1:27017/dati_tabella'
let db;
let collezione; 

MongoClient.connect(url)
.then ((client) => {
  db= client;
  collezione= db.db('dati_tabella').collection('dati_tabella_tobii_2');
  console.log('connessione al database')
})  
.catch((err) => {
  console.error ('Errore nella connessione al database:', err);
});


server.post('/eventi', async (req, res) => {
  try {
      const body = req.body;
      
      // Se il body è vuoto, rispondi con un errore senza salvare
      if (!body || Object.keys(body).length === 0) {
          console.warn('❌ Richiesta ricevuta con body vuoto. Nessun evento salvato.');
          return res.status(400).json({ error: 'Il corpo della richiesta è vuoto. Nessun evento salvato.' });
      }

      console.log('✅ Dati ricevuti:', JSON.stringify(body, null, 2));

      // Se manca il campo start, assegna un timestamp attuale
      if (!body.start) {
          body.start = new Date().toISOString();
      }

      // Se manca il campo end, assegna il timestamp attuale come fine sessione
      if (!body.end) {
          body.end = new Date().toISOString();
      }

      // Recupera eventi precedenti, se esistono
      let datiSalvati = [];
      if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf8');
          if (fileData.trim()) {
              datiSalvati = JSON.parse(fileData);
          }
      }

      const nuovaSessione = {
          start: body.start,
          end: body.end,
          eventi: body.eventi,
          itemsEventi: body.eventi.length // Numero totale degli eventi registrati
      };

      // Aggiunge la sessione all'array
      datiSalvati.push(nuovaSessione);

      // Salva l'array aggiornato nel file JSON
      fs.writeFileSync(filePath, JSON.stringify(datiSalvati, null, 2));

      console.log('✅ Sessione salvata correttamente:', nuovaSessione);
      res.json({ message: 'Eventi salvati con successo nel file JSON' });

  } catch (error) {
      console.error('❌ Errore durante il salvataggio nel file JSON:', error);
      res.status(500).json({ error: 'Errore interno del server' });
  }
});



async function assegnaID(body) {
  const participant_id = Math.floor(Math.random() * 100);
  body['participant_id'] = participant_id;
  await controlloID(body);
  return participant_id; 
}

async function controlloID(body) {
  console.log('Entro in controllo');
 const sessioneControllo = await collezione.findOne({ participant_id: body.participant_id });
  if (sessioneControllo) {
    console.log('Entro in existing del controllo');
    await assegnaID(body);
  } else {
  await salva(body,body.start,body.end);
  }
}

async function salva(sessione,start,end) {
  console.log('Entro in salva');
  sessione.start= start; 
  sessione.end= end; 

  let durataSessione= end - start; 
  const durataFormattata= formattaDurata(durataSessione); 
  sessione['sessionTime']= durataFormattata; 

    await collezione.insertOne(sessione);
}


function formattaDurata (durataSessione) {
  let millisecondi = durataSessione % 1000;
  let secondi = Math.floor((durataSessione / 1000) % 60);
  let minuti = Math.floor((durataSessione / (1000 * 60)));

  return minuti*60+secondi+millisecondi/1000;
  
}



async function aggiornaEventiEnd(sessione,body) {
  console.log ('entro in aggiorna eventi e end');
  let nuovoitems= sessione.eventi.length; 
  let durataSessione= body.end - sessione.start; 
  const durataFormattata= formattaDurata(durataSessione);

  await collezione.updateOne(
    { participant_id: sessione.participant_id },
    { $set: { eventi: sessione.eventi, end: body.end, sessionTime: durataFormattata } }
  );
  
}



async function aggiornaEnd(sessione, body) {
  console.log("Aggiornamento `end` della sessione:", sessione.participant_id);
  
  let durataSessione = new Date(body.end) - new Date(sessione.start);
  const durataFormattata = formattaDurata(durataSessione);

  const filtro = { participant_id: sessione.participant_id };
  const update = { $set: { end: body.end, sessionTime: durataFormattata } };

  await collezione.updateOne(filtro, update);
  console.log("Sessione aggiornata con `end`:", body.end);
}



// NUMERO SESSIONI TOTALI PER VISUALIZZAZIONE 
server.get("/get-session", async (req, res) => {
  try {
    // Filtra i documenti che hanno i campi "Recording Duration" e "Recording Date"
    const result = await collezione.countDocuments({
      recording_duration: { $exists: true, $ne: null }, // Deve esistere ed essere diverso da null
      recording_date: { $exists: true, $ne: null } // Deve esistere ed essere diverso da null
    });

    console.log(`Numero di sessioni valide: ${result}`);
    res.json({ sessionCount: result });
  } catch (error) {
    console.error("Errore durante il conteggio delle sessioni:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

// NUMERO FISSAZIONI TOTALI PER TUTTI GLI UTENTI
server.get("/get-total-fixations", async (req, res) => {
  try {
    const cursor = await collezione.find({});
    let totalFixations = 0;

    await cursor.forEach(doc => {
      if (doc.number_of_whole_fixations) {
        totalFixations += doc.number_of_whole_fixations; // Somma il valore
      }
    });

    console.log(`Totale fissazioni calcolato: ${totalFixations}`); // Log per debug
    res.json({ totalFixations });
  } catch (error) {
    console.error('Errore nel calcolo delle fissazioni totali:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});
;

//NUMERO FISSAZIONI MEDIA PER VISUALIZZAZIONE 
server.get("/get-MEDIA-itemsFixation", async (req, res) => {
  try {
    // Conta solo i documenti che hanno recording_duration e recording_date
    const validDocumentsCount = await collezione.countDocuments({
      recording_duration: { $exists: true, $ne: null },
      recording_date: { $exists: true, $ne: null }
    });

    if (validDocumentsCount === 0) {
      res.json({ mediaItems: 0 });
      return;
    }

    // Somma il valore di number_of_whole_fixations nei documenti validi
    const cursor = await collezione.find({
      recording_duration: { $exists: true, $ne: null },
      recording_date: { $exists: true, $ne: null }
    });

    let totalItemsFixation = 0;

    await cursor.forEach(doc => {
      if (doc.number_of_whole_fixations) {
        totalItemsFixation += doc.number_of_whole_fixations;
      }
    });

    // Calcola la media
    const mediaItems = totalItemsFixation / validDocumentsCount;

    res.json({ mediaItems });
  } catch (error) {
    console.error("Errore durante il calcolo della media degli itemsFixation:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});

//NUMERO EVENTI PER VISUALIZZAZIONE

server.get('/get-itemsEventi', async (req, res) => {
  try {
    const cursor = await collezione.find({});
    let totalevents = 0;
  
    await cursor.forEach(doc => {
      if (doc.total_event_items) {
        totalevents += doc.total_event_items; // Somma il valore
      }
    });
  
    console.log(`Totale eventi calcolato: ${totalevents}`); // Log per debug
    res.json({ totalevents });
  } catch (error) {
    console.error('Errore nel calcolo degli eventi totali:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});


//NUMERO EVENTI MEDIA PER VISUALIZZAZIONE 
server.get("/get-MEDIA-itemsEventi", async (req, res) => {
  try {
    // Conta solo i documenti che hanno recording_duration e recording_date
    const validDocumentsCount = await collezione.countDocuments({
      recording_duration: { $exists: true, $ne: null },
      recording_date: { $exists: true, $ne: null }
    });
  
    if (validDocumentsCount === 0) {
      res.json({ mediaItems: 0 });
      return;
    }
  
    // Somma il valore di number_of_whole_fixations nei documenti validi
    const cursor = await collezione.find({
      recording_duration: { $exists: true, $ne: null },
      recording_date: { $exists: true, $ne: null }
    });
  
    let totalevents = 0;
  
    await cursor.forEach(doc => {
      if (doc.total_event_items) {
        totalevents += doc.total_event_items;
      }
    });
  
    // Calcola la media
    const mediaItems = totalevents / validDocumentsCount;
  
    res.json({ mediaItems });
  } catch (error) {
    console.error("Errore durante il calcolo della media degli eventi:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
  
});

//TOTALE TEMPO UTILIZZO PER VISUALIZZAZIONE
server.get ("/get-Time",async (req,res) => {
  const cursor = await collezione.find({});
  let totalTIME = 0;

  await cursor.forEach(doc => {
    const durationStr = doc.recording_duration;

    if (durationStr) {
      // Estrai il numero dalla stringa
      const match = durationStr.match(/(\d+(\.\d+)?)/); // Cerca numeri con o senza decimali
      if (match) {
        const duration = parseFloat(match[0]); // Converte la parte numerica in numero
        totalTIME += duration; // Aggiunge al totale
      }
    } 
  });

  res.json({ totalTIME });
})




//MEDIA TEMPO UTILIZZO PER VISUALIZZAZIONE
server.get ("/get-media-Time", async (req, res) => {
  try {
    // Filtra i documenti validi con recording_duration e recording_date
    const result = await collezione.countDocuments({
      recording_duration: { $exists: true, $ne: null },
      recording_date: { $exists: true, $ne: null }
    });

    const cursor = await collezione.find({
      recording_duration: { $exists: true, $ne: null },
      recording_date: { $exists: true, $ne: null }
    });

    let totalTIME = 0;

    await cursor.forEach(doc => {
      const durationStr = doc.recording_duration;

      if (durationStr) {
        // Estrai il numero dalla stringa
        const match = durationStr.match(/(\d+(\.\d+)?)/); // Cerca numeri con o senza decimali
        if (match) {
          const duration = parseFloat(match[0]); // Converte la parte numerica in numero
          totalTIME += duration; // Aggiunge al totale
        }
      }
    });

    // Calcola la media solo sui documenti validi
    let mediaTime = totalTIME / result;
    console.log(`Numero di sessioni valide: ${result}`); // Log della media
    res.json({ mediaTime });
  } catch (error) {
    console.error("Errore durante il calcolo della media del tempo:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
});


//DATI GRAFICO A TORTA GENERICO
server.get ("/get-DatiTorta", async (req,res) => {
  const pageCounts = {};
  const cursor = await collezione.find({
    "pagina": "nuovaprova_mauve.html" // <-- Filtro per considerare solo questa pagina
  });

  await cursor.forEach(sessione => {
    if (sessione.eventi && Array.isArray(sessione.eventi)) {
      const eventi = sessione.eventi;

      eventi.forEach(evento => {
        if (evento && evento.url) {  
          const url = evento.url;
          if (pageCounts[url]) {
            pageCounts[url]++;
          } else {
            pageCounts[url] = 1;
          }
        }
      });
    }
  });

  const totalCount = Object.values(pageCounts).reduce((acc, count) => acc + count, 0);

  const pagePercentages = {};
  for (const url in pageCounts) {
    const count = pageCounts[url];
    const percentage = (count / totalCount) * 100;
    pagePercentages[url] = percentage;
  }

  res.json(pagePercentages);
});


//numero sessioni in base ai giorni 
server.get("/get-barchart", async (req,res) => {
  const result= await collezione.aggregate ([
               {$match: { start:{ $type:'date'}}},
               {$project: { dataSessione: {$dateToString: { format: "%Y-%m-%d", date: "$start" }}}}, 
               {$group: { _id: "$dataSessione", count: {$sum:1}}}, 
               {$sort: { _id: 1}}
                ]). toArray(); 

  const datiBarChart= result.map (entry => ({
    giorno:entry._id,
    numeroSessioni: entry.count, 
  }));
  res.json (datiBarChart); 

})

//numero sessioni in base ai giorni 
server.get("/get-barchart", async (req,res) => {
  const result= await collezione.aggregate ([
               {$match: { start:{ $type:'date'}}},
               {$project: { dataSessione: {$dateToString: { format: "%Y-%m-%d", date: "$start" }}}}, 
               {$group: { _id: "$dataSessione", count: {$sum:1}}}, 
               {$sort: { _id: 1}}
                ]). toArray(); 

  const datiBarChart= result.map (entry => ({
    giorno:entry._id,
    numeroSessioni: entry.count, 
  }));
  res.json (datiBarChart); 

})


//Ultime 10 sessioni tabella 
/*server.get("/10-sessioni", async (req, res) => {
  const ultimeSessioni = await collezione.find({}).sort({ start: -1 }).limit(10).toArray();
  res.json(ultimeSessioni);
});*/

// Tutte le sessioni visualizzazione
server.get("/tutte-sessioni", async (req, res) => {
  try {
    const tutteSessioni = await collezione.find({
      participant_id: { $exists: true },
      recording_date: { $exists: true },
      recording_duration: { $exists: true },
      number_of_whole_fixations:{$exists: true}


    }).sort({ start: -1 }).toArray();
    res.json(tutteSessioni);
  } catch (error) {
    console.error('Errore durante il recupero delle sessioni:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});


//sessioni filtrate 
server.get("/sessioni-filtrate", async (req, res) => {
  try {
    let filtro = {};

    if (req.query.partecipantFilter) {
      filtro.participant_id = req.query.partecipantFilter;
    }

    if (req.query.RecordingDateFilter) {
      const RecordingDateFilter = req.query.RecordingDateFilter; // La data è già una stringa
      filtro.recording_date = RecordingDateFilter; // Confronto stringhe
    }

    if (req.query.minFixations && req.query.maxFixations) {
      filtro.number_of_whole_fixations = {
        $gte: parseInt(req.query.minFixations),
        $lte: parseInt(req.query.maxFixations)
      };
    }
    
    console.log("Valore di recordingDateFilter:", req.query.RecordingDateFilter);
    console.log("Valore di partecipantFilter:", req.query.partecipantFilter);
    console.log("Parametri della query:", req.query);
    const sessioniFiltrate = await collezione.find(filtro).sort({ start: -1 }).toArray();
    res.json(sessioniFiltrate);
  } catch (error) {
    console.error('Errore durante il recupero delle sessioni filtrate:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});


//BAD SMELL
server.post('/confrontaPattern', express.json(), async (req, res) => {
  try {
    const eventi = req.body.eventi;
    const risultati= await verificaPattern(eventi);
    res.json(risultati);
    console.log ('risultati inviati')
  } catch (error) {
        console.error('Errore:', error);
        res.status(500).send('Errore durante l\'analisi dei pattern.');
      }
    });


// aggiorna array eventi sessione 
async function verificaPattern (eventi) {
  try {
    const xml = fs.readFileSync('patternsDefinition.xml', 'utf-8');
    const patternObject = await creaXmlObject(xml);
    
    const eventiAggiornati = eventi.map(event => ({
      ...event,
      interval: creaInterval(eventi, event),
      repnumber: getRepnumber(eventi, eventi.indexOf(event))
    }));

    eventiAggiornati.forEach(evento => {
      delete evento.xpath;
      delete evento.url;
      delete evento.time;
    });

    //console.log(eventiAggiornati);
    const risultati = confrontaPattern(eventiAggiornati, patternObject);
    return risultati;
  } catch (error) {
    console.error('Errore durante l\'analisi del file XML:', error);
    throw new Error('Errore durante l\'analisi del file XML.');
  }
}

// xml array eventi 
function creaXmlObject(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, (err, result) => {
      if (err) {
        reject(err);
      } else {
        try {
          const patternsContainer = result.patternsContainer;
          if (!patternsContainer || !patternsContainer.pattern) {
            throw new Error('Invalid structure: patternsContainer or pattern not found');
          }
          const patterns = Array.isArray(patternsContainer.pattern) ? patternsContainer.pattern : [patternsContainer.pattern];
          const patternObject = {};

          patterns.forEach(xmlPattern => {
            if (!xmlPattern.event) {
              throw new Error('Invalid structure: event not found in pattern');
            }

            const events = Array.isArray(xmlPattern.event) ? xmlPattern.event : [xmlPattern.event];

            const patternEvents = events.map(xmlEvent => {
              if (!xmlEvent.eventTitle || !xmlEvent.direction || !xmlEvent.repnumber || !xmlEvent.interval) {
                throw new Error('Invalid structure: missing event properties');
              }
              return {
                type: xmlEvent.eventTitle[0],
                direction: xmlEvent.direction[0],
                repnumber: xmlEvent.repnumber[0],
                interval: xmlEvent.interval[0],
              };
            });
            patternObject[xmlPattern.patternName[0]] = patternEvents;
          });

          resolve(patternObject);
          //console.log (patternObject)
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}



// INTERVAL
function creaInterval(eventi, evento) {
  const index = eventi.indexOf(evento);
  if (index > 0) {
    const timeCurrent = new Date(evento.time).getTime();
    const timePrecedente = new Date(eventi[index - 1].time).getTime();
    const intervalInMilliseconds = timeCurrent - timePrecedente;
    const intervalInSeconds = intervalInMilliseconds / 1000;
    const intervalInISO8601 = `PT${intervalInSeconds}S`;
    return intervalInISO8601;
  }
  return 'PT0S';
}

// REPNUMBER
function getRepnumber(eventi, index) {
  const typeCurrent = eventi[index].type;
  const directionCurrent = eventi[index].direction;
  const repNumberPattern = '*'; 
  const repNumberCurrent = eventi[index].repnumber;
  const isWildcardRepnumber = repNumberPattern === '*' || repNumberPattern === '$';
  if (isWildcardRepnumber || repNumberCurrent === repNumberPattern) {

    // prima
    let repNumber = 1;
    for (let i = index - 1; i >= Math.max(0, index - 4); i--) {
      const typePrecedente = eventi[i].type;
      const directionPrecedente = eventi[i].direction;

      if (typeCurrent === typePrecedente && directionCurrent === directionPrecedente) {
        repNumber++;
      } else {
        break;
      }
    }

    // dopo
    for (let i = index + 1; i <= Math.min(index + 4, eventi.length - 1); i++) {
      const typeSuccessivo = eventi[i].type;
      const directionSuccessivo = eventi[i].direction;
      if (typeCurrent === typeSuccessivo && directionCurrent === directionSuccessivo) {
        repNumber++;
      } else {
        break;
      }
    }
    return repNumber;
  }
  return 0; 
}

//confronto
function confrontaPattern(eventi, patternObject) {
  const risultati = {};

  Object.keys(patternObject).forEach(patternName => {
    const eventsInPattern = patternObject[patternName];
    const patternTrovato = eventsInPattern.every(xmlEvent => {
      return eventi.some(evento => {
        const repnumberMatch =
          xmlEvent.repnumber === '*' || evento.repnumber == parseInt(xmlEvent.repnumber);
        return (
          evento.type === xmlEvent.type &&
          (xmlEvent.direction === '$' || evento.direction === evento.direction) &&
          repnumberMatch &&
          (xmlEvent.interval <= evento.interval)
        );
      });
    });
    risultati[patternName] = patternTrovato;
  });
  return risultati;
}


server.listen(port, () => {
  console.log(`Server in ascolto sulla porta ${port}`);
});
