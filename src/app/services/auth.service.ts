import { isPlatformBrowser } from "@angular/common";
import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";


export interface LoginResponse {
  success: boolean;
  message: string;
  username?: string;
  roles?: string[];
}

@Injectable({   providedIn: "root", })
export class AuthService {
  
    private apiUrl = "http://localhost:8080/api/auth";
    private platformId = inject(PLATFORM_ID);

    private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
    public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

    constructor(private http: HttpClient) {
        //Verificación si hay sesión guardada
        this.checkSession();
    }

    login(username: string, password: string): Observable<LoginResponse> {
        const headers = new HttpHeaders({ "Content-Type": "application/json" });
        const body = {username, password};
    
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body, { headers }).pipe(
            tap(response => {
                if (response.success) {
                    if (isPlatformBrowser(this.platformId)) {
                        localStorage.setItem("isAuthenticated", "true");
                        localStorage.setItem("username", response.username || "");
                    }
                    this.isAuthenticatedSubject.next(true);
                }
            })
        );
    }
   
    checkSession(): void {
        const isAuth = isPlatformBrowser(this.platformId)
            && localStorage.getItem("isAuthenticated") === "true";
        this.isAuthenticatedSubject.next(isAuth);
    }
    
    isLoggedIn(): boolean {
        return isPlatformBrowser(this.platformId)
            && localStorage.getItem("isAuthenticated") === "true";
    }
    
    logout(): Observable<any> {
        // 1. Llamamos al endpoint de logout del backend para invalidar la sesión HTTP
        return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
            tap(() => {
                // 2. Limpiamos el estado local sin importar si el backend respondió o no
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.removeItem("isAuthenticated");
                    localStorage.removeItem("username");
                }
                this.isAuthenticatedSubject.next(false);
            })
        );
    }
}