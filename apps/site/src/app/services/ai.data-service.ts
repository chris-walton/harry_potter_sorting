import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import type { Observable } from "rxjs";

@Injectable({ providedIn: 'root' })
export class AiDataService {
    private readonly http = inject(HttpClient);

    verifyAsync(texts: string[]): Observable<void> {
        return this.http.post<void>('http://localhost:8787/api/verify', texts);
    }
}
