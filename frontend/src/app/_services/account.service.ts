import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Account } from '../../app/_models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private accountSubject: BehaviorSubject<Account | null>;
  public account: Observable<Account | null>;
  private baseUrl: string;

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    const storedAccount = localStorage.getItem('account');
    this.accountSubject = new BehaviorSubject<Account | null>(storedAccount ? JSON.parse(storedAccount) : null);
    this.account = this.accountSubject.asObservable();
    this.baseUrl = environment.apiUrl;
  }

  public get accountValue(): Account | null {
    return this.accountSubject.value;
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.baseUrl}/authenticate`, { email, password }, { withCredentials: true })
      .pipe(map(account => {
        this.accountSubject.next(account);
        localStorage.setItem('account', JSON.stringify(account));
        this.startRefreshTokenTimer();
        return account;
      }));
  }

  logout() {
    this.http.post<any>(`${this.baseUrl}/revoke-token`, {}, { withCredentials: true }).subscribe();
    this.stopRefreshTokenTimer();
    this.accountSubject.next(null);
    localStorage.removeItem('account');
    this.router.navigate(['/account/login']);
  }

  refreshToken() {
    return this.http.post<any>(`${this.baseUrl}/refresh-token`, {}, { withCredentials: true })
      .pipe(map((account) => {
        this.accountSubject.next(account);
        localStorage.setItem('account', JSON.stringify(account));
        this.startRefreshTokenTimer();
        return account;
      }));
  }

  register(account: Account) {
    return this.http.post(`${this.baseUrl}/register`, account);
  }

  verifyEmail(token: string) {
    return this.http.post(`${this.baseUrl}/verify-email`, { token });
  }

  forgotPassword(email: string) {
    return this.http.post(`${this.baseUrl}/forgot-password`, { email });
  }

  validateResetToken(token: string) {
    return this.http.post(`${this.baseUrl}/validate-reset-token`, { token });
  }

  resetPassword(token: string, password: string, confirmPassword: string) {
    return this.http.post(`${this.baseUrl}/reset-password`, { token, password, confirmPassword });
  }

  getAll() {
    return this.http.get<Account[]>(this.baseUrl);
  }

  getById(id: string) {
    return this.http.get<Account>(`${this.baseUrl}/${id}`);
  }

  create(params) {
    return this.http.post(this.baseUrl, params);
  }

  update(id, params) {
    return this.http.put(`${this.baseUrl}/${id}`, params)
      .pipe(map((account: any) => {
        if (this.accountValue && account.id === this.accountValue.id) {
          account = { ...this.accountValue, ...account };
          this.accountSubject.next(account);
          localStorage.setItem('account', JSON.stringify(account));
        }
        return account;
      }));
  }

  delete(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`)
      .pipe(finalize(() => {
        if (this.accountValue && id === this.accountValue.id) {
          this.logout();
        }
      }));
  }

  // helper methods

  private refreshTokenTimeout: any;

  private startRefreshTokenTimer() {
    if (!this.accountValue || !this.accountValue.jwtToken) return;
    
    const jwtToken = JSON.parse(atob(this.accountValue.jwtToken.split('.')[1]));
    const expires = new Date(jwtToken.exp * 1000);
    const timeout = expires.getTime() - Date.now() - (60 * 1000);
    this.refreshTokenTimeout = setTimeout(() => this.refreshToken().subscribe(), timeout);
  }

  private stopRefreshTokenTimer() {
    clearTimeout(this.refreshTokenTimeout);
  }
}
