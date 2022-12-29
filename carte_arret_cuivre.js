/**
* Fichier générant la carte qui sera affichée montrant les communes concernées par l'arrêt du cuivre, par département et par date d'arrêt
*/

// Initialisation des variables
var latitude = 46.49389;
var longitude = 2.602778;
var map = null;
var GeoSearchControl = window.GeoSearch.GeoSearchControl;
var OpenStreetMapProvider = window.GeoSearch.OpenStreetMapProvider;
var geojsonLayer;
var info;

/**
* Fonction définissant la couleur qui est affectée à une année particulière
* @param L'année concernée
*/
function getColor(year) {
  return year == "31 mars 2021" ? '#1B9E77' :
  year == "31 mars 2023" ? '#D95F02' :
  year == "Janvier 2025" ? '#7570B3' :
  '#D8B2D8';
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
  geojsonLayer.resetStyle(e.target);
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
    mouseout: resetHighlight,
    //click: zoomToFeature
  });
}

/**
* Fonction d'initialisation de la carte
*/
function initMap() {
  // Créer l'objet "map" et l'insèrer dans l'élément HTML qui a l'ID "map"
  map = L.map('map', {
    fullscreenControl: {
      pseudoFullscreen: false // if true, fullscreen to page width and height
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
  geojsonLayer = new L.GeoJSON.AJAX("./Donnees/carte_arret_cuivre.json", {
    style: style,
    onEachFeature: onEachFeature
  });

  // On définit la légende de la carte
  var legend = L.control({
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
  * On ajoute la légende à la carte
  * @param la carte où la légende sera ajoutée
  */
  legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend'),
    grades = [],
    labels = ["31 mars 2021", "31 mars 2023", "Janvier 2025"];

    // On boucle sur toutes les valeurs et on génère une étiquette avec la bonne couleur pour chaque valeur
    for (var i = 0; i < labels.length; i++) {
      div.innerHTML += '<i style="background:' + getColor(labels[i]) + '"></i> ' + labels[i] + '<br>';
    }
    return div;
  };

  info = L.control();

  /**
  * On ajoute les informatios à la carte
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
      '<b>' + props.data_arret_cuivre_DEP + '</b><br />' + props.data_arret_cuivre_DATE : '<br /><br />');
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
    osmLayer.addTo(map);
    geojsonLayer.addTo(map);
    legend.addTo(map);
    map.addControl(searchControl);
    location.addTo(map);
    info.addTo(map);
    exporter.addTo(map);
    printer.addTo(map);

  }

  /**
  * Fonction d'initialisation qui s'exécute lorsque le DOM est chargé
  */
  window.onload = function() {
    initMap();
  };
