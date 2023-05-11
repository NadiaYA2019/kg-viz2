import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as d3 from 'd3';
import * as hexbin from 'd3-hexbin';
import { select } from 'd3-selection';
import * as L from 'leaflet';
import * as Ld3 from '@asymmetrik/leaflet-d3';
import { ChartModalComponent } from '../chart-modal/chart-modal.component';
import { HexbinLayerConfig } from 'leaflet';
import { DataService } from '../../services/data.service';
import { MapperService } from '../../services/mapper.service';
import { Station } from '../../models/data';
import { Observable, Subscriber } from 'rxjs';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent {
  franceBounds: any;
  colorScale: any;
  hexbinData: any[] = [];
  options: any;
  hexLayer: any;
  stationsData: Station[] = [];

  private hexbinOptions!: HexbinLayerConfig;

  constructor(
    private dialog: MatDialog,
    private dataService: DataService,
    private mapperService: MapperService
  ) {}

  ngOnInit(): void {
    const hexLayout = hexbin.hexbin();
    this.hexbinOptions = {
      radius: 10,
      opacity: 0.7,
      duration: 500,
    };

    // Création de la carte centrée sur la
    var mymap = L.map('map').setView([46.227638, 2.213749], 6);

    // Ajout du fond de carte OpenStreetMap
    const layer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }
    ).addTo(mymap);

    //ajustement de la luminosité de la map
    layer.getContainer()!.style.filter = 'brightness(75%)';
    // Chargement des données des régions
    fetch(
      'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson'
    )
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        // Calcul de la valeur maximale de la densité de population
        var maxPopulationDensity = 0;
        data.features.forEach((region: any) => {
          var populationDensity = region.properties.code;
          if (populationDensity > maxPopulationDensity) {
            maxPopulationDensity = populationDensity;
          }
        });

        // Création d'une fonction de couleur pour la choropleth map
        function getColor(d: number) {
          return d > maxPopulationDensity * 0.8
            ? '#bd0327'
            : d > maxPopulationDensity * 0.6
            ? '#f03b20'
            : d > maxPopulationDensity * 0.4
            ? '#fd8d3c'
            : d > maxPopulationDensity * 0.2
            ? '#feb24c'
            : '#fed976';
        }

        // Création d'une couche GeoJSON pour les régions avec une couleur de remplissage basée sur la densité de population
        var regionLayer = L.geoJSON(data, {
          style: function (feature) {
            var populationDensity = feature!.properties.code;
            return {
              fillColor: getColor(populationDensity),
              fillOpacity: 0.75,
              weight: 1,
              color: 'black',
            };
          },
          onEachFeature: (feature, layer) => {
            layer.on('click', () => {
              this.openModal(feature);
            });
          },
        });
        // Ajout de la couche à la carte
        regionLayer.addTo(mymap);
      })
      .catch((error) => console.error(error));

    // ---------------------query test---------------------
    this.options = {
      radius: 10,
      opacity: 0.7,
      duration: 500,
    };

    // @ts-ignore
    (this.franceBounds = L.latLngBounds([
      [41, -5],
      [51, 10],
    ])),
      /*
    var map = L.map("map", {
      maxBounds: franceBounds, // Set maximum bounds of the map
      maxBoundsViscosity: 1.0, // Make sure the user cannot drag the map out of bounds
    }).setView([47, 2], 5);
    */
      this.colorScale = d3
        .scaleLinear()
        .domain([5, 15, 18, 28])
        .range([0, 5, 10, 30]);

      this.hexLayer = L.hexbinLayer(this.hexbinOptions).addTo(mymap);
      this.hexLayer.colorRange(["white", "yellow", "orange", "red", "darkred"]);

    const colorFn = (d: number) => {
      if (d <= 2) {
        return "#FF5733"; // Red
      } else if (d <= 4) {
        return "#FFFF66"; // Yellow
      } else {
        return "#66FF66"; // Green
      }
    };

    this.hexLayer
      .radiusRange([5, 30])
      .data(this.stationsData)
      .colorValue((d: Station) => colorFn(d.temp_avg));

    // Use the getData function to access the fully populated data
    this.getData().then((data) => {
      //this.hexbinData.push(data);
      this.hexLayer._data = data;
    });
  }

  async getData() {
    let data: any[][] = [];
    this.dataService.getTemperaturePerStation().subscribe((weather) => {
      this.stationsData = this.mapperService.weatherToStation(weather);

      this.stationsData.forEach((station) => {
        data.push([station.longitude, station.latitude, station.temp_avg]);
      });
    });
    return data;
  }

  private openModal<G, P>(feature: any) {
    const dialogRef = this.dialog.open(ChartModalComponent, {
      data: {
        regionCode: feature.properties.code,
      },
      position: { bottom: '0px' },
      panelClass: 'custom-dialog',
    });
  }

  protected readonly console = console;
}
