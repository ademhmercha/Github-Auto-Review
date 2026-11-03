import { ApplicationInsights } from '@microsoft/applicationinsights-web';

/**
 * Initialise Application Insights à partir de la configuration d'exécution
 * (window.__APP_CONFIG__, servie par /config.js au démarrage du conteneur).
 * Ne fait rien si la chaîne de connexion est absente, vide ou non remplacée,
 * et ne fait jamais échouer le démarrage de l'application.
 */
export function initTelemetry() {
  try {
    const connectionString = window.__APP_CONFIG__?.appInsightsConnectionString;
    if (typeof connectionString !== 'string' || !connectionString.trim() || connectionString.startsWith('${')) {
      return;
    }

    const appInsights = new ApplicationInsights({
      config: {
        connectionString,
        disableCookiesUsage: true,
        disableExceptionTracking: false,
      },
    });
    appInsights.loadAppInsights();
    appInsights.trackPageView();
  } catch {
    // La télémétrie est facultative : une erreur ne doit jamais bloquer l'application.
  }
}
