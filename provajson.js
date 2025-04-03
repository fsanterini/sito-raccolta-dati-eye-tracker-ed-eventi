var scriptElement = document.createElement('script');
scriptElement.src= 'https://cdn.jsdelivr.net/npm/zingtouch@latest/dist/zingtouch.min.js';
scriptElement.defer = true; 
document.head.appendChild(scriptElement);

scriptElement.onload= function () {
var settings = {
     "events": "blur focus focusin focusout load resize scroll unload beforeunload click dblclick mousedown mouseover mouseout mouseenter mouseleave change select submit keypress keydown keyup error popstate",
    "touchevents": "touchcancel gesturestart gesturechange gestureend",
     "zingevents": "tap pan swipe rotate"
};

let eventiCorrenti= []; 

let primoEvento= false; 
let timeout= null; // riguarda l'intervallo finale 
let timeEvent= null; // ogni tot tempo invia eventi
let fineSessione= false; 
let cookiesCancellati= false; 

var start;
var end; 
var cookie=""; 

let idsessione=null; 
let datiRisposta; 

// Resetta il localStorage all'inizio di ogni sessione
window.addEventListener("load", function () {
    if (localStorage.getItem("eventiSalvati")) {
        console.log("Eventi pendenti trovati, invio in corso...");
        inviaRichiesta();
    }
});



var eventiDaMonitorare = [
    "blur", "focus", "focusin", "focusout", "load", "resize", "scroll", "unload", "beforeunload",
    "click", "dblclick", "mousedown", "mouseup", "mousemove", "mouseenter", "mouseleave",
    "contextmenu", "wheel", "keydown", "keyup", "touchstart", "touchmove", "touchend",
    "input", "change", "focus", "blur", "dragstart", "dragend", "drop",
    "gesturestart", "gesturechange", "gestureend",
    "tap", "pan", "swipe", "rotate"
];

let numeroTotaleEventi = 0;

 
// Funzione per inviare i dati al server
// Funzione per inviare dati al server
async function DatiPost(url, data) {
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        console.log("Dati inviati con successo.");
    } catch (error) {
        console.error("Errore nell'invio dei dati:", error);
    }
}


// sessionID= numero idsessione= variabile 

function getCookieValue (name) {
    return (document.cookie.match(`(^| )${name}=([^;]+)`) || [])[2] || null;
}

async function inviaRichiesta() {
    end = getTimestamp();
    idsessione = getCookieValue("id_sessione");

    let eventi = JSON.parse(localStorage.getItem("eventiSalvati") || "[]").concat(eventiCorrenti);
    let itemsEventi = eventi.length;
    start = localStorage.getItem("start") || getTimestamp();

    let payload = { start, end, eventi, itemsEventi };
    if (idsessione) payload.idsessione = idsessione;

    try {
        await DatiPost("http://127.0.0.1:8000/eventi", payload);
        eventiCorrenti = [];
        localStorage.removeItem("eventiSalvati");
        console.log("Dati inviati con successo.");
    } catch (error) {
        console.error("Errore nell'invio dei dati:", error);
    }
}





// 🔴 Modifica della funzione di eliminazione del cookie per assicurare la cancellazione
function scadenzaCookie(cookieName) {
    document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    console.log(`Cookie ${cookieName} eliminato.`);
}



function scadenzaCookie( id_sessione){
    if (!cookiesCancellati) {
document.cookie= id_sessione + '=; expires= Thu, 01 Jan 1970 00:00:00 UTC;'
console.log('Ho cancellato i cookies'); 
cookiesCancellati=true; 
}}

// DUE intervalli di tempo 
function sendEnd () {
    if (!timeout) {
        timeout = setInterval(async function () {
          inviaRichiesta(); 
        }, 120000);     
    }
   
}

function sendEvent () {
    if (!timeEvent) {
        timeEvent = setInterval(function () {
          inviaRichiesta();
        }, 20000); 
    }

}

//timestamp
function getTimestamp() {
    return new Date ().toISOString(); 
  }
 
//EVENTI 
var initialDistance= 0; 
var direction= ''; 
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;



if (!isTouchDevice) {
settings.events.split(" ").forEach(function(evento) {
    window.addEventListener(evento, function(event) {
       
       
        if (event.type === 'focusin') {

            console.log ("Evento rilevato: focusin" )
            direction= 'in';
            var elemento= event.target;
            var coordinates = calculateCoordinates(elemento);
            const xpathWithCoordinates = getXPath(elemento, coordinates);
            aggiungiEvento('focus',xpathWithCoordinates,direction); 
            gestisciEventi (event);

        } else if (event.type === 'focusout') {

            console.log ("Evento rilevato: focusout" )
            direction='out'; 
            var elemento= event.target;
            var coordinates = calculateCoordinates(elemento);
            const xpathWithCoordinates = getXPath(elemento, coordinates);
            aggiungiEvento('focus',xpathWithCoordinates,direction); 
            gestisciEventi (event);

        } else if (event.type !== 'focusin' && event.type !== 'focusout') {

            console.log ("Evento rilevato:" + event.type )
            direction= '$';
            var elemento= event.target;
            var coordinates = calculateCoordinates(elemento);
            const xpathWithCoordinates = getXPath(elemento, coordinates);
            aggiungiEvento(event.type,xpathWithCoordinates,direction); 
            gestisciEventi (event);
        }
        
    });
});

//evento BEFOREUNLOAD 
window.addEventListener("beforeunload", async function () { 
    end = getTimestamp();  // Aggiorna il timestamp finale
    let eventi = JSON.parse(localStorage.getItem("eventiSalvati") || "[]");
    let payload = { end, eventi };
    
    if (eventi.length > 0) {
        payload.itemsEventi = eventi.length;
        console.log("Invio eventi prima di chiudere...");
    } else {
        console.log("Invio solo `end` prima di chiudere...");
    }

    try {
        await DatiPost("http://127.0.0.1:8000/eventi", payload);
        localStorage.clear(); // Cancella lo storage
        console.log("Dati finali inviati con successo.");
    } catch (error) {
        console.error("Errore nell'invio degli ultimi dati:", error);
    }
});





} else {


//eventi touch standard
settings.touchevents.split(" ").forEach(function(evento) {
    window.addEventListener(evento, function(event) {
        console.log("Evento touch rilevato: " + event.type);
        var elemento= event.target;
        var coordinates = calculateCoordinates(elemento);
        const xpathWithCoordinates = getXPath(elemento, coordinates);
        direction= '$'; 

        aggiungiEvento(event.type,xpathWithCoordinates,direction); 
        gestisciEventi (event); 
    });
}); 

//evento PINCH 
window.addEventListener ('touchstart', function (event) {
    console.log ("Evento touch rilevato: " + event.type)
   
    if (event.touches.length >= 2) {
        var touch1= event.touches[0]; 
        var touch2= event.touches[1]; 
        initialDistance= Math.hypot (touch2.clientX - touch1.clientX,touch2.clientY - touch1.clientY )
    } else {
        direction= '$'; 
    }
        var elemento= event.target;
        var coordinates = calculateCoordinates(elemento);
        const xpathWithCoordinates = getXPath(elemento, coordinates);
        aggiungiEvento(event.type,xpathWithCoordinates,direction); 
        gestisciEventi (event);
  })

window.addEventListener('touchmove', function (event) {
    if (event.touches.length >= 2) {
      var touch1 = event.touches[0];
      var touch2 = event.touches[1];
      var currentDistance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      var pinchDelta = currentDistance - initialDistance;
      
      if (pinchDelta > 0) {
        direction= 'out'; 
      } else if (pinchDelta < 0) {
        direction= 'in'; 
      } else {
        direction= '$';
      }
      console.log ("Evento touch rilevato: pinch" )
      var elemento= event.target;
      var coordinates = calculateCoordinates(elemento);
      const xpathWithCoordinates = getXPath(elemento, coordinates);
      aggiungiEvento('pinch',xpathWithCoordinates,direction); 
      gestisciEventi (event);
    } else {
        direction= '$'; 
        console.log("Evento touch rilevato: " + event.type)
        var elemento= event.target;
      var coordinates = calculateCoordinates(elemento);
      const xpathWithCoordinates = getXPath(elemento, coordinates);
      aggiungiEvento(event.type,xpathWithCoordinates,direction); 
      gestisciEventi (event);
    }
  });

  window.addEventListener('touchend', function (event) {
    console.log ("Evento touch rilevato: " + event.type)
    initialDistance = 0;
    direction='$'
    var elemento= event.target;
    var coordinates = calculateCoordinates(elemento);
    const xpathWithCoordinates = getXPath(elemento, coordinates);
    aggiungiEvento(event.type,xpathWithCoordinates,direction); 
    gestisciEventi (event);
  });

//evento BEFOREUNLOAD 
window.addEventListener ('beforeunload', function (event) {
    var message= 'Sei sicuro di voler abbandonare la pagina?';
    event.returnValue = message; 
    var elemento= event.target;
        var coordinates = calculateCoordinates(elemento);
        const xpathWithCoordinates = getXPath(elemento,coordinates);
        direction='$';

        aggiungiEvento (event.type,xpathWithCoordinates,direction); 
        gestisciEventi (event); 
    return message; 
}); 


//eventi libreria zingTouch
var lastTapTime = 0;
var doubleTapThreshold = 200;

settings.zingevents.split(" ").forEach(function (evento) {
    var touchRegion = new ZingTouch.Region(document.body);
    touchRegion.bind(document.body, evento, function (event) {
        console.log("Evento touch rilevato: " + evento);

        direction= '$';
        var touch = event.detail.events[0];
        var elemento = document.elementFromPoint(touch.x, touch.y);
        

        if (!elemento) {
            console.log("Elemento non definito per l'evento: " + evento);
            return;
        }

        var coordinates = calculateCoordinates(elemento);
        const xpathWithCoordinates = getXPath(elemento, coordinates);
        
        if (evento === 'pan') {
            var currentDirection= event.detail.data[0].currentDirection; 
            if (currentDirection >= 45 && currentDirection < 135) {
                direction= "down"; 
                aggiungiEvento(evento, xpathWithCoordinates, direction);
                gestisciEventi(event);
            } else {
                aggiungiEvento(evento, xpathWithCoordinates, direction);
                gestisciEventi(event);
            }
        } else if (evento !== "tap") {
            aggiungiEvento(evento, xpathWithCoordinates, direction);
            gestisciEventi(event);
        } else {
            var now = new Date().getTime();
            var timeDiff = now - lastTapTime;
            if (timeDiff < doubleTapThreshold) {
                console.log("Evento touch rilevato: doubletap");
                aggiungiEvento("doubletap", xpathWithCoordinates,direction);
                gestisciEventi(event);
            } else {
                lastTapTime = now;
                aggiungiEvento(evento, xpathWithCoordinates,direction);
                gestisciEventi(event);
            }
        } 
            
    });
});
}

function gestisciEventi (event) {
    if (!primoEvento) {
        primoEvento = true;
        sendEnd ()
        sendEvent () 
        start= getTimestamp(); 
    }else {
        //clearInterval(timeout); 
        timeout=null; 
        sendEnd()
    }
        if (event.type === "click" && event.target.tagName === "A") {
        const hrefAncora = event.target.href;
        const dominioAncora = new URL(hrefAncora).hostname;
        const dominioCorrente = window.location.hostname;
        if (dominioAncora === dominioCorrente) {
            if (localStorage.getItem ('eventiSalvati') !==null && localStorage.getItem ('start') !== null) {
                eventiSalvati= JSON.parse(localStorage.getItem('eventiSalvati'));
                console.log ("prima", eventiSalvati)
                eventiSalvati= [...eventiSalvati,...eventiCorrenti];
                console.log ("dopo", eventiSalvati)
                localStorage.setItem('eventiSalvati', JSON.stringify(eventiSalvati));
                eventiCorrenti=[];
            }else {
            localStorage.setItem('eventiSalvati', JSON.stringify(eventiCorrenti));
            localStorage.setItem('start', JSON.stringify(start));
            eventiCorrenti = [];
        } }
        else {
            inviaRichiesta();
        } } 
    }
        /*if (event.type === "popstate") {
            if (localStorage.getItem ('eventiSalvati') !==null && localStorage.getItem ('start') !== null) {
                eventiSalvati= JSON.parse(localStorage.getItem('eventiSalvati'));
                eventiSalvati= [...eventiSalvati,...eventiCorrenti];
                localStorage.setItem('eventiSalvati', JSON.stringify(eventiSalvati));
                eventiCorrenti=[];
            }else {
            localStorage.setItem('eventiSalvati', JSON.stringify(eventiCorrenti));
            localStorage.setItem('start', JSON.stringify(start));
            eventiCorrenti = [];
        }
        }*/
        
   

// Funzione per ottenere XPath dell'elemento
function getXPath(element) {
    if (!element) return "element is not defined";
    if (element.id) return `#${element.id}`;

    let path = [];
    while (element.parentNode) {
        let index = Array.prototype.indexOf.call(element.parentNode.children, element) + 1;
        path.unshift(`${element.tagName.toLowerCase()}[${index}]`);
        element = element.parentNode;
    }
    return `/${path.join("/")}`;
}

    function calculateCoordinates(element) {

        if (!element || typeof element.getBoundingClientRect !== 'function') {
            return "(undefined, undefined)";
        } else if (element.id) {
            const rect = element.getBoundingClientRect();
            return `(${rect.left + window.scrollX + rect.width / 2}, ${rect.top + window.scrollY + rect.height / 2})`;
        } else {
            const rect = element.getBoundingClientRect();
            return `(${rect.left + window.scrollX + rect.width / 2}, ${rect.top + window.scrollY + rect.height / 2})`;
        }
    }
        

    function aggiungiEvento(event) {
        let elemento = event.target;
        let xpathWithCoordinates = getXPath(elemento);
    
        eventiCorrenti.push({
            type: event.type,
            xpath: xpathWithCoordinates,
            url: window.location.href,
            time: new Date().toISOString(),
        });
    
        localStorage.setItem("eventiSalvati", JSON.stringify(eventiCorrenti));
        numeroTotaleEventi++;
        console.log(`Evento registrato: ${event.type} | Totale eventi: ${numeroTotaleEventi}`);
    }
    

    // Assegna il listener a tutti gli eventi selezionati
    eventiDaMonitorare.forEach(evento => {
        window.addEventListener(evento, aggiungiEvento);
    });

    window.addEventListener("click", function(event) {
        console.log("Evento registrato:", event.type);
    });
    
    
}
