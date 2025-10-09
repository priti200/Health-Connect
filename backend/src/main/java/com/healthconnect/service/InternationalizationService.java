package com.healthconnect.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InternationalizationService {
    
    // Supported languages
    private static final List<String> SUPPORTED_LANGUAGES = List.of("en", "es", "fr", "de", "pt");
    
    // Translation mappings
    private static final Map<String, Map<String, String>> TRANSLATIONS = new HashMap<>();
    
    static {
        initializeTranslations();
    }
    
    public String translate(String key, String languageCode) {
        return translate(key, languageCode, null);
    }
    
    public String translate(String key, String languageCode, Map<String, String> parameters) {
        try {
            // Default to English if language not supported
            if (!SUPPORTED_LANGUAGES.contains(languageCode)) {
                languageCode = "en";
            }
            
            Map<String, String> languageTranslations = TRANSLATIONS.get(languageCode);
            if (languageTranslations == null) {
                languageTranslations = TRANSLATIONS.get("en"); // Fallback to English
            }
            
            String translation = languageTranslations.get(key);
            if (translation == null) {
                // Fallback to English if key not found
                translation = TRANSLATIONS.get("en").get(key);
                if (translation == null) {
                    log.warn("Translation key not found: {}", key);
                    return key; // Return key itself if no translation found
                }
            }
            
            // Replace parameters if provided
            if (parameters != null) {
                for (Map.Entry<String, String> param : parameters.entrySet()) {
                    translation = translation.replace("{" + param.getKey() + "}", param.getValue());
                }
            }
            
            return translation;
            
        } catch (Exception e) {
            log.error("Error translating key: {} for language: {}", key, languageCode, e);
            return key; // Return key itself on error
        }
    }
    
    public Map<String, String> getTranslations(String languageCode) {
        if (!SUPPORTED_LANGUAGES.contains(languageCode)) {
            languageCode = "en";
        }
        
        Map<String, String> translations = TRANSLATIONS.get(languageCode);
        return translations != null ? new HashMap<>(translations) : new HashMap<>();
    }
    
    public List<String> getSupportedLanguages() {
        return SUPPORTED_LANGUAGES;
    }
    
    public Map<String, String> getLanguageInfo() {
        return Map.of(
            "en", "English",
            "es", "Español",
            "fr", "Français",
            "de", "Deutsch",
            "pt", "Português"
        );
    }
    
    public String detectLanguage(String text) {
        // Simple language detection based on common words
        // In a real implementation, you would use a proper language detection library
        
        if (text == null || text.trim().isEmpty()) {
            return "en";
        }
        
        text = text.toLowerCase();
        
        // Spanish detection
        if (text.contains("hola") || text.contains("gracias") || text.contains("por favor") || 
            text.contains("buenos días") || text.contains("buenas tardes")) {
            return "es";
        }
        
        // French detection
        if (text.contains("bonjour") || text.contains("merci") || text.contains("s'il vous plaît") || 
            text.contains("bonsoir") || text.contains("au revoir")) {
            return "fr";
        }
        
        // German detection
        if (text.contains("hallo") || text.contains("danke") || text.contains("bitte") || 
            text.contains("guten tag") || text.contains("auf wiedersehen")) {
            return "de";
        }
        
        // Portuguese detection
        if (text.contains("olá") || text.contains("obrigado") || text.contains("por favor") || 
            text.contains("bom dia") || text.contains("boa tarde")) {
            return "pt";
        }
        
        // Default to English
        return "en";
    }
    
    public String formatMessage(String messageKey, String languageCode, Object... parameters) {
        String template = translate(messageKey, languageCode);
        
        try {
            return String.format(template, parameters);
        } catch (Exception e) {
            log.error("Error formatting message: {} for language: {}", messageKey, languageCode, e);
            return template;
        }
    }
    
    private static void initializeTranslations() {
        // English translations
        Map<String, String> english = new HashMap<>();
        english.put("welcome", "Welcome to HealthConnect");
        english.put("login", "Login");
        english.put("logout", "Logout");
        english.put("register", "Register");
        english.put("dashboard", "Dashboard");
        english.put("appointments", "Appointments");
        english.put("prescriptions", "Prescriptions");
        english.put("chat", "Chat");
        english.put("video_consultation", "Video Consultation");
        english.put("profile", "Profile");
        english.put("settings", "Settings");
        english.put("doctor", "Doctor");
        english.put("patient", "Patient");
        english.put("appointment_booked", "Appointment booked successfully");
        english.put("prescription_issued", "Prescription issued successfully");
        english.put("consultation_started", "Video consultation started");
        english.put("consultation_ended", "Video consultation ended");
        english.put("message_sent", "Message sent successfully");
        english.put("error_occurred", "An error occurred");
        english.put("invalid_credentials", "Invalid credentials");
        english.put("access_denied", "Access denied");
        english.put("not_found", "Not found");
        english.put("server_error", "Server error");
        english.put("success", "Success");
        english.put("cancel", "Cancel");
        english.put("save", "Save");
        english.put("delete", "Delete");
        english.put("edit", "Edit");
        english.put("view", "View");
        english.put("search", "Search");
        english.put("filter", "Filter");
        english.put("sort", "Sort");
        english.put("date", "Date");
        english.put("time", "Time");
        english.put("status", "Status");
        english.put("name", "Name");
        english.put("email", "Email");
        english.put("phone", "Phone");
        english.put("address", "Address");
        english.put("symptoms", "Symptoms");
        english.put("diagnosis", "Diagnosis");
        english.put("treatment", "Treatment");
        english.put("medication", "Medication");
        english.put("dosage", "Dosage");
        english.put("frequency", "Frequency");
        english.put("duration", "Duration");
        english.put("insurance", "Insurance");
        english.put("coverage", "Coverage");
        english.put("claim", "Claim");
        english.put("approved", "Approved");
        english.put("denied", "Denied");
        english.put("pending", "Pending");
        
        // Spanish translations
        Map<String, String> spanish = new HashMap<>();
        spanish.put("welcome", "Bienvenido a HealthConnect");
        spanish.put("login", "Iniciar Sesión");
        spanish.put("logout", "Cerrar Sesión");
        spanish.put("register", "Registrarse");
        spanish.put("dashboard", "Panel de Control");
        spanish.put("appointments", "Citas");
        spanish.put("prescriptions", "Recetas");
        spanish.put("chat", "Chat");
        spanish.put("video_consultation", "Consulta por Video");
        spanish.put("profile", "Perfil");
        spanish.put("settings", "Configuración");
        spanish.put("doctor", "Doctor");
        spanish.put("patient", "Paciente");
        spanish.put("appointment_booked", "Cita reservada exitosamente");
        spanish.put("prescription_issued", "Receta emitida exitosamente");
        spanish.put("consultation_started", "Consulta por video iniciada");
        spanish.put("consultation_ended", "Consulta por video finalizada");
        spanish.put("message_sent", "Mensaje enviado exitosamente");
        spanish.put("error_occurred", "Ocurrió un error");
        spanish.put("invalid_credentials", "Credenciales inválidas");
        spanish.put("access_denied", "Acceso denegado");
        spanish.put("not_found", "No encontrado");
        spanish.put("server_error", "Error del servidor");
        spanish.put("success", "Éxito");
        spanish.put("cancel", "Cancelar");
        spanish.put("save", "Guardar");
        spanish.put("delete", "Eliminar");
        spanish.put("edit", "Editar");
        spanish.put("view", "Ver");
        spanish.put("search", "Buscar");
        spanish.put("filter", "Filtrar");
        spanish.put("sort", "Ordenar");
        spanish.put("date", "Fecha");
        spanish.put("time", "Hora");
        spanish.put("status", "Estado");
        spanish.put("name", "Nombre");
        spanish.put("email", "Correo Electrónico");
        spanish.put("phone", "Teléfono");
        spanish.put("address", "Dirección");
        spanish.put("symptoms", "Síntomas");
        spanish.put("diagnosis", "Diagnóstico");
        spanish.put("treatment", "Tratamiento");
        spanish.put("medication", "Medicamento");
        spanish.put("dosage", "Dosis");
        spanish.put("frequency", "Frecuencia");
        spanish.put("duration", "Duración");
        spanish.put("insurance", "Seguro");
        spanish.put("coverage", "Cobertura");
        spanish.put("claim", "Reclamo");
        spanish.put("approved", "Aprobado");
        spanish.put("denied", "Denegado");
        spanish.put("pending", "Pendiente");
        
        // French translations (basic set)
        Map<String, String> french = new HashMap<>();
        french.put("welcome", "Bienvenue à HealthConnect");
        french.put("login", "Connexion");
        french.put("logout", "Déconnexion");
        french.put("register", "S'inscrire");
        french.put("dashboard", "Tableau de Bord");
        french.put("appointments", "Rendez-vous");
        french.put("prescriptions", "Ordonnances");
        french.put("chat", "Chat");
        french.put("video_consultation", "Consultation Vidéo");
        french.put("profile", "Profil");
        french.put("settings", "Paramètres");
        french.put("doctor", "Docteur");
        french.put("patient", "Patient");
        french.put("success", "Succès");
        french.put("cancel", "Annuler");
        french.put("save", "Sauvegarder");
        french.put("delete", "Supprimer");
        french.put("edit", "Modifier");
        french.put("view", "Voir");
        
        // German translations (basic set)
        Map<String, String> german = new HashMap<>();
        german.put("welcome", "Willkommen bei HealthConnect");
        german.put("login", "Anmelden");
        german.put("logout", "Abmelden");
        german.put("register", "Registrieren");
        german.put("dashboard", "Dashboard");
        german.put("appointments", "Termine");
        german.put("prescriptions", "Rezepte");
        german.put("chat", "Chat");
        german.put("video_consultation", "Video-Beratung");
        german.put("profile", "Profil");
        german.put("settings", "Einstellungen");
        german.put("doctor", "Arzt");
        german.put("patient", "Patient");
        german.put("success", "Erfolg");
        german.put("cancel", "Abbrechen");
        german.put("save", "Speichern");
        german.put("delete", "Löschen");
        german.put("edit", "Bearbeiten");
        german.put("view", "Ansehen");
        
        // Portuguese translations (basic set)
        Map<String, String> portuguese = new HashMap<>();
        portuguese.put("welcome", "Bem-vindo ao HealthConnect");
        portuguese.put("login", "Entrar");
        portuguese.put("logout", "Sair");
        portuguese.put("register", "Registrar");
        portuguese.put("dashboard", "Painel");
        portuguese.put("appointments", "Consultas");
        portuguese.put("prescriptions", "Receitas");
        portuguese.put("chat", "Chat");
        portuguese.put("video_consultation", "Consulta por Vídeo");
        portuguese.put("profile", "Perfil");
        portuguese.put("settings", "Configurações");
        portuguese.put("doctor", "Médico");
        portuguese.put("patient", "Paciente");
        portuguese.put("success", "Sucesso");
        portuguese.put("cancel", "Cancelar");
        portuguese.put("save", "Salvar");
        portuguese.put("delete", "Excluir");
        portuguese.put("edit", "Editar");
        portuguese.put("view", "Ver");
        
        TRANSLATIONS.put("en", english);
        TRANSLATIONS.put("es", spanish);
        TRANSLATIONS.put("fr", french);
        TRANSLATIONS.put("de", german);
        TRANSLATIONS.put("pt", portuguese);
    }
}
