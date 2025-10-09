import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SymptomQuestionnaire {
  id: number;
  user: any;
  conversation?: any;
  title: string;
  description?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'REVIEWED';
  type: 'GENERAL_SYMPTOMS' | 'CARDIOVASCULAR' | 'RESPIRATORY' | 'NEUROLOGICAL' | 'GASTROINTESTINAL' | 'MUSCULOSKELETAL' | 'DERMATOLOGICAL' | 'MENTAL_HEALTH' | 'EMERGENCY_ASSESSMENT';
  currentStep: number;
  totalSteps: number;
  responses: string; // JSON string
  analysisResult?: string; // JSON string
  riskLevel?: 'VERY_LOW' | 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' | 'EMERGENCY';
  completionPercentage: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface QuestionTemplate {
  id: string;
  question: string;
  type: 'SINGLE_SELECT' | 'MULTI_SELECT' | 'TEXT' | 'SCALE' | 'YES_NO' | 'DATE' | 'NUMBER';
  options: string[];
  required: boolean;
}

export interface QuestionnaireType {
  value: string;
  label: string;
  description: string;
}

export interface QuestionnaireResponse {
  questionId: string;
  answer: any;
}

export interface QuestionnaireAnalysis {
  aiAnalysis: string;
  riskLevel: string;
  recommendations: string[];
  urgentCare: boolean;
  suggestedSpecialists: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SymptomQuestionnaireService {
  private apiUrl = `${environment.apiUrl}/api/symptom-questionnaire`;
  private currentQuestionnaire$ = new BehaviorSubject<SymptomQuestionnaire | null>(null);
  private currentQuestion$ = new BehaviorSubject<QuestionTemplate | null>(null);

  constructor(private http: HttpClient) {}

  // Create questionnaire
  createQuestionnaire(type: string, title: string): Observable<SymptomQuestionnaire> {
    return this.http.post<SymptomQuestionnaire>(`${this.apiUrl}/create`, {
      type,
      title
    });
  }

  // Start questionnaire
  startQuestionnaire(questionnaireId: number): Observable<SymptomQuestionnaire> {
    return this.http.post<SymptomQuestionnaire>(`${this.apiUrl}/${questionnaireId}/start`, {});
  }

  // Submit response
  submitResponse(questionnaireId: number, response: QuestionnaireResponse): Observable<SymptomQuestionnaire> {
    return this.http.post<SymptomQuestionnaire>(`${this.apiUrl}/${questionnaireId}/respond`, response);
  }

  // Get questionnaire
  getQuestionnaire(questionnaireId: number): Observable<SymptomQuestionnaire> {
    return this.http.get<SymptomQuestionnaire>(`${this.apiUrl}/${questionnaireId}`);
  }

  // Get current question
  getCurrentQuestion(questionnaireId: number): Observable<QuestionTemplate> {
    return this.http.get<QuestionTemplate>(`${this.apiUrl}/${questionnaireId}/current-question`);
  }

  // Get user questionnaires
  getUserQuestionnaires(): Observable<SymptomQuestionnaire[]> {
    return this.http.get<SymptomQuestionnaire[]>(`${this.apiUrl}/my-questionnaires`);
  }

  // Get questionnaire templates
  getQuestionnaireTemplates(): Observable<{ [key: string]: QuestionTemplate[] }> {
    return this.http.get<{ [key: string]: QuestionTemplate[] }>(`${this.apiUrl}/templates`);
  }

  // Get questionnaire types
  getQuestionnaireTypes(): Observable<QuestionnaireType[]> {
    return this.http.get<QuestionnaireType[]>(`${this.apiUrl}/types`);
  }

  // Current questionnaire state management
  setCurrentQuestionnaire(questionnaire: SymptomQuestionnaire | null): void {
    this.currentQuestionnaire$.next(questionnaire);
  }

  getCurrentQuestionnaire(): Observable<SymptomQuestionnaire | null> {
    return this.currentQuestionnaire$.asObservable();
  }

  getCurrentQuestionnaireValue(): SymptomQuestionnaire | null {
    return this.currentQuestionnaire$.value;
  }

  // Current question state management
  setCurrentQuestion(question: QuestionTemplate | null): void {
    this.currentQuestion$.next(question);
  }

  getCurrentQuestionObservable(): Observable<QuestionTemplate | null> {
    return this.currentQuestion$.asObservable();
  }

  getCurrentQuestionValue(): QuestionTemplate | null {
    return this.currentQuestion$.value;
  }

  // Utility methods
  getQuestionnaireStatusColor(status: string): string {
    switch (status) {
      case 'DRAFT': return 'secondary';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'ABANDONED': return 'danger';
      case 'REVIEWED': return 'info';
      default: return 'light';
    }
  }

  getQuestionnaireTypeLabel(type: string): string {
    switch (type) {
      case 'GENERAL_SYMPTOMS': return 'General Symptoms';
      case 'CARDIOVASCULAR': return 'Heart & Circulation';
      case 'RESPIRATORY': return 'Breathing & Lungs';
      case 'NEUROLOGICAL': return 'Brain & Nervous System';
      case 'GASTROINTESTINAL': return 'Digestive System';
      case 'MUSCULOSKELETAL': return 'Muscles & Bones';
      case 'DERMATOLOGICAL': return 'Skin & Hair';
      case 'MENTAL_HEALTH': return 'Mental Health';
      case 'EMERGENCY_ASSESSMENT': return 'Emergency Assessment';
      default: return type;
    }
  }

  getRiskLevelColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'VERY_LOW': return 'success';
      case 'LOW': return 'info';
      case 'MODERATE': return 'warning';
      case 'HIGH': return 'danger';
      case 'VERY_HIGH': return 'danger';
      case 'EMERGENCY': return 'danger';
      default: return 'light';
    }
  }

  getRiskLevelLabel(riskLevel: string): string {
    switch (riskLevel) {
      case 'VERY_LOW': return 'Very Low Risk';
      case 'LOW': return 'Low Risk';
      case 'MODERATE': return 'Moderate Risk';
      case 'HIGH': return 'High Risk';
      case 'VERY_HIGH': return 'Very High Risk';
      case 'EMERGENCY': return 'Emergency';
      default: return riskLevel;
    }
  }

  parseResponses(responsesJson: string): { [key: string]: any } {
    try {
      return JSON.parse(responsesJson);
    } catch (error) {
      console.error('Error parsing questionnaire responses:', error);
      return {};
    }
  }

  parseAnalysisResult(analysisJson: string): QuestionnaireAnalysis | null {
    try {
      return JSON.parse(analysisJson);
    } catch (error) {
      console.error('Error parsing questionnaire analysis:', error);
      return null;
    }
  }

  isQuestionnaireComplete(questionnaire: SymptomQuestionnaire): boolean {
    return questionnaire.status === 'COMPLETED';
  }

  isQuestionnaireInProgress(questionnaire: SymptomQuestionnaire): boolean {
    return questionnaire.status === 'IN_PROGRESS';
  }

  canContinueQuestionnaire(questionnaire: SymptomQuestionnaire): boolean {
    return questionnaire.status === 'IN_PROGRESS' || questionnaire.status === 'DRAFT';
  }

  getProgressPercentage(questionnaire: SymptomQuestionnaire): number {
    return Math.round(questionnaire.completionPercentage);
  }

  getNextStepNumber(questionnaire: SymptomQuestionnaire): number {
    return questionnaire.currentStep + 1;
  }

  isLastStep(questionnaire: SymptomQuestionnaire): boolean {
    return questionnaire.currentStep >= questionnaire.totalSteps;
  }

  formatQuestionType(type: string): string {
    switch (type) {
      case 'SINGLE_SELECT': return 'Single Choice';
      case 'MULTI_SELECT': return 'Multiple Choice';
      case 'TEXT': return 'Text Input';
      case 'SCALE': return 'Rating Scale';
      case 'YES_NO': return 'Yes/No';
      case 'DATE': return 'Date';
      case 'NUMBER': return 'Number';
      default: return type;
    }
  }

  validateResponse(question: QuestionTemplate, answer: any): boolean {
    if (question.required && (!answer || answer === '' || (Array.isArray(answer) && answer.length === 0))) {
      return false;
    }

    switch (question.type) {
      case 'SINGLE_SELECT':
        return !question.required || (answer && question.options.includes(answer));
      case 'MULTI_SELECT':
        return !question.required || (Array.isArray(answer) && answer.length > 0 && answer.every(a => question.options.includes(a)));
      case 'SCALE':
        const num = parseInt(answer);
        return !question.required || (!isNaN(num) && num >= 1 && num <= 10);
      case 'YES_NO':
        return !question.required || ['Yes', 'No'].includes(answer);
      case 'TEXT':
        return !question.required || (typeof answer === 'string' && answer.trim().length > 0);
      case 'NUMBER':
        return !question.required || !isNaN(parseFloat(answer));
      case 'DATE':
        return !question.required || !isNaN(Date.parse(answer));
      default:
        return true;
    }
  }
}
