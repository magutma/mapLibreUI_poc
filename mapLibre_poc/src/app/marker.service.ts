import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})

export class MarkerService {

  private apiUrl = 'http://localhost:3000/marker';

  constructor(private http: HttpClient) {}

  getMarker() {
      console.log('Fetching marker position from service');
       this.http.get<[{id: string, lng: number, lat: number}]>(this.apiUrl).subscribe({
          next: (response) => console.log('Response:', response),
          error: (err) => console.error('Error:', err)
  });
    return this.http.get<[{id: string, lng: number, lat: number}]>(this.apiUrl);
  }

  setMarker(position: {lng: number, lat: number}) {
    console.log('Setting marker position via service:', position);
    return this.http.post<any>(this.apiUrl, { position });
  }

  removeMarkerAt(id: string) {
    console.log('Removing marker at id via service:', id);
    return this.http.delete<any>(`${this.apiUrl}?id=${id}`);
  }

}
