import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Language {
  code: string;
  name: string;
  flag?: string;
}

export interface TranslationResponse {
  language: string;
  translations: { [key: string]: string };
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class InternationalizationService {
  private apiUrl = `${environment.apiUrl}/i18n`;
  private currentLanguage$ = new BehaviorSubject<string>('en');
  private translations$ = new BehaviorSubject<{ [key: string]: string }>({});
  private supportedLanguages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ];

  constructor(private http: HttpClient) {
    this.initializeLanguage();
  }

  private initializeLanguage(): void {
    // Get language from localStorage or browser preference
    const savedLanguage = localStorage.getItem('healthconnect_language');
    const browserLanguage = navigator.language.split('-')[0];
    
    const defaultLanguage = savedLanguage || 
      (this.supportedLanguages.find(lang => lang.code === browserLanguage)?.code) || 
      'en';
    
    this.setLanguage(defaultLanguage);
  }

  getCurrentLanguage(): Observable<string> {
    return this.currentLanguage$.asObservable();
  }

  getCurrentLanguageValue(): string {
    return this.currentLanguage$.value;
  }

  getTranslations(): Observable<{ [key: string]: string }> {
    return this.translations$.asObservable();
  }

  getSupportedLanguages(): Language[] {
    return this.supportedLanguages;
  }

  setLanguage(languageCode: string): void {
    if (this.supportedLanguages.find(lang => lang.code === languageCode)) {
      this.currentLanguage$.next(languageCode);
      localStorage.setItem('healthconnect_language', languageCode);
      this.loadTranslations(languageCode);
    }
  }

  private loadTranslations(languageCode: string): void {
    this.getTranslationsFromServer(languageCode).subscribe({
      next: (response) => {
        this.translations$.next(response.translations);
      },
      error: (error) => {
        console.error('Failed to load translations:', error);
        // Fallback to default translations
        this.loadDefaultTranslations();
      }
    });
  }

  private getTranslationsFromServer(languageCode: string): Observable<TranslationResponse> {
    return this.http.get<TranslationResponse>(`${this.apiUrl}/translations/${languageCode}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching translations from server:', error);
          return of(this.getDefaultTranslations(languageCode));
        })
      );
  }

  translate(key: string, params?: { [key: string]: string }): Observable<string> {
    return this.translations$.pipe(
      map(translations => {
        let translation = translations[key] || key;
        
        // Replace parameters if provided
        if (params) {
          Object.keys(params).forEach(paramKey => {
            translation = translation.replace(`{${paramKey}}`, params[paramKey]);
          });
        }
        
        return translation;
      })
    );
  }

  translateSync(key: string, params?: { [key: string]: string }): string {
    const translations = this.translations$.value;
    let translation = translations[key] || key;
    
    // Replace parameters if provided
    if (params) {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(`{${paramKey}}`, params[paramKey]);
      });
    }
    
    return translation;
  }

  translateBatch(keys: string[]): Observable<{ [key: string]: string }> {
    return this.http.post<{ translations: { [key: string]: string } }>(
      `${this.apiUrl}/translate/batch`,
      { keys, language: this.getCurrentLanguageValue() }
    ).pipe(
      map(response => response.translations),
      catchError(error => {
        console.error('Error in batch translation:', error);
        // Fallback to current translations
        const currentTranslations = this.translations$.value;
        const result: { [key: string]: string } = {};
        keys.forEach(key => {
          result[key] = currentTranslations[key] || key;
        });
        return of(result);
      })
    );
  }

  detectLanguage(text: string): Observable<{ detectedLanguage: string; confidence: number }> {
    return this.http.post<{ detectedLanguage: string; confidence: number }>(
      `${this.apiUrl}/detect-language`,
      { text }
    ).pipe(
      catchError(error => {
        console.error('Error detecting language:', error);
        return of({ detectedLanguage: 'en', confidence: 0.5 });
      })
    );
  }

  formatMessage(messageKey: string, parameters: any[]): Observable<string> {
    return this.http.post<{ formattedMessage: string }>(
      `${this.apiUrl}/format-message`,
      { messageKey, language: this.getCurrentLanguageValue(), parameters }
    ).pipe(
      map(response => response.formattedMessage),
      catchError(error => {
        console.error('Error formatting message:', error);
        return this.translate(messageKey);
      })
    );
  }

  private loadDefaultTranslations(): void {
    const defaultTranslations = this.getDefaultTranslations(this.getCurrentLanguageValue());
    this.translations$.next(defaultTranslations.translations);
  }

  private getDefaultTranslations(languageCode: string): TranslationResponse {
    const translations: { [key: string]: { [key: string]: string } } = {
      'en': {
        'welcome': 'Welcome to HealthConnect',
        'login': 'Login',
        'logout': 'Logout',
        'register': 'Register',
        'dashboard': 'Dashboard',
        'appointments': 'Appointments',
        'prescriptions': 'Prescriptions',
        'chat': 'Chat',
        'video_consultation': 'Video Consultation',
        'profile': 'Profile',
        'settings': 'Settings',
        'doctor': 'Doctor',
        'patient': 'Patient',
        'success': 'Success',
        'error': 'Error',
        'cancel': 'Cancel',
        'save': 'Save',
        'delete': 'Delete',
        'edit': 'Edit',
        'view': 'View',
        'search': 'Search',
        'loading': 'Loading...',
        'no_data': 'No data available',
        'confirm': 'Confirm',
        'yes': 'Yes',
        'no': 'No'
      },
      'es': {
        'welcome': 'Bienvenido a HealthConnect',
        'login': 'Iniciar Sesión',
        'logout': 'Cerrar Sesión',
        'register': 'Registrarse',
        'dashboard': 'Panel de Control',
        'appointments': 'Citas',
        'prescriptions': 'Recetas',
        'chat': 'Chat',
        'video_consultation': 'Consulta por Video',
        'profile': 'Perfil',
        'settings': 'Configuración',
        'doctor': 'Doctor',
        'patient': 'Paciente',
        'success': 'Éxito',
        'error': 'Error',
        'cancel': 'Cancelar',
        'save': 'Guardar',
        'delete': 'Eliminar',
        'edit': 'Editar',
        'view': 'Ver',
        'search': 'Buscar',
        'loading': 'Cargando...',
        'no_data': 'No hay datos disponibles',
        'confirm': 'Confirmar',
        'yes': 'Sí',
        'no': 'No'
      },
      'fr': {
        'welcome': 'Bienvenue à HealthConnect',
        'login': 'Connexion',
        'logout': 'Déconnexion',
        'register': 'S\'inscrire',
        'dashboard': 'Tableau de Bord',
        'appointments': 'Rendez-vous',
        'prescriptions': 'Ordonnances',
        'chat': 'Chat',
        'video_consultation': 'Consultation Vidéo',
        'profile': 'Profil',
        'settings': 'Paramètres',
        'doctor': 'Docteur',
        'patient': 'Patient',
        'success': 'Succès',
        'error': 'Erreur',
        'cancel': 'Annuler',
        'save': 'Sauvegarder',
        'delete': 'Supprimer',
        'edit': 'Modifier',
        'view': 'Voir',
        'search': 'Rechercher',
        'loading': 'Chargement...',
        'no_data': 'Aucune donnée disponible',
        'confirm': 'Confirmer',
        'yes': 'Oui',
        'no': 'Non'
      }
    };

    return {
      language: languageCode,
      translations: translations[languageCode] || translations['en'],
      count: Object.keys(translations[languageCode] || translations['en']).length
    };
  }

  // Utility method to get language name by code
  getLanguageName(code: string): string {
    const language = this.supportedLanguages.find(lang => lang.code === code);
    return language ? language.name : code;
  }

  // Utility method to get language flag by code
  getLanguageFlag(code: string): string {
    const language = this.supportedLanguages.find(lang => lang.code === code);
    return language?.flag || '🌐';
  }
}
