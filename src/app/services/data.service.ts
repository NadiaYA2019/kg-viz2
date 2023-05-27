import { Injectable } from '@angular/core';
import { MapperService } from './mapper.service';
import { DataJson } from '../constants/fake';
import { QueryBuilderService } from './query-builder.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IWeather } from '../models/dataFromServeur';
import {IAvgTempPerRegion} from "../models/data";

@Injectable({
  providedIn: 'root',
})
export class DataService {
  private apiUrl = 'https://weakg.i3s.unice.fr/sparql';

  initAvgTempPerRegionData : IAvgTempPerRegion[] | undefined;

  constructor(
    private mapperService: MapperService,
    private queryBuilderService: QueryBuilderService,
    private http: HttpClient
  ) {

    this.getAvgTempPerRegion().subscribe(data=>{
      this.initAvgTempPerRegionData = this.mapperService.weatherToAvgTempPerRegion(data);
    });

  }

  getAvgTempPerRegion() {
    const query = this.queryBuilderService.getAvgTempPerRegion();
    const url = `${this.apiUrl}?query=${encodeURIComponent(query)}`;
    return this.http.get<IWeather>(url);
  }

  getTemperaturePerRegion(ResgionCode: number) {
    const query = this.queryBuilderService.buildQuery_slices(ResgionCode);
    const url = `${this.apiUrl}?query=${encodeURIComponent(query)}`;
    return this.http.get<IWeather>(url);
  }
  getTemperaturePerStation() {
    const query = this.queryBuilderService.buildQuery_getAllStationsAvgTemp();
    const url = `${this.apiUrl}?query=${encodeURIComponent(query)}`;
    return this.http.get<IWeather>(url);
  }
  getRainPerStation() {
    const query = this.queryBuilderService.buildQuery_avgRainQtyPerStation();
    const url = `${this.apiUrl}?query=${encodeURIComponent(query)}`;
    return this.http.get<IWeather>(url);
  }
  QueryObservationsByDate(insee: number, date: string) {
    const query = this.queryBuilderService.QueryObservationsByDate(insee, date);
    const url = `${this.apiUrl}?query=${encodeURIComponent(query)}`;
    return this.http.get<IWeather>(url);
  }

}
