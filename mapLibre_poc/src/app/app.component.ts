import { Component, OnInit } from '@angular/core';
import { Map as MapLibreMap } from 'maplibre-gl';
import { MarkerService } from './marker.service';
import { catchError } from 'rxjs/operators';
import { of, Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent implements OnInit {
  center: [number, number] = [10.4515, 51.1657]; // Mittelpunkt Deutschland
  userPosition?: [number, number];
  zoom: number = 5; // Deutschland-Übersicht
  lastClickCoords?: [number, number];
  clickMarkerPosition?: [number, number];
  markeredPositions: Array<{id: string, lng: number, lat:number}> = [];
  mapInstance?: MapLibreMap;
  
  readonly GERMANY_BOUNDS: [[number, number], [number, number]] = [
  [5.5, 47.2],   // Südwesten (ungefähr Freiburg)
  [15.2, 55.1]   // Nordosten (ungefähr Rügen)
  ];
 
  readonly CLICK_TOLERANCE = 0.0005;

  constructor(private markerService: MarkerService) {}

  ngOnInit() {
    this.markerService.getMarker()
      .pipe(
        catchError(() => of(undefined))
      )
      .subscribe((pos) => {
        if (Array.isArray(pos)) {
          this.markeredPositions = pos.filter((p: any) =>
            p.lng !== undefined && p.lat !== undefined && p.id !== undefined
          ).map((p: any) => ({
            id: p.id,
            lng: p.lng,
            lat: p.lat
          }))
          console.log('Alle Marker-Positionen:', this.markeredPositions);
        }
      });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.userPosition = [position.coords.longitude, position.coords.latitude];
        this.center = this.userPosition;
        this.zoom = 14; // Nah an die Nutzerposition heranzoomen
      });
    }
   
  }

  onMapLoad(mapInstance: MapLibreMap) {
    this.mapInstance = mapInstance;
    this.mapInstance.setMaxBounds(this.GERMANY_BOUNDS);
    }

  onMapClick(event: any) {
    if (!this.mapInstance) return;
    const coords = this.getCoordsFromEvent(event);
    const marker = this.findMarkerNear(coords);

    if (!marker) {
      console.debug('Kein Marker gefunden.');
      return;
    }

    console.debug('Gefundene Marker-ID:', marker.id);
    this.updateMarkerListAfter(this.markerService.removeMarkerAt(marker.id));
  }

  onDragStart(event: DragEvent) {
    event.dataTransfer?.setData('text/plain', 'pegman');
  }

  // Diese Methode muss im Map-Element aufgerufen werden, z.B. (drop)="onMapDrop($event)"
  onMapDrop(event: any) {
    const lngLat = this.getLngLatFromDropEvent(event);
    if (lngLat) {
      this.updateMarkerListAfter(this.markerService.setMarker({lng: lngLat.lng, lat: lngLat.lat}));
    }
  }

  private getCoordsFromEvent(event: any /* MapMouseEvent */) {
    return event?.lngLat ??
          this.mapInstance!.unproject([event.point.x, event.point.y]);
  }

  private findMarkerNear(coords:{lng:number,lat:number}) {
    return this.markeredPositions.find(m =>
      Math.abs(m.lng - coords.lng) < this.CLICK_TOLERANCE &&
      Math.abs(m.lat - coords.lat) < this.CLICK_TOLERANCE);
  }

  private updateMarkerListAfter(apiCall$: Observable<any>) {
      apiCall$
        .pipe(
          switchMap(() => this.markerService.getMarker()),
          catchError(err => {
            console.error('Fehler beim Aktualisieren der Marker:', err);
            return of([]);
          })
        )
        .subscribe((pos) => {
          if (Array.isArray(pos)) {
            this.markeredPositions = pos;
            console.log('Aktualisierte Marker-Positionen:', this.markeredPositions);
          }
        });
  }

  private getLngLatFromDropEvent(event: DragEvent): {lng: number, lat: number} | null {
        if (!this.mapInstance) return null;
        const mapDiv = this.mapInstance.getContainer();
        const rect = mapDiv.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const lngLat = this.mapInstance.unproject([x, y]);
        return { lng: lngLat.lng, lat: lngLat.lat };
  }

}

