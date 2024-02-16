/**
* Fichier générant la carte qui sera affichée montrant les communes concernées par l'arrêt du cuivre, par date d'arrêt
*/

// Initialisation des variables
var latitude = 46.49389;
var longitude = 2.602778;
var map = null;
var GeoSearchControl = window.GeoSearch.GeoSearchControl;
var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;
var fermetureTechniqueLayer;
var fermetureCommercialeLayer;
var info;
var control;

/**
* Fonction définissant la couleur qui est affectée à une année particulière
* @param L'année concernée
*/
function getColor(year) {
  return year == "19 novembre 2020" ? "#1b9e77" :
  year == "31 mars 2021" ? '#1B9E77' :
  year == "31 mars 2022" ? "#d95f02"  :
  year == "31 mars 2023" ? '#d95f02' :
  year == "31 janvier 2024" ? "#7570b3" :
  year == "31 mars 2024" ? "#e7298a" : 
  year == "27 janvier 2025" ? "#66a61e" :
  year == "31 janvier 2025" ? '#7570b3' :
  year == "31 mars 2025" ? '#e7298a' :
  year == "27 janvier 2026" ? '#66a61e' :
  year == "31 janvier 2026" ? "#e6ab02" : 
  year == "31 janvier 2027" ? "#e6ab02" : 
  '#d8b2d8';
}

/**
* Fonction qui définit le style qui sera affiché en fonction d'une donnée particulière
* @param Le fichier GeoJson en entrée
*/
function style(feature) {
  return {
    fillColor: getColor(feature.properties.data_arret_cuivre_DATE),
    weight: 2,
    opacity: 1,
    color: 'white',
    dashArray: '3',
    fillOpacity: 0.7
  };
}

/*
* Foncion qui définit un listener pour lorsque la souris est sur une des couches
* @param Évènement
*/
function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(layer.feature.properties);
}

/*
* Fonction qui définit ce qui se passe lorsque la souris quitte une des couches
* @param Évènement
*/
function resetHighlight(e) {
  fermetureTechniqueLayer.resetStyle(e.target);
  fermetureCommercialeLayer.resetStyle(e.target);
  info.update();
}

/*
* Fonction qui va permettre de zoomer sur l'élément lorsqu'un clic est détecté sur ce dernier
* @param Évènement
*/
function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

/**
* Fonction qui ajoute les listeners pour chaque couche de la carte
* @param Fonctionnalités
* @param Couches
*/
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight
    //click: zoomToFeature
  });
}

/**
* Fonction qui déplace des éléments au format HTML dans un nouveau parent
* @param Eléments à déplacer
* @param Le nouvel élément où l'élément "el" sera déplacé
*/
function setParent(el, newParent) {
  newParent.appendChild(el);
}

/**
* Fonction d'initialisation de la carte
*/
function initMap() {
  // Créer l'objet "map" et l'insèrer dans l'élément HTML qui a l'ID "map"
  map = L.map('map', {
    fullscreenControl: {
      pseudoFullscreen: false, // if true, fullscreen to page width and height
      position: 'topleft'
    }
  }).setView([latitude, longitude], 6);
  
  // Leaflet ne récupère pas les cartes (tiles) sur un serveur par défaut. Nous devons lui préciser où nous souhaitons les récupérer. Ici, openstreetmap.fr
  var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    minZoom: 1,
    maxZoom: 20
  });

  // On créé une URL dynamique au lieu de l'URL statique par défaut
  var hash = new L.Hash(map);

  // On lit les données contenues dans le fichier geojson
  fermetureTechniqueLayer = new L.GeoJSON.AJAX("./Donnees/fermeture_technique.json", {
    style: style,
    onEachFeature: onEachFeature
  });
  fermetureCommercialeLayer = new L.GeoJSON.AJAX("./Donnees/fermeture_commerciale.json", {
    style: style,
    onEachFeature: onEachFeature
  });

  var overlayMaps = {
    "Fermeture technique": fermetureTechniqueLayer,
    "Fermeture commerciale": fermetureCommercialeLayer 
  };

  control = L.control.layers(overlayMaps, null, {
    collapsed: false
  }); // On ajoute les couches précédentes à la carte, en les rendant exclusives

  // On définit les 2 légendes de la carte
  var legendFermetureTechnique = L.control({
    position: 'bottomright'
  });
  var legendFermetureCommerciale = L.control({
    position: 'bottomright'
  });

  // On gère la géolocalisation de l'utilisateur
  var location = L.control.locate({
    position: 'topleft',
    setView: 'untilPanOrZoom',
    flyTo: false,
    cacheLocation: true,
    drawMarker: true,
    drawCircle: false,
    showPopup: false,
    keepCurrentZoomLevel: true
  });

  // On définit le fournisseur sur lequel on va s'appuyer pour effectuer les recherches d'adresse
  var provider = new OpenStreetMapProvider({
    params: {
      countrycodes: 'fr'
    }, // On restreint uniquement les recherches pour la France
  });

  // On définit le module de recherche
  var searchControl = new GeoSearchControl({
    provider: provider,
    showMarker: true,
    showPopup: false,
    marker: {
      icon: new L.Icon.Default,
      draggable: false,
      interactive: false
    },
    maxMarkers: 1,
    retainZoomLevel: true,
    animateZoom: true,
    autoClose: true,
    searchLabel: "Entrez l'adresse",
    keepResult: true
  });

  /**
  * On ajoute la légende pour la fermeture technique à la carte
  * @param la carte où la légende sera ajoutée
  */
  legendFermetureTechnique.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = [],
    labelsFermetureTechnique = ["31 mars 2021", "31 mars 2023", "31 janvier 2025", "31 mars 2025", "27 janvier 2026", "31 janvier 2027"];

    // On boucle sur toutes les valeurs et on génère une étiquette avec la bonne couleur pour chaque valeur
    for (var i = 0; i < labelsFermetureTechnique.length; i++) {
      div.innerHTML += '<i style="background:' + getColor(labelsFermetureTechnique[i]) + '"></i> ' + labelsFermetureTechnique[i] + '<br>';
    }
    return div;
  };

  /**
  * On ajoute la légende pour la fermeture commerciale à la carte
  * @param la carte où la légende sera ajoutée
  */
  legendFermetureCommerciale.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = [],
    labelsFermetureCommerciale = ["19 novembre 2020", "31 mars 2022", "31 janvier 2024", "31 mars 2024", "27 janvier 2025", "31 janvier 2026"];

    // On boucle sur toutes les valeurs et on génère une étiquette avec la bonne couleur pour chaque valeur
    for (var i = 0; i < labelsFermetureCommerciale.length; i++) {
      div.innerHTML += '<i style="background:' + getColor(labelsFermetureCommerciale[i]) + '"></i> ' + labelsFermetureCommerciale[i] + '<br>';
    }
    return div;
  };

  info = L.control();

  /**
  * On ajoute les informations à la carte
  * @param la carte où les informations seront ajoutées
  */
  info.onAdd = function(map) {
    this._div = L.DomUtil.create('div', 'info'); // On créé une section avec la classe info
    this.update();
    return this._div;
  }

  /**
  * Fonction qui met à jour les informations en fonction des propriétés passées
  * @param Propriétés
  */
  info.update = function(props) {
    this._div.innerHTML = '<h4>Date arrêt Cuivre</h4>' + (props ?
      '<b>' + props.data_arret_cuivre_DATE + '</b>' : '<br /><br />');
    };

    // On définit l'export de la carte au format .png
    var exporter = L.easyPrint({
      sizeModes: ['Current'],
      title: 'Exporter',
      filename: 'CarteCuivre',
      exportOnly: true,
      hideControlContainer: false,
      hideClasses: ['leaflet-control-zoom','leaflet-control-fullscreen','leaflet-control-easyPrint','leaflet-control-easyPrint-button','leaflet-control-locate','leaflet-control-geosearch','info']
    });

    // On définit l'impression de la carte
    var printer = L.easyPrint({
      sizeModes: ['Current'],
      title: 'Imprimer',
      filename: 'CarteCuivre',
      exportOnly: false,
      hideControlContainer: false,
      hideClasses: ['leaflet-control-zoom','leaflet-control-fullscreen','leaflet-control-easyPrint','leaflet-control-easyPrint-button','leaflet-control-locate','leaflet-control-geosearch','info']
    });

    // On ajoute toutes les couches à la carte
    control.addTo(map);
    osmLayer.addTo(map);
    fermetureTechniqueLayer.addTo(map);
    legendFermetureTechnique.addTo(map);
    map.addControl(searchControl);
    location.addTo(map);
    info.addTo(map);
    exporter.addTo(map);
    printer.addTo(map);

    // On met les boutons radio servant à contrôler la carte qui sera affichée en dehors de la carte
    var htmlObject = control.getContainer();
    var a = document.getElementById('control');
    setParent(htmlObject, a);

     // On change l'endroit où s'affiche les boutons radio lorsque l'utilisateur passe en plein écran
    map.on('fullscreenchange', function() {
      if (map.isFullscreen()) {
        control.addTo(map);
      } else {
        htmlObject = control.getContainer();
        setParent(htmlObject, a);
      }
    });

    // On change la légende de la carte en fonction des données affichées
    map.on("baselayerchange", function(eventLayer){
      if(eventLayer.name == "Fermeture technique"){
        map.removeControl(legendFermetureCommerciale);
        legendFermetureTechnique.addTo(map);
      } else if(eventLayer.name == "Fermeture commerciale"){
        map.removeControl(legendFermetureTechnique);
        legendFermetureCommerciale.addTo(map);
      }
    });

  }

  /**
  * Fonction d'initialisation qui s'exécute lorsque le DOM est chargé
  */
  window.onload = function() {
    initMap();
  };
