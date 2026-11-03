// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { initTelemetry } from './telemetry.js';

const loadAppInsights = vi.fn();
const trackPageView = vi.fn();

vi.mock('@microsoft/applicationinsights-web', () => ({
  ApplicationInsights: vi.fn(function () {
    this.loadAppInsights = loadAppInsights;
    this.trackPageView = trackPageView;
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  delete window.__APP_CONFIG__;
});

describe('initTelemetry', () => {
  it('ne fait rien quand la configuration est absente', () => {
    expect(() => initTelemetry()).not.toThrow();
    expect(ApplicationInsights).not.toHaveBeenCalled();
  });

  it('ne fait rien quand la chaîne de connexion est vide', () => {
    window.__APP_CONFIG__ = { appInsightsConnectionString: '' };
    initTelemetry();
    expect(ApplicationInsights).not.toHaveBeenCalled();
  });

  it('ne fait rien quand la chaîne de connexion ne contient que des espaces', () => {
    window.__APP_CONFIG__ = { appInsightsConnectionString: '   ' };
    initTelemetry();
    expect(ApplicationInsights).not.toHaveBeenCalled();
  });

  it('ne fait rien quand la variable n’a pas été remplacée', () => {
    window.__APP_CONFIG__ = { appInsightsConnectionString: '${APPINSIGHTS_CONNECTION_STRING}' };
    initTelemetry();
    expect(ApplicationInsights).not.toHaveBeenCalled();
  });

  it('ne fait rien quand la valeur n’est pas une chaîne', () => {
    window.__APP_CONFIG__ = { appInsightsConnectionString: 42 };
    initTelemetry();
    expect(ApplicationInsights).not.toHaveBeenCalled();
  });

  it('initialise le SDK avec la chaîne de connexion, le charge et envoie une page vue', () => {
    window.__APP_CONFIG__ = { appInsightsConnectionString: 'InstrumentationKey=test' };

    initTelemetry();

    expect(ApplicationInsights).toHaveBeenCalledWith({
      config: {
        connectionString: 'InstrumentationKey=test',
        disableCookiesUsage: true,
        disableExceptionTracking: false,
      },
    });
    expect(loadAppInsights).toHaveBeenCalledTimes(1);
    expect(trackPageView).toHaveBeenCalledTimes(1);
  });

  it('capture une erreur du SDK sans la propager', () => {
    window.__APP_CONFIG__ = { appInsightsConnectionString: 'InstrumentationKey=test' };
    loadAppInsights.mockImplementationOnce(() => {
      throw new Error('SDK indisponible');
    });

    expect(() => initTelemetry()).not.toThrow();
    expect(trackPageView).not.toHaveBeenCalled();
  });
});
